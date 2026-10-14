// Reads the mandatory key ratios (nyckeltal) out of the text of a Swedish
// BRF annual report. Since FY2023 the law (ÅRL 6 kap. 3 a §) and BFNAR 2023:1
// fix their names, and they're printed in the förvaltningsberättelse, usually
// in a multi-year table (flerårsöversikt) with the newest year first.
//
// Pure functions over positioned text items, so they can be tested without a
// browser. PDF loading lives in report-pdf.ts.

export interface TextItem {
  str: string;
  /** Left edge, PDF units */
  x: number;
  /** Baseline, PDF units (origin bottom-left, so larger is higher up) */
  y: number;
  w: number;
  h: number;
  page: number;
}

export type RatioKey = "feePerSqm" | "debtPerSqm" | "savingsPerSqm" | "rateSensitivity" | "energyCostPerSqm" | "feeShare";

export interface Found {
  value: number;
  /** The label as printed, for the user to check against */
  label: string;
  page: number;
}

export interface Extracted {
  /** False when the PDF has no text layer (a scan), so nothing can be read */
  hasText: boolean;
  ratios: Partial<Record<RatioKey, Found>>;
  /** True when debt came from the per-flat-area ratio because the total-area one wasn't printed */
  debtIsPerFlatArea: boolean;
  feeChangePct?: number;
  name?: string;
  orgNr?: string;
  year?: number;
  built?: number;
  stambyteYear?: number;
  tomtratt?: boolean;
}

/** Plausible ranges, used to split numbers whose thousands separator is a space. */
const RANGE: Record<RatioKey | "debtFlat", [number, number]> = {
  feePerSqm: [50, 5000],
  debtPerSqm: [0, 80000],
  debtFlat: [0, 100000],
  savingsPerSqm: [-5000, 5000],
  rateSensitivity: [0, 100],
  energyCostPerSqm: [0, 2000],
  feeShare: [1, 100],
};

const PER_SQM = String.raw`(per|/)\s*(kvm|kvadratmeter|m2)`;
const LABELS: { key: RatioKey | "debtFlat"; re: RegExp; not?: RegExp }[] = [
  { key: "feeShare", re: /arsavgifternas\s*andel|andel\s*arsavgift/ },
  { key: "feePerSqm", re: new RegExp(`arsavgift(er)?\\s*${PER_SQM}`), not: /andel/ },
  { key: "debtFlat", re: new RegExp(`skuldsattning\\s*${PER_SQM}.*upplat`) },
  { key: "debtPerSqm", re: new RegExp(`skuldsattning\\s*${PER_SQM}`), not: /upplat/ },
  { key: "savingsPerSqm", re: new RegExp(`sparande\\s*${PER_SQM}`) },
  { key: "rateSensitivity", re: /rantek\w{1,3}nslighet/ }, // tolerates one or two OCR slips in "känslighet"
  { key: "energyCostPerSqm", re: new RegExp(`energikostnad(er)?\\s*${PER_SQM}`) },
];

/** Lower-case, strip diacritics, and turn "m²" into "m2". */
export function foldText(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const MINUS = /[−–]/g;
const NUMERIC_CELL = /^[−–-]?\s?\d[\d   ]*(?:[.,]\d+)?\s*(%|kr|kr\/kvm|kr\/m2|tkr)?$/i;
const isNumeric = (s: string) => NUMERIC_CELL.test(s.trim().normalize("NFKD"));

interface Row {
  page: number;
  y: number;
  items: TextItem[];
  /** Text of the non-numeric items, in reading order */
  label: string;
  /** Numeric cells in reading order, as printed */
  cells: { str: string; x: number }[];
}

/** Groups items into visual lines and splits each line into its label and its number cells. */
export function toRows(items: TextItem[]): Row[] {
  const sorted = items.filter((i) => i.str.trim()).sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const rows: Row[] = [];
  for (const it of sorted) {
    const last = rows[rows.length - 1];
    const tol = Math.max(2, (it.h || 8) * 0.5);
    if (last && last.page === it.page && Math.abs(last.y - it.y) <= tol) last.items.push(it);
    else rows.push({ page: it.page, y: it.y, items: [it], label: "", cells: [] });
  }
  for (const r of rows) {
    r.items.sort((a, b) => a.x - b.x);
    const labelParts: string[] = [];
    for (let k = 0; k < r.items.length; k++) {
      const it = r.items[k];
      const s = it.str.trim();
      if (isNumeric(s)) {
        // Rejoin "7" + "117" when a generator split one number at its thousands space.
        const prev = r.cells[r.cells.length - 1];
        const prevItem = r.items[k - 1];
        const gap = prevItem ? it.x - (prevItem.x + prevItem.w) : Infinity;
        if (prev && /^\d{3}$/.test(s) && /^[−–-]?\d{1,3}$/.test(prev.str) && gap < (it.h || 8) * 0.45) {
          prev.str = `${prev.str} ${s}`;
        } else {
          r.cells.push({ str: s, x: it.x });
        }
      } else if (r.cells.length === 0) {
        // A label item may end with its numbers when the generator wrote the whole line as one string.
        const m = s.match(/^(.*?[a-zåäö):\]])\s*,?\s+([−–-]?\d[\d\s.,%−–-]*(?:kr)?)$/i);
        if (m) {
          labelParts.push(m[1]);
          r.cells.push(...m[2].split(/\s{2,}|\t/).map((str) => ({ str: str.trim(), x: it.x })));
        } else {
          labelParts.push(s);
        }
      }
    }
    r.label = labelParts.join(" ");
  }
  return rows;
}

/**
 * Parses a run of numbers printed with spaces as thousands separators, e.g.
 * "7 117 6 980 7 200" or "224 196 180". Space-separated digit groups are
 * ambiguous, so each value takes as many 3-digit groups as keep it inside the
 * field's plausible range.
 */
export function parseSeries(text: string, [lo, hi]: [number, number]): number[] {
  const t = text.normalize("NFKD").replace(MINUS, "-").replace(/(%|kr\/kvm|kr\/m2|kr|tkr)/gi, " ").replace(/[  ]/g, " ");
  const tokens = t.trim().split(/\s+/).filter(Boolean);
  const out: number[] = [];
  let i = 0;
  while (i < tokens.length) {
    const first = tokens[i];
    if (!/^-?\d+(?:[.,]\d+)?$/.test(first)) {
      i++;
      continue;
    }
    // Try the longest run of following exact-3-digit groups first.
    let best: { v: number; n: number } | null = null;
    if (/^-?\d{1,3}$/.test(first)) {
      let n = 1;
      while (i + n < tokens.length && /^\d{3}(?:[.,]\d+)?$/.test(tokens[i + n]) && !/[.,]/.test(tokens[i + n - 1]) && n < 4) n++;
      for (let k = n; k >= 1; k--) {
        const v = Number(tokens.slice(i, i + k).join("").replace(",", "."));
        if (v >= lo && v <= hi) {
          best = { v, n: k };
          break;
        }
      }
    }
    if (!best) best = { v: Number(first.replace(",", ".")), n: 1 };
    out.push(best.v);
    i += best.n;
  }
  return out;
}

const YEAR = /^(20[12]\d)$/;

/** Finds the column years printed above a table row, to know which column is the newest year. */
function headerYears(rows: Row[], idx: number) {
  const r = rows[idx];
  for (let k = idx - 1; k >= 0 && k >= idx - 25; k--) {
    const h = rows[k];
    if (h.page !== r.page) break;
    const years = h.items.map((i) => i.str.trim()).filter((s) => YEAR.test(s)).map(Number);
    if (years.length >= 2) return years;
    const inline = (h.label + " " + h.cells.map((c) => c.str).join(" ")).match(/\b20[12]\d\b/g);
    if (inline && inline.length >= 2 && h.cells.length + h.label.split(" ").length <= inline.length + 3) return inline.map(Number);
  }
  return null;
}

function matchLabel(text: string) {
  const f = foldText(text);
  return LABELS.find((l) => l.re.test(f) && !(l.not && l.not.test(f)));
}

export function extractRatios(items: TextItem[]): Extracted {
  const hasText = items.some((i) => /[a-zåäö]{3}/i.test(i.str));
  const rows = toRows(items);
  const raw: Partial<Record<RatioKey | "debtFlat", Found & { series: number[] }>> = {};

  const isYearHeader = (r: Row) => r.cells.length >= 2 && r.cells.every((c) => YEAR.test(c.str.trim()));
  rows.forEach((r, idx) => {
    // Skip lines with no numbers and the column-year header ("2024 2023 2022 2021").
    if (r.cells.length === 0 || isYearHeader(r)) return;
    // Long labels wrap over up to three lines, with the numbers on any one of them.
    const around = (dir: -1 | 1) => {
      const out: string[] = [];
      for (let k = idx + dir; out.length < 2 && k >= 0 && k < rows.length; k += dir) {
        const o = rows[k];
        if (o.page !== r.page || o.cells.length > 0 || !o.label) break;
        out.push(o.label);
      }
      return out;
    };
    const [p1 = "", p2 = ""] = around(-1);
    const [n1 = "", n2 = ""] = around(1);
    const candidates = [
      [r.label],
      [p1, r.label],
      [r.label, n1],
      [p1, r.label, n1],
      [p2, p1, r.label, n1],
      [p1, r.label, n1, n2],
    ].map((parts) => parts.filter(Boolean).join(" ")).filter(Boolean);
    let hit: (typeof LABELS)[number] | undefined;
    let label = "";
    for (const c of candidates) {
      hit = matchLabel(c);
      if (hit) {
        label = c;
        break;
      }
    }
    // Keep the first multi-year table row; a lone number in running text only counts until one turns up.
    const existing = hit && raw[hit.key];
    if (!hit || (existing && existing.series.length >= 2)) return;

    const range = RANGE[hit.key];
    let series = r.cells.length > 1 ? r.cells.flatMap((c) => parseSeries(c.str, range).slice(0, 1)) : parseSeries(r.cells[0].str, range);
    // Newest year first is the norm; flip if the header says the columns run oldest to newest.
    const years = headerYears(rows, idx);
    if (years && years.length >= 2 && years[0] < years[years.length - 1]) series = [...series].reverse();
    if (series.length === 0 || !Number.isFinite(series[0])) return;
    if (series[0] < range[0] || series[0] > range[1]) return;
    if (existing && series.length < 2) return;
    raw[hit.key] = { value: series[0], label: label.replace(/\s+/g, " "), page: r.page, series };
  });

  const ratios: Extracted["ratios"] = {};
  for (const k of ["feePerSqm", "debtPerSqm", "savingsPerSqm", "rateSensitivity", "energyCostPerSqm", "feeShare"] as RatioKey[]) {
    const v = raw[k];
    if (v) ratios[k] = { value: v.value, label: v.label, page: v.page };
  }
  let debtIsPerFlatArea = false;
  if (!ratios.debtPerSqm && raw.debtFlat) {
    ratios.debtPerSqm = { value: raw.debtFlat.value, label: raw.debtFlat.label, page: raw.debtFlat.page };
    debtIsPerFlatArea = true;
  }

  const fee = raw.feePerSqm?.series;
  const feeChangePct = fee && fee.length >= 2 && fee[1] > 0 ? Math.round((fee[0] / fee[1] - 1) * 1000) / 10 : undefined;

  return { hasText, ratios, debtIsPerFlatArea, feeChangePct, ...facts(rows) };
}

/** Name, org number, year and building facts from the report's running text. */
function facts(rows: Row[]) {
  const lines = rows.map((r) => [r.label, ...r.cells.map((c) => c.str)].join(" ").replace(/\s+/g, " ").trim());
  const early = lines.filter((_, i) => rows[i].page <= 2);
  const all = lines.join("\n");
  const folded = foldText(all);

  const nameLine = early.find((l) => /\b(bostadsrättsföreningen|bostadsrättsförening|brf)\b/i.test(l));
  const name = nameLine
    ?.match(/((?:HSB\s+)?(?:Bostadsrättsföreningen|Bostadsrättsförening|Brf\.?|BRF)\s+[A-ZÅÄÖ0-9][\wåäöÅÄÖé.\- ]{1,45})/)?.[1]
    .replace(/\s+(org|organisationsnummer|årsredovisning|org\.?\s*nr).*$/i, "")
    .trim();

  const org = all.match(/\b(7\d{5})\s?[-–]\s?(\d{4})\b/);
  const yearMatch =
    folded.match(/rakenskapsaret\s*(?:\d{4}-\d{2}-\d{2}\s*[-–]\s*)?(20[12]\d)/) ??
    folded.match(/20[12]\d-\d{2}-\d{2}\s*[-–]\s*(20[12]\d)-\d{2}-\d{2}/) ??
    folded.match(/arsredovisning\s*(?:for\s*)?(?:rakenskapsaret\s*)?(20[12]\d)/);
  const year = yearMatch ? Number(yearMatch[1]) : undefined;

  const builtMatch =
    folded.match(/(?:byggnadsar|byggar|bygg\w* ar)\D{0,25}(1[89]\d\d|20[0-2]\d)/) ??
    folded.match(/(?:uppford|fardigstall|byggdes|byggd)\w*\D{0,25}(1[89]\d\d|20[0-2]\d)/);

  // A stambyte year later than the report year is a plan, not work done.
  const stamMatch = [...folded.matchAll(/stambyte\w*\D{0,40}((?:19|20)\d\d)/g)].map((m) => Number(m[1]));
  const stambyteYear = stamMatch.find((y) => !year || y <= year);

  return {
    name: name && name.length > 4 ? name : undefined,
    orgNr: org ? `${org[1]}-${org[2]}` : undefined,
    year,
    built: builtMatch ? Number(builtMatch[1]) : undefined,
    stambyteYear,
    // Ground rent shows up as its own cost line only when the association pays it.
    tomtratt: /tomtrattsavgald/.test(folded) ? true : undefined,
  };
}
