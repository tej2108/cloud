// Builds the rows and the one-line verdict for the compare page. Pure function:
// no React, no data import, so it's easy to test.
//
// Values are compared AS DISPLAYED (rounded the way format.ts shows them), so
// two values that look the same on screen are a tie and neither side is marked.

import type { RatedBrf } from "./brfs";
import { pct, perSqm } from "./format";

export type Side = "a" | "b";

export interface CompareRow {
  key: string;
  label: string;
  /** Swedish name of the ratio, as used in the reports */
  sv: string;
  /** Display text for each side */
  a: string;
  b: string;
  /** Which side is better, or null for a tie or a row that is never marked */
  better: Side | null;
  note?: string;
}

export interface Verdict {
  aWins: number;
  bWins: number;
  level: number;
  /** How many rows count towards the verdict */
  counted: number;
  text: string;
}

const whole = (n: number) => Math.round(n);
const oneDecimal = (n: number) => Math.round(n * 10) / 10;

/** Picks the side with the better rounded value; equal values are a tie. */
function pick(a: number, b: number, higherIsBetter: boolean): Side | null {
  if (a === b) return null;
  return (a > b) === higherIsBetter ? "a" : "b";
}

const buildingScore = (x: RatedBrf) => x.assessment.factors.find((f) => f.key === "building")?.score;

const builtText = (x: RatedBrf) =>
  x.stambyteYear != null
    ? `Built ${x.built} · stambyte ${x.stambyteYear}`
    : `Built ${x.built} · no stambyte yet`;

export function compareRows(a: RatedBrf, b: RatedBrf): { rows: CompareRow[]; verdict: Verdict } {
  const ai = a.inputs;
  const bi = b.inputs;

  const buildingA = buildingScore(a);
  const buildingB = buildingScore(b);

  const rows: CompareRow[] = [
    {
      key: "debt",
      label: "Debt",
      sv: "Skuldsättning per m²",
      a: perSqm(ai.debtPerSqm),
      b: perSqm(bi.debtPerSqm),
      better: pick(whole(ai.debtPerSqm), whole(bi.debtPerSqm), false),
    },
    {
      key: "savings",
      label: "Savings",
      sv: "Sparande per m²",
      a: perSqm(ai.savingsPerSqm),
      b: perSqm(bi.savingsPerSqm),
      better: pick(whole(ai.savingsPerSqm), whole(bi.savingsPerSqm), true),
    },
    {
      key: "rate",
      label: "If rates rise 1 pp",
      sv: "Räntekänslighet",
      a: `+${pct(ai.rateSensitivity)} fee`,
      b: `+${pct(bi.rateSensitivity)} fee`,
      better: pick(oneDecimal(ai.rateSensitivity), oneDecimal(bi.rateSensitivity), false),
    },
    {
      key: "energy",
      label: "Energy",
      sv: "Energikostnad per m²",
      a: perSqm(ai.energyCostPerSqm),
      b: perSqm(bi.energyCostPerSqm),
      better: pick(whole(ai.energyCostPerSqm), whole(bi.energyCostPerSqm), false),
    },
    {
      key: "fee",
      label: "Fee",
      sv: "Årsavgift per m²",
      a: perSqm(ai.feePerSqm),
      b: perSqm(bi.feePerSqm),
      better: null,
      note: "Not scored head to head. A low fee only helps if savings are healthy.",
    },
    {
      key: "building",
      label: "Building",
      sv: "Byggnadsår, stambyte",
      a: builtText(a),
      b: builtText(b),
      // Marked by the engine's building score (pipe outlook), not by which is newer.
      better:
        buildingA == null || buildingB == null ? null : pick(whole(buildingA), whole(buildingB), true),
      note: "Better means a healthier pipe outlook, not simply newer.",
    },
  ];

  // Only the first four rows are compared head to head and counted.
  const counted = rows.slice(0, 4);
  const aWins = counted.filter((r) => r.better === "a").length;
  const bWins = counted.filter((r) => r.better === "b").length;
  const level = counted.length - aWins - bWins;

  const stronger = (name: string, wins: number) =>
    `${name} is stronger on ${wins} of ${counted.length} ratios.`;
  const text =
    aWins > bWins
      ? stronger(a.name, aWins)
      : bWins > aWins
        ? stronger(b.name, bWins)
        : "The two are level on the ratios that can be compared head to head.";

  return { rows, verdict: { aWins, bWins, level, counted: counted.length, text } };
}
