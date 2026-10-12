import "server-only";
import { and, asc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { project, task } from "@/db/schema";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { addDays, todayIso } from "@/lib/dates";
import type { Dashboard, UpcomingTask } from "@/lib/types";
import { listProjects } from "./projects";

const UPCOMING_LIMIT = 6;
const DUE_SOON_DAYS = 7;

/** Everything the dashboard shows, for the given user, in three queries. */
export async function getDashboard(
  userId: string,
  today: string = todayIso(),
): Promise<Dashboard> {
  const db = await getDb();
  const soon = addDays(today, DUE_SOON_DAYS);
  const open = ne(task.status, "done");
  const owned = eq(project.ownerId, userId);

  const [statusRows, upcoming, projects] = await Promise.all([
    db
      .select({
        status: task.status,
        total: sql<number>`count(*)`.mapWith(Number),
        overdue: sql<number>`count(*) filter (where ${open} and ${task.dueDate} < ${today})`.mapWith(
          Number,
        ),
        dueSoon: sql<number>`count(*) filter (where ${open} and ${task.dueDate} between ${today} and ${soon})`.mapWith(
          Number,
        ),
      })
      .from(task)
      .innerJoin(project, eq(project.id, task.projectId))
      .where(owned)
      .groupBy(task.status),

    db
      .select({
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        projectName: project.name,
        projectColor: project.color,
      })
      .from(task)
      .innerJoin(project, eq(project.id, task.projectId))
      // Overdue tasks stay on the list until they are done or rescheduled.
      .where(and(owned, open, isNotNull(task.dueDate)))
      .orderBy(asc(task.dueDate), asc(task.createdAt))
      .limit(UPCOMING_LIMIT),

    listProjects(userId),
  ]);

  const byStatus = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, 0]),
  ) as Record<TaskStatus, number>;
  let overdue = 0;
  let dueSoon = 0;
  for (const row of statusRows) {
    byStatus[row.status] = row.total;
    overdue += row.overdue;
    dueSoon += row.dueSoon;
  }

  return {
    byStatus,
    total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
    overdue,
    dueSoon,
    projects,
    upcoming: upcoming satisfies UpcomingTask[],
  };
}
