import { projectUpdateSchema } from "@/lib/validation";
import { parseBody, parseId, withUser } from "@/server/http";
import {
  deleteProject,
  getProject,
  updateProject,
} from "@/server/services/projects";

type Params = { id: string };

export const GET = withUser<Params>(async ({ user, params }) => {
  const id = parseId(params.id, "Project");
  return Response.json(await getProject(user.id, id));
});

export const PATCH = withUser<Params>(async ({ request, user, params }) => {
  const id = parseId(params.id, "Project");
  const input = await parseBody(request, projectUpdateSchema);
  return Response.json(await updateProject(user.id, id, input));
});

export const DELETE = withUser<Params>(async ({ user, params }) => {
  const id = parseId(params.id, "Project");
  await deleteProject(user.id, id);
  return new Response(null, { status: 204 });
});
