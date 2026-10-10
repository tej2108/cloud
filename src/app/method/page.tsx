import type { Metadata } from "next";
import Link from "next/link";
import { CURVES, GRADES } from "@/lib/score";
import { GradeChip } from "@/components/grade";
import { num } from "@/lib/format";

export const metadata: Metadata = {
  title: "Method",
  description: "How Trapphus grades a housing association: the factors, weights and benchmarks.",
};

const FACTORS = [
  {
    name: "Debt per m²",
    sv: "Skuldsättning per kvm",
    weight: 25,
    curve: CURVES.debt,
    unit: "kr/m²",
    why: "The single biggest driver of future fees. Every krona the association owes is effectively part of your flat's price, and its interest comes out of your fee.",
  },
  {
    name: "Savings per m²",
    sv: "Sparande per kvm",
    weight: 20,
    curve: CURVES.savings,
    unit: "kr/m²",
    why: "What's left each year for future maintenance, before depreciation. Too little means new loans or fee hikes when the roof, façade or pipes need work.",
  },
  {
    name: "Interest-rate sensitivity",
    sv: "Räntekänslighet",
    weight: 15,
    curve: CURVES.rate,
    unit: "%",
    why: "How much fees must rise to cover a one percentage point rate increase. 2022–2023 showed how quickly this turns into real money.",
  },
  {
    name: "Fee level",
    sv: "Årsavgift per kvm",
    weight: 10,
    curve: CURVES.fee,
    unit: "kr/m²",
    why: "A lower fee leaves more room in your budget. It only counts as good when savings are healthy too; otherwise it's a fee that will rise.",
  },
  {
    name: "Energy cost per m²",
    sv: "Energikostnad per kvm",
    weight: 5,
    curve: CURVES.energy,
    unit: "kr/m²",
    why: "Heating, electricity and water: the costs that spike when energy prices move.",
  },
  {
    name: "Cash buffer per m²",
    sv: "Likvida medel per kvm",
    weight: 5,
    curve: CURVES.cash,
    unit: "kr/m²",
    why: "Pays for unexpected repairs without new borrowing. Optional; when it is missing, the other weights scale up.",
  },
];

const BANDS = [
  [85, 100],
  [75, 84],
  [65, 74],
  [55, 64],
  [45, 54],
  [35, 44],
  [0, 34],
];

export default function MethodPage() {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <p className="text-sm font-medium text-brand">Method · v1</p>
          <h1 className="mt-2 max-w-2xl text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]">
            Eight factors, one grade
          </h1>
          <p className="mt-3 max-w-2xl text-ink-2">
            From the 2023 financial year, Swedish housing associations must report a fixed set of key ratios in their
            annual report (BFNAR 2023:1). That makes associations comparable for the first time. Trapphus scores each
            ratio 0–100 against Stockholm benchmarks, adds building and land factors, and weights them into a single
            score.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] space-y-6 px-4 pt-6 sm:px-6">
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold tracking-tight">Score to grade</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {GRADES.map((g, i) => (
              <div key={g} className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
                <GradeChip grade={g} />
                <span className="text-sm font-medium tabular">
                  {BANDS[i][0]}–{BANDS[i][1]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-2">
            Hard caps apply: negative savings caps the score at 44 (grade F), and an oäkta förening caps it at 54
            (grade E).
          </p>
        </section>

        <section className="card divide-y divide-line">
          {FACTORS.map((f) => (
            <div key={f.name} className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h2 className="text-lg font-bold tracking-tight">{f.name}</h2>
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand tabular">
                    weight {f.weight}
                  </span>
                </div>
                <p className="text-sm text-ink-3">{f.sv}</p>
                <p className="mt-3 text-sm text-ink-2">{f.why}</p>
              </div>
              <div className="self-end">
                <div className="flex items-end gap-1">
                  {f.curve.map(([x, s]) => (
                    <div key={x} className="flex min-w-0 flex-1 flex-col items-center">
                      <span className="text-[11px] text-ink-3 tabular">{Math.round(s)}</span>
                      <div
                        className="mt-1 w-full rounded-t"
                        style={{
                          height: `${8 + s * 0.7}px`,
                          background: s >= 75 ? "var(--up)" : s >= 50 ? "var(--g-e)" : "var(--down)",
                        }}
                      />
                      <span className="mt-1.5 text-[11px] font-medium tabular">{num(x)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-right text-[11px] text-ink-3">{f.unit} → score (linear between points)</p>
              </div>
            </div>
          ))}
          <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-bold tracking-tight">Building &amp; maintenance</h2>
                <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand">weight 15</span>
              </div>
              <p className="mt-3 text-sm text-ink-2">
                Stambyte (replacing water and drain pipes) costs 600 000–1 000 000 kr per flat in Stockholm today.
                Buildings over ~45 years old without one face it soon. A recent stambyte scores full marks, and a
                missing maintenance plan costs 20 points.
              </p>
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-bold tracking-tight">Land &amp; tax status</h2>
                <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand">weight 10</span>
              </div>
              <p className="mt-3 text-sm text-ink-2">
                Leasehold land (tomträtt) means paying ground rent to the city, and it&apos;s renegotiated every 10–20
                years, often with steep increases. A non-genuine association (oäkta förening) makes residents pay tax on
                the rent benefit, which caps the overall score at 54.
              </p>
            </div>
          </div>
        </section>

        <section className="card border-warn/30 bg-warn-tint p-5 sm:p-6">
          <h2 className="text-lg font-bold tracking-tight">Limits</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-2">
            <li>The associations in the index are fictional demo data, built to show typical Stockholm patterns.</li>
            <li>The ratios don&apos;t capture board quality, disputes, or how well the building has actually been maintained. Read the full report and the stadgar too.</li>
            <li>Benchmarks reflect Stockholm in 2024–2025 and will drift with interest rates and construction costs.</li>
            <li>This is an educational model, not financial advice.</li>
          </ul>
          <Link
            href="/analyse"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-ink"
          >
            Try it on a real report
          </Link>
        </section>
      </div>
    </>
  );
}
