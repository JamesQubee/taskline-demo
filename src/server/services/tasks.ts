import "server-only";
import { and, asc, count, eq, getTableColumns, max, ne } from "drizzle-orm";
import { getDb, type Db } from "@/db/client";
import { project, task, type TaskRow } from "@/db/schema";
import { LIMITS, type TaskStatus } from "@/lib/constants";
import type { Task } from "@/lib/types";
import {
  taskCreateSchema,
  type TaskCreateInput,
  type TaskUpdateInput,
} from "@/lib/validation";
import { limitReached, notFound } from "../errors";
import { getProject } from "./projects";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Loads a task only if its project belongs to the user. */
async function findOwnedTask(
  db: Db | Tx,
  userId: string,
  taskId: string,
): Promise<TaskRow> {
  const [row] = await db
    .select(getTableColumns(task))
    .from(task)
    .innerJoin(project, eq(project.id, task.projectId))
    .where(and(eq(task.id, taskId), eq(project.ownerId, userId)));

  if (!row) throw notFound("Task");
  return row;
}

export async function listTasks(
  userId: string,
  projectId: string,
): Promise<Task[]> {
  await getProject(userId, projectId);

  const db = await getDb();
  const rows = await db
    .select()
    .from(task)
    .where(eq(task.projectId, projectId))
    .orderBy(asc(task.position), asc(task.createdAt));
  return rows.map(toTask);
}

export async function createTask(
  userId: string,
  projectId: string,
  input: TaskCreateInput,
): Promise<Task> {
  const values = taskCreateSchema.parse(input);
  await getProject(userId, projectId);

  const db = await getDb();
  const [{ total }] = await db
    .select({ total: count() })
    .from(task)
    .where(eq(task.projectId, projectId));
  if (total >= LIMITS.tasksPerProject) {
    throw limitReached(
      `A project can hold up to ${LIMITS.tasksPerProject} tasks.`,
    );
  }

  // New tasks go to the bottom of their column.
  const [{ last }] = await db
    .select({ last: max(task.position) })
    .from(task)
    .where(and(eq(task.projectId, projectId), eq(task.status, values.status)));

  const [row] = await db
    .insert(task)
    .values({ ...values, projectId, position: (last ?? -1) + 1 })
    .returning();
  return toTask(row);
}

/**
 * Updates a task's fields and, when `status` or `position` is given, moves it
 * on the board. `position` is the index the task should end up at inside the
 * target column; out-of-range values are clamped to the end.
 */
export async function updateTask(
  userId: string,
  taskId: string,
  input: TaskUpdateInput,
): Promise<Task> {
  const { status, position, ...fields } = input;
  const db = await getDb();

  return db.transaction(async (tx) => {
    const current = await findOwnedTask(tx, userId, taskId);

    const targetStatus = status ?? current.status;
    const isMove =
      targetStatus !== current.status || position !== undefined;
    const placement = isMove
      ? await placeInColumn(tx, current, targetStatus, position)
      : {};

    const [row] = await tx
      .update(task)
      .set({ ...fields, ...placement, updatedAt: new Date() })
      .where(eq(task.id, taskId))
      .returning();
    return toTask(row);
  });
}

/**
 * Makes room for a task at `index` in the target column by renumbering the
 * other cards, and returns the status and position the task itself should get.
 */
async function placeInColumn(
  tx: Tx,
  moving: TaskRow,
  status: TaskStatus,
  index: number | undefined,
): Promise<{ status: TaskStatus; position: number }> {
  const siblings = await tx
    .select({ id: task.id, position: task.position })
    .from(task)
    .where(
      and(
        eq(task.projectId, moving.projectId),
        eq(task.status, status),
        ne(task.id, moving.id),
      ),
    )
    .orderBy(asc(task.position), asc(task.createdAt));

  const target = Math.min(index ?? siblings.length, siblings.length);

  // Columns hold a handful of cards, so one small UPDATE per shifted card is
  // simpler than a bulk statement and only touches rows that actually change.
  for (const [i, sibling] of siblings.entries()) {
    const next = i < target ? i : i + 1;
    if (sibling.position !== next) {
      await tx
        .update(task)
        .set({ position: next })
        .where(eq(task.id, sibling.id));
    }
  }

  return { status, position: target };
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const db = await getDb();
  // Gaps left in `position` are harmless: only the relative order matters and
  // the next move renumbers the column.
  const current = await findOwnedTask(db, userId, taskId);
  await db.delete(task).where(eq(task.id, current.id));
}
