# Session handoff
Session: 720f5396-7a6c-520f-af6e-b326b222e634
Context tokens at handoff: 718740
Written: 2026-10-12, branch claude/awesome-shannon-uxcpqw, last commit b73a90d

## The user
A UX designer moving into UX engineering, and a beginner at code. Wants honest answers, no patronising, plain language. Learns best by doing: interactive lessons grounded in this repo, with real measurements rather than theory. Often types quickly with typos; read for intent. Follows on the Claude mobile/web app, so localhost on their machine can't reach this cloud container (explain this; it confused them twice).

## Where things stand
Trapphus is a Next.js 16 app that grades Stockholm housing associations (BRFs) A–G from their annual reports. It has 11 fictional demo associations, a Booli/Nordnet-style design, a lookup box (Hemnet/Booli links or names), a PDF reader that extracts key ratios on-device, HTTP Basic Auth on the whole site, and security headers. Alongside it runs a 12-week "UX designer to UX engineer" programme taught through this codebase. We were mid-way through building a /compare page together as a lesson.

## Done this session
- ae304dc Redesign to a clean listings/broker-style UI (IBM Plex Sans, cool grey + one brand blue)
- 605b7f5 Security headers (CSP without nonces, nosniff, frame deny, HSTS, Permissions-Policy)
- 5e85c95 Lookup from Hemnet link, Booli link or BRF name (src/lib/lookup.ts, no scraping)
- 16c1e59 Read key ratios from an annual-report PDF in the browser (src/lib/report-parse.ts, pdfjs-dist pinned 6.3.289)
- 458592c Password-protect the site (src/proxy.ts, SITE_USERNAME / SITE_PASSWORD env vars)
- 297e6c9 Logged-in responses marked private so a CDN can't cache protected pages
- cc16543 /compare skeleton reading ?a=&b= (step 1 of the lesson)
- b73a90d This handoff skill and its hooks

## In progress, or waiting on the user
- **/compare page, step 2.** User chose query-string URLs (`/compare?a=slug&b=slug`) and dropdowns to pick. Step 1 works (src/app/compare/page.tsx: static shell, `Comparison` awaits searchParams inside Suspense; builds as ◐). We asked the user to decide, in their own words or by filling in `pickPair(aSlug, bSlug)`, what happens when: (1) nothing is chosen, (2) only one is chosen, (3) a slug doesn't exist, (4) the same association is chosen twice. **No answer yet.** Wait for it; it's their product decision.
- Then: step 3 comparison table (grade, debt, savings, +1 pp rate, fee, built/land; mark the better value per row, verdict line), step 4 dropdown picker as a small Client Component that navigates to the new URL, then a nav link.
- Lesson style for the build: user decides and writes small pieces; Claude explains each line, runs it, shows results.
- Unanswered earlier: user's real BRF name ("Vallanstam" didn't exist; likely garbled). Asked for exact name, city, org number or the PDF.

## Next steps
1. Ask for (or use) the user's answers to the four /compare cases, implement `pickPair`, test all five URLs from the lesson (incl. `?a=x&a=y`), commit.
2. Build the comparison table, then the picker, verifying in a production build with the login (credentials in .env.local).
3. Continue the programme: the user wanted "explain something else" after this; offer the next lesson from the programme page.

## Decisions already made (don't re-argue)
- Next.js 16 conventions: `proxy.ts` (not middleware), Cache Components on, read node_modules/next/dist/docs before using APIs (AGENTS.md).
- No scraping Hemnet/Booli (no API, ToS). Real data later via Bolagsverket's API (BRF reports mandatory from FY2025/26) or Booli Pro.
- PDF parsing stays on-device; pdf.js pinned to an older release on purpose.
- Fonts: IBM Plex Sans (Schibsted Grotesk widened Swedish decimal commas with tabular figures).
- Compare page uses query strings, not pre-built path segments (user's choice; scales beyond 11).
- No Dockerfile committed: Vercel doesn't need one and it couldn't be tested here.

## Links
- Static preview of the site: https://claude.ai/artifact/NBj4JAtMdc5gvEohs9U7M4 (no JS; refresh it after UI changes with the scratchpad snap script pattern)
- 12-week programme: https://claude.ai/artifact/Lezdnvdp1njP341bYtUSEP
- Lesson, builds and containers: https://claude.ai/artifact/Ut6oXaV4VQCBtCWfyrQV4S
- Lesson, life of a request: https://claude.ai/artifact/FYxaCJVYs99j3ZHVTXNEZB
- Lesson, where code lives: https://claude.ai/artifact/K4nj9hyCajfQitXYTimmJG
- Repo: github.com/tej2108/cloud, branch claude/awesome-shannon-uxcpqw (no PR opened; user deploys via Vercel themselves)

## Environment gotchas
- Network policy blocks most of the web (booli.se, nordnet.se, hemnet, bolagsverket, vercel, google). npm registry works. WebSearch works; WebFetch mostly doesn't.
- No Docker engine (client only). No deploy CLIs or hosting connectors.
- `npm install` rewrites package-lock.json (removes `libc` fields, older npm); revert with `git checkout -- package-lock.json` unless dependencies changed.
- Run `npm run build` before `npx tsc --noEmit` after adding routes; route types are generated by the build.
- Kill test servers by PID (`ps -eo pid,cmd | grep next-server`); `pkill -f` patterns can kill the shell running them.
- Background servers stop after their timeout; restart when needed.
- `.env.local` holds the site login and is gitignored; never print or commit it. Tell the user it's in their password manager / Vercel settings.

## Prompt for the next session
Read .claude/handoff/HANDOFF.md, then run `git log --oneline -10` on branch claude/awesome-shannon-uxcpqw. We're teaching a beginner UX designer Next.js through the Trapphus app. Pick up the /compare page lesson: ask for their answers to the four "not found" cases (nothing chosen, one chosen, unknown slug, same association twice), then implement and test `pickPair` with them before building the comparison table.
