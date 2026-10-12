import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { project, task, user } from "@/db/schema";
import type {
  ProjectColor,
  TaskPriority,
  TaskStatus,
} from "@/lib/constants";
import { getAuth } from "@/lib/auth";
import { addDays, todayIso } from "@/lib/dates";
import { rateLimited } from "../errors";

// "Try the live demo" gives every visitor a private workspace: a throwaway
// account with sample data. Nobody sees what another visitor changed, and the
// accounts are purged a day later.

const DEMO_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_NEW_DEMOS_PER_MINUTE = 20;

type SeedTask = {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Due date as an offset in days from today; omitted for no due date. */
  due?: number;
  description?: string;
};

type SeedProject = {
  name: string;
  description: string;
  color: ProjectColor;
  tasks: SeedTask[];
};

const SEED: SeedProject[] = [
  {
    name: "Website relaunch",
    description: "New marketing site, built mobile-first and shipped in stages.",
    color: "indigo",
    tasks: [
      { title: "Audit current pages and traffic", status: "done", priority: "medium", due: -9 },
      { title: "Agree on sitemap with stakeholders", status: "done", priority: "high", due: -6 },
      { title: "Design system: colors, type, spacing", status: "done", priority: "medium", due: -4 },
      {
        title: "Build homepage and pricing page",
        status: "in_progress",
        priority: "high",
        due: 2,
        description: "Hero, feature grid, pricing table and FAQ. Check both at 375px and 1440px.",
      },
      { title: "Connect contact form to CRM", status: "in_progress", priority: "medium", due: -1 },
      { title: "Write copy for the About page", status: "todo", priority: "low", due: 5 },
      { title: "Set up redirects from old URLs", status: "todo", priority: "high", due: 6 },
      { title: "Accessibility pass (keyboard, contrast)", status: "todo", priority: "medium", due: 9 },
      { title: "Add a blog", status: "backlog", priority: "low" },
      { title: "Localize for German market", status: "backlog", priority: "low" },
    ],
  },
  {
    name: "Mobile app v2",
    description: "Offline mode, faster sync and a redesigned onboarding flow.",
    color: "emerald",
    tasks: [
      { title: "Interview five active users", status: "done", priority: "medium", due: -12 },
      { title: "Prototype new onboarding", status: "done", priority: "high", due: -3 },
      { title: "Offline queue for edits", status: "in_progress", priority: "high", due: 4 },
      { title: "Fix crash on image upload", status: "todo", priority: "high", due: 0 },
      { title: "Push notification settings screen", status: "todo", priority: "medium", due: 11 },
      { title: "Dark theme", status: "backlog", priority: "low" },
      { title: "Tablet layout", status: "backlog", priority: "medium" },
    ],
  },
  {
    name: "Q3 hiring",
    description: "Two engineers and one designer by the end of the quarter.",
    color: "amber",
    tasks: [
      { title: "Publish job descriptions", status: "done", priority: "high", due: -14 },
      { title: "Screen inbound applications", status: "in_progress", priority: "medium", due: 1 },
      { title: "Schedule final-round interviews", status: "todo", priority: "high", due: 3 },
      { title: "Prepare onboarding checklist", status: "backlog", priority: "low", due: 20 },
    ],
  },
];

async function seedWorkspace(userId: string): Promise<void> {
  const db = await getDb();
  const today = todayIso();

  await db.transaction(async (tx) => {
    for (const [index, seed] of SEED.entries()) {
      const [created] = await tx
        .insert(project)
        .values({
          ownerId: userId,
          name: seed.name,
          description: seed.description,
          color: seed.color,
          // Projects are listed newest first; stagger them to keep this order.
          createdAt: new Date(Date.now() - index * 60_000),
        })
        .returning({ id: project.id });

      const nextPosition: Partial<Record<TaskStatus, number>> = {};
      await tx.insert(task).values(
        seed.tasks.map((item) => {
          const position = nextPosition[item.status] ?? 0;
          nextPosition[item.status] = position + 1;
          return {
            projectId: created.id,
            title: item.title,
            description: item.description ?? "",
            status: item.status,
            priority: item.priority,
            dueDate: item.due === undefined ? null : addDays(today, item.due),
            position,
          };
        }),
      );
    }
  });
}

/** Removes demo accounts older than a day. Their data goes with them. */
export async function purgeExpiredDemos(now: Date = new Date()): Promise<number> {
  const db = await getDb();
  const removed = await db
    .delete(user)
    .where(
      and(
        eq(user.isDemo, true),
        lt(user.createdAt, new Date(now.getTime() - DEMO_TTL_MS)),
      ),
    )
    .returning({ id: user.id });
  return removed.length;
}

/**
 * Creates a demo account with sample data and signs it in.
 * Returns the `Set-Cookie` headers that carry the new session.
 */
export async function createDemoWorkspace(): Promise<{
  userId: string;
  cookies: string[];
}> {
  const db = await getDb();
  // No scheduler needed: each new demo cleans up the expired ones first.
  await purgeExpiredDemos();

  const [{ recent }] = await db
    .select({ recent: count() })
    .from(user)
    .where(
      and(eq(user.isDemo, true), gt(user.createdAt, new Date(Date.now() - 60_000))),
    );
  if (recent >= MAX_NEW_DEMOS_PER_MINUTE) {
    throw rateLimited("The demo is busy right now. Try again in a minute.");
  }

  const auth = await getAuth();
  const { headers, response } = await auth.api.signUpEmail({
    body: {
      name: "Demo User",
      email: `demo-${randomUUID()}@taskline.invalid`,
      // Never shown or reused: the account is only reachable through its cookie.
      password: randomBytes(24).toString("base64url"),
    },
    returnHeaders: true,
  });
  const userId = response.user.id;

  await db.update(user).set({ isDemo: true }).where(eq(user.id, userId));
  await seedWorkspace(userId);

  return { userId, cookies: headers.getSetCookie() };
}
