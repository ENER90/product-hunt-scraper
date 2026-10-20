export const BASE = 'https://www.producthunt.com';
const IMG = 'https://ph-files.imgix.net/';

/** Extract the Apollo SSR payload(s) Product Hunt embeds in its HTML. */
export function apolloPayloads(html: string): any[] {
  const marker = 'ApolloSSRDataTransport")] ??= []).push(';
  const out: any[] = [];
  let from = 0;
  while ((from = html.indexOf(marker, from)) !== -1) {
    const start = from + marker.length; from = start;
    let depth = 0, inStr = false, esc = false, end = -1;
    for (let k = start; k < html.length; k++) {
      const c = html[k];
      if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true; else if (c === '{') depth++; else if (c === '}') { depth--; if (depth === 0) { end = k; break; } }
    }
    if (end < 0) continue;
    try { out.push(JSON.parse(html.slice(start, end + 1).replace(/:undefined([,}\]])/g, ':null$1'))); } catch { /* skip */ }
  }
  return out;
}
export function nodesOf(o: any, type: string, acc: any[] = []): any[] {
  if (Array.isArray(o)) o.forEach((v) => nodesOf(v, type, acc));
  else if (o && typeof o === 'object') { if (o.__typename === type) acc.push(o); Object.values(o).forEach((v) => nodesOf(v, type, acc)); }
  return acc;
}
export const isChallenge = (html: string) => /<title>Just a moment|cf-chl/i.test(html.slice(0, 20000));

export interface LaunchRecord {
  type: 'launch'; postId: string; name: string; slug: string; tagline: string | null; productSlug: string | null; productUrl: string | null; launchUrl: string;
  upvotes: number | null; launchDayScore: number | null; commentsCount: number | null; dailyRank: number | null; weeklyRank: number | null; monthlyRank: number | null;
  launchedAt: string | null; topics: string[]; thumbnailUrl: string | null; foundVia: string; scrapedAt: string; product?: ProductDetails | null;
}
export interface ProductDetails {
  name: string | null; slug: string; tagline: string | null; description: string | null; websiteUrl: string | null; logoUrl: string | null;
  reviewsRating: number | null; reviewsCount: number | null; followersCount: number | null; launchesCount: number | null; firstLaunchedAt: string | null;
  categories: string[]; isTopProduct: boolean | null; wasInYCombinator: boolean | null; employeeSize: string | number | null; fundingAmount: string | number | null;
  social: Record<string, string>; appStoreUrls: Record<string, string>;
}
const n = (v: any) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

export function parseLaunches(html: string, foundVia: string, now: string): LaunchRecord[] {
  const seen = new Map<string, LaunchRecord>();
  for (const pl of apolloPayloads(html)) for (const p of nodesOf(pl, 'Post')) {
    if (!p.id || !p.name || !p.slug || p.tagline === undefined || seen.has(p.id)) continue;
    if (p.latestScore === undefined && p.dailyRank === undefined) continue; // skip shallow refs (badges, reviews…)
    const productSlug = p.product?.slug ?? p.redirectToProduct?.slug ?? null;
    seen.set(p.id, {
      type: 'launch', postId: String(p.id), name: p.name, slug: p.slug, tagline: p.tagline ?? null, productSlug,
      productUrl: productSlug ? `${BASE}/products/${productSlug}` : null, launchUrl: `${BASE}/posts/${p.slug}`,
      upvotes: p.hideVotesCount ? null : n(p.latestScore), launchDayScore: n(p.launchDayScore), commentsCount: n(p.commentsCount),
      dailyRank: n(p.dailyRank), weeklyRank: n(p.weeklyRank), monthlyRank: n(p.monthlyRank), launchedAt: p.featuredAt ?? p.createdAt ?? null,
      topics: (p.topics?.edges ?? []).map((e: any) => e?.node?.name).filter(Boolean), thumbnailUrl: p.thumbnailImageUuid ? IMG + p.thumbnailImageUuid : null,
      foundVia, scrapedAt: now,
    });
  }
  return [...seen.values()].sort((a, b) => (a.dailyRank ?? 1e9) - (b.dailyRank ?? 1e9));
}

/** Product details; merges every cached fragment of the product with this slug. Makers' personal data is not collected. */
export function parseProduct(html: string, slug: string): ProductDetails | null {
  const parts = apolloPayloads(html).flatMap((pl) => nodesOf(pl, 'Product')).filter((p) => p.slug === slug);
  if (!parts.length) return null;
  const p: any = Object.assign({}, ...parts.sort((a, b) => Object.keys(a).length - Object.keys(b).length));
  const pick = (keys: string[]) => Object.fromEntries(keys.filter((k) => typeof p[k] === 'string' && p[k]).map((k) => [k.replace(/Url$/, ''), p[k]]));
  return {
    name: p.name ?? null, slug, tagline: p.tagline ?? null, description: p.description ?? null, websiteUrl: p.websiteUrl ?? p.url ?? null,
    logoUrl: p.logoUuid ? IMG + p.logoUuid : null, reviewsRating: n(p.reviewsRating), reviewsCount: n(p.reviewsCount), followersCount: n(p.followersCount),
    launchesCount: n(p.postsCount), firstLaunchedAt: p.firstPost?.createdAt ?? null, categories: (p.categories ?? []).map((c: any) => c?.name).filter(Boolean),
    isTopProduct: typeof p.isTopProduct === 'boolean' ? p.isTopProduct : null, wasInYCombinator: typeof p.wasInYCombinator === 'boolean' ? p.wasInYCombinator : null,
    employeeSize: p.employeeSize ?? null, fundingAmount: p.fundingAmount ?? null,
    social: pick(['twitterUrl', 'linkedinUrl', 'facebookUrl', 'instagramUrl', 'githubUrl', 'mediumUrl', 'threadsUrl', 'angellistUrl']),
    appStoreUrls: pick(['iosUrl', 'androidUrl']),
  };
}

/** "2026-10-15" -> leaderboard URL. */
export function leaderboardUrl(date: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): string {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) throw new Error(`Invalid date "${date}" (use YYYY-MM-DD).`);
  const [, y, mo, d] = m;
  if (period === 'monthly') return `${BASE}/leaderboard/monthly/${y}/${Number(mo)}`;
  if (period === 'weekly') { const dt = new Date(Date.UTC(+y, +mo - 1, +d)); const wk = isoWeek(dt); return `${BASE}/leaderboard/weekly/${wk[0]}/${wk[1]}`; }
  return `${BASE}/leaderboard/daily/${y}/${Number(mo)}/${Number(d)}`;
}
function isoWeek(d: Date): [number, number] { const t = new Date(d); t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); const y = t.getUTCFullYear(); return [y, Math.ceil(((+t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7)]; }
export function dateRange(from: string, to: string, maxDays = 62): string[] {
  const a = new Date(from + 'T00:00:00Z'), b = new Date(to + 'T00:00:00Z');
  if (isNaN(+a) || isNaN(+b) || a > b) throw new Error('Invalid date range.');
  const out: string[] = []; for (let d = a; d <= b && out.length < maxDays; d = new Date(+d + 864e5)) out.push(d.toISOString().slice(0, 10));
  return out;
}
export function topicSlug(s: string): string { const m = s.trim().match(/producthunt\.com\/topics\/([a-z0-9-]+)/i); const v = m ? m[1] : s.trim(); if (!/^[a-z0-9-]+$/i.test(v)) throw new Error(`Invalid topic "${s}".`); return v.toLowerCase(); }
export function productSlug(s: string): string { const m = s.trim().match(/producthunt\.com\/products\/([a-z0-9-]+)/i); const v = m ? m[1] : s.trim(); if (!/^[a-z0-9-]+$/i.test(v)) throw new Error(`Invalid product "${s}".`); return v.toLowerCase(); }

/** Products listed on a topic page (ProductEdge nodes), most relevant first. */
export function parseTopicProducts(html: string): string[] {
  const slugs: string[] = [];
  for (const pl of apolloPayloads(html)) for (const e of nodesOf(pl, 'ProductEdge')) { const s = e?.node?.slug; if (s && !slugs.includes(s)) slugs.push(s); }
  return slugs;
}
