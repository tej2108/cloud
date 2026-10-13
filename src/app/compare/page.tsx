import type { Metadata } from "next";
import { Suspense } from "react";
import { RATED } from "@/lib/brfs";
import { pickPair } from "@/lib/compare";
import { GradeChip } from "@/components/grade";

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

// Only this part waits for the request, because only it reads the query string.
async function Comparison({ searchParams }: { searchParams: PageProps<"/compare">["searchParams"] }) {
  const query = await searchParams;
  const { a, b, notices } = pickPair(first(query.a), first(query.b), RATED);

  return (
    <div className="space-y-4">
      {notices.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-warn/30 bg-warn-tint px-4 py-3 text-sm text-ink" aria-live="polite">
          {notices.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      {a && b ? (
        <div className="card grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 p-5">
          {[a, b].map((x, i) => (
            <div key={x.slug} className={`flex items-center gap-3 ${i === 1 ? "order-3 justify-end text-right" : ""}`}>
              <GradeChip grade={x.assessment.grade} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{x.name}</p>
                <p className="text-sm text-ink-3">{x.district}</p>
              </div>
            </div>
          ))}
          <span className="order-2 text-sm font-medium text-ink-3">vs</span>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold">Choose two associations to compare</p>
          <p className="mt-1 text-sm text-ink-2">Pick them below and see them side by side, ratio by ratio.</p>
        </div>
      )}
    </div>
  );
}
