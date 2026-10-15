import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { MEDIANS } from "@/lib/brfs";
import { getBrf, listBrfs } from "@/lib/data";
import { dbConfigured, listWatched } from "@/lib/data/saved";
import { mkr, num, num1, pct, perSqm } from "@/lib/format";
import { GradeChip, GradeLadder, SignalPill } from "@/components/grade";
import { FactorList, Flags } from "@/components/factors";
import { ReportsChart, type Series } from "@/components/reports-chart";
import { SectionNav } from "@/components/section-nav";
import { StressTest } from "@/components/stress-test";
import { ChevronRight } from "@/components/icons";
import { WatchButton } from "@/components/watch-button";

export async function generateStaticParams() {
  return (await listBrfs()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata(props: PageProps<"/brf/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const b = await getBrf(slug);
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

// Whether this visitor's shared list includes the association. Read on every
// request (connection() keeps it out of the pre-built page), so the rest of the
// page stays static and only this small hole is dynamic. Renders nothing where
// no database is connected.
async function WatchState({ slug }: { slug: string }) {
  await connection();
  if (!dbConfigured()) return null;
  const watching = (await listWatched()).includes(slug);
  return (
    <div className="md:ml-auto">
      <WatchButton slug={slug} watching={watching} />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading association">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-8 sm:px-6">
          <div className="h-3 w-40 rounded bg-line" />
          <div className="h-9 w-80 rounded bg-line" />
          <div className="h-3 w-96 max-w-full rounded bg-line" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="card h-80" />
        <div className="card h-80" />
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "costs", label: "Your costs" },
  { id: "reports", label: "Annual reports" },
  { id: "breakdown", label: "Grade breakdown" },
];

async function BrfDetail({ params }: { params: PageProps<"/brf/[slug]">["params"] }) {
  const { slug } = await params;
  const b = await getBrf(slug);
  if (!b) notFound();

  const a = b.assessment;
  const i = b.inputs;
  const total = b.boa + b.loa;
  const latest = b.reports[b.reports.length - 1];
  const reports = b.reports;
  const pts = (fn: (r: (typeof reports)[number]) => number) => reports.map((r) => ({ year: r.year, value: fn(r) }));

  const series: Series[] = [
    { key: "fee", label: "Fee", sv: "avgift/kvm", unit: "sqm", upIsGood: false, points: pts((r) => r.feePerSqm) },
    { key: "debt", label: "Debt", sv: "skuld/kvm", unit: "sqm", upIsGood: false, points: pts((r) => r.debt / total) },
    { key: "savings", label: "Savings", sv: "sparande/kvm", unit: "sqm", upIsGood: true, points: pts((r) => r.savings / total) },
    { key: "result", label: "Result", sv: "årets resultat", unit: "mkr", upIsGood: true, points: pts((r) => r.result) },
    { key: "interest", label: "Interest cost", sv: "räntekostnad", unit: "mkr", upIsGood: false, points: pts((r) => r.interestCost) },
    { key: "cash", label: "Cash", sv: "likvida medel", unit: "mkr", upIsGood: true, points: pts((r) => r.cash) },
  ];

  // `better` is the direction that is good for a buyer; null means no judgement.
  const ratios: { label: string; sv: string; value: number; median: number; fmt: (n: number) => string; better: "low" | "high" | null; hint: string }[] = [
    { label: "Debt", sv: "Skuldsättning/kvm", value: i.debtPerSqm, median: MEDIANS.debtPerSqm, fmt: perSqm, better: "low", hint: "per m² of total area" },
    { label: "Savings", sv: "Sparande/kvm", value: i.savingsPerSqm, median: MEDIANS.savingsPerSqm, fmt: perSqm, better: "high", hint: "per m², per year" },
    { label: "Rate sensitivity", sv: "Räntekänslighet", value: i.rateSensitivity, median: MEDIANS.rateSensitivity, fmt: pct, better: "low", hint: "fee rise per +1 pp" },
    { label: "Fee", sv: "Årsavgift/kvm", value: i.feePerSqm, median: MEDIANS.feePerSqm, fmt: perSqm, better: "low", hint: "per m² of flat, per year" },
    { label: "Energy", sv: "Energikostnad/kvm", value: i.energyCostPerSqm, median: MEDIANS.energyCostPerSqm, fmt: perSqm, better: "low", hint: "per m², per year" },
    { label: "Fee share of income", sv: "Avgiftsandel", value: i.feeShare ?? 0, median: MEDIANS.feeShare, fmt: pct, better: null, hint: "rest from commercial rent" },
  ];

  const tags = [
    b.land === "äganderätt" ? "Äganderätt (owns land)" : `Tomträtt${b.tomtrattYearsLeft ? ` · renegotiation in ${b.tomtrattYearsLeft} y` : ""}`,
    b.genuine ? "Äkta förening" : "Oäkta förening",
    b.stambyteYear ? `Stambyte ${b.stambyteYear}` : "No stambyte yet",
    b.maintenancePlan ? "Maintenance plan" : "No maintenance plan",
  ];

  return (
    <article>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 pb-7 pt-5 sm:px-6">
          <nav className="flex items-center gap-1 text-xs text-ink-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand">Associations</Link>
            <ChevronRight className="h-3 w-3" />
            <span>{b.district}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-ink-2">{b.name}</span>
          </nav>

          <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 md:flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]">{b.name}</h1>
                <span className="rounded bg-warn-tint px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warn">
                  Demo data
                </span>
                <Suspense fallback={null}>
                  <WatchState slug={b.slug} />
                </Suspense>
              </div>
              <p className="mt-1 text-sm text-ink-2">
                {b.district} · built {b.built} · {b.apartments} flats · {num(total)} m²
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <li key={t} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2">
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-4 md:text-right">
              <div className="md:order-2">
                <GradeChip grade={a.grade} size="lg" />
              </div>
              <div>
                <p className="text-sm text-ink-2">Health score</p>
                <p className="text-3xl font-bold leading-none tracking-tight tabular">
                  {a.score}
                  <span className="text-base font-medium text-ink-3">/100</span>
                </p>
                <div className="mt-2">
                  <SignalPill grade={a.grade}>{a.signal}</SignalPill>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SectionNav sections={SECTIONS} />

      <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] items-start gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section id="overview" className="card scroll-mt-32 p-5 sm:p-6">
            <h2 className="text-lg font-bold tracking-tight">{a.title}</h2>
            <p className="mt-1.5 text-ink-2">{a.summary}</p>
            <p className="mt-3 text-sm text-ink-3">{b.blurb}</p>

            <div className="mt-6 flex items-baseline justify-between">
              <h3 className="font-semibold">Key ratios {latest.year}</h3>
              <span className="text-xs text-ink-3">vs. index median</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border border-line md:grid-cols-3">
              {ratios.map((r) => {
                const above = r.value > r.median;
                const good = r.better == null ? null : r.better === "low" ? !above : above;
                // A percentage against the median only means something when both are positive.
                const diff = r.value > 0 && r.median > 0 ? Math.abs(Math.round((r.value / r.median - 1) * 100)) : null;
                return (
                  <div key={r.label} className="-mb-px -mr-px border-b border-r border-line p-4">
                    <dt className="text-sm text-ink-2">{r.label}</dt>
                    <dd className="mt-1 text-xl font-bold tracking-tight tabular">{r.fmt(r.value)}</dd>
                    <dd className="mt-1 text-xs text-ink-3 tabular">
                      {good != null && diff !== 0 && (
                        <span className={`mr-1.5 font-semibold ${good ? "text-up" : "text-down"}`}>
                          {above ? "▲" : "▼"}
                          {diff != null && ` ${diff} %`}
                        </span>
                      )}
                      median {r.fmt(r.median)}
                    </dd>
                    <dd className="mt-0.5 text-[11px] text-ink-3">
                      {r.sv} · {r.hint}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section id="costs" className="card scroll-mt-32 p-5 sm:p-6">
            <h2 className="text-lg font-bold tracking-tight">What it means for you</h2>
            <p className="mb-6 mt-1 text-sm text-ink-2">
              Your monthly fee rises with the association&apos;s interest costs, and its debt is effectively part of
              what you pay for the flat.
            </p>
            <StressTest feePerSqm={i.feePerSqm} debtPerSqm={i.debtPerSqm} rateSensitivity={i.rateSensitivity} />
          </section>

          <section id="reports" className="card scroll-mt-32 p-5 sm:p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-bold tracking-tight">Annual reports</h2>
              <span className="text-xs text-ink-3">
                Årsredovisningar {b.reports[0].year}–{latest.year}
              </span>
            </div>
            <ReportsChart series={series} />

            <div className="-mx-5 mt-6 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[640px] text-sm tabular">
                <thead>
                  <tr className="border-y border-line bg-surface-2 text-left">
                    <th className="label py-2.5 pl-5 font-medium sm:pl-6">Year</th>
                    {["Income", "Interest", "Avg. rate", "Result", "Debt", "Cash", "Savings/m²"].map((h, k, arr) => (
                      <th key={h} className={`label py-2.5 text-right font-medium ${k === arr.length - 1 ? "pr-5 sm:pr-6" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...b.reports].reverse().map((r) => (
                    <tr key={r.year} className="hover:bg-surface-2">
                      <td className="py-2.5 pl-5 font-semibold sm:pl-6">{r.year}</td>
                      <td className="text-right">{mkr(r.totalIncome)}</td>
                      <td className="text-right">{mkr(r.interestCost)}</td>
                      <td className="text-right">{num1(r.avgRate)} %</td>
                      <td className={`text-right ${r.result < 0 ? "text-down" : ""}`}>{mkr(r.result)}</td>
                      <td className="text-right">{mkr(r.debt)}</td>
                      <td className="text-right">{mkr(r.cash)}</td>
                      <td className={`pr-5 text-right sm:pr-6 ${r.savings < 0 ? "text-down" : ""}`}>{perSqm(r.savings / total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-ink-3">
              A negative result is common and not alarming in itself, since depreciation is a non-cash cost. Savings
              per m² is the number to watch. Real reports are filed with{" "}
              <a href="https://www.bolagsverket.se" target="_blank" rel="noreferrer" className="text-brand hover:underline">
                Bolagsverket
              </a>
              .
            </p>
          </section>

          <section id="breakdown" className="card scroll-mt-32 p-5 sm:p-6">
            <h2 className="text-lg font-bold tracking-tight">How the grade is built</h2>
            <p className="mb-5 mt-1 text-sm text-ink-2">
              Each factor is scored 0–100 against Stockholm benchmarks, then weighted.{" "}
              <Link href="/method" className="text-brand hover:underline">Read the method</Link>
            </p>
            <FactorList factors={a.factors} />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-32">
          <div className="card p-5">
            <h2 className="mb-4 font-semibold">Health grade</h2>
            <GradeLadder grade={a.grade} score={a.score} />
          </div>
          <div className="card p-5">
            <Flags green={a.green} red={a.red} />
          </div>
          {b.upcoming.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">On the horizon</h2>
              <ul className="space-y-2 text-sm">
                {b.upcoming.map((u) => (
                  <li key={u} className="flex gap-2.5">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card border-brand/20 bg-brand-tint p-5">
            <h2 className="font-semibold">Ask the board before you bid</h2>
            <ol className="mt-3 space-y-2.5 text-sm text-ink-2">
              {a.questions.map((q, k) => (
                <li key={q} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
                    {k + 1}
                  </span>
                  {q}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </article>
  );
}
