import type { ProjectColor, TaskStatus } from "./constants";

// Class names are written out in full so Tailwind can find them at build time.

/** Fill for a workflow stage, used by the board columns and the dashboard. */
export const STAGE_FILL: Record<TaskStatus, string> = {
  backlog: "bg-stage-1",
  todo: "bg-stage-2",
  in_progress: "bg-stage-3",
  done: "bg-stage-4",
};

/** Identity color of a project. Always shown next to the project's name. */
export const PROJECT_FILL: Record<ProjectColor, string> = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};
