// DEMO DATA. Every association below is fictional. The five-year figures are
// generated from a small set of parameters so the series stay internally
// consistent (fees, debt, interest, savings and cash all reconcile).

import { assess, type Assessment, type Inputs, type Land } from "./score";

export const YEARS = [2020, 2021, 2022, 2023, 2024] as const;

export interface YearReport {
  year: number;
  feePerSqm: number;
  feeIncome: number;
  totalIncome: number;
  energyCost: number;
  operatingCost: number;
  maintenance: number;
  depreciation: number;
  interestCost: number;
  avgRate: number;
  result: number;
  debt: number;
  cash: number;
  savings: number;
}

export interface Brf {
  slug: string;
  name: string;
  district: string;
  built: number;
  apartments: number;
  boa: number;
  loa: number;
  land: Land;
  tomtrattYearsLeft: number | null;
  genuine: boolean;
  stambyteYear: number | null;
  maintenancePlan: boolean;
  newBuild: boolean;
  blurb: string;
  upcoming: string[];
  reports: YearReport[];
}

interface Params {
  boa: number;
  loa: number;
  fee0: number;
  hikes: number[];
  debt0: number;
  debtDelta: number[];
  cash0: number;
  fixedShare: number;
  opCost: number;
  energy0: number;
  maintenance: number[];
  dep: number;
  rentLoa: number;
  /** Capital spending (e.g. stambyte), capitalised rather than expensed */
  invest?: number[];
}

const MARKET_RATE = [0.9, 0.8, 1.9, 3.9, 3.5];
const ENERGY_INDEX = [1, 1.05, 1.38, 1.3, 1.2];
const COST_INDEX = [1, 1.02, 1.07, 1.13, 1.17];
const RENT_INDEX = [1, 1.01, 1.04, 1.1, 1.14];

function generate(p: Params): YearReport[] {
  const total = p.boa + p.loa;
  let fee = p.fee0;
  let debt = p.debt0;
  let cash = p.cash0;
  return YEARS.map((year, y) => {
    fee = fee * (1 + p.hikes[y]);
    const prevDebt = debt;
    debt = debt + p.debtDelta[y];
    const avgRate = p.fixedShare * 1.4 + (1 - p.fixedShare) * MARKET_RATE[y];
    const feeIncome = fee * p.boa;
    const totalIncome = feeIncome * 1.02 + p.rentLoa * p.loa * RENT_INDEX[y];
    const energyCost = p.energy0 * ENERGY_INDEX[y] * total;
    const operatingCost = p.opCost * COST_INDEX[y] * total;
    const maintenance = p.maintenance[y] * total;
    const depreciation = p.dep * total;
    const interestCost = ((prevDebt + debt) / 2) * (avgRate / 100);
    const result = totalIncome - energyCost - operatingCost - maintenance - depreciation - interestCost;
    cash = Math.max(150_000, cash + result + depreciation + p.debtDelta[y] - (p.invest?.[y] ?? 0));
    return {
      year,
      feePerSqm: fee,
      feeIncome,
      totalIncome,
      energyCost,
      operatingCost,
      maintenance,
      depreciation,
      interestCost,
      avgRate,
      result,
      debt,
      cash,
      savings: result + depreciation + maintenance,
    };
  });
}

type Def = Omit<Brf, "reports" | "boa" | "loa"> & { p: Params };

const DEFS: Def[] = [
  {
    slug: "gardesmasen",
    name: "Brf Gärdesmåsen",
    district: "Gärdet",
    built: 1936,
    apartments: 58,
    land: "äganderätt",
    tomtrattYearsLeft: null,
    genuine: true,
    stambyteYear: 2009,
    maintenancePlan: true,
    newBuild: false,
    blurb: "Functionalist lamellhus with a quiet courtyard. A long-standing board that has paid down almost all its loans.",
    upcoming: ["Façade repaint 2027, funded from savings", "Window maintenance 2029"],
    p: { boa: 3900, loa: 120, fee0: 560, hikes: [0, 0, 0.03, 0.05, 0.03], debt0: 7.5e6, debtDelta: [0, -3e5, -3e5, -3e5, -3e5], cash0: 2.4e6, fixedShare: 0.6, opCost: 230, energy0: 125, maintenance: [60, 80, 90, 70, 90], dep: 120, rentLoa: 1800 },
  },
  {
    slug: "kopparslagaren",
    name: "Brf Kopparslagaren",
    district: "Södermalm",
    built: 1929,
    apartments: 44,
    land: "äganderätt",
    tomtrattYearsLeft: null,
    genuine: true,
    stambyteYear: 2012,
    maintenancePlan: true,
    newBuild: false,
    blurb: "Classic Söder stone house with a café at street level. A conservative board that has amortised steadily.",
    upcoming: ["Roof inspection 2026", "Laundry room renovation 2028"],
    p: { boa: 4200, loa: 350, fee0: 600, hikes: [0, 0.02, 0.04, 0.07, 0.04], debt0: 1.4e7, debtDelta: [0, -5e5, -5e5, -6e5, -6e5], cash0: 1.8e6, fixedShare: 0.5, opCost: 245, energy0: 140, maintenance: [90, 70, 110, 90, 80], dep: 150, rentLoa: 2100 },
  },
  {
    slug: "ekbacken",
    name: "Brf Ekbacken",
    district: "Bromma",
    built: 1948,
    apartments: 32,
    land: "äganderätt",
    tomtrattYearsLeft: null,
    genuine: true,
    stambyteYear: 2016,
    maintenancePlan: true,
    newBuild: false,
    blurb: "Three-storey houses among oaks near Brommaplan. Stambyte already done and paid for, with a strong savings habit.",
    upcoming: ["Balcony renovation 2028"],
    p: { boa: 2800, loa: 0, fee0: 640, hikes: [0, 0.02, 0.04, 0.06, 0.03], debt0: 1.1e7, debtDelta: [0, -2e5, -2e5, -3e5, -3e5], cash0: 1.2e6, fixedShare: 0.6, opCost: 240, energy0: 150, maintenance: [80, 60, 70, 80, 70], dep: 140, rentLoa: 0 },
  },
  {
    slug: "morkullan",
    name: "Brf Morkullan",
    district: "Östermalm",
    built: 1899,
    apartments: 61,
    land: "äganderätt",
    tomtrattYearsLeft: null,
    genuine: true,
    stambyteYear: 2005,
    maintenancePlan: true,
    newBuild: false,
    blurb: "Grand jugend block with shops facing the street. Healthy, with moderate debt from the 2005 renovation.",
    upcoming: ["Elevator replacement 2026", "Courtyard drainage 2027"],
    p: { boa: 6500, loa: 1200, fee0: 560, hikes: [0, 0.02, 0.05, 0.08, 0.04], debt0: 4.6e7, debtDelta: [0, -1e6, -1e6, -1.2e6, -1.2e6], cash0: 3.5e6, fixedShare: 0.55, opCost: 250, energy0: 145, maintenance: [100, 90, 120, 110, 100], dep: 160, rentLoa: 2600 },
  },
  {
    slug: "tornseglaren",
    name: "Brf Tornseglaren",
    district: "Vasastan",
    built: 1910,
    apartments: 36,
    land: "äganderätt",
    tomtrattYearsLeft: null,
    genuine: true,
    stambyteYear: 1988,
    maintenancePlan: true,
    newBuild: false,
    blurb: "Corner building on a busy street with a large shop and a restaurant. Commercial rents carry a big share of the income.",
    upcoming: ["Second stambyte being investigated for ~2030", "Restaurant lease renewal 2026"],
    p: { boa: 3100, loa: 900, fee0: 580, hikes: [0, 0.02, 0.05, 0.08, 0.05], debt0: 3.4e7, debtDelta: [0, -2e5, -2e5, -3e5, -3e5], cash0: 1.4e6, fixedShare: 0.4, opCost: 260, energy0: 155, maintenance: [80, 90, 100, 90, 90], dep: 150, rentLoa: 2400 },
  },
  {
    slug: "sjobrisen",
    name: "Brf Sjöbrisen",
    district: "Kungsholmen",
    built: 1962,
    apartments: 70,
    land: "äganderätt",
    tomtrattYearsLeft: null,
    genuine: true,
    stambyteYear: null,
    maintenancePlan: true,
    newBuild: false,
    blurb: "Sixties block by the water with low debt today. The original pipes are still in the walls, though.",
    upcoming: ["Stambyte planned 2027 (est. 85 MSEK)", "Fee increase expected to fund new loans"],
    p: { boa: 5600, loa: 200, fee0: 640, hikes: [0, 0.02, 0.05, 0.08, 0.06], debt0: 2.6e7, debtDelta: [0, -4e5, -4e5, -4e5, -4e5], cash0: 2.8e6, fixedShare: 0.5, opCost: 250, energy0: 165, maintenance: [70, 80, 90, 80, 90], dep: 130, rentLoa: 1600 },
  },
  {
    slug: "lingonriset",
    name: "Brf Lingonriset",
    district: "Hammarby Sjöstad",
    built: 2004,
    apartments: 112,
    land: "tomträtt",
    tomtrattYearsLeft: 4,
    genuine: true,
    stambyteYear: null,
    maintenancePlan: true,
    newBuild: false,
    blurb: "Modern block on the canal with good energy performance. The ground rent is up for renegotiation soon.",
    upcoming: ["Tomträttsavgäld renegotiation 2029", "Garage membrane repair 2026"],
    p: { boa: 9800, loa: 600, fee0: 600, hikes: [0, 0.02, 0.06, 0.1, 0.05], debt0: 9.6e7, debtDelta: [0, -5e5, -5e5, -5e5, -5e5], cash0: 2.2e6, fixedShare: 0.45, opCost: 270, energy0: 110, maintenance: [50, 60, 70, 60, 70], dep: 170, rentLoa: 1900 },
  },
  {
    slug: "skeppskatten",
    name: "Brf Skeppskatten",
    district: "Liljeholmen",
    built: 2012,
    apartments: 88,
    land: "tomträtt",
    tomtrattYearsLeft: 18,
    genuine: true,
    stambyteYear: null,
    maintenancePlan: true,
    newBuild: false,
    blurb: "Waterfront tower from the Liljeholmskajen boom. Mid-level debt and a fee that was raised hard after 2022.",
    upcoming: ["Façade sealant replacement 2028"],
    p: { boa: 7400, loa: 300, fee0: 600, hikes: [0, 0.01, 0.08, 0.12, 0.06], debt0: 8e7, debtDelta: [0, -3e5, -3e5, -3e5, -3e5], cash0: 1.6e6, fixedShare: 0.35, opCost: 240, energy0: 120, maintenance: [40, 50, 60, 60, 60], dep: 190, rentLoa: 1700 },
  },
  {
    slug: "valsverket",
    name: "Brf Valsverket",
    district: "Årsta",
    built: 1957,
    apartments: 54,
    land: "äganderätt",
    tomtrattYearsLeft: null,
    genuine: true,
    stambyteYear: 2021,
    maintenancePlan: true,
    newBuild: false,
    blurb: "Did the stambyte in 2021, funded entirely with new loans just before rates climbed. Fees have been raised repeatedly since.",
    upcoming: ["Further fee increase of 8 % decided for 2025"],
    p: { boa: 3900, loa: 0, fee0: 690, hikes: [0, 0.03, 0.12, 0.15, 0.08], debt0: 2.2e7, debtDelta: [0, 3.4e7, 0, -2e5, -2e5], cash0: 1.1e6, fixedShare: 0.2, opCost: 255, energy0: 165, maintenance: [60, 30, 20, 30, 30], dep: 230, rentLoa: 0, invest: [0, 3.4e7, 0, 0, 0] },
  },
  {
    slug: "saltsjovyn",
    name: "Brf Saltsjövyn",
    district: "Hornstull",
    built: 1934,
    apartments: 22,
    land: "äganderätt",
    tomtrattYearsLeft: null,
    genuine: false,
    stambyteYear: 1999,
    maintenancePlan: false,
    newBuild: false,
    blurb: "Small association where offices and shops make up most of the floor area, so it's taxed as an oäkta förening.",
    upcoming: ["No adopted maintenance plan"],
    p: { boa: 1500, loa: 1300, fee0: 520, hikes: [0, 0.01, 0.03, 0.05, 0.03], debt0: 2.1e7, debtDelta: [0, 0, 0, -1e5, -1e5], cash0: 6e5, fixedShare: 0.3, opCost: 270, energy0: 160, maintenance: [40, 30, 30, 40, 30], dep: 160, rentLoa: 1500 },
  },
  {
    slug: "glasbruket",
    name: "Brf Glasbruket",
    district: "Norra Djurgårdsstaden",
    built: 2019,
    apartments: 96,
    land: "tomträtt",
    tomtrattYearsLeft: 12,
    genuine: true,
    stambyteYear: null,
    maintenancePlan: true,
    newBuild: true,
    blurb: "Newly built (nyproduktion), with a fee that looks attractively low. That low fee was set by the developer on top of heavy loans.",
    upcoming: ["Fee increase of 20 % proposed for 2025", "First fixed-rate loans mature 2025"],
    p: { boa: 7600, loa: 0, fee0: 520, hikes: [0, 0, 0.04, 0.08, 0.06], debt0: 1.2e8, debtDelta: [0, 0, 0, -2e5, -2e5], cash0: 1.5e6, fixedShare: 0.55, opCost: 200, energy0: 95, maintenance: [10, 15, 15, 20, 20], dep: 260, rentLoa: 0 },
  },
];

export const BRFS: Brf[] = DEFS.map(({ p, ...d }) => ({
  ...d,
  boa: p.boa,
  loa: p.loa,
  reports: generate(p),
}));

export function inputsFor(b: Brf): Inputs {
  const latest = b.reports[b.reports.length - 1];
  const prev = b.reports[b.reports.length - 2];
  const total = b.boa + b.loa;
  return {
    feePerSqm: latest.feePerSqm,
    debtPerSqm: latest.debt / total,
    savingsPerSqm: latest.savings / total,
    rateSensitivity: ((latest.debt * 0.01) / latest.feeIncome) * 100,
    energyCostPerSqm: latest.energyCost / total,
    cashPerSqm: latest.cash / total,
    feeShare: (latest.feeIncome / latest.totalIncome) * 100,
    built: b.built,
    stambyteYear: b.stambyteYear,
    maintenancePlan: b.maintenancePlan,
    land: b.land,
    tomtrattYearsLeft: b.tomtrattYearsLeft,
    genuine: b.genuine,
    feeChangePct: (latest.feePerSqm / prev.feePerSqm - 1) * 100,
    referenceYear: 2025,
  };
}

export interface RatedBrf extends Brf {
  inputs: Inputs;
  assessment: Assessment;
}

export function rated(b: Brf): RatedBrf {
  const inputs = inputsFor(b);
  return { ...b, inputs, assessment: assess(inputs) };
}

export const RATED: RatedBrf[] = BRFS.map(rated).sort((a, b) => b.assessment.score - a.assessment.score);

export function getBrf(slug: string): RatedBrf | undefined {
  return RATED.find((b) => b.slug === slug);
}
