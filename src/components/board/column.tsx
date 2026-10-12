"use client";

import { useId } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { STAGE_FILL } from "@/lib/styles";
import type { Task } from "@/lib/types";
import { SortableTaskCard } from "./task-card";

export function Column({
  status,
  tasks,
  today,
  onAdd,
  onOpen,
}: {
  status: TaskStatus;
  tasks: Task[];
  today: string;
  onAdd: () => void;
  onOpen: (task: Task) => void;
}) {
  const headingId = useId();
  // The column itself is a drop target, so a card can land in an empty one.
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const label = STATUS_LABELS[status];

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-[82vw] max-w-80 shrink-0 snap-center flex-col rounded-card bg-sunken p-2 xl:w-auto xl:max-w-none"
    >
      <header className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
        <span
          aria-hidden="true"
          className={cn("size-2.5 shrink-0 rounded-[3px]", STAGE_FILL[status])}
        />
        <h2 id={headingId} className="text-sm font-semibold">
          {label}
        </h2>
        <span className="text-sm text-muted">
          {tasks.length}
          <span className="sr-only"> tasks</span>
        </span>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add a task to ${label}`}
          className="-my-1 ml-auto rounded-control p-1.5 text-muted hover:bg-surface hover:text-ink"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </header>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-28 flex-1 flex-col gap-2 rounded-control transition-colors",
            isOver && tasks.length === 0 && "bg-brand-soft",
          )}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              today={today}
              onOpen={() => onOpen(task)}
            />
          ))}
          {tasks.length === 0 && (
            <p className="flex flex-1 items-center justify-center rounded-control border border-dashed border-line-strong px-3 text-center text-sm text-muted">
              Nothing here yet
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
