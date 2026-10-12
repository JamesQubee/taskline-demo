import { beforeAll } from "vitest";

// By default each test file runs against its own in-memory Postgres, migrated
// with the same SQL files that production uses.
//
// Set TEST_DATABASE_URL to run the suite against a real Postgres server
// instead, which also exercises the production database driver:
//   TEST_DATABASE_URL=postgres://... pnpm test --no-file-parallelism
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  delete process.env.DATABASE_URL;
  process.env.PGLITE_DATA_DIR = "memory://";
}
process.env.BETTER_AUTH_SECRET = "test-secret-not-used-anywhere-else";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

beforeAll(async () => {
  const { runMigrations } = await import("@/db/migrate");
  await runMigrations();
});
