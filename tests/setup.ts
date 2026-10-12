import { beforeAll } from "vitest";

// Each test file runs against its own in-memory Postgres, migrated with the
// same SQL files that production uses.
delete process.env.DATABASE_URL;
process.env.PGLITE_DATA_DIR = "memory://";
process.env.BETTER_AUTH_SECRET = "test-secret-not-used-anywhere-else";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

beforeAll(async () => {
  const { runMigrations } = await import("@/db/migrate");
  await runMigrations();
});
