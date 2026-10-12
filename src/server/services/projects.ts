import "server-only";
import { and, count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { project, task, type ProjectRow } from "@/db/schema";
import { LIMITS } from "@/lib/constants";
import type { Project, ProjectSummary } from "@/lib/types";
import {
  projectCreateSchema,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from "@/lib/validation";
import { limitReached, notFound } from "../errors";

// Every function takes the acting user's id and scopes its query by it.
// A project that belongs to someone else is reported as not found.

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
  };
}

const ownedBy = (userId: string, projectId: string) =>
  and(eq(project.id, projectId), eq(project.ownerId, userId));

export async function listProjects(userId: string): Promise<ProjectSummary[]> {
  const db = await getDb();
  const rows = await db
    .select({
      ...getTableColumns(project),
      taskCount: count(task.id),
      doneCount: sql<number>`count(${task.id}) filter (where ${task.status} = 'done')`.mapWith(
        Number,
      ),
    })
    .from(project)
    .leftJoin(task, eq(task.projectId, project.id))
    .where(eq(project.ownerId, userId))
    .groupBy(project.id)
    .orderBy(desc(project.createdAt));

  return rows.map(({ taskCount, doneCount, ...row }) => ({
    ...toProject(row),
    taskCount,
    doneCount,
  }));
}

export async function getProject(
  userId: string,
  projectId: string,
): Promise<Project> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(project)
    .where(ownedBy(userId, projectId));

  if (!row) throw notFound("Project");
  return toProject(row);
}

export async function createProject(
  userId: string,
  input: ProjectCreateInput,
): Promise<Project> {
  const values = projectCreateSchema.parse(input);
  const db = await getDb();

  const [{ total }] = await db
    .select({ total: count() })
    .from(project)
    .where(eq(project.ownerId, userId));
  if (total >= LIMITS.projectsPerUser) {
    throw limitReached(
      `You can have up to ${LIMITS.projectsPerUser} projects. Delete one to add another.`,
    );
  }

  const [row] = await db
    .insert(project)
    .values({ ...values, ownerId: userId })
    .returning();
  return toProject(row);
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: ProjectUpdateInput,
): Promise<Project> {
  const db = await getDb();
  const [row] = await db
    .update(project)
    .set({ ...input, updatedAt: new Date() })
    .where(ownedBy(userId, projectId))
    .returning();

  if (!row) throw notFound("Project");
  return toProject(row);
}

export async function deleteProject(
  userId: string,
  projectId: string,
): Promise<void> {
  const db = await getDb();
  const deleted = await db
    .delete(project)
    .where(ownedBy(userId, projectId))
    .returning({ id: project.id });

  if (deleted.length === 0) throw notFound("Project");
}
