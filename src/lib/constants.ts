// Shared by the database schema, the API validation and the UI.
// Keep this file free of server-only imports so client components can use it.

export const APP_NAME = "Taskline";

export const TASK_STATUSES = ["backlog", "todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PROJECT_COLORS = [
  "indigo",
  "emerald",
  "amber",
  "rose",
  "sky",
  "violet",
] as const;
export type ProjectColor = (typeof PROJECT_COLORS)[number];

export const LIMITS = {
  projectName: 60,
  projectDescription: 280,
  taskTitle: 120,
  taskDescription: 2000,
  projectsPerUser: 50,
  tasksPerProject: 500,
} as const;
