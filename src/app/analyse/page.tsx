import type { Metadata } from "next";
import { RATED } from "@/lib/brfs";
import { Analyser } from "@/components/analyser";

export const metadata: Metadata = {
  title: "Analyse an annual report",
  description: "Type in the key ratios from any Swedish BRF annual report and get an instant A–G health grade.",
};

export default function AnalysePage() {
  return (
    <div className="pt-12">
      <header className="max-w-3xl pb-10">
        <p className="eyebrow reveal">Any förening · any årsredovisning</p>
        <h1 className="reveal mt-3 font-display text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.95]" style={{ ["--i" as string]: 1 }}>
          Got the annual report? <span className="italic text-ochre">Grade it.</span>
        </h1>
        <p className="reveal mt-5 text-lg text-ink-2" style={{ ["--i" as string]: 2 }}>
          The estate agent gives you the latest årsredovisning, or you can order it from Bolagsverket. Copy eight
          numbers from it and the grade updates as you type. Nothing leaves your browser.
        </p>
      </header>
      <Analyser presets={RATED.map((b) => ({ name: b.name, inputs: b.inputs }))} />
    </div>
  );
}
