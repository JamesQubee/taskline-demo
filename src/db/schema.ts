import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  PROJECT_COLORS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "../lib/constants";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

// --- Auth tables -----------------------------------------------------------
// Shape required by Better Auth. Property names must match its field names;
// column names are free to follow the database convention.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Set only by the server for throwaway demo workspaces, so they can be purged.
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// --- Application tables ----------------------------------------------------

export const taskStatus = pgEnum("task_status", TASK_STATUSES);
export const taskPriority = pgEnum("task_priority", TASK_PRIORITIES);
export const projectColor = pgEnum("project_color", PROJECT_COLORS);

export const project = pgTable(
  "project",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    color: projectColor("color").notNull().default("indigo"),
    ...timestamps,
  },
  (t) => [index("project_owner_id_idx").on(t.ownerId)],
);

export const task = pgTable(
  "task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: taskStatus("status").notNull().default("todo"),
    priority: taskPriority("priority").notNull().default("medium"),
    // Calendar date without a time zone, stored and returned as YYYY-MM-DD.
    dueDate: date("due_date", { mode: "string" }),
    // Zero-based order of the task inside its status column.
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("task_board_idx").on(t.projectId, t.status, t.position)],
);

export type ProjectRow = typeof project.$inferSelect;
export type TaskRow = typeof task.$inferSelect;
