import type { Metadata } from "next";
import { Suspense } from "react";
import { getBrf } from "@/lib/brfs";

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
  const a = getBrf(first(query.a) ?? "");
  const b = getBrf(first(query.b) ?? "");

  return (
    <div className="card p-5">
      <p>A: {a ? a.name : "not found"}</p>
      <p>B: {b ? b.name : "not found"}</p>
    </div>
  );
}
