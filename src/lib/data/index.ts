// Where the app gets its associations from. Today that is the demo data in
// ./brfs, but these functions are async on purpose: later phases put a real
// source (a database, then real reports) behind the same signatures, so pages
// already `await` them and won't need to change when the source does.

import { RATED, getBrf as findBrf } from "../brfs";
import type { RatedBrf } from "../brfs";

/** Every association, strongest first (RATED is already sorted this way). */
export async function listBrfs(): Promise<RatedBrf[]> {
  return RATED;
}

/** One association by its slug, or undefined if there isn't one. */
export async function getBrf(slug: string): Promise<RatedBrf | undefined> {
  return findBrf(slug);
}
