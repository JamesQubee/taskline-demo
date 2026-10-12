import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import type { Task } from "@/lib/types";

// Pure functions for the board's local state. The array order inside each
// column is the display order; `position` and `status` on every task are kept
// in step with it, so a task can be sent to the API exactly as it appears.

export type Columns = Record<TaskStatus, Task[]>;
export type Place = { status: TaskStatus; index: number };

const emptyColumns = (): Columns => ({
  backlog: [],
  todo: [],
  in_progress: [],
  done: [],
});

const renumber = (status: TaskStatus, tasks: Task[]): Task[] =>
  tasks.map((task, index) =>
    task.position === index && task.status === status
      ? task
      : { ...task, status, position: index },
  );

export function isStatus(id: unknown): id is TaskStatus {
  return TASK_STATUSES.includes(id as TaskStatus);
}

export function toColumns(tasks: Task[]): Columns {
  const columns = emptyColumns();
  for (const task of tasks) columns[task.status].push(task);
  for (const status of TASK_STATUSES) {
    columns[status].sort(
      (a, b) =>
        a.position - b.position || a.createdAt.localeCompare(b.createdAt),
    );
  }
  return columns;
}

/** Where a task currently sits, or null if it is not on the board. */
export function locate(columns: Columns, taskId: string): Place | null {
  for (const status of TASK_STATUSES) {
    const index = columns[status].findIndex((task) => task.id === taskId);
    if (index !== -1) return { status, index };
  }
  return null;
}

export function removeTask(columns: Columns, taskId: string): Columns {
  const place = locate(columns, taskId);
  if (!place) return columns;
  return {
    ...columns,
    [place.status]: renumber(
      place.status,
      columns[place.status].filter((task) => task.id !== taskId),
    ),
  };
}

/**
 * Puts a task at `index` of the `status` column, taking it out of wherever it
 * was. An index past the end of the column means "at the bottom".
 */
export function placeTask(
  columns: Columns,
  task: Task,
  status: TaskStatus,
  index: number,
): Columns {
  const without = removeTask(columns, task.id);
  const target = [...without[status]];
  target.splice(Math.min(Math.max(index, 0), target.length), 0, task);
  return { ...without, [status]: renumber(status, target) };
}

/** Moves a task that is already on the board. */
export function moveTask(
  columns: Columns,
  taskId: string,
  status: TaskStatus,
  index: number,
): Columns {
  const place = locate(columns, taskId);
  if (!place) return columns;
  if (place.status === status && place.index === index) return columns;
  return placeTask(columns, columns[place.status][place.index], status, index);
}

/** Adds a task the server just created or updated, at the place it reports. */
export function upsertTask(columns: Columns, task: Task): Columns {
  return placeTask(columns, task, task.status, task.position);
}

export function countTasks(columns: Columns): { total: number; done: number } {
  const total = TASK_STATUSES.reduce(
    (sum, status) => sum + columns[status].length,
    0,
  );
  return { total, done: columns.done.length };
}
