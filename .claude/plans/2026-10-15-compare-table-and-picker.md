# Plan: Compare table, picker and nav link
Status: draft
Date: 2026-10-15
Preview: https://claude.ai/artifact/5tDzxJXhUvdRt59ih83QNf

## Goal
Finish `/compare`: show two associations side by side with the better value marked per row, let the visitor choose the two from menus, and link to the page from the nav.

## What the visitor will see
- A **Compare** link in the top nav (between Associations and Analyse).
- On `/compare`, a row of two menus ("Compare [A] with [B]") directly under the page header. Choosing in either menu updates the page at once, with no button.
- Below it, any notices, then a one-line verdict such as "Brf Gärdesmåsen is stronger on 3 of 4 ratios."
- Then a table: a header cell per association (grade chip, name, district, score), then rows for debt, savings, +1 pp rate, energy, fee and built. The better value in a row gets a green tint and the word "Better" (not colour alone).
- The **fee** row is never marked, and has a short note. The **built** row is marked by the engine's building score (pipe outlook), not by which is newer.
- With nothing chosen, the menus show "Choose…" and the empty-state card; choosing one fills the other with the strongest association (existing rule).
- Notice and empty-state copy that says "below" now says "above", because the menus are above.

## Changes, file by file
- `src/lib/compare-rows.ts` (new): pure function that builds the rows and the verdict.
- `src/lib/compare.ts`: notice wording only ("Pick another below" becomes "Change either one with the menus above.").
- `src/components/compare-picker.tsx` (new, client): the two menus.
- `src/components/site-nav.tsx`: one new link.
- `src/app/compare/page.tsx`: render picker, verdict and table; empty-state wording.

## Slices (for parallel builders)

### Slice A: row logic (parallel with B and D)
- Files: `src/lib/compare-rows.ts` (new), `src/lib/compare.ts`
- Interface the page will rely on:
  ```ts
  export type Side = "a" | "b";
  export interface CompareRow { key: string; label: string; sv: string; a: string; b: string; better: Side | null; note?: string }
  export interface Verdict { aWins: number; bWins: number; level: number; counted: number; text: string }
  export function compareRows(a: RatedBrf, b: RatedBrf): { rows: CompareRow[]; verdict: Verdict }
  ```
  (`RatedBrf` is a type-only import from `@/lib/brfs`.)
- Rows, in order, with direction: `debt` lower is better; `savings` higher; `rate` lower; `energy` lower (these four are "counted" in the verdict); `fee` never marked, with a note; `built` marked by the higher `building` factor score from `assessment.factors`, not counted, with a note.
- Compare the values as displayed (rounded as `src/lib/format.ts` shows them), so equal-looking values are a tie (`better: null`).
- Display strings use `src/lib/format.ts`. The built row reads like "Built 1936 · stambyte 2009" or "Built 2019 · no stambyte yet".
- Verdict text: more wins for one side gives "<name> is stronger on N of 4 ratios."; level gives "The two are level on the ratios that can be compared head to head."
- Done when: tested in plain Node on real data from `RATED`: all 11 × 10 ordered pairs run without error; a pair with negative savings (Glasbruket) ranks correctly; ties give `null`; Gärdesmåsen vs Glasbruket gives 3 wins to Gärdesmåsen and 1 to Glasbruket (energy), fee unmarked, built marked for Gärdesmåsen.

### Slice B: picker (parallel with A and D)
- Files: `src/components/compare-picker.tsx` (new)
- Props: `options: { slug: string; name: string; grade: Grade }[]`, `a?: string`, `b?: string` (the slugs currently shown).
- Two native `<select>` menus labelled "First association" and "Second association", option text like "Brf Kopparslagaren · A". Empty selection shows "Choose…". The option picked in one menu is disabled in the other.
- On change: `router.push` to `/compare?a=…&b=…` (only the params that are set), inside `startTransition`, with scroll position kept. While pending, mark the container `aria-busy`.
- Read the Next.js 16 docs for `useRouter` before using it.
- Done when: lints and typechecks; touch targets at least 44px tall; works by keyboard.

### Slice D: nav link (parallel with A and B)
- Files: `src/components/site-nav.tsx`
- Add `{ href: "/compare", label: "Compare", match: (p) => p.startsWith("/compare") }` between Associations and Analyse.
- Done when: the link shows, is marked current on `/compare`, and the mobile nav still fits at 400px.

### Slice C: page (after A and B)
- Files: `src/app/compare/page.tsx`
- Render, inside `Comparison` after `await searchParams`: picker (options from `RATED`, current slugs), notices, verdict, then a semantic `<table>` (caption for screen readers, `th scope` on headers and row labels). Better cell: tint plus a visible "Better" label. Notes render as a muted line under the row.
- Empty-state copy: "Choose them in the menus above and see them side by side, ratio by ratio."
- The table must not overflow at 400px (fixed layout, wrapping values).
- Done when: matches the approved preview.

## Decisions for the owner
1. **Fee row.** Recommended: show both values, mark no winner, with a note ("A low fee only helps if savings are healthy"). Alternative: mark the lower fee as better, which would mislead: the fee factor in the engine is a straight line, so Glasbruket (the worst association) scores 90/100 on fee. Third option: no marker plus a warning chip when fee is under 600 and savings under 150 (the engine's own rule). It fires for none of the 11 demo associations today, so it would sit unused.
2. **Built row.** Recommended: mark by the engine's building score, which accounts for pipe replacement (so a 1936 building with a 2009 stambyte beats a 2019 building, 100 vs 92). Alternative: no marker.
3. **Menus.** Recommended: change takes effect immediately. Alternative: a "Compare" button, which adds a click and a state to get wrong.

Verdict counts only the four head-to-head ratios (debt, savings, rate, energy). Say if you want fee and built counted too.

## Risks and unknowns
- Navigating with `router.push` on a page that streams inside Suspense: need to confirm the shell stays and only the comparison swaps. Verified by the verifier.
- Native `<select>` styling differs by browser; the design uses the app's tokens and keeps the native control for accessibility.

## Verification
- [ ] `/compare` shows two menus reading "Choose…" and the empty-state card.
- [ ] `/compare?a=gardesmasen&b=glasbruket`: verdict "Brf Gärdesmåsen is stronger on 3 of 4 ratios."; debt, savings, rate marked on the left; energy marked on the right; fee unmarked with its note; built marked on the left.
- [ ] Changing a menu updates the URL and the content without a full page reload.
- [ ] `?a=nonsense&b=ekbacken`, `?a=ekbacken&b=ekbacken` and `?a=<script>…` behave as before, with the new "above" wording, and the script text renders as text.
- [ ] At 400px: no horizontal scroll; menus and table readable.
- [ ] Keyboard: menus reachable and changeable without a mouse; focus is visible.
- [ ] `/compare` still builds as ◐; `npm run build`, lint and `tsc` pass.
- [ ] Slice A tests in plain Node pass.

## Out of scope
- A "swap sides" button, more than two associations, saving comparisons, "Compare with…" links on report pages, anything with real data.
