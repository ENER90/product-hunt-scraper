# Product Hunt Scraper – Daily Launches & Upvotes

Get every Product Hunt launch for a day, a week or a month in one table, with upvotes, comments, daily/weekly/monthly rank and topics. You can also pull the top products in a topic, or full details for specific products (website, rating, followers, socials). I use it to keep an eye on what's launching in my space without checking the site every morning.

![Input form with a launch date](https://raw.githubusercontent.com/ENER90/product-hunt-scraper/main/docs/screenshots/01-input.png)

## What you get

**Launch rows** (`type: "launch"`):

| Field | Real example |
|---|---|
| `name`, `tagline` | Talanoa, "Email that feels like chat" |
| `upvotes`, `commentsCount` | `331`, `23` |
| `dailyRank`, `weeklyRank`, `monthlyRank` | `1`, `5`, `17` |
| `topics` | ["Email", "Productivity", "Task Management"] |
| `launchedAt`, `launchUrl`, `productUrl`, `thumbnailUrl` | `2026-10-15T00:01:00-07:00`, links |

**Product rows** (`type: "product"`) come from **Products**, from **Topics**, or when **Add product details to each launch** is on. They add `websiteUrl`, `reviewsRating`, `reviewsCount`, `followersCount`, `launchesCount`, `categories`, `social`, `appStoreUrls` and `wasInYCombinator`.

![Launches from October 15, 2026](https://raw.githubusercontent.com/ENER90/product-hunt-scraper/main/docs/screenshots/02-output-table.png)

## How much it costs

$1.50 per 1,000 rows ($0.0015 each). Each launch or product row is one result.

| Example | Rows | Cost |
|---|---|---|
| Yesterday's launches | ~20–40 | $0.03–$0.06 |
| One month of daily launches | ~900 | $1.35 |
| Same month, with product details | ~1,800 | $2.70 |

Apify's free plan includes $5 a month, which is about 3,300 rows. **Min upvotes** and **Max launches** keep the bill small. A real run for one day took about 5 seconds.

## How to use it

1. Create a free Apify account and open this Actor.
2. In **Dates** type one or more days as `YYYY-MM-DD`, or set a range with **Date from** and **Date to** (up to 62 days). If you leave everything empty, you get yesterday.
3. Pick **Leaderboard period**: `daily`, `weekly` (the ISO week of the date) or `monthly`.
4. Optional: set **Min upvotes** to skip small launches, and turn on **Add product details to each launch** for website, rating and followers.
5. Click **Start** and download the table from the **Output** tab.

To get the top products in a category, use **Topics** (e.g. `artificial-intelligence`). For specific products, use **Products** (slug or `producthunt.com/products/<slug>` URL).

## Input example

```json
{
  "dates": ["2026-10-15"],
  "period": "daily",
  "minUpvotes": 0,
  "maxLaunches": 500
}
```

## Output example

![One launch as JSON](https://raw.githubusercontent.com/ENER90/product-hunt-scraper/main/docs/screenshots/03-output-json.png)

## Use cases

- A daily or weekly digest of new tools in your niche for a newsletter or Slack channel.
- Market research: which categories get the most upvotes month after month.
- Lead lists of new startups, with product details on for website and socials.
- Tracking competitors' launches and how they ranked.

## Integrations

- **Schedule** it every morning and send the results to Slack, email or a webhook from the Integrations tab.
- **Google Sheets, Make, Zapier, n8n:** official Apify app, "Run Actor" (`ener90/product-hunt-launches`), then "Get dataset items".
- **API:**

```python
from apify_client import ApifyClient
client = ApifyClient("YOUR_TOKEN")
run = client.actor("ener90/product-hunt-launches").call(run_input={"dates": ["2026-10-15"], "period": "daily"})
for l in client.dataset(run["defaultDatasetId"]).iterate_items():
    print(l.get("dailyRank"), l["name"], l.get("upvotes"))
```

- **AI agents:** add it to [Apify MCP](https://mcp.apify.com) and ask "what were the top AI launches on Product Hunt this week?".

## Limitations

- Product Hunt is behind Cloudflare, so residential proxies are on by default.
- Date ranges are capped at 62 days per run. Split longer periods into several runs.
- Followers, rating and website only come on product rows, not on plain launch rows.

## FAQ

**Is this the official Product Hunt API?** No. It reads the public site, so you don't need an API token.

**What does `launchDayScore` mean?** It's the score Product Hunt uses for the daily ranking. It's close to the upvotes, but not always the same.

**Is it legal?** It only reads public launch pages. Check Product Hunt's terms for your use case.

## More from me

- [TrustRadius Reviews Scraper](https://apify.com/ener90/software-reviews-scraper)
- [Walmart Reviews Scraper](https://apify.com/ener90/walmart-products-reviews)
- [AI Review Insights](https://apify.com/ener90/ai-review-insights)
