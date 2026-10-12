import { z } from "zod";
import {
  LIMITS,
  PROJECT_COLORS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "./constants";

// One set of schemas validates both the forms in the browser and the request
// bodies in the API, so the two can never drift apart.

const nonEmpty = <Schema extends z.ZodObject>(schema: Schema) =>
  schema.refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

const projectFields = {
  name: z
    .string()
    .trim()
    .min(1, "Give the project a name.")
    .max(LIMITS.projectName, `Keep the name under ${LIMITS.projectName} characters.`),
  description: z
    .string()
    .trim()
    .max(
      LIMITS.projectDescription,
      `Keep the description under ${LIMITS.projectDescription} characters.`,
    ),
  color: z.enum(PROJECT_COLORS),
};

export const projectCreateSchema = z.object({
  name: projectFields.name,
  description: projectFields.description.default(""),
  color: projectFields.color.default("indigo"),
});

export const projectUpdateSchema = nonEmpty(z.object(projectFields).partial());

const taskFields = {
  title: z
    .string()
    .trim()
    .min(1, "Give the task a title.")
    .max(LIMITS.taskTitle, `Keep the title under ${LIMITS.taskTitle} characters.`),
  description: z
    .string()
    .trim()
    .max(
      LIMITS.taskDescription,
      `Keep the description under ${LIMITS.taskDescription} characters.`,
    ),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.iso.date("Use a valid date.").nullable(),
};

export const taskCreateSchema = z.object({
  title: taskFields.title,
  description: taskFields.description.default(""),
  status: taskFields.status.default("todo"),
  priority: taskFields.priority.default("medium"),
  dueDate: taskFields.dueDate.default(null),
});

export const taskUpdateSchema = nonEmpty(
  z
    .object({
      ...taskFields,
      // Target index inside the status column, used when a card is dragged.
      position: z.number().int().min(0),
    })
    .partial(),
);

export type ProjectCreateInput = z.input<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type TaskCreateInput = z.input<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(60),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(LIMITS.passwordMin, `Use at least ${LIMITS.passwordMin} characters.`)
    .max(128),
});

/** Flattens a Zod error into one message per field, for display under inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "form";
    fields[key] ??= issue.message;
  }
  return fields;
}
