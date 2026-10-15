// What visitors have saved: watched associations and saved comparisons. This
// is the only file that runs queries. Everything goes through Drizzle, so
// values are always passed as parameters, never built into SQL strings.
//
// Callers check dbConfigured() first; without a database these throw.
// Only import this from server code.

import { and, asc, desc, eq } from "drizzle-orm";
import { ready } from "./db";
import { comparisons, watched } from "./schema";

export { dbConfigured } from "./db";

export type SavedComparison = { id: number; a: string; b: string; createdAt: Date };

/** Slugs of watched associations, oldest first. */
export async function listWatched(): Promise<string[]> {
  const db = await ready();
  const rows = await db
    .select({ slug: watched.slug })
    .from(watched)
    .orderBy(asc(watched.addedAt), asc(watched.slug));
  return rows.map((r) => r.slug);
}

/** Watch or stop watching. Safe to repeat in either direction. */
export async function setWatched(slug: string, on: boolean): Promise<void> {
  const db = await ready();
  if (on) {
    await db.insert(watched).values({ slug }).onConflictDoNothing();
  } else {
    await db.delete(watched).where(eq(watched.slug, slug));
  }
}

/** Saved comparisons, newest first. */
export async function listComparisons(): Promise<SavedComparison[]> {
  const db = await ready();
  return db
    .select({
      id: comparisons.id,
      a: comparisons.a,
      b: comparisons.b,
      createdAt: comparisons.createdAt,
    })
    .from(comparisons)
    .orderBy(desc(comparisons.createdAt), desc(comparisons.id));
}

// A pair is always stored with the smaller slug first, so (A, B) and (B, A) match.
const sortedPair = (a: string, b: string): [string, string] => (a <= b ? [a, b] : [b, a]);

/** True when this pair, in either order, is saved. A single keyed lookup. */
export async function isComparisonSaved(a: string, b: string): Promise<boolean> {
  const [first, second] = sortedPair(a, b);
  const db = await ready();
  const rows = await db
    .select({ id: comparisons.id })
    .from(comparisons)
    .where(and(eq(comparisons.a, first), eq(comparisons.b, second)))
    .limit(1);
  return rows.length > 0;
}

/** Saves a pair. (A, B) and (B, A) are one row; saving it again does nothing. */
export async function saveComparison(a: string, b: string): Promise<void> {
  const [first, second] = sortedPair(a, b);
  const db = await ready();
  await db.insert(comparisons).values({ a: first, b: second }).onConflictDoNothing();
}

export async function deleteComparison(id: number): Promise<void> {
  const db = await ready();
  await db.delete(comparisons).where(eq(comparisons.id, id));
}
