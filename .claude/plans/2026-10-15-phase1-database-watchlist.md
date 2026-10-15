# Plan: Phase 1 of the full-stack Trapphus — database, watchlist, saved comparisons
Status: draft
Date: 2026-10-15
Preview: https://claude.ai/artifact/Pjs6gkX5g4VGG32BbKmTMh

## Where this sits
The owner chose to grow Trapphus into a full-stack app with three backend capabilities: (1) data layer + search API route, (2) database for saved comparisons and watchlists, (3) report ingest pipeline. They are too big to build and verify safely at once, so they ship in phases, each with its own plan and approval.
- **Phase 1 (this plan):** async data layer, a real Postgres database, the watchlist and saved comparisons, a `/saved` page.
- **Phase 2 (later):** `/api/search` route, and ingest. Ingest sends only the ratios the browser already extracted from a PDF, never the PDF itself, so the "your PDF is never uploaded" promise on `/analyse` stays true.
- Real accounts are out of scope. See decision 1.

## Goal
Visitors can **watch** an association and **save a comparison**, and see both on a new **Saved** page. The data lives in a real Postgres database, reached through a small data layer that the rest of the app will keep using in later phases.

## What the visitor will see
- A **Watch** button on each report page (outlined star; filled star and "Watching" once on). 
- A **Save this comparison** button on `/compare` (becomes "Saved · View saved").
- A **Saved** page listing watched associations and saved comparisons, each removable.
- **Saved** appears in the nav. On phones the "Trapphus" wordmark hides below 480px (the logo icon stays) so five links fit from 360px up (decision 2).
- Where no database is connected (the Vercel site until one is added), the buttons are hidden and `/saved` says "Saving isn't switched on here yet". Nothing breaks.
- Everything else looks and behaves as today. The site's pages stay pre-built.

## How it works
- `src/lib/data/db.ts`: one Drizzle (Postgres) client. With `DATABASE_URL` set it connects to a hosted Postgres (Neon) through `@neondatabase/serverless`. With `USE_LOCAL_DB=1` it uses an embedded Postgres (PGlite) stored in `.data/pglite`, so the whole feature can be built and tested with no hosting. With neither, the data layer reports "not configured".
- `src/lib/data/schema.ts`: two tables. `watched(slug primary key, added_at)` and `comparisons(id, a, b, created_at, unique(a, b))` where a and b are stored in sorted order so (A,B) and (B,A) are the same comparison. Tables are created on first use with `create table if not exists`. Real migrations come when the schema first changes.
- `src/lib/data/saved.ts`: the only code that runs SQL: `dbConfigured`, `listWatched`, `setWatched`, `listComparisons`, `saveComparison`, `deleteComparison`.
- `src/lib/data/index.ts`: async `listBrfs()` and `getBrf(slug)` over the demo data, so pages already use the shape that a real source will have later.
- `src/app/actions.ts`: Server Actions (`toggleWatch`, `saveComparison`, `removeComparison`). They validate every input (slug format, must be a known association, not the same twice) and Next.js rejects calls from any other host. Reads of saved data are never cached, and sit inside `<Suspense>` so pages stay pre-built with a small dynamic hole.

## Changes, file by file
- New: `src/lib/data/index.ts`, `db.ts`, `schema.ts`, `saved.ts`; `src/app/actions.ts`; `src/app/saved/page.tsx`; `src/components/watch-button.tsx`, `save-comparison.tsx`.
- Edited: `src/app/page.tsx`, `src/app/brf/[slug]/page.tsx`, `src/app/compare/page.tsx` (use the data layer; add the buttons), `src/components/site-nav.tsx`, `src/app/layout.tsx` (wordmark), `package.json` and lockfile (three dependencies), `.env.example`, `.gitignore` (`.data/`), `next.config.ts` only if the bundler needs `serverExternalPackages` for PGlite.

## Slices (for parallel builders)
Order: A1 and A2 together, then B, then C and D together, then the verifier.

### Slice A1: demo data layer
- Files: `src/lib/data/index.ts` (new)
- Do: export `listBrfs(): Promise<RatedBrf[]>` and `getBrf(slug): Promise<RatedBrf | undefined>` over `RATED` and `getBrf` in `src/lib/brfs.ts`. Async on purpose. No other changes.
- Done when: both resolve correctly for all 11 slugs and for an unknown slug (undefined).

### Slice A2: database and saved-data queries
- Files: `src/lib/data/db.ts`, `schema.ts`, `saved.ts` (new); `package.json`, `package-lock.json`, `.env.example`, `.gitignore`; `next.config.ts` only if needed
- Do: add `drizzle-orm`, `@electric-sql/pglite`, `@neondatabase/serverless` and nothing else; keep lockfile changes to those packages. Implement as in "How it works". Import `server-only` is not available, so keep the files free of client imports and rely on only importing them from server files.
- Done when: a Node script in the scratchpad runs against PGlite: watch on/off is idempotent; saving (A,B) then (B,A) leaves one row; delete removes; `dbConfigured()` is false with no env; `npm run build` passes with PGlite imported (add `serverExternalPackages` only if the build says it must).

### Slice B: Server Actions
- Files: `src/app/actions.ts` (new)
- Do: `"use server"` actions that validate (slug matches `^[a-z0-9-]{1,60}$` and `getBrf` finds it; two different slugs for a comparison), call `saved.ts`, then refresh what is on screen using the mechanism the Next.js 16 docs prescribe for pages that read uncached data. Return `{ ok: boolean; message?: string }`. Read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` and `02-guides/data-security.md` first.
- Done when: bad input returns an error and writes nothing; good input writes once.

### Slice C: report pages and home
- Files: `src/app/page.tsx`, `src/app/brf/[slug]/page.tsx`, `src/components/watch-button.tsx` (new)
- Do: use `listBrfs`/`getBrf` from the data layer (`generateStaticParams` too). On the report page add a small server component inside `<Suspense>` that reads `listWatched` (and `dbConfigured`) and renders `WatchButton` (client, uses the action with `useActionState` or a form, works without JavaScript). Hidden entirely when not configured.
- Done when: the page is still pre-built apart from the button's hole, and the button reflects the stored state after a reload.

### Slice D: compare, Saved page, nav
- Files: `src/app/compare/page.tsx`, `src/app/saved/page.tsx` (new), `src/components/save-comparison.tsx` (new), `src/components/site-nav.tsx`, `src/app/layout.tsx`
- Do: compare page uses the data layer and shows `SaveComparison` when both associations are present and the database is configured. `/saved` lists watched associations (grade chip, name, district, Remove) and saved comparisons (names, date, Open, Delete); empty states; the "not switched on" note when not configured; all reads inside `<Suspense>`. Nav: add Saved after Compare. In `layout.tsx` hide the wordmark text below 480px (`hidden min-[480px]:inline`).
- Done when: matches the approved preview; five nav links fit at 360, 375, 390 and 400px.

## Decisions for the owner
1. **Whose list is it?** Recommended: one shared list for everyone who has the site login (no accounts), which fits "just a couple of us". Alternative: per-person accounts, which means replacing the login box and is the biggest security change in the app. I would do it as its own phase.
2. **Phone nav.** Recommended: add Saved to the nav and hide the "Trapphus" wordmark below 480px, keeping the logo icon. It fits five links from 360px and also fixes the 360/375px clipping from before. Alternative: keep the wordmark and reach Saved only through the buttons, which leaves the clipping as it is.

Defaults I chose (say if you disagree): hide the buttons when no database is connected; create tables on first use instead of migration tooling for now; keep saved reads uncached.

## Risks and unknowns
- PGlite worked in plain Node here (PostgreSQL 18.6 in a spike), but not yet inside the Next.js bundler. Slice A2 finds out; the fallback is `serverExternalPackages`.
- The hosted path (Neon through `DATABASE_URL`) can't be exercised from here: no account, and Vercel is blocked. It will be written to the same interface and reviewed by hand, but it stays **unverified until you connect a database**. I'll give the exact dashboard steps then.
- PGlite writes to disk, so it is for local use only. On Vercel, files don't persist.

## Verification
- [ ] Build, lint and `tsc` pass; `/`, `/analyse`, `/method` still static; `/brf/[slug]` and `/compare` still pre-built with a dynamic hole.
- [ ] With `USE_LOCAL_DB=1` on a production build: watch a report, reload, still watching; stop and restart the server, still watching.
- [ ] Save a comparison; it appears on `/saved`; saving the swapped pair adds nothing; delete removes it.
- [ ] Bad input is rejected: unknown slug, malformed slug, same association twice.
- [ ] A request to an action from a different Origin is rejected.
- [ ] With no database variables: no buttons, `/saved` shows the "not switched on" note, no errors in the console.
- [ ] 360, 375, 390, 400px: five nav links fit, no sideways scroll on any page.
- [ ] No secrets in the diff.

## Out of scope
Per-person accounts, the search API route, ingest, real data providers, migration tooling, editing saved comparisons.
