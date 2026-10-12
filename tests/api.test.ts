import { beforeAll, describe, expect, it } from "vitest";
import * as projectRoute from "@/app/api/projects/[id]/route";
import * as projectTasksRoute from "@/app/api/projects/[id]/tasks/route";
import * as projectsRoute from "@/app/api/projects/route";
import * as taskRoute from "@/app/api/tasks/[id]/route";
import type { Project, ProjectSummary, Task } from "@/lib/types";
import { createUser, noParams, params, request } from "./helpers";

type User = Awaited<ReturnType<typeof createUser>>;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

async function createProject(user: User, name = "Launch"): Promise<Project> {
  const response = await projectsRoute.POST(
    request("POST", "/api/projects", { cookie: user.cookie, body: { name } }),
    noParams,
  );
  expect(response.status).toBe(201);
  return response.json();
}

async function createTask(
  user: User,
  projectId: string,
  body: Record<string, unknown>,
): Promise<Task> {
  const response = await projectTasksRoute.POST(
    request("POST", `/api/projects/${projectId}/tasks`, {
      cookie: user.cookie,
      body,
    }),
    params({ id: projectId }),
  );
  expect(response.status).toBe(201);
  return response.json();
}

async function moveTask(
  user: User,
  taskId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return taskRoute.PATCH(
    request("PATCH", `/api/tasks/${taskId}`, { cookie: user.cookie, body }),
    params({ id: taskId }),
  );
}

async function boardOrder(user: User, projectId: string) {
  const response = await projectTasksRoute.GET(
    request("GET", `/api/projects/${projectId}/tasks`, { cookie: user.cookie }),
    params({ id: projectId }),
  );
  const tasks: Task[] = await response.json();
  const titles = (status: Task["status"]) =>
    tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position)
      .map((task) => task.title);
  return { todo: titles("todo"), in_progress: titles("in_progress") };
}

describe("authentication", () => {
  it("rejects requests without a session", async () => {
    const response = await projectsRoute.GET(
      request("GET", "/api/projects"),
      noParams,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: "unauthorized" },
    });
  });

  it("rejects a forged session cookie", async () => {
    const response = await projectsRoute.GET(
      request("GET", "/api/projects", {
        cookie: "better-auth.session_token=forged.signature",
      }),
      noParams,
    );

    expect(response.status).toBe(401);
  });
});

describe("validation", () => {
  let user: User;
  beforeAll(async () => {
    user = await createUser();
  });

  it("reports which field is wrong", async () => {
    const response = await projectsRoute.POST(
      request("POST", "/api/projects", {
        cookie: user.cookie,
        body: { name: "   ", color: "neon" },
      }),
      noParams,
    );

    expect(response.status).toBe(400);
    const { error } = await response.json();
    expect(error.code).toBe("validation_error");
    expect(Object.keys(error.fields).sort()).toEqual(["color", "name"]);
  });

  it("rejects a body that is not JSON", async () => {
    const response = await projectsRoute.POST(
      request("POST", "/api/projects", {
        cookie: user.cookie,
        rawBody: "{not json",
      }),
      noParams,
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("invalid_json");
  });

  it("rejects an update with no fields", async () => {
    const project = await createProject(user);
    const response = await projectRoute.PATCH(
      request("PATCH", `/api/projects/${project.id}`, {
        cookie: user.cookie,
        body: {},
      }),
      params({ id: project.id }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects an impossible due date", async () => {
    const project = await createProject(user);
    const response = await projectTasksRoute.POST(
      request("POST", `/api/projects/${project.id}/tasks`, {
        cookie: user.cookie,
        body: { title: "Ship", dueDate: "2026-02-31" },
      }),
      params({ id: project.id }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.fields).toHaveProperty("dueDate");
  });

  it("treats a malformed id as not found", async () => {
    const response = await projectRoute.GET(
      request("GET", "/api/projects/not-a-uuid", { cookie: user.cookie }),
      params({ id: "not-a-uuid" }),
    );

    expect(response.status).toBe(404);
  });
});

describe("projects", () => {
  it("creates, lists, updates and deletes", async () => {
    const user = await createUser();
    const project = await createProject(user, "  Website  ");
    expect(project).toMatchObject({ name: "Website", color: "indigo" });

    await createTask(user, project.id, { title: "One", status: "done" });
    await createTask(user, project.id, { title: "Two" });

    const list: ProjectSummary[] = await (
      await projectsRoute.GET(
        request("GET", "/api/projects", { cookie: user.cookie }),
        noParams,
      )
    ).json();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: project.id, taskCount: 2, doneCount: 1 });

    const updated = await projectRoute.PATCH(
      request("PATCH", `/api/projects/${project.id}`, {
        cookie: user.cookie,
        body: { color: "rose" },
      }),
      params({ id: project.id }),
    );
    expect(await updated.json()).toMatchObject({ name: "Website", color: "rose" });

    const deleted = await projectRoute.DELETE(
      request("DELETE", `/api/projects/${project.id}`, { cookie: user.cookie }),
      params({ id: project.id }),
    );
    expect(deleted.status).toBe(204);

    const gone = await projectRoute.GET(
      request("GET", `/api/projects/${project.id}`, { cookie: user.cookie }),
      params({ id: project.id }),
    );
    expect(gone.status).toBe(404);
  });

  it("returns 404 for an id that does not exist", async () => {
    const user = await createUser();
    const response = await projectRoute.GET(
      request("GET", `/api/projects/${MISSING_ID}`, { cookie: user.cookie }),
      params({ id: MISSING_ID }),
    );

    expect(response.status).toBe(404);
  });
});

describe("data isolation between users", () => {
  let owner: User;
  let intruder: User;
  let project: Project;
  let task: Task;

  beforeAll(async () => {
    owner = await createUser("Owner");
    intruder = await createUser("Intruder");
    project = await createProject(owner, "Private");
    task = await createTask(owner, project.id, { title: "Secret" });
  });

  it("hides another user's projects from the list", async () => {
    const response = await projectsRoute.GET(
      request("GET", "/api/projects", { cookie: intruder.cookie }),
      noParams,
    );

    expect(await response.json()).toEqual([]);
  });

  it.each([
    ["read the project", () =>
      projectRoute.GET(
        request("GET", `/api/projects/${project.id}`, { cookie: intruder.cookie }),
        params({ id: project.id }),
      )],
    ["rename the project", () =>
      projectRoute.PATCH(
        request("PATCH", `/api/projects/${project.id}`, {
          cookie: intruder.cookie,
          body: { name: "Hijacked" },
        }),
        params({ id: project.id }),
      )],
    ["delete the project", () =>
      projectRoute.DELETE(
        request("DELETE", `/api/projects/${project.id}`, { cookie: intruder.cookie }),
        params({ id: project.id }),
      )],
    ["list its tasks", () =>
      projectTasksRoute.GET(
        request("GET", `/api/projects/${project.id}/tasks`, { cookie: intruder.cookie }),
        params({ id: project.id }),
      )],
    ["add a task to it", () =>
      projectTasksRoute.POST(
        request("POST", `/api/projects/${project.id}/tasks`, {
          cookie: intruder.cookie,
          body: { title: "Planted" },
        }),
        params({ id: project.id }),
      )],
    ["edit a task", () => moveTask(intruder, task.id, { title: "Hijacked" })],
    ["delete a task", () =>
      taskRoute.DELETE(
        request("DELETE", `/api/tasks/${task.id}`, { cookie: intruder.cookie }),
        params({ id: task.id }),
      )],
  ])("another user cannot %s", async (_action, attempt) => {
    const response = await attempt();
    expect(response.status).toBe(404);
  });

  it("leaves the owner's data untouched after those attempts", async () => {
    const stored: Project = await (
      await projectRoute.GET(
        request("GET", `/api/projects/${project.id}`, { cookie: owner.cookie }),
        params({ id: project.id }),
      )
    ).json();
    expect(stored.name).toBe("Private");

    const tasks: Task[] = await (
      await projectTasksRoute.GET(
        request("GET", `/api/projects/${project.id}/tasks`, { cookie: owner.cookie }),
        params({ id: project.id }),
      )
    ).json();
    expect(tasks.map((item) => item.title)).toEqual(["Secret"]);
  });
});

describe("board ordering", () => {
  let user: User;
  let project: Project;
  let a: Task;
  let b: Task;
  let c: Task;

  beforeAll(async () => {
    user = await createUser();
    project = await createProject(user, "Board");
    a = await createTask(user, project.id, { title: "A" });
    b = await createTask(user, project.id, { title: "B" });
    c = await createTask(user, project.id, { title: "C" });
  });

  it("appends new tasks to the bottom of their column", async () => {
    expect([a.position, b.position, c.position]).toEqual([0, 1, 2]);
    expect(await boardOrder(user, project.id)).toEqual({
      todo: ["A", "B", "C"],
      in_progress: [],
    });
  });

  it("reorders a card inside its column", async () => {
    const response = await moveTask(user, c.id, { position: 0 });

    expect(response.status).toBe(200);
    expect((await boardOrder(user, project.id)).todo).toEqual(["C", "A", "B"]);
  });

  it("moves a card to the end of another column when no position is given", async () => {
    await createTask(user, project.id, { title: "D", status: "in_progress" });
    await moveTask(user, a.id, { status: "in_progress" });

    expect(await boardOrder(user, project.id)).toEqual({
      todo: ["C", "B"],
      in_progress: ["D", "A"],
    });
  });

  it("drops a card at a specific place in another column", async () => {
    await moveTask(user, b.id, { status: "in_progress", position: 1 });

    expect(await boardOrder(user, project.id)).toEqual({
      todo: ["C"],
      in_progress: ["D", "B", "A"],
    });
  });

  it("clamps a position past the end of the column", async () => {
    const response = await moveTask(user, b.id, { position: 99 });

    expect((await response.json()).position).toBe(2);
    expect((await boardOrder(user, project.id)).in_progress).toEqual(["D", "A", "B"]);
  });

  it("keeps the order when only other fields change", async () => {
    const response = await moveTask(user, a.id, {
      title: "A, renamed",
      priority: "high",
      dueDate: "2030-01-15",
    });

    expect(await response.json()).toMatchObject({
      title: "A, renamed",
      priority: "high",
      dueDate: "2030-01-15",
      status: "in_progress",
    });
    expect((await boardOrder(user, project.id)).in_progress).toEqual([
      "D",
      "A, renamed",
      "B",
    ]);
  });
});
