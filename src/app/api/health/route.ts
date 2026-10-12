import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db/client";

// Liveness check that also proves the database is reachable.
export async function GET(): Promise<Response> {
  // Run on every request instead of being prerendered at build time.
  await connection();

  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: "degraded", database: "unreachable" },
      { status: 503 },
    );
  }
}
