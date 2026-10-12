import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

// Both drivers expose the same query builder, so the rest of the app depends
// on this common type and never on a specific driver.
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

// Survives hot reloads in development, so each reload does not open a new pool.
const globalForDb = globalThis as unknown as { __tasklineDb?: Promise<Db> };

/**
 * Returns the shared database handle, creating it on first use.
 *
 * - With `DATABASE_URL` set: a node-postgres pool (Neon, Supabase, RDS, ...).
 * - Without it: PGlite, an embedded Postgres, so the project runs locally and
 *   in tests with no database to install.
 */
export function getDb(): Promise<Db> {
  return (globalForDb.__tasklineDb ??= createDb());
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url) {
    // Serverless instances each hold their own pool, so keep it small and
    // point DATABASE_URL at the provider's pooled endpoint.
    const pool = new Pool({ connectionString: url, max: 5 });
    return drizzle({ client: pool, schema });
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set for this deployment.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const dataDir = process.env.PGLITE_DATA_DIR ?? ".data/pglite";
  if (!dataDir.includes("://")) {
    // PGlite creates only the last path segment itself.
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dataDir, { recursive: true });
  }
  return drizzlePglite({ client: new PGlite(dataDir), schema });
}
