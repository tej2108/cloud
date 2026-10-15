import type { Metadata } from "next";
import { Fragment, Suspense } from "react";
import { listBrfs } from "@/lib/data";
import { dbConfigured, listComparisons } from "@/lib/data/saved";
import { pickPair } from "@/lib/compare";
import { compareRows } from "@/lib/compare-rows";
import { GradeChip } from "@/components/grade";
import { ComparePicker } from "@/components/compare-picker";
import { SaveComparison } from "@/components/save-comparison";

export const metadata: Metadata = {
  title: "Compare associations",
  description: "Put two Stockholm housing associations side by side: grade, debt, savings, rate sensitivity and fee.",
};

// The page itself never reads the URL, so this part is pre-built at build time.
export default function ComparePage(props: PageProps<"/compare">) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]">
            Compare associations
          </h1>
          <p className="mt-3 max-w-2xl text-ink-2">Two associations side by side, ratio by ratio.</p>
        </div>
      </header>
      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
        <Suspense fallback={<p className="text-ink-3">Loading comparison…</p>}>
          <Comparison searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}

/** ?a=x&b=y can also arrive as ?a=x&a=z, which gives an array. Take the first value. */
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Plain words for the verdict line, keyed on row.key. Only the counted rows need one. */
const WORDS: Record<string, string> = {
  debt: "debt",
  savings: "savings",
  rate: "rate sensitivity",
  energy: "energy cost",
};

/** "debt", "debt and savings", "debt, savings and rate sensitivity". */
const joinWords = (items: string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

// Only this part waits for the request, because only it reads the query string.
async function Comparison({ searchParams }: { searchParams: PageProps<"/compare">["searchParams"] }) {
  const query = await searchParams;
  const brfs = await listBrfs();
  const { a, b, notices } = pickPair(first(query.a), first(query.b), brfs);
  const options = brfs.map((x) => ({ slug: x.slug, name: x.name, grade: x.assessment.grade }));

  const compared = a && b ? compareRows(a, b) : null;
  let detail = "";
  if (a && b && compared) {
    const { rows, verdict } = compared;
    if (verdict.aWins !== verdict.bWins) {
      const counted = rows.slice(0, verdict.counted);
      const wonBy = (side: "a" | "b") =>
        joinWords(counted.filter((r) => r.better === side).map((r) => WORDS[r.key] ?? r.label.toLowerCase()));
      const [leader, trailer, lead, trail] =
        verdict.aWins > verdict.bWins ? [a, b, "a", "b"] as const : [b, a, "b", "a"] as const;
      detail = `${leader.name} is ahead on ${wonBy(lead)}.`;
      if (wonBy(trail)) detail += ` ${trailer.name} is ahead on ${wonBy(trail)}.`;
    }
  }

  // Whether to offer "Save this comparison", and whether this pair is already
  // saved. Awaiting searchParams above already makes this request-time, so the
  // environment and the database are read per request, never at build time.
  // null means no button (no database, or it could not be read).
  let isSaved: boolean | null = null;
  if (a && b && dbConfigured()) {
    try {
      const [lo, hi] = a.slug <= b.slug ? [a.slug, b.slug] : [b.slug, a.slug];
      isSaved = (await listComparisons()).some((c) => c.a === lo && c.b === hi);
    } catch {
      isSaved = null;
    }
  }

  return (
    <div className="space-y-4">
      <ComparePicker options={options} a={a?.slug} b={b?.slug} />

      {notices.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-warn/30 bg-warn-tint px-4 py-3 text-sm text-ink" aria-live="polite">
          {notices.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      {a && b && compared ? (
        <>
          <div className="card flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold">{compared.verdict.text}</p>
              {detail && <p className="mt-1 text-sm text-ink-2">{detail}</p>}
            </div>
            {isSaved !== null && <SaveComparison key={`${a.slug}:${b.slug}`} a={a.slug} b={b.slug} saved={isSaved} />}
          </div>

          <div className="card">
            <table className="w-full table-fixed border-collapse text-left text-[13px] sm:text-sm">
              <caption className="sr-only">{`${a.name} compared with ${b.name}`}</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-[26%] px-3 py-3 sm:w-[28%] sm:px-4">
                    <span className="sr-only">Ratio</span>
                  </th>
                  {[a, b].map((x) => (
                    <th key={x.slug} scope="col" className="px-3 py-3 align-top font-normal sm:px-4">
                      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <GradeChip grade={x.assessment.grade} />
                        <div className="min-w-0">
                          <p className="break-words font-semibold">{x.name}</p>
                          <p className="text-sm font-normal text-ink-3">{x.district}</p>
                          <p className="text-xs font-normal text-ink-2">Score {Math.round(x.assessment.score)} / 100</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compared.rows.map((row) => (
                  <Fragment key={row.key}>
                    <tr className="border-t border-line">
                      <th scope="row" className="px-3 py-3 align-top font-medium sm:px-4">
                        <span className="break-words">{row.label}</span>
                        <span className="hidden break-words text-xs font-normal text-ink-3 sm:block">{row.sv}</span>
                      </th>
                      {(["a", "b"] as const).map((side) => {
                        const better = row.better === side;
                        return (
                          <td
                            key={side}
                            className={`break-words px-3 py-3 align-top tabular sm:px-4 ${better ? "bg-up-tint font-bold" : "font-medium"}`}
                          >
                            {row[side]}
                            {better && (
                              <span className="mt-1 block text-xs font-semibold text-up">
                                <span aria-hidden="true">✓ </span>Better
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {row.note && (
                      <tr>
                        <td colSpan={3} className="px-3 pb-3 text-xs text-ink-2 sm:px-4">
                          {row.note}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold">Choose two associations to compare</p>
          <p className="mt-1 text-sm text-ink-2">Choose them in the menus above and see them side by side, ratio by ratio.</p>
        </div>
      )}
    </div>
  );
}
