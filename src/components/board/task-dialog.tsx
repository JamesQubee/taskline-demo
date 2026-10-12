"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api, errorFields, errorMessage } from "@/lib/api-client";
import {
  LIMITS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/constants";
import type { Task } from "@/lib/types";
import { fieldErrors, taskCreateSchema } from "@/lib/validation";

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  /** Pass a task to edit it; leave out to create a new one. */
  task?: Task;
  /** Column a new task starts in. */
  defaultStatus: TaskStatus;
  onSaved: (task: Task) => void;
  onDeleted: (taskId: string) => void;
};

export function TaskDialog({ open, onClose, task, ...rest }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? "Edit task" : "New task"}
    >
      {/* Rendered only while open, so the form starts fresh every time. */}
      <TaskForm task={task} onClose={onClose} {...rest} />
    </Dialog>
  );
}

function TaskForm({
  onClose,
  projectId,
  task,
  defaultStatus,
  onSaved,
  onDeleted,
}: Omit<Props, "open">) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const toast = useToast();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = taskCreateSchema.safeParse({
      ...form,
      // An empty date input means "no due date".
      dueDate: form.dueDate || null,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setPending("save");
    try {
      const saved = task
        ? await api.tasks.update(task.id, parsed.data)
        : await api.tasks.create(projectId, parsed.data);
      toast.success(task ? "Task updated." : "Task added.");
      onSaved(saved);
    } catch (error) {
      setPending(null);
      setErrors({ form: errorMessage(error), ...errorFields(error) });
    }
  }

  async function onDelete() {
    if (!task) return;
    setPending("delete");
    try {
      await api.tasks.remove(task.id);
      toast.success("Task deleted.");
      onDeleted(task.id);
    } catch (error) {
      setPending(null);
      setConfirmingDelete(false);
      setErrors({ form: errorMessage(error) });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label="Title"
        name="title"
        defaultValue={task?.title}
        maxLength={LIMITS.taskTitle}
        placeholder="What needs to be done?"
        autoFocus
        error={errors.title}
      />
      <TextAreaField
        label="Description"
        name="description"
        defaultValue={task?.description}
        maxLength={LIMITS.taskDescription}
        hint="Optional."
        error={errors.description}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Stage"
          name="status"
          defaultValue={task?.status ?? defaultStatus}
          error={errors.status}
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Priority"
          name="priority"
          defaultValue={task?.priority ?? "medium"}
          error={errors.priority}
        >
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Due date"
          name="dueDate"
          type="date"
          defaultValue={task?.dueDate ?? ""}
          error={errors.dueDate}
        />
      </div>

      {errors.form && (
        <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
          {errors.form}
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-2">
        {task &&
          (confirmingDelete ? (
            <>
              <Button
                variant="danger"
                loading={pending === "delete"}
                onClick={onDelete}
              >
                Delete for good
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Keep it
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
              disabled={pending !== null}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          ))}

        {!confirmingDelete && (
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={pending === "save"}
              disabled={pending !== null}
            >
              {task ? "Save changes" : "Add task"}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
