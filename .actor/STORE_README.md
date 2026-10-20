# Product Hunt Launches Scraper

**Pricing:** US$0.0015 per result row (launch or product) = US$1.50 per 1,000. No start fee, no add-ons. / **Precio:** US$0,0015 por fila = US$1,50 por 1.000, sin cargo de inicio.

🇬🇧 [English](#english) · 🇪🇸 [Español](#español)

## English

Scrape **Product Hunt launches** by day, week or month from the leaderboards, plus **top products by topic**. No Product Hunt API token is needed.

- **Each launch:** name, tagline, upvotes, launch-day score, comment count, daily/weekly/monthly rank, topics, launch date, thumbnail and links.
- **Product details (optional):** website, description, PH review rating and count, followers, number of launches, first launch date, categories, Top Product and YC flags, company social links and app store links.

**No personal data:** makers' and voters' names, usernames, avatars and emails are never collected. You only get product and company-level information.

**Use cases:** finding new startups and lead lists (product websites), competitor and trend tracking, investor deal flow, and newsletters ("top 10 launches of the week").

**Input example**
```json
{ "dateFrom": "2026-10-12", "dateTo": "2026-10-16", "includeProductDetails": true, "minUpvotes": 50 }
```
- `dates`: a list of days.
- `period`: daily, weekly or monthly.
- `topics`: e.g. `artificial-intelligence`.
- `products`: slugs or URLs.
- With no input at all, you get yesterday's leaderboard.

**Output example**
```json
{ "type": "launch", "name": "Talanoa", "tagline": "Email that feels like chat", "upvotes": 333, "commentsCount": 23, "dailyRank": 1,
  "topics": ["Email", "Productivity"], "launchedAt": "2026-10-15T00:01:00-07:00", "productUrl": "https://www.producthunt.com/products/talanoa-2",
  "product": { "websiteUrl": "…", "followersCount": 512, "reviewsRating": 5, "categories": ["…"] } }
```

**Integrations:** Apify API, n8n, Make and Zapier (schedule it daily and send the results to Sheets or Slack), the [Apify MCP server](https://mcp.apify.com) for AI agents, and export to JSON, CSV or Excel.

**FAQ**
- *How many launches per day?* The day's top ~17 featured launches, the ones shown on the leaderboard page. Use weekly or monthly for the bigger picture.
- *Why no makers' names or emails?* Privacy. This actor only returns product and company information.
- *Is it reliable?* It uses US residential IPs, rotates sessions and retries automatically on Cloudflare challenges. 256 MB of memory is enough.

## Español

Extrae **lanzamientos de Product Hunt** por día, semana o mes, y los **productos destacados de un tema**. No necesita token de la API.

- **Cada lanzamiento:** nombre, tagline, votos, comentarios, ranking, temas y fecha.
- **Detalle del producto (opcional):** sitio web, nota, seguidores, categorías y redes de la empresa.

**Sin datos personales:** no guarda nombres, usuarios ni emails de makers o votantes.

**Casos de uso:** listas de startups y leads, seguimiento de tendencias y competencia, deal flow y newsletters.

**Entrada:** `dates` o `dateFrom`/`dateTo`, `period`, `topics`, `products`, `includeProductDetails`, `minUpvotes` y `maxLaunches`. Sin input, trae el leaderboard de ayer.

**Integraciones:** API de Apify, n8n, Make, Zapier y MCP. Exporta a JSON, CSV o Excel.

## 🧩 API & integrations quick start

**cURL (sync, returns items)**
```bash
curl -X POST "https://api.apify.com/v2/acts/ener90~product-hunt-launches/run-sync-get-dataset-items?token=YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" -d '{"dates":["2026-10-15"],"includeProductDetails":true}'
```

**Node.js**
```js
import { ApifyClient } from 'apify-client';
const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const run = await client.actor('ener90/product-hunt-launches').call({"dates":["2026-10-15"],"includeProductDetails":true});
const { items } = await client.dataset(run.defaultDatasetId).listItems();
```

**Python**
```python
from apify_client import ApifyClient
client = ApifyClient("YOUR_APIFY_TOKEN")
run = client.actor("ener90/product-hunt-launches").call(run_input={"dates":["2026-10-15"],"includeProductDetails":true})
items = client.dataset(run["defaultDatasetId"]).list_items().items
```

- **Google Sheets:** add the *Google Sheets* integration to a saved Task, or use `=IMPORTDATA("https://api.apify.com/v2/datasets/<DATASET_ID>/items?format=csv&clean=1")`.
- **n8n / Make / Zapier:** use the official Apify node or app: *Run Actor* (`ener90/product-hunt-launches`) → *Get dataset items*.
- **Webhooks:** on a Task, add an integration *Run succeeded* → your URL (gets `defaultDatasetId`).
- **AI agents (MCP):** `https://mcp.apify.com?actors=ener90/product-hunt-launches` works in Claude, ChatGPT, Cursor or any MCP client.
- **Free plan:** works on Apify's free tier; usage is billed per result (see Pricing). Start with small limits to try it out.

## 📝 Changelog
- 0.1 (2026-10-20): first public release. Daily/weekly/monthly leaderboards, topics, product details.

Issues or ideas? Open an issue in the **Issues** tab and we usually reply within 24 h.
