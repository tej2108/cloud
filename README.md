# Trapphus: Stockholm BRF health check

Read a housing association's annual report (årsredovisning) before you buy the flat. Trapphus turns a bostadsrättsförening's key ratios into an A–G health grade, styled like a Swedish energy-declaration label, and a plain-language buyer signal.

> The associations in the index are **fictional demo data**. The grade is an educational model, not financial advice.

## Features

- **Look up an association** by pasting a Hemnet or Booli link, or typing its name. Links are parsed locally (type, rooms, area, street; some Booli links carry the association name), names are matched forgivingly ("HSB brf Ekbacken i Stockholm" finds Brf Ekbacken, typos are tolerated), and an association that isn't in the index is sent straight to the analyser. Listing pages are never fetched: Hemnet has no public API and doesn't permit scraping.
- **Index** of Stockholm associations, with district filter and sorting by health, debt, savings or fee.
- **Association pages** with the 2024 key ratios, five years of annual-report figures (charts and a ledger), a weighted factor breakdown, green and red flags, upcoming works, and questions to ask the board.
- **"What it means for you"** stress test: set your flat size, a rate rise and the asking price to see your monthly fee, your share of the association's debt, and the true price.
- **Analyse a report**: drop in *any* real årsredovisning PDF and the mandatory key ratios (ÅRL 6 kap. 3 a §, BFNAR 2023:1) fill in automatically, each labelled with the page it came from. It handles multi-year tables in either column order, labels that wrap over several lines, and space-separated thousands, and it computes the latest fee change from the table. The PDF is parsed in the browser with pdf.js and never uploaded. Scanned reports have no text layer, so those still need typing in. The parser lives in [`src/lib/report-parse.ts`](src/lib/report-parse.ts).
- **Method** page documenting every benchmark and weight.

## How the grade works

Since FY2023 every BRF must publish standard key ratios (BFNAR 2023:1). Trapphus scores each one 0–100 against Stockholm benchmarks and weights them:

| Factor | Weight |
| --- | --- |
| Debt per m² (skuldsättning) | 25 |
| Savings per m² (sparande) | 20 |
| Interest-rate sensitivity (räntekänslighet) | 15 |
| Building & maintenance (stambyte, underhållsplan) | 15 |
| Fee level (årsavgift) | 10 |
| Land & tax status (tomträtt, äkta förening) | 10 |
| Energy cost per m² | 5 |
| Cash per m² (optional) | 5 |

Hard caps apply. Negative savings caps the score at 44 (grade F), and an oäkta förening caps it at 54 (grade E). The engine lives in [`src/lib/score.ts`](src/lib/score.ts) and the demo data in [`src/lib/brfs.ts`](src/lib/brfs.ts).

## Getting started

```bash
git clone https://github.com/tej2108/cloud.git
cd cloud
npm install
npm run dev
```

Open http://localhost:3000.

## Password-protected preview

The whole site sits behind a username and password ([`src/proxy.ts`](src/proxy.ts), HTTP Basic Auth). The login comes from two environment variables, `SITE_USERNAME` and `SITE_PASSWORD`, which are set on the host and never committed (see [`.env.example`](.env.example)).

- Local development without them: the site is open.
- Production without them: the site is locked (HTTP 503), so a missing setting never exposes it.
- To change the password or remove someone's access, change `SITE_PASSWORD` on the host and redeploy.

Built with Next.js 16 (App Router, Cache Components), React 19 and Tailwind CSS 4.
