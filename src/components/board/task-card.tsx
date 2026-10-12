"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, ChevronsDown, ChevronsUp, GripVertical } from "lucide-react";
import { DueBadge } from "@/components/due-badge";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Task } from "@/lib/types";

type CardProps = {
  task: Task;
  today: string;
  onOpen?: () => void;
  /** Props for the drag handle, supplied by the sortable wrapper. */
  handle?: React.ComponentProps<"button">;
};

/** The card's appearance, shared by the board and the drag overlay. */
export function TaskCardView({ task, today, onOpen, handle }: CardProps) {
  const done = task.status === "done";

  return (
    <div className="flex gap-1 rounded-control border border-line bg-surface p-2.5 pl-1 shadow-card">
      <button
        type="button"
        {...handle}
        aria-label={`Move task: ${task.title}`}
        className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-subtle hover:text-ink active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "block w-full rounded text-left text-sm leading-6 font-medium break-words hover:text-brand",
            done && "text-muted line-through decoration-line-strong",
          )}
        >
          {task.title}
        </button>

        {(task.priority !== "medium" || task.dueDate || task.description) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {task.priority === "high" && (
              <Badge tone="warn">
                <ChevronsUp className="size-3" aria-hidden="true" />
                High
              </Badge>
            )}
            {task.priority === "low" && (
              <Badge>
                <ChevronsDown className="size-3" aria-hidden="true" />
                Low
              </Badge>
            )}
            {task.dueDate && (
              <DueBadge dueDate={task.dueDate} today={today} done={done} />
            )}
            {task.description && (
              <span className="text-subtle" title="Has a description">
                <AlignLeft className="size-3.5" aria-hidden="true" />
                <span className="sr-only">Has a description</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SortableTaskCard({
  task,
  today,
  onOpen,
}: Required<Pick<CardProps, "task" | "today" | "onOpen">>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    // Pointer and touch can drag from anywhere on the card. The keyboard
    // picks it up from the handle, which is the only element given a role.
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        // Press-and-hold starts a drag on touch screens. Without these, a
        // phone answers the same gesture by selecting the card's text.
        "touch-manipulation select-none [-webkit-touch-callout:none]",
        isDragging && "opacity-40",
      )}
      {...listeners}
    >
      <TaskCardView
        task={task}
        today={today}
        onOpen={onOpen}
        handle={{ ref: setActivatorNodeRef, ...attributes }}
      />
    </div>
  );
}
