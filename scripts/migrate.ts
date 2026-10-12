// Applies pending migrations. Runs before `next dev` and in the Vercel build.
import { runMigrations } from "../src/db/migrate";

const target = process.env.DATABASE_URL ? "Postgres" : "local PGlite";

runMigrations()
  .then(() => {
    console.log(`Migrations applied (${target}).`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Migration failed (${target}).`);
    console.error(error);
    process.exit(1);
  });
