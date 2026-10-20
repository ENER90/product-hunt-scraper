import { Actor, log } from 'apify';
import { BasicCrawler } from 'crawlee';
import { BASE, isChallenge, parseTopicProducts, parseLaunches, parseProduct, leaderboardUrl, dateRange, topicSlug, productSlug, LaunchRecord } from './parsers.js';

interface Input { dates?: string[]; dateFrom?: string; dateTo?: string; period?: 'daily' | 'weekly' | 'monthly'; topics?: string[]; products?: string[];
  includeProductDetails?: boolean; maxLaunches?: number; minUpvotes?: number; proxyConfiguration?: any }
await Actor.init();
const input = (await Actor.getInput<Input>()) ?? {};
const now = new Date().toISOString();
const period = input.period ?? 'daily';
const maxLaunches = input.maxLaunches ?? 500;
const details = input.includeProductDetails ?? false;
const reqs: any[] = [];
const dates = new Set<string>(input.dates ?? []);
if (input.dateFrom) for (const d of dateRange(input.dateFrom, input.dateTo ?? input.dateFrom)) dates.add(d);
for (const d of dates) { try { reqs.push({ url: leaderboardUrl(d, period), label: 'LIST', userData: { via: `${period}:${d}` } }); } catch (e) { log.error((e as Error).message); } }
for (const t of input.topics ?? []) { try { const s = topicSlug(t); reqs.push({ url: `${BASE}/topics/${s}`, label: 'LIST', userData: { via: `topic:${s}` } }); } catch (e) { log.error((e as Error).message); } }
for (const p of input.products ?? []) { try { const s = productSlug(p); reqs.push({ url: `${BASE}/products/${s}`, label: 'PRODUCT', userData: { slug: s } }); } catch (e) { log.error((e as Error).message); } }
if (!reqs.length) {
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  log.info(`No input given: scraping yesterday's daily leaderboard (${y}).`);
  reqs.push({ url: leaderboardUrl(y), label: 'LIST', userData: { via: `daily:${y}` } });
}
const proxy = await Actor.createProxyConfiguration(input.proxyConfiguration ?? { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'], apifyProxyCountry: 'US' });
const pending = new Map<string, LaunchRecord[]>(); // productSlug -> launches waiting for details
const seen = new Set<string>();
const seenProducts = new Set<string>();
let pushed = 0, blocks = 0;

const crawler = new BasicCrawler({
  maxRequestRetries: 6, maxConcurrency: 4, requestHandlerTimeoutSecs: 60, useSessionPool: true,
  sessionPoolOptions: { maxPoolSize: 40, sessionOptions: { maxUsageCount: 20, maxErrorScore: 1 } },
  async requestHandler({ request, session, sendRequest, crawler: c }) {
    const res: any = await sendRequest({ url: request.url, proxyUrl: await proxy?.newUrl(session?.id), throwHttpErrors: false, timeout: { request: 30000 },
      headerGeneratorOptions: { browsers: ['chrome'], devices: ['desktop'], locales: ['en-US'] } } as any);
    if (res.statusCode === 404) { log.error(`Not found: ${request.url}`); return; }
    if (isChallenge(res.body) || res.statusCode >= 400) { blocks++; session?.retire(); throw new Error(`Blocked (HTTP ${res.statusCode}) on ${request.url}; retrying with a new IP`); }
    if (request.label === 'LIST') {
      const launches = parseLaunches(res.body, request.userData.via, now).filter((l) => (l.upvotes ?? 0) >= (input.minUpvotes ?? 0) && !seen.has(l.postId));
      if (String(request.userData.via).startsWith('topic:')) {
        const slugs = parseTopicProducts(res.body).filter((s) => !seenProducts.has(s)).slice(0, Math.max(0, maxLaunches - pushed));
        slugs.forEach((s) => seenProducts.add(s));
        await c.addRequests(slugs.map((s) => ({ url: `${BASE}/products/${s}`, label: 'PRODUCT', userData: { slug: s, via: request.userData.via } })));
        log.info(`${request.userData.via}: ${slugs.length} products`);
        return;
      }
      if (!launches.length) log.warning(`${request.userData.via}: no launches found on ${request.url}`);
      for (const l of launches) {
        if (pushed + [...pending.values()].flat().length >= maxLaunches) break;
        seen.add(l.postId);
        if (details && l.productSlug) {
          const q = pending.get(l.productSlug);
          if (q) q.push(l); else { pending.set(l.productSlug, [l]); await c.addRequests([{ url: `${BASE}/products/${l.productSlug}`, label: 'DETAILS', userData: { slug: l.productSlug } }]); }
        } else { await Actor.pushData(l); pushed++; }
      }
      log.info(`${request.userData.via}: ${launches.length} launches`);
    } else {
      const slug = request.userData.slug as string;
      const prod = parseProduct(res.body, slug);
      if (request.label === 'PRODUCT') {
        if (!prod) { log.error(`${slug}: product not found.`); return; }
        const launches = parseLaunches(res.body, `product:${slug}`, now).filter((l) => l.productSlug === slug);
        await Actor.pushData({ type: 'product', ...prod, foundVia: request.userData.via ?? 'product', url: `${BASE}/products/${slug}`, recentLaunches: launches.map(({ type, foundVia, scrapedAt, ...x }) => x), scrapedAt: now });
        pushed++;
      } else {
        const ls = pending.get(slug) ?? []; pending.delete(slug);
        for (const l of ls) { l.product = prod; await Actor.pushData(l); pushed++; }
      }
    }
  },
  async failedRequestHandler({ request }, e) {
    log.error(`Gave up on ${request.url}: ${e.message}`);
    if (request.label === 'DETAILS') { const ls = pending.get(request.userData.slug) ?? []; pending.delete(request.userData.slug); for (const l of ls) { l.product = null; await Actor.pushData(l); pushed++; } }
  },
});
await crawler.run(reqs);
await Actor.setValue('OUTPUT', { items: pushed, blockedRetries: blocks });
if (!pushed) await Actor.fail('Nothing scraped. See log.'); else await Actor.exit(`${pushed} items, ${blocks} blocked retries.`);
