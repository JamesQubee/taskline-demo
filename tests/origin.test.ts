import { describe, expect, it } from "vitest";
import * as authRoute from "@/app/api/auth/[...all]/route";
import { createUser } from "./helpers";

// Sign-in, sign-up and sign-out are protected against cross-site requests by
// comparing the Origin header with the address the request was sent to.

type Attempt = {
  /** What the browser's address bar shows: the Host header. */
  host: string;
  /** The page the request came from: the Origin header. */
  origin: string;
  /** What the server believes its own address is. */
  serverUrl?: string;
  forwardedProto?: string;
};

async function signOut({
  host,
  origin,
  serverUrl = "http://localhost:3000",
  forwardedProto,
}: Attempt): Promise<number> {
  const user = await createUser();
  const headers = new Headers({
    Cookie: user.cookie,
    Host: host,
    Origin: origin,
    "Content-Type": "application/json",
  });
  if (forwardedProto) headers.set("X-Forwarded-Proto", forwardedProto);

  const response = await authRoute.POST(
    new Request(`${serverUrl}/api/auth/sign-out`, {
      method: "POST",
      headers,
      body: "{}",
    }),
  );
  return response.status;
}

describe("origin check on auth endpoints", () => {
  it("accepts a request from the same address", async () => {
    expect(
      await signOut({ host: "localhost:3000", origin: "http://localhost:3000" }),
    ).toBe(200);
  });

  // The Next.js dev server reports http://localhost:3000 as the request URL
  // even when the browser opened http://127.0.0.1:3000.
  it("accepts the address the visitor opened when the server reports another", async () => {
    expect(
      await signOut({ host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }),
    ).toBe(200);
    expect(
      await signOut({
        host: "192.168.0.20:3000",
        origin: "http://192.168.0.20:3000",
      }),
    ).toBe(200);
  });

  it("accepts any domain the deployment is served from, behind a proxy", async () => {
    expect(
      await signOut({
        host: "taskline-git-main.example.app",
        origin: "https://taskline-git-main.example.app",
        forwardedProto: "https",
      }),
    ).toBe(200);
  });

  it("rejects a request from another site", async () => {
    expect(
      await signOut({ host: "127.0.0.1:3000", origin: "https://evil.example" }),
    ).toBe(403);
    expect(
      await signOut({
        host: "taskline.example.app",
        origin: "https://taskline.example.app.evil.example",
        forwardedProto: "https",
      }),
    ).toBe(403);
  });

  it("rejects the same host over a different scheme", async () => {
    expect(
      await signOut({
        host: "taskline.example.app",
        origin: "http://taskline.example.app",
        forwardedProto: "https",
      }),
    ).toBe(403);
  });
});
