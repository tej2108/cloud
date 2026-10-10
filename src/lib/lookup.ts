// Turns whatever a buyer pastes into the search box (a Hemnet link, a Booli
// link, or an association's name) into something we can match against the
// index. Pure functions, no network: listing sites don't permit reading their
// pages, so we only use what the link itself contains.

export type Lookup =
  | { kind: "empty" }
  | { kind: "name"; query: string }
  | {
      kind: "listing";
      site: "Hemnet" | "Booli";
      url: string;
      /** Association name, when the link contains one (some Booli links do) */
      name?: string;
      /** Area slug from the link, e.g. "sodermalm" (no diacritics) */
      area?: string;
      municipality?: string;
      street?: string;
      rooms?: string;
      propertyType?: string;
    }
  | { kind: "other-url"; host: string };

const PROPERTY_TYPES: Record<string, string> = {
  lagenhet: "Apartment",
  villa: "House",
  radhus: "Terraced house",
  parhus: "Semi-detached house",
  kedjehus: "Link house",
  fritidshus: "Holiday home",
  tomt: "Plot",
  gard: "Farm",
};

/** Lower-case, strip diacritics and punctuation, so "Gärdesmåsen" matches "gardesmasen". */
export function fold(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Drops the legal-form words people add or leave out: "Brf", "Bostadsrättsföreningen", "HSB" … */
export function coreName(s: string) {
  return fold(s)
    .replace(/\b(bostadsrattsforeningen|bostadsrattsforening|brf|hsb|riksbyggen|sbc|i stockholm|stockholm)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const titleCase = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

function parseUrl(raw: string): URL | null {
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    return u.hostname.includes(".") ? u : null;
  } catch {
    return null;
  }
}

/**
 * Hemnet listing slugs look like
 *   /bostad/lagenhet-2rum-sodermalm-stockholms-kommun-hornsgatan-12-21310123
 *   /salda/lagenhet-3,5rum-kungsholmen-stockholms-kommun-fleminggatan-5-1234567
 * i.e. type, rooms, area, municipality, "kommun", street, listing id.
 */
function parseHemnetSlug(slug: string) {
  const out: { propertyType?: string; rooms?: string; area?: string; municipality?: string; street?: string } = {};
  const m = slug.match(/^([a-z]+)-(?:(\d+(?:[,.]\d+)?)rum-)?(.*)$/);
  if (!m) return out;
  out.propertyType = PROPERTY_TYPES[m[1]];
  out.rooms = m[2]?.replace(".", ",");
  const rest = m[3].replace(/-\d+$/, ""); // drop listing id
  const k = rest.indexOf("-kommun");
  if (k === -1) {
    out.area = rest || undefined;
    return out;
  }
  const before = rest.slice(0, k).split("-");
  const after = rest.slice(k + "-kommun".length).replace(/^-/, "");
  // The municipality is usually one word ("stockholms", "solna"); the area is what comes before it.
  out.municipality = titleCase(before.pop() ?? "").replace(/s$/, "");
  out.area = before.join("-") || undefined;
  out.street = after ? titleCase(after) : undefined;
  return out;
}

export function parseLookup(input: string): Lookup {
  const raw = input.trim();
  if (!raw) return { kind: "empty" };

  const looksLikeUrl = /^https?:\/\//i.test(raw) || /^(www\.)?[a-z0-9-]+\.(se|com|nu)(\/|$)/i.test(raw);
  if (!looksLikeUrl) return { kind: "name", query: raw };

  const u = parseUrl(raw);
  if (!u) return { kind: "name", query: raw };
  const host = u.hostname.replace(/^www\./, "");
  const segs = u.pathname.split("/").filter(Boolean).map((s) => decodeURIComponent(s).toLowerCase());

  if (host === "hemnet.se" || host.endsWith(".hemnet.se")) {
    const slug = segs[0] === "bostad" || segs[0] === "salda" ? segs[1] : undefined;
    return { kind: "listing", site: "Hemnet", url: u.href, ...(slug ? parseHemnetSlug(slug) : {}) };
  }

  if (host === "booli.se" || host.endsWith(".booli.se")) {
    // Most Booli links are only an id (/annons/123, /bostad/123). Association pages carry the name.
    const brfSeg = segs.find((s) => /^(brf|bostadsrattsforening)[-_]/.test(s));
    return {
      kind: "listing",
      site: "Booli",
      url: u.href,
      name: brfSeg ? `Brf ${titleCase(brfSeg.replace(/^(brf|bostadsrattsforening(en)?)[-_]/, ""))}` : undefined,
    };
  }

  return { kind: "other-url", host };
}

export interface Matchable {
  name: string;
  district: string;
}

/**
 * Scores how well a typed name matches an association. 1 is exact (ignoring
 * "Brf", case and accents), 0 is no match. Tolerates small typos.
 */
export function nameScore(query: string, name: string) {
  const q = coreName(query);
  const n = coreName(name);
  if (!q || !n) return 0;
  if (q === n) return 1;
  if (n.startsWith(q) || q.startsWith(n)) return 0.9;
  if (n.includes(q)) return 0.8;
  const dist = levenshtein(q, n);
  const sim = 1 - dist / Math.max(q.length, n.length);
  return sim >= 0.7 ? sim * 0.85 : 0;
}

/** True when an area from a link (e.g. "sodermalm", "vasastan-odenplan") points at this district. */
export function areaMatches(area: string | undefined, district: string) {
  if (!area) return false;
  const a = fold(area.replace(/-/g, " "));
  const d = fold(district);
  return a === d || a.split(" ").includes(d) || a.includes(d);
}

function levenshtein(a: string, b: string) {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}
