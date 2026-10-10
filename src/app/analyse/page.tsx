import type { Metadata } from "next";
import { RATED } from "@/lib/brfs";
import { Analyser } from "@/components/analyser";

export const metadata: Metadata = {
  title: "Analyse an annual report",
  description: "Type in the key ratios from any Swedish BRF annual report and get an instant A–G health grade.",
};

export default function AnalysePage() {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <h1 className="max-w-2xl text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]">
            Grade any annual report
          </h1>
          <p className="mt-3 max-w-2xl text-ink-2">
            The estate agent can give you the latest årsredovisning, or you can order it from Bolagsverket. Copy eight
            numbers from it and the grade updates as you type. Nothing leaves your browser.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
        <Analyser presets={RATED.map((b) => ({ name: b.name, inputs: b.inputs }))} />
      </div>
    </>
  );
}
