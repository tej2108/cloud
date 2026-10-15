"use client";

import { useEffect, useRef, useState } from "react";
import { mkr, num, perSqm } from "@/lib/format";

export interface Series {
  key: string;
  label: string;
  sv: string;
  unit: "sqm" | "mkr";
  /** Whether a rise is good news for a buyer */
  upIsGood: boolean;
  points: { year: number; value: number }[];
}

const fmt = (unit: Series["unit"]) => (unit === "sqm" ? perSqm : mkr);
const axisFmt = (unit: Series["unit"]) => (unit === "sqm" ? (n: number) => num(n) : (n: number) => mkr(n).replace(" Mkr", ""));

/** "Nice" tick step: 1, 2 or 5 times a power of ten. */
function niceStep(span: number, target = 4) {
  const raw = span / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/** Five-year annual-report series with a metric switcher, Nordnet-style. */
export function ReportsChart({ series }: { series: Series[] }) {
  const [key, setKey] = useState(series[0].key);
  const [hover, setHover] = useState<number | null>(null);
  // Lay the chart out at its real pixel width so axis text stays readable on phones.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const s = series.find((x) => x.key === key)!;
  const f = fmt(s.unit);

  const values = s.points.map((p) => p.value);
  const rawMax = Math.max(...values, 0);
  const rawMin = Math.min(...values, 0);
  const step = niceStep(rawMax - rawMin || 1);
  const max = Math.ceil(rawMax / step) * step || step;
  const min = Math.floor(rawMin / step) * step;
  const ticks: number[] = [];
  for (let t = min; t <= max + step / 2; t += step) ticks.push(t);

  const H = W < 480 ? 200 : 240;
  const L = 44;
  const T = 12;
  const B = 28;
  const plotW = W - L;
  const plotH = H - T - B;
  const y = (v: number) => T + ((max - v) / (max - min || 1)) * plotH;
  const slot = plotW / s.points.length;
  const bw = Math.min(56, slot * 0.5);

  const first = s.points[0];
  const last = s.points[s.points.length - 1];
  const active = hover != null ? s.points[hover] : last;
  const change = first.value > 0 && last.value > 0 ? (last.value / first.value - 1) * 100 : null;
  const good = change == null ? null : change >= 0 === s.upIsGood;

  return (
    <div>
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Metric">
        {series.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={x.key === key}
            onClick={() => {
              setKey(x.key);
              setHover(null);
            }}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${
              x.key === key ? "bg-ink font-semibold text-white" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-1">
        <div>
          <p className="label">
            {s.label} · {s.sv} · {active.year}
          </p>
          <p className="mt-0.5 text-3xl font-bold tracking-tight tabular">{f(active.value)}</p>
        </div>
        {change != null && (
          <p className={`pb-1 text-sm font-semibold tabular ${good ? "text-up" : "text-down"}`}>
            {change >= 0 ? "▲ +" : "▼ "}
            {Math.round(change)} % <span className="font-normal text-ink-3">since {first.year}</span>
          </p>
        )}
      </div>

      <div ref={box} className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={`${s.label} by year: ${s.points.map((p) => `${p.year} ${f(p.value)}`).join(", ")}`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--line-2)" : "var(--line)"} strokeDasharray={t === 0 ? undefined : "3 3"} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)" className="tabular">
              {axisFmt(s.unit)(t)}
            </text>
          </g>
        ))}
        {s.points.map((p, i) => {
          const cx = L + slot * (i + 0.5);
          const top = Math.min(y(p.value), y(0));
          const h = Math.max(1.5, Math.abs(y(p.value) - y(0)));
          const on = hover == null ? i === s.points.length - 1 : hover === i;
          return (
            <g key={p.year} onMouseEnter={() => setHover(i)}>
              <rect x={L + slot * i} y={T} width={slot} height={plotH} fill="transparent" />
              <rect
                x={cx - bw / 2}
                y={top}
                width={bw}
                height={h}
                rx="3"
                fill={p.value < 0 ? "var(--down)" : "var(--brand)"}
                opacity={on ? 1 : 0.3}
                className="transition-opacity"
              />
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="12" fill={on ? "var(--ink)" : "var(--ink-3)"} fontWeight={on ? 600 : 400}>
                {p.year}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}
