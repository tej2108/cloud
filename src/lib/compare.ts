// Decides which two associations the compare page shows, from whatever the URL
// asked for. Pure function: no React, no data import, so it's easy to test.
//
// The rules (chosen by the product owner):
// 1. Nothing chosen          → show nothing; the page asks them to pick.
// 2. Only one chosen         → compare it with the strongest association
//                              (the second strongest if it IS the strongest).
// 3. A slug that isn't found → say so, then treat that side as not chosen.
// 4. The same one twice      → keep the first, replace the second as in rule 2, and say why.

export interface Pair<T> {
  a?: T;
  b?: T;
  /** Plain-language notes to show above the comparison */
  notices: string[];
}

/** Long or odd slugs from a URL are shortened before being shown back to the user. */
const shown = (slug: string) => (slug.length > 40 ? `${slug.slice(0, 40)}…` : slug);

/**
 * @param ranked every association, strongest first (RATED is already sorted this way)
 */
export function pickPair<T extends { slug: string; name: string }>(
  aSlug: string | undefined,
  bSlug: string | undefined,
  ranked: T[],
): Pair<T> {
  const find = (slug?: string) => (slug ? ranked.find((x) => x.slug === slug) : undefined);
  const strongestExcept = (other: T) => ranked.find((x) => x.slug !== other.slug);
  const notices: string[] = [];

  let a = find(aSlug);
  let b = find(bSlug);
  const aMissing = !!aSlug && !a;
  const bMissing = !!bSlug && !b;

  // Rule 4: the same association on both sides.
  let sameTwice = false;
  if (a && b && a.slug === b.slug) {
    b = undefined;
    sameTwice = true;
  }

  // Rule 2: one side chosen, so fill the other with the strongest.
  let filled: T | undefined;
  if (a && !b) filled = b = strongestExcept(a);
  else if (b && !a) filled = a = strongestExcept(b);

  // Rule 3: tell them about links that didn't match, and what happened instead.
  for (const [missing, slug] of [[aMissing, aSlug], [bMissing, bSlug]] as const) {
    if (!missing || !slug) continue;
    notices.push(
      filled
        ? `We couldn't find “${shown(slug)}”, so ${filled.name} is shown instead.`
        : `We couldn't find “${shown(slug)}”.`,
    );
  }
  if (sameTwice && a && filled) {
    notices.push(`You chose ${a.name} twice, so it's compared with ${filled.name} instead.`);
  }
  // Rule 2 with nothing gone wrong: explain the automatic choice.
  if (filled && !aMissing && !bMissing && !sameTwice) {
    const rank = filled.slug === ranked[0]?.slug ? "the strongest" : "the second strongest";
    notices.push(`Compared with ${filled.name}, ${rank} association in the index. Change either one with the menus above.`);
  }

  return { a, b, notices };
}
