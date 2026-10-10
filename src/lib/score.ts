// Scoring engine. Works on the key ratios (nyckeltal) that every Swedish BRF
// must publish in its annual report since FY2023 (BFNAR 2023:1), plus a few
// building and land facts read from the förvaltningsberättelse.

export type Land = "äganderätt" | "tomträtt";

export interface Inputs {
  /** Årsavgift per kvm upplåten med bostadsrätt (kr/m² per year) */
  feePerSqm: number;
  /** Skuldsättning per kvm totalyta (kr/m²) */
  debtPerSqm: number;
  /** Sparande per kvm totalyta (kr/m² per year) */
  savingsPerSqm: number;
  /** Räntekänslighet: % fee rise needed to cover +1pp on all loans */
  rateSensitivity: number;
  /** Energikostnad per kvm totalyta (kr/m² per year) */
  energyCostPerSqm: number;
  /** Cash and short-term investments per kvm totalyta (optional) */
  cashPerSqm?: number;
  /** Årsavgifternas andel av totala rörelseintäkter (%) */
  feeShare?: number;
  built: number;
  stambyteYear: number | null;
  maintenancePlan: boolean;
  land: Land;
  /** Years until the tomträttsavgäld is renegotiated */
  tomtrattYearsLeft?: number | null;
  /** Äkta förening (privatbostadsföretag) for tax purposes */
  genuine: boolean;
  /** Last year's change in fee, % */
  feeChangePct?: number;
  referenceYear?: number;
}

export type Grade = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export const GRADES: Grade[] = ["A", "B", "C", "D", "E", "F", "G"];

export interface Factor {
  key: string;
  label: string;
  sv: string;
  weight: number;
  score: number;
  display: string;
  note: string;
}

export interface Assessment {
  score: number;
  grade: Grade;
  title: string;
  signal: string;
  summary: string;
  factors: Factor[];
  green: string[];
  red: string[];
  questions: string[];
}

type Curve = [number, number][];

function curve(x: number, pts: Curve): number {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (x <= x1) {
      const [x0, y0] = pts[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return pts[pts.length - 1][1];
}

export const CURVES = {
  debt: [[2000, 100], [5000, 88], [8000, 72], [12000, 50], [16000, 30], [22000, 10], [30000, 0]] as Curve,
  savings: [[0, 0], [50, 10], [100, 25], [150, 42], [200, 58], [250, 70], [300, 80], [400, 95], [500, 100]] as Curve,
  rate: [[2, 100], [4, 88], [6, 74], [8, 60], [10, 46], [13, 28], [16, 12], [20, 0]] as Curve,
  fee: [[500, 100], [650, 88], [800, 72], [950, 55], [1100, 35], [1300, 15], [1500, 0]] as Curve,
  energy: [[120, 100], [160, 82], [200, 65], [250, 45], [300, 25], [380, 0]] as Curve,
  cash: [[0, 0], [100, 35], [250, 65], [500, 90], [800, 100]] as Curve,
};

const kr = (n: number) => `${Math.round(n).toLocaleString("sv-SE")} kr/m²`;
const pct = (n: number) => `${n.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} %`;

function buildingScore(i: Inputs, year: number): { score: number; note: string } {
  const age = year - i.built;
  let score: number;
  let note: string;
  if (i.stambyteYear) {
    const since = year - i.stambyteYear;
    score = since < 30 ? 100 : since < 45 ? 70 : 45;
    note = `Pipe replacement (stambyte) done ${i.stambyteYear}, ${since} years ago.`;
  } else if (age < 35) {
    score = 92;
    note = `Built ${i.built}; pipes have decades left.`;
  } else if (age < 48) {
    score = i.maintenancePlan ? 60 : 40;
    note = `Built ${i.built}; stambyte is approaching.`;
  } else {
    score = i.maintenancePlan ? 35 : 15;
    note = `Built ${i.built} with no stambyte yet, so a large renovation is due.`;
  }
  if (!i.maintenancePlan) score = Math.max(0, score - 20);
  return { score, note };
}

function landScore(i: Inputs): { score: number; note: string } {
  let score: number;
  let note: string;
  if (i.land === "äganderätt") {
    score = 100;
    note = "The association owns its land.";
  } else {
    const y = i.tomtrattYearsLeft;
    score = y == null ? 45 : y <= 5 ? 25 : y <= 10 ? 40 : 65;
    note =
      y == null
        ? "Leasehold land (tomträtt), renegotiation date unknown."
        : `Leasehold land (tomträtt); ground rent renegotiated in ${y} years.`;
  }
  if (!i.genuine) {
    score = Math.min(score, 30);
    note += " Not an äkta förening: buyers face extra tax.";
  }
  return { score, note };
}

export function gradeFor(score: number): Grade {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 55) return "D";
  if (score >= 45) return "E";
  if (score >= 35) return "F";
  return "G";
}

const VERDICTS: Record<Grade, { title: string; signal: string; summary: string }> = {
  A: {
    title: "Excellent health",
    signal: "Strong buy-case",
    summary: "Low debt and solid savings. Fee hikes are unlikely to hurt, and the association can absorb surprises.",
  },
  B: {
    title: "Healthy",
    signal: "Good to buy",
    summary: "Finances are in good shape. Check the maintenance plan, but nothing here should scare you off.",
  },
  C: {
    title: "Sound, with caveats",
    signal: "Probably fine",
    summary: "The fundamentals hold up, but one or two weak spots deserve a question to the board before you bid.",
  },
  D: {
    title: "Average: read the fine print",
    signal: "Depends on price",
    summary: "Middling numbers. Whether it's a good buy depends on the asking price and what renovations are coming.",
  },
  E: {
    title: "Weak",
    signal: "Proceed with caution",
    summary: "Thin margins and meaningful debt. Expect the fee to rise, and factor that into your monthly budget.",
  },
  F: {
    title: "Fragile",
    signal: "Avoid unless discounted",
    summary: "The association is under real financial pressure. Large fee increases or extra levies are likely.",
  },
  G: {
    title: "High risk",
    signal: "Avoid",
    summary: "Debt and costs are out of balance with income. Buying here means carrying the association's problems.",
  },
};

export function assess(i: Inputs): Assessment {
  const year = i.referenceYear ?? new Date().getFullYear();
  const b = buildingScore(i, year);
  const l = landScore(i);

  const factors: Factor[] = [
    {
      key: "debt",
      label: "Debt per m²",
      sv: "Skuldsättning per kvm",
      weight: 25,
      score: curve(i.debtPerSqm, CURVES.debt),
      display: kr(i.debtPerSqm),
      note: "Below 5 000 is strong, above 15 000 is heavy.",
    },
    {
      key: "savings",
      label: "Annual savings per m²",
      sv: "Sparande per kvm",
      weight: 20,
      score: i.savingsPerSqm <= 0 ? 0 : curve(i.savingsPerSqm, CURVES.savings),
      display: kr(i.savingsPerSqm),
      note: "Roughly 250–350 is needed to fund future maintenance without loans.",
    },
    {
      key: "rate",
      label: "Interest-rate sensitivity",
      sv: "Räntekänslighet",
      weight: 15,
      score: curve(i.rateSensitivity, CURVES.rate),
      display: pct(i.rateSensitivity),
      note: "How much the fee must rise if rates go up by one percentage point.",
    },
    {
      key: "fee",
      label: "Fee level",
      sv: "Årsavgift per kvm",
      weight: 10,
      score: curve(i.feePerSqm, CURVES.fee),
      display: kr(i.feePerSqm),
      note: "A low fee only counts as good if savings are healthy too.",
    },
    {
      key: "energy",
      label: "Energy cost per m²",
      sv: "Energikostnad per kvm",
      weight: 5,
      score: curve(i.energyCostPerSqm, CURVES.energy),
      display: kr(i.energyCostPerSqm),
      note: "Heating, electricity and water: the costs most exposed to price shocks.",
    },
    {
      key: "building",
      label: "Building & maintenance",
      sv: "Stambyte & underhållsplan",
      weight: 15,
      score: b.score,
      display: i.stambyteYear ? `Stambyte ${i.stambyteYear}` : `Built ${i.built}`,
      note: b.note,
    },
    {
      key: "land",
      label: "Land & tax status",
      sv: "Mark & äkta förening",
      weight: 10,
      score: l.score,
      display: i.land === "äganderätt" ? "Freehold" : "Leasehold",
      note: l.note,
    },
  ];

  if (i.cashPerSqm != null) {
    factors.push({
      key: "cash",
      label: "Cash buffer per m²",
      sv: "Likvida medel per kvm",
      weight: 5,
      score: curve(i.cashPerSqm, CURVES.cash),
      display: kr(i.cashPerSqm),
      note: "A buffer for unexpected repairs without new loans.",
    });
  }

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const raw = factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight;
  // Hard caps: some problems should dominate an otherwise good score.
  let score = raw;
  if (i.savingsPerSqm <= 0) score = Math.min(score, 44);
  if (!i.genuine) score = Math.min(score, 54);
  score = Math.round(score);
  const grade = gradeFor(score);

  const green: string[] = [];
  const red: string[] = [];
  const questions: string[] = [];

  if (i.debtPerSqm < 5000) green.push(`Low debt at ${kr(i.debtPerSqm)}.`);
  if (i.debtPerSqm > 15000) {
    red.push(`Heavy debt at ${kr(i.debtPerSqm)}. Rising rates feed straight into your fee.`);
    questions.push("What is the amortisation plan, and when do the current fixed-rate loans mature?");
  }
  if (i.savingsPerSqm >= 300) green.push(`Saves ${kr(i.savingsPerSqm)} a year towards future maintenance.`);
  if (i.savingsPerSqm < 150) {
    red.push(
      i.savingsPerSqm <= 0
        ? `Spends more than it takes in (savings ${kr(i.savingsPerSqm)}). Upkeep will need new loans or higher fees.`
        : `Saves only ${kr(i.savingsPerSqm)} a year, too little to fund upkeep without new loans.`,
    );
    questions.push("How will upcoming maintenance be financed: fee increases, new loans or a levy?");
  }
  if (i.rateSensitivity > 12) red.push(`A 1 pp rate rise would push the fee up ~${pct(i.rateSensitivity)}.`);
  if (i.rateSensitivity < 5) green.push(`Barely exposed to interest rates (${pct(i.rateSensitivity)} per +1 pp).`);
  if (i.feePerSqm < 600 && i.savingsPerSqm < 150) {
    red.push("The fee is low but savings are too. The fee is likely set too low and will need to rise.");
    questions.push("Was the fee set by the developer? Are increases already planned?");
  }
  if (i.feeChangePct != null && i.feeChangePct >= 10)
    red.push(`Fee was raised ${pct(i.feeChangePct)} last year.`);
  if (i.energyCostPerSqm > 260) red.push(`High energy cost at ${kr(i.energyCostPerSqm)}.`);

  const age = year - i.built;
  if (!i.stambyteYear && age >= 45) {
    red.push(`Built ${i.built} with no stambyte. Expect a large renovation and disruption within a few years.`);
    questions.push("When is the stambyte planned, how will it be financed, and will flats be evacuated?");
  } else if (i.stambyteYear && year - i.stambyteYear < 20) {
    green.push(`Pipes recently replaced (stambyte ${i.stambyteYear}).`);
  }
  if (!i.maintenancePlan) {
    red.push("No long-term maintenance plan (underhållsplan).");
    questions.push("Why is there no underhållsplan, and when will one be adopted?");
  }
  if (i.land === "tomträtt") {
    if (i.tomtrattYearsLeft != null && i.tomtrattYearsLeft <= 10)
      red.push(`Ground rent on leasehold land is renegotiated in ${i.tomtrattYearsLeft} years and can jump sharply.`);
    questions.push("What does the ground rent (tomträttsavgäld) cost today, and when is it renegotiated?");
  } else {
    green.push("Owns its land (äganderätt), so there's no ground-rent risk.");
  }
  if (!i.genuine) red.push("Not an äkta förening. Buyers pay tax on the implied rent benefit.");
  if (i.feeShare != null && i.feeShare < 65) {
    red.push(`Only ${pct(i.feeShare)} of income comes from fees, so it relies heavily on commercial tenants.`);
    questions.push("How long are the commercial leases, and how stable are the tenants?");
  }
  if (i.cashPerSqm != null && i.cashPerSqm >= 400) green.push(`Healthy cash buffer at ${kr(i.cashPerSqm)}.`);

  questions.push("Are any fee increases or extra levies (extrauttag) decided or under discussion?");
  questions.push("Are there any disputes, water damage or insurance claims in the last two years?");

  return { score, grade, ...VERDICTS[grade], factors, green, red, questions };
}

/** Monthly fee impact of a rate change, given the association's figures. */
export function stressFee(opts: {
  monthlyFee: number;
  rateSensitivity: number;
  ratePp: number;
}) {
  const increasePct = opts.rateSensitivity * opts.ratePp;
  return {
    increasePct,
    newMonthlyFee: opts.monthlyFee * (1 + increasePct / 100),
  };
}
