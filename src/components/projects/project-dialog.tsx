"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api, errorFields, errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { LIMITS, PROJECT_COLORS } from "@/lib/constants";
import { PROJECT_FILL } from "@/lib/styles";
import type { Project } from "@/lib/types";
import { fieldErrors, projectCreateSchema } from "@/lib/validation";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pass a project to edit it; leave out to create a new one. */
  project?: Project;
  onSaved: (project: Project) => void;
};

export function ProjectDialog({ open, onClose, project, onSaved }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={project ? "Edit project" : "New project"}
    >
      {/* Rendered only while open, so the form starts fresh every time. */}
      <ProjectForm project={project} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}

function ProjectForm({ project, onClose, onSaved }: Omit<Props, "open">) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const toast = useToast();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = projectCreateSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const saved = project
        ? await api.projects.update(project.id, parsed.data)
        : await api.projects.create(parsed.data);
      toast.success(project ? "Project updated." : "Project created.");
      onSaved(saved);
    } catch (error) {
      setPending(false);
      setErrors({ form: errorMessage(error), ...errorFields(error) });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label="Name"
        name="name"
        defaultValue={project?.name}
        maxLength={LIMITS.projectName}
        placeholder="Website relaunch"
        autoFocus
        error={errors.name}
      />
      <TextAreaField
        label="Description"
        name="description"
        defaultValue={project?.description}
        maxLength={LIMITS.projectDescription}
        placeholder="What is this project about?"
        hint="Optional."
        error={errors.description}
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Color</legend>
        <div className="flex flex-wrap gap-2.5">
          {PROJECT_COLORS.map((color) => (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={color === (project?.color ?? "indigo")}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "block size-8 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand",
                  PROJECT_FILL[color],
                )}
              />
              <span className="sr-only">{color}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {errors.form && (
        <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
          {errors.form}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={pending}>
          {project ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
