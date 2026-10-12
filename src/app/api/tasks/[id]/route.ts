import { taskUpdateSchema } from "@/lib/validation";
import { parseBody, parseId, withUser } from "@/server/http";
import { deleteTask, updateTask } from "@/server/services/tasks";

type Params = { id: string };

// Also handles board moves: send `status` and/or `position` to move a card.
export const PATCH = withUser<Params>(async ({ request, user, params }) => {
  const id = parseId(params.id, "Task");
  const input = await parseBody(request, taskUpdateSchema);
  return Response.json(await updateTask(user.id, id, input));
});

export const DELETE = withUser<Params>(async ({ user, params }) => {
  const id = parseId(params.id, "Task");
  await deleteTask(user.id, id);
  return new Response(null, { status: 204 });
});
