import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RATED, getBrf } from "@/lib/brfs";
import { mkr, num1, pct, perSqm } from "@/lib/format";
import { GradeLadder } from "@/components/grade";
import { FactorList, Flags } from "@/components/factors";
import { MiniChart } from "@/components/mini-chart";
import { StressTest } from "@/components/stress-test";

export function generateStaticParams() {
  return RATED.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata(props: PageProps<"/brf/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const b = getBrf(slug);
  if (!b) return {};
  return {
    title: `${b.name}: grade ${b.assessment.grade}`,
    description: `${b.name}, ${b.district}. ${b.assessment.title}. ${b.assessment.summary}`,
  };
}

export default function BrfPage(props: PageProps<"/brf/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <BrfDetail params={props.params} />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse pt-8" aria-busy="true" aria-label="Loading association">
      <div className="h-3 w-40 bg-paper-2" />
      <div className="grid gap-10 pb-12 pt-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="h-20 w-4/5 bg-paper-2" />
          <div className="h-3 w-3/5 bg-paper-2" />
          <div className="h-16 w-full max-w-xl bg-paper-2" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 7 }, (_, k) => (
            <div key={k} className="h-7 bg-paper-2" style={{ width: `${46 + k * 7}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

async function BrfDetail({ params }: { params: PageProps<"/brf/[slug]">["params"] }) {
  const { slug } = await params;
  const b = getBrf(slug);
  if (!b) notFound();

  const a = b.assessment;
  const i = b.inputs;
  const total = b.boa + b.loa;
  const latest = b.reports[b.reports.length - 1];
  const reports = b.reports;
  const series = (fn: (r: (typeof reports)[number]) => number) =>
    reports.map((r) => ({ label: String(r.year), value: fn(r) }));

  const ratios = [
    { label: "Fee", sv: "Årsavgift/kvm", value: perSqm(i.feePerSqm), hint: "per m² of flat, per year" },
    { label: "Debt", sv: "Skuldsättning/kvm", value: perSqm(i.debtPerSqm), hint: "per m² of total area" },
    { label: "Savings", sv: "Sparande/kvm", value: perSqm(i.savingsPerSqm), hint: "per m², per year" },
    { label: "Rate sensitivity", sv: "Räntekänslighet", value: pct(i.rateSensitivity), hint: "fee rise per +1 pp" },
    { label: "Energy", sv: "Energikostnad/kvm", value: perSqm(i.energyCostPerSqm), hint: "per m², per year" },
    { label: "Fee share of income", sv: "Avgiftsandel", value: pct(i.feeShare ?? 0), hint: "rest from commercial rent" },
  ];

  return (
    <article className="pt-8">
      <nav className="eyebrow reveal flex gap-2">
        <Link href="/#index" className="hover:text-ochre">Index</Link>
        <span>/</span>
        <span>{b.district}</span>
      </nav>

      <header className="grid gap-10 pb-12 pt-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="reveal font-display text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.92]" style={{ ["--i" as string]: 1 }}>
            {b.name}
          </h1>
          <p className="reveal mt-4 font-mono text-xs text-ink-3" style={{ ["--i" as string]: 2 }}>
            {b.district} · built {b.built} · {b.apartments} flats · {Math.round(total).toLocaleString("sv-SE")} m² ·{" "}
            {b.land}
            {b.tomtrattYearsLeft ? ` (renegotiation in ${b.tomtrattYearsLeft} y)` : ""} ·{" "}
            {b.genuine ? "äkta förening" : "oäkta förening"}
          </p>
          <p className="reveal mt-5 max-w-xl text-lg text-ink-2" style={{ ["--i" as string]: 3 }}>
            {b.blurb}
          </p>
          <p className="reveal mt-6 inline-block bg-ochre/12 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ochre" style={{ ["--i" as string]: 4 }}>
            Fictional demo association
          </p>
        </div>
        <div className="reveal" style={{ ["--i" as string]: 2 }}>
          <p className="eyebrow mb-3">Health grade</p>
          <GradeLadder grade={a.grade} score={a.score} />
          <div className="mt-6 border-t border-ink pt-4">
            <p className="font-display text-3xl leading-tight">{a.title}</p>
            <p className="mt-1 text-sm">
              Buyer signal: <strong className="font-semibold">{a.signal}</strong>
            </p>
            <p className="mt-3 text-[15px] text-ink-2">{a.summary}</p>
          </div>
        </div>
      </header>

      <section className="border-t-[3px] border-double border-ink pt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-4xl">Key ratios {latest.year}</h2>
          <span className="eyebrow">Nyckeltal · årsredovisning</span>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-px bg-line md:grid-cols-3">
          {ratios.map((r, k) => (
            <div key={r.label} className="reveal bg-paper p-4 sm:p-5" style={{ ["--i" as string]: k }}>
              <dt className="text-sm">
                {r.label} <span className="font-display italic text-ink-3">{r.sv}</span>
              </dt>
              <dd className="mt-2 font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-none tabular">{r.value}</dd>
              <dd className="mt-1 font-mono text-[11px] text-ink-3">{r.hint}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="pt-16">
        <h2 className="font-display text-4xl">What it means for you</h2>
        <p className="mb-6 mt-2 max-w-2xl text-ink-2">
          Move the sliders. Your monthly fee rises with the association&apos;s interest costs, and the
          association&apos;s debt is effectively part of what you pay for the flat.
        </p>
        <StressTest feePerSqm={i.feePerSqm} debtPerSqm={i.debtPerSqm} rateSensitivity={i.rateSensitivity} />
      </section>

      <section className="pt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-4xl">Annual reports</h2>
          <span className="eyebrow">Årsredovisningar {b.reports[0].year}–{latest.year}</span>
        </div>
        <div className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          <MiniChart title="Fee" sv="avgift/kvm" points={series((r) => r.feePerSqm)} format={perSqm} color="var(--ochre)" />
          <MiniChart title="Debt" sv="skuld/kvm" points={series((r) => r.debt / total)} format={perSqm} />
          <MiniChart title="Savings" sv="sparande/kvm" points={series((r) => r.savings / total)} format={perSqm} color="var(--moss)" />
          <MiniChart title="Result" sv="årets resultat" points={series((r) => r.result)} format={mkr} />
          <MiniChart title="Interest cost" sv="räntekostnad" points={series((r) => r.interestCost)} format={mkr} color="var(--falu)" />
          <MiniChart title="Cash" sv="likvida medel" points={series((r) => r.cash)} format={mkr} color="var(--moss)" />
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm tabular">
            <thead>
              <tr className="border-b border-ink text-left">
                <th className="eyebrow py-2 font-normal">Year</th>
                {["Income", "Interest", "Avg. rate", "Result", "Debt", "Cash", "Savings/m²"].map((h) => (
                  <th key={h} className="eyebrow py-2 text-right font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {[...b.reports].reverse().map((r) => (
                <tr key={r.year} className="border-b border-line">
                  <td className="py-2.5 font-sans font-medium">{r.year}</td>
                  <td className="text-right">{mkr(r.totalIncome)}</td>
                  <td className="text-right">{mkr(r.interestCost)}</td>
                  <td className="text-right">{num1(r.avgRate)} %</td>
                  <td className={`text-right ${r.result < 0 ? "text-falu" : ""}`}>{mkr(r.result)}</td>
                  <td className="text-right">{mkr(r.debt)}</td>
                  <td className="text-right">{mkr(r.cash)}</td>
                  <td className={`text-right ${r.savings < 0 ? "text-falu" : ""}`}>{perSqm(r.savings / total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-3">
            A negative result is common and not alarming in itself, since depreciation is a non-cash cost. Savings
            per m² is the number to watch. Real reports are filed with{" "}
            <a href="https://www.bolagsverket.se" target="_blank" rel="noreferrer" className="underline hover:text-ochre">
              Bolagsverket
            </a>
            .
          </p>
        </div>
      </section>

      <section className="grid gap-12 pt-16 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="font-display text-4xl">How the grade is built</h2>
          <p className="mt-2 text-sm text-ink-2">
            Each factor is scored 0–100 against Stockholm benchmarks, then weighted.{" "}
            <Link href="/method" className="underline hover:text-ochre">Read the method</Link>.
          </p>
          <div className="mt-4">
            <FactorList factors={a.factors} />
          </div>
        </div>
        <div className="space-y-12">
          <div>
            <h2 className="mb-5 font-display text-4xl">Flags</h2>
            <Flags green={a.green} red={a.red} />
          </div>
          {b.upcoming.length > 0 && (
            <div>
              <h3 className="eyebrow mb-3">On the horizon</h3>
              <ul className="space-y-2 border-l-2 border-ochre pl-4 text-[15px]">
                {b.upcoming.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="bg-ink p-6 text-paper">
            <h3 className="font-display text-2xl">Ask the board before you bid</h3>
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-paper/85 marker:font-mono marker:text-ochre">
              {a.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </article>
  );
}
