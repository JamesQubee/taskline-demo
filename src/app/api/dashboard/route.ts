import { withUser } from "@/server/http";
import { getDashboard } from "@/server/services/dashboard";

export const GET = withUser(async ({ user }) => {
  return Response.json(await getDashboard(user.id));
});
