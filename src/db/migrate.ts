import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { getDb } from "./client";
import type * as schema from "./schema";

const migrationsFolder = "drizzle";

/** Applies any pending SQL migrations from `./drizzle` to the active database. */
export async function runMigrations(): Promise<void> {
  const db = await getDb();

  if (process.env.DATABASE_URL) {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db as NodePgDatabase<typeof schema>, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as PgliteDatabase<typeof schema>, { migrationsFolder });
  }
}
