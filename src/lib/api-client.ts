import { reloadTo } from "./navigation";
import type { ApiErrorBody, Project, Task } from "./types";
import type {
  ProjectCreateInput,
  ProjectUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
} from "./validation";

/** A failed API call, carrying the message and field errors the server sent. */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError(
      0,
      "network_error",
      "Could not reach the server. Check your connection and try again.",
    );
  }

  if (response.status === 401) {
    // The session ended in another tab or expired: start over at sign-in.
    reloadTo("/sign-in");
  }
  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    throw new ApiClientError(
      response.status,
      error?.code ?? "unknown",
      error?.message ?? "Something went wrong. Try again.",
      error?.fields,
    );
  }
  return data as T;
}

/** Typed wrapper around the REST API. The only place the UI builds URLs. */
export const api = {
  projects: {
    create: (input: ProjectCreateInput) =>
      send<Project>("POST", "/api/projects", input),
    update: (id: string, input: ProjectUpdateInput) =>
      send<Project>("PATCH", `/api/projects/${id}`, input),
    remove: (id: string) => send<void>("DELETE", `/api/projects/${id}`),
  },
  tasks: {
    create: (projectId: string, input: TaskCreateInput) =>
      send<Task>("POST", `/api/projects/${projectId}/tasks`, input),
    update: (id: string, input: TaskUpdateInput) =>
      send<Task>("PATCH", `/api/tasks/${id}`, input),
    remove: (id: string) => send<void>("DELETE", `/api/tasks/${id}`),
  },
  demo: {
    start: () => send<{ ok: true }>("POST", "/api/demo"),
  },
};

export function errorMessage(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "Something went wrong. Try again.";
}

export function errorFields(error: unknown): Record<string, string> {
  return error instanceof ApiClientError ? error.fields : {};
}
