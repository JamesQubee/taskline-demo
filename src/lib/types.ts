import type { ProjectColor, TaskPriority, TaskStatus } from "./constants";

// The shapes the API returns and the UI renders. Timestamps are ISO strings so
// a value looks the same whether it came from a Server Component or a fetch.

/** The only user fields the rest of the app, and the browser, ever see. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  isDemo: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  color: ProjectColor;
  createdAt: string;
};

export type ProjectSummary = Project & {
  taskCount: number;
  doneCount: number;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Calendar date as YYYY-MM-DD, or null when no due date is set. */
  dueDate: string | null;
  /** Zero-based order inside the status column. */
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type UpcomingTask = Pick<
  Task,
  "id" | "projectId" | "title" | "status" | "priority" | "dueDate"
> & {
  projectName: string;
  projectColor: ProjectColor;
};

export type Dashboard = {
  byStatus: Record<TaskStatus, number>;
  total: number;
  /** Not done and past the due date. */
  overdue: number;
  /** Not done and due within the next seven days, today included. */
  dueSoon: number;
  projects: ProjectSummary[];
  upcoming: UpcomingTask[];
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};
