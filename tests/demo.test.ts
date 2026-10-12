import { describe, expect, it } from "vitest";
import * as demoRoute from "@/app/api/demo/route";
import * as projectsRoute from "@/app/api/projects/route";
import type { ProjectSummary } from "@/lib/types";
import { getDashboard } from "@/server/services/dashboard";
import { createDemoWorkspace, purgeExpiredDemos } from "@/server/services/demo";
import { listProjects } from "@/server/services/projects";
import { createUser, noParams, request, toCookieHeader } from "./helpers";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("demo workspace", () => {
  it("signs the visitor in through the public endpoint", async () => {
    const response = await demoRoute.POST();
    expect(response.status).toBe(201);

    const cookie = toCookieHeader(response.headers.getSetCookie());
    const projects: ProjectSummary[] = await (
      await projectsRoute.GET(
        request("GET", "/api/projects", { cookie }),
        noParams,
      )
    ).json();

    expect(projects.map((project) => project.name)).toEqual([
      "Website relaunch",
      "Mobile app v2",
      "Q3 hiring",
    ]);
  });

  it("gives each visitor their own data", async () => {
    const first = await createDemoWorkspace();
    const second = await createDemoWorkspace();
    const regular = await createUser();

    const [firstProjects, secondProjects] = await Promise.all([
      listProjects(first.userId),
      listProjects(second.userId),
    ]);

    expect(firstProjects).toHaveLength(3);
    expect(secondProjects).toHaveLength(3);
    const firstIds = new Set(firstProjects.map((project) => project.id));
    expect(secondProjects.some((project) => firstIds.has(project.id))).toBe(false);
    expect(await listProjects(regular.id)).toEqual([]);
  });

  it("seeds a dashboard with work in every state", async () => {
    const { userId } = await createDemoWorkspace();
    const dashboard = await getDashboard(userId);

    expect(dashboard.total).toBe(21);
    expect(dashboard.byStatus).toEqual({
      backlog: 5,
      todo: 6,
      in_progress: 4,
      done: 6,
    });
    // "Connect contact form to CRM" is the one open task dated yesterday.
    expect(dashboard.overdue).toBe(1);
    expect(dashboard.dueSoon).toBe(7);
    expect(dashboard.upcoming[0]).toMatchObject({
      title: "Connect contact form to CRM",
      projectName: "Website relaunch",
    });
  });

  it("purges demo accounts after a day and keeps regular ones", async () => {
    const { userId } = await createDemoWorkspace();
    const regular = await createUser();

    expect(await purgeExpiredDemos()).toBe(0);
    expect(await listProjects(userId)).toHaveLength(3);

    const tomorrow = new Date(Date.now() + DAY_MS + 60_000);
    expect(await purgeExpiredDemos(tomorrow)).toBeGreaterThanOrEqual(1);

    // Projects and tasks are removed with the account.
    expect(await listProjects(userId)).toEqual([]);
    expect((await getDashboard(userId)).total).toBe(0);
    // The regular account and its session are untouched.
    const response = await projectsRoute.GET(
      request("GET", "/api/projects", { cookie: regular.cookie }),
      noParams,
    );
    expect(response.status).toBe(200);
  });
});
