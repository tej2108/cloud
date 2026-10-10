"use client";

import { useMemo, useState } from "react";
import { assess, type Inputs, type Land } from "@/lib/score";
import { GradeChip, GradeLadder, SignalPill } from "./grade";
import { FactorList, Flags } from "./factors";

type Form = {
  feePerSqm: string;
  debtPerSqm: string;
  savingsPerSqm: string;
  rateSensitivity: string;
  energyCostPerSqm: string;
  feeShare: string;
  cashPerSqm: string;
  feeChangePct: string;
  built: string;
  stambyteYear: string;
  tomtrattYearsLeft: string;
  maintenancePlan: boolean;
  land: Land;
  genuine: boolean;
};

const EMPTY_EXAMPLE: Form = {
  feePerSqm: "780",
  debtPerSqm: "9500",
  savingsPerSqm: "190",
  rateSensitivity: "11",
  energyCostPerSqm: "185",
  feeShare: "88",
  cashPerSqm: "",
  feeChangePct: "6",
  built: "1965",
  stambyteYear: "",
  tomtrattYearsLeft: "",
  maintenancePlan: true,
  land: "äganderätt",
  genuine: true,
};

export interface Preset {
  name: string;
  inputs: Inputs;
}

function toForm(i: Inputs): Form {
  const s = (n: number | null | undefined) => (n == null ? "" : String(Math.round(n * 10) / 10));
  return {
    feePerSqm: s(i.feePerSqm),
    debtPerSqm: s(i.debtPerSqm),
    savingsPerSqm: s(i.savingsPerSqm),
    rateSensitivity: s(i.rateSensitivity),
    energyCostPerSqm: s(i.energyCostPerSqm),
    feeShare: s(i.feeShare),
    cashPerSqm: s(i.cashPerSqm),
    feeChangePct: s(i.feeChangePct),
    built: String(i.built),
    stambyteYear: s(i.stambyteYear),
    tomtrattYearsLeft: s(i.tomtrattYearsLeft),
    maintenancePlan: i.maintenancePlan,
    land: i.land,
    genuine: i.genuine,
  };
}

const n = (v: string) => {
  const x = Number(v.replace(/\s/g, "").replace(",", "."));
  return v.trim() === "" || !Number.isFinite(x) ? undefined : x;
};

export function Analyser({ presets }: { presets: Preset[] }) {
  const [f, setF] = useState<Form>(EMPTY_EXAMPLE);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const result = useMemo(() => {
    const inputs: Inputs = {
      feePerSqm: n(f.feePerSqm) ?? 0,
      debtPerSqm: n(f.debtPerSqm) ?? 0,
      savingsPerSqm: n(f.savingsPerSqm) ?? 0,
      rateSensitivity: n(f.rateSensitivity) ?? 0,
      energyCostPerSqm: n(f.energyCostPerSqm) ?? 0,
      feeShare: n(f.feeShare),
      cashPerSqm: n(f.cashPerSqm),
      feeChangePct: n(f.feeChangePct),
      built: n(f.built) ?? 1960,
      stambyteYear: n(f.stambyteYear) ?? null,
      tomtrattYearsLeft: n(f.tomtrattYearsLeft) ?? null,
      maintenancePlan: f.maintenancePlan,
      land: f.land,
      genuine: f.genuine,
      referenceYear: 2025,
    };
    return assess(inputs);
  }, [f]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="card p-5 sm:p-6">
          <p className="text-sm font-medium">Start from a demo association</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setF(toForm(p.inputs))}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand"
              >
                {p.name.replace("Brf ", "")}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="card p-5 sm:p-6">
          <legend className="sr-only">Key ratios</legend>
          <h2 className="text-lg font-bold tracking-tight">Key ratios</h2>
          <p className="mt-1 text-sm text-ink-2">
            Since 2023 every BRF must print these in the <em>förvaltningsberättelse</em>, usually in a table
            called <em>Flerårsöversikt</em> or <em>Nyckeltal</em>.
          </p>
          <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Årsavgift per kvm" hint="Fee per m² of flat area" unit="kr/m²" v={f.feePerSqm} on={(v) => set("feePerSqm", v)} />
            <Field label="Skuldsättning per kvm" hint="Debt per m² of total area" unit="kr/m²" v={f.debtPerSqm} on={(v) => set("debtPerSqm", v)} />
            <Field label="Sparande per kvm" hint="Savings per m² of total area" unit="kr/m²" v={f.savingsPerSqm} on={(v) => set("savingsPerSqm", v)} />
            <Field label="Räntekänslighet" hint="Fee rise per +1 pp rate" unit="%" v={f.rateSensitivity} on={(v) => set("rateSensitivity", v)} />
            <Field label="Energikostnad per kvm" hint="Energy cost per m² of total area" unit="kr/m²" v={f.energyCostPerSqm} on={(v) => set("energyCostPerSqm", v)} />
            <Field label="Årsavgifternas andel av intäkter" hint="Fees as share of income" unit="%" v={f.feeShare} on={(v) => set("feeShare", v)} />
            <Field label="Likvida medel per kvm" hint="Optional · cash ÷ total m²" unit="kr/m²" v={f.cashPerSqm} on={(v) => set("cashPerSqm", v)} />
            <Field label="Avgiftsförändring senaste år" hint="Optional · last fee change" unit="%" v={f.feeChangePct} on={(v) => set("feeChangePct", v)} />
          </div>
        </fieldset>

        <fieldset className="card p-5 sm:p-6">
          <legend className="sr-only">The building</legend>
          <h2 className="text-lg font-bold tracking-tight">The building</h2>
          <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Byggår" hint="Year built" v={f.built} on={(v) => set("built", v)} />
            <Field label="Stambyte år" hint="Leave empty if not done" v={f.stambyteYear} on={(v) => set("stambyteYear", v)} />
          </div>
          <div className="mt-5">
            <p className="text-sm font-medium">Land</p>
            <div className="mt-1.5 inline-flex rounded-lg bg-surface-2 p-1 ring-1 ring-line">
              {(["äganderätt", "tomträtt"] as Land[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => set("land", l)}
                  aria-pressed={f.land === l}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    f.land === l ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgb(16_24_40/0.1)]" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {l === "äganderätt" ? "Äganderätt (owns land)" : "Tomträtt (leasehold)"}
                </button>
              ))}
            </div>
            {f.land === "tomträtt" && (
              <div className="mt-4 max-w-xs">
                <Field
                  label="Years to renegotiation"
                  hint="Tomträttsavgäld"
                  unit="years"
                  v={f.tomtrattYearsLeft}
                  on={(v) => set("tomtrattYearsLeft", v)}
                />
              </div>
            )}
          </div>
          <div className="mt-5 divide-y divide-line rounded-lg border border-line">
            <Check label="Adopted maintenance plan" hint="Underhållsplan" v={f.maintenancePlan} on={(v) => set("maintenancePlan", v)} />
            <Check label="Äkta förening" hint="Genuine housing association for tax" v={f.genuine} on={(v) => set("genuine", v)} />
          </div>
        </fieldset>
      </form>

      <aside className="space-y-6 lg:sticky lg:top-24">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Live grade</h2>
            <span className="flex items-center gap-1.5 text-xs text-ink-3">
              <span className="h-1.5 w-1.5 rounded-full bg-up" /> Updates as you type
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <GradeChip grade={result.grade} size="lg" />
            <div>
              <p className="text-3xl font-bold leading-none tracking-tight tabular">
                {result.score}
                <span className="text-base font-medium text-ink-3">/100</span>
              </p>
              <div className="mt-2">
                <SignalPill grade={result.grade}>{result.signal}</SignalPill>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <GradeLadder key={result.grade} grade={result.grade} score={result.score} />
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <p className="font-semibold">{result.title}</p>
            <p className="mt-1 text-sm text-ink-2">{result.summary}</p>
          </div>
        </div>
        <div className="card p-5">
          <Flags green={result.green} red={result.red} />
        </div>
        <details className="card group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
            Factor breakdown
            <span aria-hidden className="text-ink-3 transition-transform group-open:rotate-90">›</span>
          </summary>
          <div className="mt-4">
            <FactorList factors={result.factors} />
          </div>
        </details>
      </aside>
    </div>
  );
}

function Field({ label, hint, unit, v, on }: { label: string; hint: string; unit?: string; v: string; on: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5 flex items-center rounded-lg border border-line-2 bg-surface transition-shadow focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-tint">
        <input
          inputMode="decimal"
          value={v}
          onChange={(e) => on(e.target.value)}
          className="h-10 w-full min-w-0 bg-transparent px-3 text-base tabular outline-none"
        />
        {unit && <span className="shrink-0 pr-3 text-sm text-ink-3">{unit}</span>}
      </div>
      <span className="mt-1 block text-xs text-ink-3">{hint}</span>
    </label>
  );
}

function Check({ label, hint, v, on }: { label: string; hint: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-ink-3">{hint}</span>
      </span>
      <input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-6 w-10 shrink-0 rounded-full bg-line-2 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
      />
    </label>
  );
}
