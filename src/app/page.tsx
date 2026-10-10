import Link from "next/link";
import { RATED } from "@/lib/brfs";
import { perSqm } from "@/lib/format";
import { BrfIndex, type IndexRow } from "@/components/brf-index";
import { GradeChip } from "@/components/grade";

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

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

  const trap = RATED.find((b) => b.newBuild) ?? RATED[RATED.length - 1];
  const strong = RATED.filter((b) => "AB".includes(b.assessment.grade)).length;
  const weak = RATED.filter((b) => "EFG".includes(b.assessment.grade)).length;

  return (
    <>
      <section className="grid gap-10 pb-14 pt-12 md:grid-cols-[1.45fr_1fr] md:pt-16">
        <div>
          <p className="eyebrow reveal">Stockholm · annual reports 2020–2024</p>
          <h1
            className="reveal mt-4 font-display text-[clamp(2.9rem,7.5vw,5.8rem)] leading-[0.92]"
            style={{ ["--i" as string]: 1 }}
          >
            Read the stairwell
            <br />
            <span className="italic text-ochre">before</span> you buy the flat.
          </h1>
          <p className="reveal mt-6 max-w-xl text-lg text-ink-2" style={{ ["--i" as string]: 2 }}>
            In Stockholm, buying a bostadsrätt means buying into the association&apos;s debts too. Trapphus reads
            each förening&apos;s annual report and grades its health from A to G, the same way your building&apos;s
            energy label does.
          </p>
          <div className="reveal mt-8 flex flex-wrap gap-3" style={{ ["--i" as string]: 3 }}>
            <a href="#index" className="bg-ink px-5 py-3 text-sm text-paper transition-colors hover:bg-ochre">
              Browse the index
            </a>
            <Link href="/analyse" className="border border-ink px-5 py-3 text-sm transition-colors hover:border-ochre hover:text-ochre">
              Analyse any årsredovisning →
            </Link>
          </div>
        </div>

        <Link
          href={`/brf/${trap.slug}`}
          className="reveal group relative self-end border border-ink bg-paper p-6 shadow-[8px_8px_0_var(--ink)] transition-transform hover:-translate-y-1"
          style={{ ["--i" as string]: 4 }}
        >
          <p className="eyebrow !text-falu">Case study · the low-fee trap</p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <h2 className="font-display text-3xl leading-tight">{trap.name}</h2>
            <GradeChip grade={trap.assessment.grade} size="lg" />
          </div>
          <p className="mt-1 text-sm text-ink-3">
            {trap.district} · built {trap.built}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div>
              <dt className="eyebrow">Fee</dt>
              <dd className="font-display text-2xl text-moss">{perSqm(trap.inputs.feePerSqm)}</dd>
              <dd className="text-xs text-ink-3">looks cheap</dd>
            </div>
            <div>
              <dt className="eyebrow">Debt</dt>
              <dd className="font-display text-2xl text-falu">{perSqm(trap.inputs.debtPerSqm)}</dd>
              <dd className="text-xs text-ink-3">is why</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-2">
            Developers set the opening fee. A low one sells flats, while the association borrows to cover the gap. See
            what that does when rates move →
          </p>
        </Link>
      </section>

      <section className="grid grid-cols-2 border-y border-ink md:grid-cols-4">
        {[
          [String(RATED.length), "associations graded"],
          [perSqm(median(RATED.map((b) => b.inputs.debtPerSqm))), "median debt"],
          [String(strong), "graded A–B"],
          [String(weak), "graded E or worse"],
        ].map(([v, l], i) => (
          <div key={l} className={`px-4 py-5 ${i ? "md:border-l" : ""} ${i % 2 ? "border-l" : ""} border-line ${i > 1 ? "border-t md:border-t-0" : ""}`}>
            <div className="font-display text-3xl tabular sm:text-4xl">{v}</div>
            <div className="eyebrow mt-1">{l}</div>
          </div>
        ))}
      </section>

      <div id="index" className="scroll-mt-6 pt-14">
        <BrfIndex rows={rows} />
      </div>
    </>
  );
}
