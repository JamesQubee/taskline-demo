import { defineConfig } from "drizzle-kit";

// Only used to generate SQL migrations from the schema (`pnpm db:generate`).
// Applying them is done by `scripts/migrate.ts`.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
