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

  return (
    <div className="grid gap-8 border border-ink p-5 sm:p-8 md:grid-cols-[1fr_1.2fr]">
      <div className="space-y-7">
        <Slider label="Your flat" value={`${size} m²`} min={20} max={160} step={1} v={size} set={setSize} />
        <Slider
          label="If interest rates rise by"
          value={`+${num1(pp)} pp`}
          min={0}
          max={4}
          step={0.25}
          v={pp}
          set={setPp}
        />
        <label className="block">
          <span className="eyebrow">Asking price (kr)</span>
          <input
            inputMode="numeric"
            value={num(price)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, ""));
              if (Number.isFinite(n)) setPrice(n);
            }}
            className="mt-1 w-full border-b border-ink bg-transparent py-1 font-mono text-lg tabular outline-none focus:border-ochre"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        <Out label="Monthly fee today" value={`${num(monthly)} kr`} />
        <Out
          label={`After +${num1(pp)} pp`}
          value={`${num(newMonthlyFee)} kr`}
          sub={pp > 0 ? `+${num1(increasePct)} % · +${num(newMonthlyFee - monthly)} kr/mo` : "no change"}
          tone={increasePct > 15 ? "bad" : increasePct > 7 ? "warn" : undefined}
        />
        <Out
          label="Your share of association debt"
          value={`${num(debtShare)} kr`}
          sub="approx., by floor area"
          tone={debtPerSqm > 15000 ? "bad" : undefined}
        />
        <Out
          label="True price (price + debt share)"
          value={`${num(truePrice)} kr`}
          sub={`${num(truePrice / size)} kr/m²`}
        />
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
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">{props.label}</span>
        <span className="font-display text-2xl tabular">{props.value}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.v}
        onChange={(e) => props.set(Number(e.target.value))}
        className="mt-3 w-full"
      />
    </label>
  );
}

function Out({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" | "bad" }) {
  const color = tone === "bad" ? "text-falu" : tone === "warn" ? "text-ochre" : "";
  return (
    <div className="border-t border-line pt-2">
      <div className="text-xs text-ink-3">{label}</div>
      <div className={`font-display text-[clamp(1.5rem,3.2vw,2.2rem)] leading-tight tabular ${color}`}>{value}</div>
      {sub && <div className="font-mono text-[11px] text-ink-3">{sub}</div>}
    </div>
  );
}
