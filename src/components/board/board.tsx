"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { PROJECT_FILL } from "@/lib/styles";
import type { Project, Task } from "@/lib/types";
import {
  countTasks,
  isStatus,
  locate,
  moveTask,
  removeTask,
  toColumns,
  upsertTask,
  type Columns,
  type Place,
} from "./board-state";
import { Column } from "./column";
import { TaskCardView } from "./task-card";
import { TaskDialog } from "./task-dialog";

type OpenDialog =
  | { kind: "task"; task?: Task; status: TaskStatus }
  | { kind: "edit-project" }
  | { kind: "delete-project" }
  | null;

export function Board({
  project: serverProject,
  tasks: serverTasks,
  today,
}: {
  project: Project;
  tasks: Task[];
  today: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const dndId = useId();

  // The board keeps its own copy of the data so a drop shows instantly, then
  // adopts whatever the server sends next, as long as no move is in flight.
  const [project, setProject] = useState(serverProject);
  const [columns, setColumns] = useState(() => toColumns(serverTasks));
  const [synced, setSynced] = useState({ serverProject, serverTasks });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [savingMoves, setSavingMoves] = useState(0);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [deleting, setDeleting] = useState(false);
  const beforeDrag = useRef<Columns | null>(null);

  const idle = activeId === null && savingMoves === 0;
  if (
    idle &&
    (synced.serverTasks !== serverTasks || synced.serverProject !== serverProject)
  ) {
    setSynced({ serverProject, serverTasks });
    setProject(serverProject);
    setColumns(toColumns(serverTasks));
  }

  const sensors = useSensors(
    // A small drag distance keeps plain clicks working as clicks.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Press and hold to drag on touch screens, so swiping still scrolls.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnOf = (id: UniqueIdentifier): TaskStatus | null =>
    isStatus(id) ? id : (locate(columns, String(id))?.status ?? null);

  function onDragStart({ active }: DragStartEvent) {
    beforeDrag.current = columns;
    setActiveId(String(active.id));
  }

  // While dragging over another column, move the card there right away so the
  // column opens a gap for it.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = columnOf(active.id);
    const to = columnOf(over.id);
    if (!from || !to || from === to) return;

    setColumns((current) => {
      const overIndex = current[to].findIndex((task) => task.id === over.id);
      return moveTask(
        current,
        String(active.id),
        to,
        overIndex === -1 ? current[to].length : overIndex,
      );
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const taskId = String(active.id);
    const before = beforeDrag.current;
    beforeDrag.current = null;
    setActiveId(null);
    if (!before) return;
    if (!over) {
      setColumns(before);
      return;
    }

    // Settle the order inside the column the card ended up in.
    let next = columns;
    const here = locate(next, taskId);
    const overPlace = isStatus(over.id) ? null : locate(next, String(over.id));
    if (here && overPlace && overPlace.status === here.status) {
      next = moveTask(next, taskId, here.status, overPlace.index);
    }

    const from = locate(before, taskId);
    const to = locate(next, taskId);
    if (!from || !to) return;
    if (from.status === to.status && from.index === to.index) {
      setColumns(before);
      return;
    }

    setColumns(next);
    void saveMove(taskId, to, before);
  }

  function onDragCancel() {
    if (beforeDrag.current) setColumns(beforeDrag.current);
    beforeDrag.current = null;
    setActiveId(null);
  }

  async function saveMove(taskId: string, to: Place, rollback: Columns) {
    setSavingMoves((count) => count + 1);
    try {
      await api.tasks.update(taskId, { status: to.status, position: to.index });
    } catch (error) {
      setColumns(rollback);
      toast.error(`The move was not saved. ${errorMessage(error)}`);
    } finally {
      setSavingMoves((count) => count - 1);
      // Refresh the server-rendered data (and confirm the final order).
      router.refresh();
    }
  }

  async function deleteProject() {
    setDeleting(true);
    try {
      await api.projects.remove(project.id);
      toast.success("Project deleted.");
      router.push("/app/projects");
      router.refresh();
    } catch (error) {
      setDeleting(false);
      setDialog(null);
      toast.error(errorMessage(error));
    }
  }

  const titleOf = (id: UniqueIdentifier) => {
    const place = locate(columns, String(id));
    return place ? columns[place.status][place.index].title : "task";
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) => {
      const column = over ? columnOf(over.id) : null;
      return column
        ? `${titleOf(active.id)} is over ${STATUS_LABELS[column]}.`
        : undefined;
    },
    onDragEnd: ({ active, over }) => {
      const column = over ? columnOf(over.id) : null;
      return column
        ? `Dropped ${titleOf(active.id)} in ${STATUS_LABELS[column]}.`
        : `${titleOf(active.id)} went back to where it was.`;
    },
    onDragCancel: ({ active }) =>
      `Moving ${titleOf(active.id)} was cancelled.`,
  };

  const { total, done } = countTasks(columns);
  const activePlace = activeId ? locate(columns, activeId) : null;
  const activeTask = activePlace
    ? columns[activePlace.status][activePlace.index]
    : null;

  return (
    <>
      <Link
        href="/app/projects"
        className="mb-3 inline-flex items-center gap-1.5 rounded-control text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Projects
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <span
              aria-hidden="true"
              className={cn("size-3 shrink-0 rounded-full", PROJECT_FILL[project.color])}
            />
            <span className="break-words">{project.name}</span>
          </h1>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted">
              {project.description}
            </p>
          )}
          <p className="mt-1 text-sm text-muted">
            {total === 0
              ? "No tasks yet"
              : `${total} ${total === 1 ? "task" : "tasks"} · ${done} done`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Edit project"
            title="Edit project"
            onClick={() => setDialog({ kind: "edit-project" })}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete project"
            title="Delete project"
            onClick={() => setDialog({ kind: "delete-project" })}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="primary"
            onClick={() => setDialog({ kind: "task", status: "todo" })}
          >
            <Plus className="size-4" aria-hidden="true" />
            New task
          </Button>
        </div>
      </div>

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        accessibility={{ announcements }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        {/* Phones and tablets: one column at a time, swipe sideways.
            Wide screens: all four columns side by side.
            `relative` keeps absolutely positioned children (screen-reader-only
            text) inside the scroll area instead of widening the whole page. */}
        <div className="relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8 xl:mx-0 xl:grid xl:snap-none xl:grid-cols-4 xl:items-start xl:overflow-visible xl:px-0">
          {TASK_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={columns[status]}
              today={today}
              onAdd={() => setDialog({ kind: "task", status })}
              onOpen={(task) =>
                setDialog({ kind: "task", task, status: task.status })
              }
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            // The outer element is what the drag library measures, so the tilt
            // goes on the inner one. A rotated box would report a position a
            // pixel off and send the first arrow-key press to the wrong column.
            <div className="cursor-grabbing">
              <div className="rotate-2 rounded-control shadow-lift">
                <TaskCardView task={activeTask} today={today} />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialog?.kind === "task"}
        onClose={() => setDialog(null)}
        projectId={project.id}
        task={dialog?.kind === "task" ? dialog.task : undefined}
        defaultStatus={dialog?.kind === "task" ? dialog.status : "todo"}
        onSaved={(task) => {
          setColumns((current) => upsertTask(current, task));
          setDialog(null);
          router.refresh();
        }}
        onDeleted={(taskId) => {
          setColumns((current) => removeTask(current, taskId));
          setDialog(null);
          router.refresh();
        }}
      />

      <ProjectDialog
        open={dialog?.kind === "edit-project"}
        onClose={() => setDialog(null)}
        project={project}
        onSaved={(saved) => {
          setProject(saved);
          setDialog(null);
          router.refresh();
        }}
      />

      <Dialog
        open={dialog?.kind === "delete-project"}
        onClose={() => setDialog(null)}
        title="Delete this project?"
        description={
          total === 0
            ? `“${project.name}” will be removed. This cannot be undone.`
            : `“${project.name}” and its ${total} ${total === 1 ? "task" : "tasks"} will be removed. This cannot be undone.`
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDialog(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={deleteProject}>
            Delete project
          </Button>
        </div>
      </Dialog>
    </>
  );
}
