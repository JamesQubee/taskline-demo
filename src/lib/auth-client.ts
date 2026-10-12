import { createAuthClient } from "better-auth/react";

// Talks to the Better Auth handler mounted at /api/auth.
export const authClient = createAuthClient();
