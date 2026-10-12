import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { LIMITS } from "@/lib/constants";

// On Vercel the public URL is known from the environment, so BETTER_AUTH_URL
// only has to be set when the app is served from a custom domain.
function vercelOrigins(): string[] {
  return [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
  ]
    .filter((host): host is string => Boolean(host))
    .map((host) => `https://${host}`);
}

function baseUrl(): string | undefined {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  const host =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL;
  return host ? `https://${host}` : undefined;
}

async function createAuth() {
  const db = await getDb();

  return betterAuth({
    baseURL: baseUrl(),
    trustedOrigins: vercelOrigins(),
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: LIMITS.passwordMin,
    },
    user: {
      additionalFields: {
        // `input: false` keeps clients from setting this on sign-up.
        isDemo: { type: "boolean", defaultValue: false, input: false },
      },
    },
  });
}

export type Auth = Awaited<ReturnType<typeof createAuth>>;

const globalForAuth = globalThis as unknown as {
  __tasklineAuth?: Promise<Auth>;
};

/** Returns the shared Better Auth instance, creating it on first use. */
export function getAuth(): Promise<Auth> {
  return (globalForAuth.__tasklineAuth ??= createAuth());
}
