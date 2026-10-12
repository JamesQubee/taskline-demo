import { TaskCardView } from "@/components/board/task-card";
import { cn } from "@/lib/cn";
import { STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { addDays } from "@/lib/dates";
import { STAGE_FILL } from "@/lib/styles";
import type { Task } from "@/lib/types";

// A fixed reference date keeps this picture identical on every render, so the
// page stays fully static.
const TODAY = "2026-06-10";

const card = (
  id: number,
  title: string,
  status: TaskStatus,
  extra: Partial<Task> = {},
): Task => ({
  id: String(id),
  projectId: "preview",
  title,
  description: "",
  status,
  priority: "medium",
  dueDate: null,
  position: id,
  createdAt: "",
  updatedAt: "",
  ...extra,
});

const COLUMNS: Array<{ status: TaskStatus; tasks: Task[] }> = [
  {
    status: "todo",
    tasks: [
      card(1, "Set up redirects from old URLs", "todo", {
        priority: "high",
        dueDate: addDays(TODAY, 6),
      }),
      card(2, "Write copy for the About page", "todo", {
        priority: "low",
        dueDate: addDays(TODAY, 5),
      }),
    ],
  },
  {
    status: "in_progress",
    tasks: [
      card(3, "Build homepage and pricing page", "in_progress", {
        priority: "high",
        dueDate: addDays(TODAY, 1),
        description: "yes",
      }),
      card(4, "Connect contact form to CRM", "in_progress", {
        dueDate: addDays(TODAY, -1),
      }),
    ],
  },
  {
    status: "done",
    tasks: [
      card(5, "Agree on sitemap with stakeholders", "done"),
      card(6, "Design system: colors, type, spacing", "done"),
    ],
  },
];

/** A picture of the board made from the real card component. Not interactive. */
export function BoardPreview() {
  return (
    <div
      inert
      aria-hidden="true"
      className="rounded-card border border-line bg-surface p-3 shadow-pop select-none sm:p-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {COLUMNS.map(({ status, tasks }, index) => (
          <div
            key={status}
            className={cn(
              "flex-col gap-2 rounded-card bg-sunken p-2",
              // One column is enough to get the idea on a phone.
              index === 1 ? "flex" : "hidden sm:flex",
            )}
          >
            <div className="flex items-center gap-2 px-1.5 pt-1 pb-0.5">
              <span className={cn("size-2.5 rounded-[3px]", STAGE_FILL[status])} />
              <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
              <span className="text-sm text-muted">{tasks.length}</span>
            </div>
            {tasks.map((task) => (
              <TaskCardView key={task.id} task={task} today={TODAY} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
