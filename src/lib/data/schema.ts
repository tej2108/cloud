// The two tables Trapphus saves: associations someone is watching, and
// comparisons someone saved. One shared list for everyone with the site login,
// so there is no user column.
//
// A comparison stores its two slugs in sorted order (a before b), so saving
// (A, B) and then (B, A) is the same row. saved.ts does the sorting.
//
// There is no migration tooling yet. The SQL below creates the same tables and
// runs once on first use (see db.ts). When the schema first changes, replace
// it with real migrations.

import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const watched = pgTable("watched", {
  slug: text("slug").primaryKey(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const comparisons = pgTable(
  "comparisons",
  {
    id: serial("id").primaryKey(),
    a: text("a").notNull(),
    b: text("b").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("comparisons_a_b_unique").on(t.a, t.b)],
);

/**
 * One statement per entry (the hosted driver runs one statement at a time).
 * Keep these in step with the tables above.
 */
export const BOOTSTRAP_SQL: string[] = [
  `create table if not exists watched (
    slug text primary key,
    added_at timestamptz not null default now()
  )`,
  `create table if not exists comparisons (
    id serial primary key,
    a text not null,
    b text not null,
    created_at timestamptz not null default now(),
    constraint comparisons_a_b_unique unique (a, b)
  )`,
];
