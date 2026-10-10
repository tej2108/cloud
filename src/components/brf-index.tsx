"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Grade } from "@/lib/score";
import { perSqm, pct } from "@/lib/format";
import { GradeChip } from "./grade";

export interface IndexRow {
  slug: string;
  name: string;
  district: string;
  built: number;
  apartments: number;
  newBuild: boolean;
  land: string;
  grade: Grade;
  score: number;
  signal: string;
  debtPerSqm: number;
  savingsPerSqm: number;
  rateSensitivity: number;
  feePerSqm: number;
}

const SORTS = {
  score: { label: "Health score", fn: (a: IndexRow, b: IndexRow) => b.score - a.score },
  debt: { label: "Lowest debt", fn: (a: IndexRow, b: IndexRow) => a.debtPerSqm - b.debtPerSqm },
  savings: { label: "Highest savings", fn: (a: IndexRow, b: IndexRow) => b.savingsPerSqm - a.savingsPerSqm },
  fee: { label: "Lowest fee", fn: (a: IndexRow, b: IndexRow) => a.feePerSqm - b.feePerSqm },
} as const;

type SortKey = keyof typeof SORTS;

export function BrfIndex({ rows }: { rows: IndexRow[] }) {
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("score");

  const districts = useMemo(() => [...new Set(rows.map((r) => r.district))].sort(), [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => !district || r.district === district)
      .filter((r) => !needle || `${r.name} ${r.district}`.toLowerCase().includes(needle))
      .sort(SORTS[sort].fn);
  }, [rows, q, district, sort]);

  return (
    <section aria-labelledby="index-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="index-heading" className="font-display text-4xl">
          The index <span className="italic text-ink-3">· föreningar</span>
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block">
            <span className="sr-only">Search associations</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or district…"
              className="w-full border-b border-ink bg-transparent py-1.5 pr-2 text-sm outline-none placeholder:text-ink-3 focus:border-ochre sm:w-64"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="eyebrow">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="border-b border-ink bg-transparent py-1.5 text-sm outline-none focus:border-ochre"
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[null, ...districts].map((d) => (
          <button
            key={d ?? "all"}
            onClick={() => setDistrict(d)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              district === d ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
            }`}
          >
            {d ?? "All districts"}
          </button>
        ))}
      </div>

      <div className="mt-6 hidden grid-cols-[3.5rem_1fr_7rem_7rem_6rem_6.5rem_9rem] gap-4 border-b border-ink pb-2 md:grid">
        <span className="eyebrow">Grade</span>
        <span className="eyebrow">Association</span>
        <span className="eyebrow text-right">Debt</span>
        <span className="eyebrow text-right">Savings</span>
        <span className="eyebrow text-right">+1pp rate</span>
        <span className="eyebrow text-right">Fee</span>
        <span className="eyebrow text-right">Signal</span>
      </div>

      <ul>
        {shown.map((r, i) => (
          <li key={r.slug} className="reveal" style={{ ["--i" as string]: i }}>
            <Link
              href={`/brf/${r.slug}`}
              className="group grid grid-cols-[3.5rem_1fr] items-center gap-x-4 gap-y-3 border-b border-line py-4 transition-colors hover:bg-paper-2/60 md:grid-cols-[3.5rem_1fr_7rem_7rem_6rem_6.5rem_9rem]"
            >
              <GradeChip grade={r.grade} />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="truncate font-display text-2xl leading-tight group-hover:text-ochre transition-colors">
                    {r.name}
                  </span>
                  {r.newBuild && (
                    <span className="shrink-0 rounded-sm bg-ochre/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ochre">
                      New build
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-3">
                  {r.district} · {r.built} · {r.apartments} flats · {r.land}
                </div>
              </div>
              <dl className="col-span-2 grid grid-cols-4 gap-2 font-mono text-xs tabular md:contents md:text-sm">
                <Metric label="Debt" value={perSqm(r.debtPerSqm)} />
                <Metric label="Savings" value={perSqm(r.savingsPerSqm)} warn={r.savingsPerSqm < 150} />
                <Metric label="+1pp rate" value={pct(r.rateSensitivity)} warn={r.rateSensitivity > 12} />
                <Metric label="Fee" value={perSqm(r.feePerSqm)} />
              </dl>
              <span className="col-span-2 flex items-center justify-between gap-2 text-sm md:col-span-1 md:justify-end">
                <span className="md:text-right">{r.signal}</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="py-10 text-center text-ink-3">No associations match.</li>}
      </ul>
    </section>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="md:text-right">
      <dt className="text-[10px] uppercase tracking-wider text-ink-3 md:sr-only">{label}</dt>
      <dd className={warn ? "text-falu" : ""}>{value}</dd>
    </div>
  );
}
