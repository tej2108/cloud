"use client";

import { useMemo, useState } from "react";
import { assess, type Inputs, type Land } from "@/lib/score";
import { GradeLadder } from "./grade";
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
    <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
      <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
        <div>
          <p className="eyebrow mb-2">Load a demo association</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setF(toForm(p.inputs))}
                className="rounded-full border border-line px-3 py-1 text-xs transition-colors hover:border-ink"
              >
                {p.name.replace("Brf ", "")}
              </button>
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="font-display text-3xl">Key ratios</legend>
          <p className="mt-1 text-sm text-ink-2">
            Since 2023 every BRF must print these in the <em>förvaltningsberättelse</em>, usually in a table
            called <em>Flerårsöversikt</em> or <em>Nyckeltal</em>.
          </p>
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Årsavgift per kvm" hint="kr/m² bostadsrättsyta" v={f.feePerSqm} on={(v) => set("feePerSqm", v)} />
            <Field label="Skuldsättning per kvm" hint="kr/m² totalyta" v={f.debtPerSqm} on={(v) => set("debtPerSqm", v)} />
            <Field label="Sparande per kvm" hint="kr/m² totalyta" v={f.savingsPerSqm} on={(v) => set("savingsPerSqm", v)} />
            <Field label="Räntekänslighet" hint="%" v={f.rateSensitivity} on={(v) => set("rateSensitivity", v)} />
            <Field label="Energikostnad per kvm" hint="kr/m² totalyta" v={f.energyCostPerSqm} on={(v) => set("energyCostPerSqm", v)} />
            <Field label="Årsavgifternas andel av intäkter" hint="%" v={f.feeShare} on={(v) => set("feeShare", v)} />
            <Field label="Likvida medel per kvm" hint="optional · cash ÷ total m²" v={f.cashPerSqm} on={(v) => set("cashPerSqm", v)} />
            <Field label="Avgiftsförändring senaste år" hint="optional · %" v={f.feeChangePct} on={(v) => set("feeChangePct", v)} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-3xl">The building</legend>
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Byggår" hint="year built" v={f.built} on={(v) => set("built", v)} />
            <Field label="Stambyte år" hint="leave empty if not done" v={f.stambyteYear} on={(v) => set("stambyteYear", v)} />
          </div>
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-2">Land</span>
              {(["äganderätt", "tomträtt"] as Land[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => set("land", l)}
                  aria-pressed={f.land === l}
                  className={`rounded-full border px-3 py-1 text-xs ${f.land === l ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                >
                  {l === "äganderätt" ? "Äganderätt (owns land)" : "Tomträtt (leasehold)"}
                </button>
              ))}
            </div>
            {f.land === "tomträtt" && (
              <div className="max-w-xs">
                <Field
                  label="Years to renegotiation"
                  hint="tomträttsavgäld"
                  v={f.tomtrattYearsLeft}
                  on={(v) => set("tomtrattYearsLeft", v)}
                />
              </div>
            )}
            <Check label="Has an adopted maintenance plan (underhållsplan)" v={f.maintenancePlan} on={(v) => set("maintenancePlan", v)} />
            <Check label="Äkta förening (genuine housing association for tax)" v={f.genuine} on={(v) => set("genuine", v)} />
          </div>
        </fieldset>
      </form>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="border border-ink bg-paper p-6 shadow-[8px_8px_0_var(--ink)]">
          <p className="eyebrow mb-3">Live grade</p>
          <GradeLadder key={result.grade} grade={result.grade} score={result.score} />
          <div className="mt-5 border-t border-ink pt-4">
            <p className="font-display text-3xl leading-tight">{result.title}</p>
            <p className="mt-1 text-sm">
              Buyer signal: <strong className="font-semibold">{result.signal}</strong>
            </p>
            <p className="mt-2 text-sm text-ink-2">{result.summary}</p>
          </div>
        </div>
        <div className="mt-10">
          <Flags green={result.green} red={result.red} />
        </div>
        <details className="mt-10 border-t border-ink pt-3">
          <summary className="cursor-pointer font-display text-2xl">Factor breakdown</summary>
          <FactorList factors={result.factors} />
        </details>
      </aside>
    </div>
  );
}

function Field({ label, hint, v, on }: { label: string; hint: string; v: string; on: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input
        inputMode="decimal"
        value={v}
        onChange={(e) => on(e.target.value)}
        className="mt-1 w-full border-b border-ink bg-transparent py-1 font-mono text-lg tabular outline-none focus:border-ochre"
      />
      <span className="font-mono text-[11px] text-ink-3">{hint}</span>
    </label>
  );
}

function Check({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} className="h-4 w-4 accent-[var(--ochre)]" />
      {label}
    </label>
  );
}
