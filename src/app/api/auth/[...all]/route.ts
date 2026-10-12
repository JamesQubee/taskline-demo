import { getAuth } from "@/lib/auth";

// Sign-up, sign-in, sign-out and session endpoints are provided by Better Auth.
async function handler(request: Request): Promise<Response> {
  const auth = await getAuth();
  return auth.handler(request);
}

export { handler as GET, handler as POST };
