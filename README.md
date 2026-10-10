# Trapphus: Stockholm BRF health check

Read a housing association's annual report (årsredovisning) before you buy the flat. Trapphus turns a bostadsrättsförening's key ratios into an A–G health grade, styled like a Swedish energy-declaration label, and a plain-language buyer signal.

> The associations in the index are **fictional demo data**. The grade is an educational model, not financial advice.

## Features

- **Index** of Stockholm associations, with search, district filter and sorting by health, debt, savings or fee.
- **Association pages** with the 2024 key ratios, five years of annual-report figures (charts and a ledger), a weighted factor breakdown, green and red flags, upcoming works, and questions to ask the board.
- **"What it means for you"** stress test: set your flat size, a rate rise and the asking price to see your monthly fee, your share of the association's debt, and the true price.
- **Analyse a report**: type in the key ratios from *any* real årsredovisning and get a live grade. Everything runs in the browser.
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

Built with Next.js 16 (App Router, Cache Components), React 19 and Tailwind CSS 4.
