"use client";

import { useMemo, useState } from "react";
import { assess, type Inputs, type Land } from "@/lib/score";
import { GradeChip, GradeLadder, SignalPill } from "./grade";
import { FactorList, Flags } from "./factors";
import { ReportUpload } from "./report-upload";
import type { Extracted, RatioKey } from "@/lib/report-parse";

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

type Source = { page?: number; label: string };

const RATIOS: RatioKey[] = ["feePerSqm", "debtPerSqm", "savingsPerSqm", "rateSensitivity", "energyCostPerSqm", "feeShare"];
/** Without these the score would treat a blank as zero, which flatters the association. */
const REQUIRED: { key: keyof Form; label: string }[] = [
  { key: "feePerSqm", label: "Årsavgift per kvm" },
  { key: "debtPerSqm", label: "Skuldsättning per kvm" },
  { key: "savingsPerSqm", label: "Sparande per kvm" },
  { key: "rateSensitivity", label: "Räntekänslighet" },
  { key: "energyCostPerSqm", label: "Energikostnad per kvm" },
  { key: "built", label: "Byggår" },
];

const fmt = (x: number) => String(Math.round(x * 10) / 10).replace(".", ",");

export function Analyser({ presets }: { presets: Preset[] }) {
  const [f, setF] = useState<Form>(EMPTY_EXAMPLE);
  /** Where each field's value came from, when it was read from a report */
  const [sources, setSources] = useState<Partial<Record<keyof Form, Source>>>({});
  /** Ratios the last report didn't contain */
  const [missing, setMissing] = useState<Set<keyof Form>>(new Set());

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    // A hand edit replaces what the report said.
    setSources((prev) => {
      if (!(k in prev)) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
    setMissing((m) => {
      if (!m.has(k)) return m;
      const next = new Set(m);
      next.delete(k);
      return next;
    });
  };

  const loadPreset = (inputs: Inputs) => {
    setF(toForm(inputs));
    setSources({});
    setMissing(new Set());
  };

  const fromReport = (ex: Extracted) => {
    const src: Partial<Record<keyof Form, Source>> = {};
    const patch: Partial<Form> = {};
    const miss = new Set<keyof Form>();
    for (const k of RATIOS) {
      const hit = ex.ratios[k];
      if (hit) {
        patch[k] = fmt(hit.value);
        src[k] = { page: hit.page, label: hit.label };
      } else {
        // Clear the example value so it can't mix with the real report.
        patch[k] = "";
        miss.add(k);
      }
    }
    patch.feeChangePct = ex.feeChangePct != null ? fmt(ex.feeChangePct) : "";
    if (ex.feeChangePct != null && ex.ratios.feePerSqm) {
      src.feeChangePct = { page: ex.ratios.feePerSqm.page, label: "Calculated from the fee for the two latest years" };
    }
    patch.cashPerSqm = "";
    // Every building fact is reset, so nothing from a previous report or the example survives.
    patch.built = ex.built ? String(ex.built) : "";
    if (ex.built) src.built = { label: "Byggår" };
    else miss.add("built");
    patch.stambyteYear = ex.stambyteYear ? String(ex.stambyteYear) : "";
    if (ex.stambyteYear) src.stambyteYear = { label: "Stambyte" };
    patch.land = ex.tomtratt ? "tomträtt" : "äganderätt";
    patch.tomtrattYearsLeft = "";
    setF((p) => ({ ...p, ...patch }));
    setSources(src);
    setMissing(miss);
  };

  const blank = REQUIRED.filter((r) => n(f[r.key] as string) == null);

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
        <ReportUpload onRead={fromReport} />

        <div className="card p-5 sm:p-6">
          <p className="text-sm font-medium">Or start from a demo association</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => loadPreset(p.inputs)}
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
            <Field label="Årsavgift per kvm" hint="Fee per m² of flat area" unit="kr/m²" v={f.feePerSqm} on={(v) => set("feePerSqm", v)} src={sources.feePerSqm} missing={missing.has("feePerSqm")} />
            <Field label="Skuldsättning per kvm" hint="Debt per m² of total area" unit="kr/m²" v={f.debtPerSqm} on={(v) => set("debtPerSqm", v)} src={sources.debtPerSqm} missing={missing.has("debtPerSqm")} />
            <Field label="Sparande per kvm" hint="Savings per m² of total area" unit="kr/m²" v={f.savingsPerSqm} on={(v) => set("savingsPerSqm", v)} src={sources.savingsPerSqm} missing={missing.has("savingsPerSqm")} />
            <Field label="Räntekänslighet" hint="Fee rise per +1 pp rate" unit="%" v={f.rateSensitivity} on={(v) => set("rateSensitivity", v)} src={sources.rateSensitivity} missing={missing.has("rateSensitivity")} />
            <Field label="Energikostnad per kvm" hint="Energy cost per m² of total area" unit="kr/m²" v={f.energyCostPerSqm} on={(v) => set("energyCostPerSqm", v)} src={sources.energyCostPerSqm} missing={missing.has("energyCostPerSqm")} />
            <Field label="Årsavgifternas andel av intäkter" hint="Fees as share of income" unit="%" v={f.feeShare} on={(v) => set("feeShare", v)} src={sources.feeShare} missing={missing.has("feeShare")} />
            <Field label="Likvida medel per kvm" hint="Optional · cash ÷ total m²" unit="kr/m²" v={f.cashPerSqm} on={(v) => set("cashPerSqm", v)} />
            <Field label="Avgiftsförändring senaste år" hint="Optional · last fee change" unit="%" v={f.feeChangePct} on={(v) => set("feeChangePct", v)} src={sources.feeChangePct} />
          </div>
        </fieldset>

        <fieldset className="card p-5 sm:p-6">
          <legend className="sr-only">The building</legend>
          <h2 className="text-lg font-bold tracking-tight">The building</h2>
          <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Byggår" hint="Year built" v={f.built} on={(v) => set("built", v)} src={sources.built} missing={missing.has("built")} />
            <Field label="Stambyte år" hint="Leave empty if not done" v={f.stambyteYear} on={(v) => set("stambyteYear", v)} src={sources.stambyteYear} />
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
          {blank.length > 0 && (
            <p className="mt-3 rounded-lg bg-warn-tint px-3 py-2 text-sm text-warn">
              Fill in {blank.map((b) => b.label).join(", ")} to see a real grade. Until then the grade below is not reliable.
            </p>
          )}
          <div className={`mt-4 flex items-center gap-4 ${blank.length ? "opacity-40" : ""}`}>
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

function Field({
  label,
  hint,
  unit,
  v,
  on,
  src,
  missing,
}: {
  label: string;
  hint: string;
  unit?: string;
  v: string;
  on: (v: string) => void;
  src?: Source;
  missing?: boolean;
}) {
  const box = missing ? "border-warn bg-warn-tint" : src ? "border-brand/40 bg-brand-tint" : "border-line-2 bg-surface";
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className={`mt-1.5 flex items-center rounded-lg border transition-shadow focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-tint ${box}`}>
        <input
          inputMode="decimal"
          value={v}
          onChange={(e) => on(e.target.value)}
          className="h-10 w-full min-w-0 bg-transparent px-3 text-base tabular outline-none"
        />
        {unit && <span className="shrink-0 pr-3 text-sm text-ink-3">{unit}</span>}
      </div>
      {src ? (
        <span className="mt-1 block truncate text-xs text-brand" title={src.label}>
          From the report{src.page ? `, page ${src.page}` : ""}
        </span>
      ) : missing ? (
        <span className="mt-1 block text-xs font-medium text-warn">Not found in the report. Type it in.</span>
      ) : (
        <span className="mt-1 block text-xs text-ink-3">{hint}</span>
      )}
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
