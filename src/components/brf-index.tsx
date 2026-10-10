"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Grade } from "@/lib/score";
import { num, pct } from "@/lib/format";
import { GradeChip, SignalPill } from "./grade";
import { ChevronRight, SearchIcon, SortIcon } from "./icons";

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

type NumKey = "score" | "debtPerSqm" | "savingsPerSqm" | "rateSensitivity" | "feePerSqm";

/** Sortable numeric columns. `best` is the direction that is good for a buyer, used as the first click. */
const COLS: { key: NumKey; label: string; unit: string; best: "asc" | "desc" }[] = [
  { key: "score", label: "Score", unit: "/100", best: "desc" },
  { key: "debtPerSqm", label: "Debt", unit: "kr/m²", best: "asc" },
  { key: "savingsPerSqm", label: "Savings", unit: "kr/m²", best: "desc" },
  { key: "rateSensitivity", label: "+1 pp rate", unit: "fee rise", best: "asc" },
  { key: "feePerSqm", label: "Fee", unit: "kr/m²", best: "asc" },
];

const GRID = "md:grid-cols-[3.25rem_minmax(0,1fr)_4.5rem_6.5rem_6rem_6rem_5.5rem_10rem]";

export function BrfIndex({ rows, intro, aside }: { rows: IndexRow[]; intro: React.ReactNode; aside: React.ReactNode }) {
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: NumKey; dir: "asc" | "desc" }>({ key: "score", dir: "desc" });

  const districts = useMemo(() => [...new Set(rows.map((r) => r.district))].sort((a, b) => a.localeCompare(b, "sv")), [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const sign = sort.dir === "asc" ? 1 : -1;
    return rows
      .filter((r) => !district || r.district === district)
      .filter((r) => !needle || `${r.name} ${r.district}`.toLowerCase().includes(needle))
      .sort((a, b) => sign * (a[sort.key] - b[sort.key]));
  }, [rows, q, district, sort]);

  const clickSort = (key: NumKey) => {
    const col = COLS.find((c) => c.key === key)!;
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: col.best }));
  };

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            {intro}
            <form
              role="search"
              className="mt-7 flex flex-col gap-2 rounded-xl border border-line-2 bg-surface p-2 shadow-[0_1px_2px_rgb(16_24_40/0.05)] focus-within:border-brand sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("index")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <label className="flex flex-1 items-center gap-2.5 px-2">
                <SearchIcon className="h-5 w-5 shrink-0 text-ink-3" />
                <span className="sr-only">Search associations</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Association or district"
                  className="h-11 w-full bg-transparent text-base outline-none placeholder:text-ink-3"
                />
              </label>
              <label className="sr-only" htmlFor="district">District</label>
              <select
                id="district"
                value={district ?? ""}
                onChange={(e) => setDistrict(e.target.value || null)}
                className="h-11 rounded-lg border border-line bg-surface-2 px-3 text-sm outline-none sm:w-44"
              >
                <option value="">All districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button className="h-11 rounded-lg bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-ink">
                Search
              </button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
              <span>Popular:</span>
              {["Södermalm", "Vasastan", "Kungsholmen", "Östermalm"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDistrict(d);
                    document.getElementById("index")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-brand hover:underline"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {aside}
        </div>
      </section>

      <section id="index" aria-labelledby="index-heading" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pt-10 sm:px-6">
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5">
            <div className="flex items-baseline gap-3">
              <h2 id="index-heading" className="text-xl font-bold tracking-tight">Associations</h2>
              <span className="whitespace-nowrap text-sm text-ink-3 tabular">
                {shown.length} of {rows.length}
              </span>
            </div>
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
              {[null, ...districts].map((d) => (
                <button
                  key={d ?? "all"}
                  onClick={() => setDistrict(d)}
                  aria-pressed={district === d}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    district === d ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-line-2 hover:text-ink"
                  }`}
                >
                  {d ?? "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile sort */}
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 md:hidden">
            <label htmlFor="sort" className="label">Sort by</label>
            <select
              id="sort"
              value={`${sort.key}:${sort.dir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split(":") as [NumKey, "asc" | "desc"];
                setSort({ key, dir });
              }}
              className="bg-transparent text-sm font-medium outline-none"
            >
              {COLS.map((c) => (
                <option key={c.key} value={`${c.key}:${c.best}`}>
                  {c.label} ({c.best === "asc" ? "lowest" : "highest"} first)
                </option>
              ))}
            </select>
          </div>

          <div className={`hidden gap-4 border-b border-line bg-surface-2 px-5 py-2.5 md:grid ${GRID}`}>
            <span className="label">Grade</span>
            <span className="label">Association</span>
            {COLS.map((c) => {
              const active = sort.key === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => clickSort(c.key)}
                  aria-pressed={active}
                  title={`Sort by ${c.label.toLowerCase()} (${c.unit})`}
                  className={`label flex items-center justify-end gap-1 text-right transition-colors hover:text-ink ${active ? "!text-ink" : ""}`}
                >
                  {c.label}
                  <SortIcon dir={active ? sort.dir : null} />
                </button>
              );
            })}
            <span className="label text-right">Buyer signal</span>
          </div>

          <ul className="divide-y divide-line">
            {shown.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/brf/${r.slug}`}
                  className={`group grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-5 ${GRID}`}
                >
                  <GradeChip grade={r.grade} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold group-hover:text-brand">{r.name}</span>
                      {r.newBuild && (
                        <span className="shrink-0 rounded bg-warn-tint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn">
                          New build
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-ink-3">
                      {r.district} · {r.built} · {r.apartments} flats · {r.land}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-3 md:hidden" />

                  <span className="hidden text-right text-sm font-semibold tabular md:block">{r.score}</span>
                  <dl className="col-span-3 grid grid-cols-4 gap-2 text-sm tabular md:contents">
                    <Metric label="Debt" value={num(r.debtPerSqm)} />
                    <Metric label="Savings" value={num(r.savingsPerSqm)} bad={r.savingsPerSqm < 150} />
                    <Metric label="+1 pp" value={pct(r.rateSensitivity)} bad={r.rateSensitivity > 12} />
                    <Metric label="Fee" value={num(r.feePerSqm)} />
                  </dl>
                  <span className="col-span-3 md:col-span-1 md:text-right">
                    <SignalPill grade={r.grade}>{r.signal}</SignalPill>
                  </span>
                </Link>
              </li>
            ))}
            {shown.length === 0 && (
              <li className="px-5 py-14 text-center text-sm text-ink-3">
                No associations match “{q}”.{" "}
                <button
                  className="text-brand hover:underline"
                  onClick={() => {
                    setQ("");
                    setDistrict(null);
                  }}
                >
                  Clear filters
                </button>
              </li>
            )}
          </ul>
          <p className="border-t border-line bg-surface-2 px-5 py-2.5 text-xs text-ink-3">
            Debt, savings and fee in kr/m² per year. “+1 pp rate” is how much fees must rise if interest rates go up one
            percentage point. Red marks a weak value.
          </p>
        </div>
      </section>
    </>
  );
}

function Metric({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="md:text-right">
      <dt className="text-[11px] text-ink-3 md:sr-only">{label}</dt>
      <dd className={bad ? "font-medium text-down" : ""}>{value}</dd>
    </div>
  );
}
