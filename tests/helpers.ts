import { getAuth } from "@/lib/auth";

const BASE_URL = "http://localhost:3000";

let userCount = 0;

/** Turns `Set-Cookie` response headers into a `Cookie` request header. */
export function toCookieHeader(setCookies: string[]): string {
  return setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

/** Registers a real account and returns its id and session cookie. */
export async function createUser(name = "Test User") {
  const auth = await getAuth();
  const { headers, response } = await auth.api.signUpEmail({
    body: {
      name,
      email: `user-${++userCount}-${Date.now()}@example.com`,
      password: "correct horse battery staple",
    },
    returnHeaders: true,
  });
  return {
    id: response.user.id,
    cookie: toCookieHeader(headers.getSetCookie()),
  };
}

type RequestOptions = { cookie?: string; body?: unknown; rawBody?: string };

export function request(
  method: string,
  path: string,
  { cookie, body, rawBody }: RequestOptions = {},
): Request {
  const headers = new Headers();
  if (cookie) headers.set("Cookie", cookie);
  if (body !== undefined || rawBody !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  return new Request(`${BASE_URL}${path}`, {
    method,
    headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
}

/** The second argument Next.js passes to a Route Handler. */
export function params<P extends object>(value: P): { params: Promise<P> } {
  return { params: Promise.resolve(value) };
}

export const noParams = params({});
