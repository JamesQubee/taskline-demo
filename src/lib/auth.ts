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

/**
 * The origin a request was addressed to, read from its Host header.
 *
 * A browser request is same-origin exactly when its Origin header equals this
 * value. Checking against the Host header, instead of one configured URL,
 * keeps sign-in and sign-out working under every name the app is reachable
 * by: localhost and 127.0.0.1 in development (Next.js reports only one of
 * them as the request URL), and each domain Vercel assigns to a deployment.
 */
function addressedOrigin(request?: Request): string[] {
  const host = request?.headers.get("host");
  if (!request || !host) return [];

  const forwarded = request.headers.get("x-forwarded-proto");
  const protocol =
    forwarded?.split(",")[0].trim() ||
    new URL(request.url).protocol.replace(":", "");
  return [`${protocol}://${host}`];
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
    trustedOrigins: (request) => [
      ...vercelOrigins(),
      ...addressedOrigin(request),
    ],
    advanced: {
      // The library turns this check off by itself when NODE_ENV or TEST says
      // "test". Pin it on, so the tests exercise the same protection that
      // production has and a stray environment variable cannot remove it.
      disableOriginCheck: false,
    },
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
