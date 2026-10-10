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

export default function MethodPage() {
  return (
    <div className="pt-12">
      <header className="max-w-3xl">
        <p className="eyebrow">Method · v1</p>
        <h1 className="mt-3 font-display text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.95]">
          Eight factors, <span className="italic text-ochre">one grade.</span>
        </h1>
        <p className="mt-5 text-lg text-ink-2">
          From the 2023 financial year, Swedish housing associations must report a fixed set of key ratios in their
          annual report (BFNAR 2023:1). That makes associations comparable for the first time. Trapphus scores each
          ratio 0–100 against Stockholm benchmarks, adds building and land factors, and weights them into a single
          score.
        </p>
      </header>

      <section className="mt-12 grid grid-cols-2 gap-px bg-line sm:grid-cols-4 lg:grid-cols-7">
        {GRADES.map((g, i) => {
          const lo = [85, 75, 65, 55, 45, 35, 0][i];
          const hi = [100, 84, 74, 64, 54, 44, 34][i];
          return (
            <div key={g} className="flex items-center gap-3 bg-paper p-4">
              <GradeChip grade={g} />
              <span className="font-mono text-xs tabular">
                {lo}–{hi}
              </span>
            </div>
          );
        })}
      </section>

      <section className="mt-16 space-y-12">
        {FACTORS.map((f) => (
          <div key={f.name} className="grid gap-6 border-t border-ink pt-5 md:grid-cols-[1fr_1.3fr]">
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="font-display text-3xl">{f.name}</h2>
                <span className="font-mono text-xs text-ink-3">weight {f.weight}</span>
              </div>
              <p className="font-display italic text-ink-3">{f.sv}</p>
              <p className="mt-3 text-ink-2">{f.why}</p>
            </div>
            <div className="flex flex-wrap items-end gap-1 self-end">
              {f.curve.map(([x, s]) => (
                <div key={x} className="flex min-w-14 flex-1 flex-col items-center">
                  <span className="font-mono text-[10px] text-ink-3">{Math.round(s)}</span>
                  <div
                    className="w-full"
                    style={{
                      height: `${8 + s * 0.7}px`,
                      background: s >= 75 ? "var(--moss)" : s >= 50 ? "var(--ochre)" : "var(--falu)",
                      opacity: 0.85,
                    }}
                  />
                  <span className="mt-1 font-mono text-[10px] tabular">{num(x)}</span>
                </div>
              ))}
              <span className="w-full text-right font-mono text-[10px] text-ink-3">{f.unit} → score (linear between points)</span>
            </div>
          </div>
        ))}

        <div className="grid gap-6 border-t border-ink pt-5 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">Building &amp; maintenance</h2>
            <p className="font-mono text-xs text-ink-3">weight 15</p>
            <p className="mt-3 text-ink-2">
              Stambyte (replacing water and drain pipes) costs 600 000–1 000 000 kr per flat in Stockholm today.
              Buildings over ~45 years old without one face it soon. A recent stambyte scores full marks, and a
              missing maintenance plan costs 20 points.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl">Land &amp; tax status</h2>
            <p className="font-mono text-xs text-ink-3">weight 10</p>
            <p className="mt-3 text-ink-2">
              Leasehold land (tomträtt) means paying ground rent to the city, and it&apos;s renegotiated every 10–20
              years, often with steep increases. A non-genuine association (oäkta förening) makes residents pay tax on
              the rent benefit, which caps the overall score at 54.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 bg-ink p-6 text-paper sm:p-10">
        <h2 className="font-display text-3xl">Limits</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-paper/85">
          <li>The associations in the index are fictional demo data, built to show typical Stockholm patterns.</li>
          <li>The ratios don&apos;t capture board quality, disputes, or how well the building has actually been maintained. Read the full report and the stadgar too.</li>
          <li>Benchmarks reflect Stockholm in 2024–2025 and will drift with interest rates and construction costs.</li>
          <li>This is an educational model, not financial advice.</li>
        </ul>
        <Link href="/analyse" className="mt-6 inline-block border border-paper px-5 py-3 text-sm hover:border-ochre hover:text-ochre">
          Try it on a real report →
        </Link>
      </section>
    </div>
  );
}
