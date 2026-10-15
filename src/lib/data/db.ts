// The one database client for the app. Only import this from server code.
//
// With DATABASE_URL set it talks to a hosted Postgres (Neon) over HTTP. With
// USE_LOCAL_DB=1 it uses PGlite, an embedded Postgres kept in .data/pglite, so
// the whole feature can be built and tested with no hosting. With neither,
// dbConfigured() is false and callers must not ask for the database.
//
// PGlite is for local use only: it writes to disk, and on Vercel the file
// system does not persist. The hosted (Neon) path is unverified until a real
// database is connected.
//
// The rest of the code only sees the shared Db type, never which driver is
// behind it.

import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/** True when there is somewhere to save to. Check this before calling ready(). */
export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL) || process.env.USE_LOCAL_DB === "1";
}

// Cached on globalThis so Next.js dev reloads reuse one client instead of
// opening a second one (PGlite cannot share its folder between two clients).
type Cache = { client?: Promise<Db>; ready?: Promise<Db> };
const g = globalThis as typeof globalThis & { __trapphusDb?: Cache };
const cache: Cache = (g.__trapphusDb ??= {});

/** Creates the client the first time it is asked for, then reuses it. */
export function getDb(): Promise<Db> {
  return (cache.client ??= connect());
}

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    // Imported on demand so the local driver is never loaded in production.
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle({ client: neon(url), schema });
  }
  if (process.env.USE_LOCAL_DB === "1") {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { mkdir } = await import("node:fs/promises");
    const dir = `${process.cwd()}/.data/pglite`;
    // PGlite creates only the last folder, not the .data folder above it.
    await mkdir(dir, { recursive: true });
    return drizzle({ client: new PGlite(dir), schema });
  }
  throw new Error(
    "No database configured: set DATABASE_URL, or USE_LOCAL_DB=1 for local development. Check dbConfigured() first.",
  );
}

/** The database, with the tables guaranteed to exist. Creates them once. */
export function ready(): Promise<Db> {
  return (cache.ready ??= bootstrap());
}

async function bootstrap(): Promise<Db> {
  try {
    const db = await getDb();
    for (const statement of schema.BOOTSTRAP_SQL) {
      await db.execute(sql.raw(statement));
    }
    return db;
  } catch (err) {
    // Do not remember a failure, so the next request can try again.
    cache.ready = undefined;
    cache.client = undefined;
    throw err;
  }
}
