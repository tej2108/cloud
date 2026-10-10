import Link from "next/link";
import { MEDIANS, RATED, type RatedBrf } from "@/lib/brfs";
import { GRADES } from "@/lib/score";
import { num, pct, perSqm } from "@/lib/format";
import { BrfIndex, type IndexRow } from "@/components/brf-index";
import { GradeChip, gradeColor } from "@/components/grade";
import { ChevronRight } from "@/components/icons";

export default function Home() {
  const rows: IndexRow[] = RATED.map((b) => ({
    slug: b.slug,
    name: b.name,
    district: b.district,
    built: b.built,
    apartments: b.apartments,
    newBuild: b.newBuild,
    land: b.land,
    grade: b.assessment.grade,
    score: b.assessment.score,
    signal: b.assessment.signal,
    debtPerSqm: b.inputs.debtPerSqm,
    savingsPerSqm: b.inputs.savingsPerSqm,
    rateSensitivity: b.inputs.rateSensitivity,
    feePerSqm: b.inputs.feePerSqm,
  }));

  const strongest = RATED[0];
  const trap = RATED.find((b) => b.newBuild) ?? RATED[RATED.length - 1];
  const exposed = RATED.filter((b) => b !== trap).reduce((m, b) =>
    b.inputs.rateSensitivity > m.inputs.rateSensitivity ? b : m,
  );

  return (
    <>
      <BrfIndex
        rows={rows}
        intro={
          <>
            <h1 className="max-w-xl text-[clamp(2rem,4.6vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.025em]">
              Check the association before you bid on the flat.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-pretty text-ink-2">
              Buying a bostadsrätt means buying into the förening&apos;s debt. We read each annual report and grade
              its finances from A to G.
            </p>
          </>
        }
        aside={<Snapshot />}
      />

      <section className="mx-auto max-w-[1200px] px-4 pt-10 sm:px-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold tracking-tight">Worth a closer look</h2>
          <Link href="/analyse" className="text-sm font-medium text-brand hover:underline">
            Grade your own report →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Spotlight
            b={strongest}
            kicker="Strongest balance sheet"
            note="Low debt, healthy savings. Fee rises would barely be felt."
            stats={[
              ["Debt", perSqm(strongest.inputs.debtPerSqm)],
              ["Savings", perSqm(strongest.inputs.savingsPerSqm)],
            ]}
          />
          <Spotlight
            b={trap}
            kicker="The low-fee trap"
            note="The developer set a low opening fee. The association borrowed to cover the gap."
            stats={[
              ["Fee", perSqm(trap.inputs.feePerSqm)],
              ["Debt", perSqm(trap.inputs.debtPerSqm)],
            ]}
            warn
          />
          <Spotlight
            b={exposed}
            kicker="Most exposed to rates"
            note={`If rates rise one point, fees must go up ${pct(exposed.inputs.rateSensitivity)} to cover it. That lands straight on the residents.`}
            stats={[
              ["+1 pp rate", `+${pct(exposed.inputs.rateSensitivity)} fee`],
              ["Fee", perSqm(exposed.inputs.feePerSqm)],
            ]}
            warn
          />
        </div>
      </section>
    </>
  );
}

function Snapshot() {
  const counts = GRADES.map((g) => ({ g, n: RATED.filter((b) => b.assessment.grade === g).length }));
  const rows: [string, string][] = [
    ["Median debt", perSqm(MEDIANS.debtPerSqm)],
    ["Median savings", perSqm(MEDIANS.savingsPerSqm)],
    ["Median fee", perSqm(MEDIANS.feePerSqm)],
    ["Median fee rise per +1 pp", pct(MEDIANS.rateSensitivity)],
  ];
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Index snapshot</h2>
        <span className="text-xs text-ink-3">FY2024 · {RATED.length} associations</span>
      </div>

      <p className="label mt-5">Grade distribution</p>
      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-line">
        {counts
          .filter((c) => c.n > 0)
          .map((c) => (
            <div key={c.g} style={{ flex: c.n, background: gradeColor(c.g) }} title={`${c.g}: ${c.n}`} />
          ))}
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-xs tabular">
        {counts.map((c) => (
          <div key={c.g} className={c.n ? "" : "text-ink-3"}>
            <div className="font-semibold">{c.g}</div>
            <div className="text-ink-3">{c.n}</div>
          </div>
        ))}
      </div>

      <dl className="mt-5 divide-y divide-line border-t border-line text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2.5">
            <dt className="text-ink-2">{k}</dt>
            <dd className="font-semibold tabular">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Spotlight({
  b,
  kicker,
  note,
  stats,
  warn,
}: {
  b: RatedBrf;
  kicker: string;
  note: string;
  stats: [string, string][];
  warn?: boolean;
}) {
  return (
    <Link href={`/brf/${b.slug}`} className="card group flex flex-col p-5 transition-shadow hover:shadow-[0_4px_16px_rgb(16_24_40/0.08)]">
      <p className={`text-xs font-semibold ${warn ? "text-down" : "text-up"}`}>{kicker}</p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold tracking-tight group-hover:text-brand">{b.name}</h3>
          <p className="text-sm text-ink-3">
            {b.district} · built {b.built}
          </p>
        </div>
        <GradeChip grade={b.assessment.grade} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-surface-2 p-3">
        {stats.map(([k, v]) => (
          <div key={k}>
            <dt className="label">{k}</dt>
            <dd className="mt-0.5 font-semibold tabular">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex-1 text-sm text-ink-2">{note}</p>
      <span className="mt-4 flex items-center gap-1 text-sm font-medium text-brand">
        Score {num(b.assessment.score)}/100 · see the report <ChevronRight />
      </span>
    </Link>
  );
}
