import { taskCreateSchema } from "@/lib/validation";
import { parseBody, parseId, withUser } from "@/server/http";
import { createTask, listTasks } from "@/server/services/tasks";

type Params = { id: string };

export const GET = withUser<Params>(async ({ user, params }) => {
  const projectId = parseId(params.id, "Project");
  return Response.json(await listTasks(user.id, projectId));
});

export const POST = withUser<Params>(async ({ request, user, params }) => {
  const projectId = parseId(params.id, "Project");
  const input = await parseBody(request, taskCreateSchema);
  const task = await createTask(user.id, projectId, input);
  return Response.json(task, { status: 201 });
});
