"use client";

import { useState } from "react";
import { num, num1 } from "@/lib/format";
import { stressFee } from "@/lib/score";

export function StressTest({
  feePerSqm,
  debtPerSqm,
  rateSensitivity,
}: {
  feePerSqm: number;
  debtPerSqm: number;
  rateSensitivity: number;
}) {
  const [size, setSize] = useState(62);
  const [pp, setPp] = useState(1);
  const [price, setPrice] = useState(4_500_000);

  const monthly = (feePerSqm * size) / 12;
  const { increasePct, newMonthlyFee } = stressFee({ monthlyFee: monthly, rateSensitivity, ratePp: pp });
  const debtShare = debtPerSqm * size;
  const truePrice = price + debtShare;
  const riseTone = increasePct > 15 ? "text-down" : increasePct > 7 ? "text-warn" : "text-ink";

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-6">
        <Slider label="Flat size" value={`${size} m²`} min={20} max={160} step={1} v={size} set={setSize} />
        <Slider label="Interest rates rise by" value={`+${num1(pp)} pp`} min={0} max={4} step={0.25} v={pp} set={setPp} />
        <label className="block">
          <span className="text-sm font-medium">Asking price</span>
          <div className="mt-1.5 flex items-center rounded-lg border border-line-2 bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-tint">
            <input
              inputMode="numeric"
              value={num(price)}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ""));
                if (Number.isFinite(n)) setPrice(n);
              }}
              className="h-11 w-full bg-transparent px-3 text-base tabular outline-none"
            />
            <span className="pr-3 text-sm text-ink-3">kr</span>
          </div>
        </label>
      </div>

      <div className="rounded-lg bg-surface-2 p-5">
        <dl className="space-y-3 text-sm">
          <Row label="Monthly fee today" value={`${num(monthly)} kr`} />
          <Row
            label={`Monthly fee after +${num1(pp)} pp`}
            value={`${num(newMonthlyFee)} kr`}
            sub={pp > 0 ? `+${num(newMonthlyFee - monthly)} kr/mo (+${num1(increasePct)} %)` : "no change"}
            className={riseTone}
          />
          <Row
            label="Your share of association debt"
            value={`${num(debtShare)} kr`}
            sub="approx., by floor area"
            className={debtPerSqm > 15000 ? "text-down" : ""}
          />
          <Row label="Asking price" value={`${num(price)} kr`} />
        </dl>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line-2 pt-4">
          <div>
            <p className="text-sm font-semibold">True price</p>
            <p className="text-xs text-ink-3">price + debt share · {num(truePrice / size)} kr/m²</p>
          </div>
          <p className="whitespace-nowrap text-2xl font-bold tracking-tight tabular">{num(truePrice)} kr</p>
        </div>
      </div>
    </div>
  );
}

function Slider(props: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  v: number;
  set: (n: number) => void;
}) {
  const fill = ((props.v - props.min) / (props.max - props.min)) * 100;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{props.label}</span>
        <span className="text-base font-semibold tabular">{props.value}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.v}
        onChange={(e) => props.set(Number(e.target.value))}
        className="mt-3 w-full"
        style={{ ["--fill" as string]: `${fill}%` }}
      />
    </label>
  );
}

function Row({ label, value, sub, className = "" }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-2">
        {label}
        {sub && <span className="block text-xs text-ink-3">{sub}</span>}
      </dt>
      <dd className={`font-semibold tabular ${className}`}>{value}</dd>
    </div>
  );
}
