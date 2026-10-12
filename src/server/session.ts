import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

/** The only user fields the rest of the app, and the browser, ever see. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  isDemo: boolean;
};

async function readUser(requestHeaders: Headers): Promise<CurrentUser | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;

  const { id, name, email, isDemo } = session.user;
  return { id, name, email, isDemo: Boolean(isDemo) };
}

/** Session lookup for Route Handlers. */
export function getRequestUser(request: Request): Promise<CurrentUser | null> {
  return readUser(request.headers);
}

/** Session lookup for Server Components, deduplicated within one render. */
export const getSessionUser = cache(async () => readUser(await headers()));

/** Returns the signed-in user or sends the visitor to the sign-in page. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}
