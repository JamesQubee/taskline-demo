import { projectCreateSchema } from "@/lib/validation";
import { parseBody, withUser } from "@/server/http";
import { createProject, listProjects } from "@/server/services/projects";

export const GET = withUser(async ({ user }) => {
  return Response.json(await listProjects(user.id));
});

export const POST = withUser(async ({ request, user }) => {
  const input = await parseBody(request, projectCreateSchema);
  const project = await createProject(user.id, input);
  return Response.json(project, { status: 201 });
});
