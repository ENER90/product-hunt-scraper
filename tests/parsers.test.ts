import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseTopicProducts, parseLaunches, parseProduct, leaderboardUrl, dateRange, topicSlug, productSlug, isChallenge } from '../src/parsers.js';
const lb = readFileSync('tests/fixtures/leaderboard_2026-10-15.html', 'utf8');
const pr = readFileSync('tests/fixtures/product_notion.html', 'utf8');
describe('inputs', () => {
  it('urls', () => {
    expect(leaderboardUrl('2026-10-15')).toBe('https://www.producthunt.com/leaderboard/daily/2026/10/15');
    expect(leaderboardUrl('2026-10-15', 'weekly')).toBe('https://www.producthunt.com/leaderboard/weekly/2026/42');
    expect(leaderboardUrl('2026-10-15', 'monthly')).toBe('https://www.producthunt.com/leaderboard/monthly/2026/10');
    expect(dateRange('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(topicSlug('https://www.producthunt.com/topics/artificial-intelligence')).toBe('artificial-intelligence');
    expect(productSlug('notion')).toBe('notion'); expect(() => leaderboardUrl('15/10/2026')).toThrow();
  });
});
describe('parse', () => {
  it('topic products', () => { const t = parseTopicProducts(readFileSync('tests/fixtures/topic_ai.html', 'utf8')); expect(t.length).toBeGreaterThanOrEqual(10); expect(new Set(t).size).toBe(t.length); });
  const l = parseLaunches(lb, 'daily:2026-10-15', 'n');
  it('launches', () => {
    expect(l.length).toBeGreaterThanOrEqual(15);
    expect(l[0]).toMatchObject({ name: 'Talanoa', dailyRank: 1, upvotes: 333, commentsCount: 23, productSlug: 'talanoa-2' });
    expect(new Set(l.map((x) => x.postId)).size).toBe(l.length);
  });
  it('product', () => {
    const p = parseProduct(pr, 'notion')!;
    expect(p).toMatchObject({ name: 'Notion', websiteUrl: 'https://www.notion.so', isTopProduct: true });
    expect(p.followersCount).toBeGreaterThan(1000); expect(p.categories.length).toBeGreaterThan(0);
  });
  it('no personal data', () => expect(JSON.stringify([l, parseProduct(pr, 'notion')])).not.toMatch(/avatarUrl|username|"email"/));
  it('challenge', () => { expect(isChallenge('<title>Just a moment...</title>')).toBe(true); expect(isChallenge(lb)).toBe(false); });
});
