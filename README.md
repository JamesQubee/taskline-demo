# Taskline

A small, complete project tracker: accounts, a Postgres database, a REST API and a drag-and-drop board. Built with Next.js, React, TypeScript and Tailwind CSS.

**Live demo: https://taskline-demo.vercel.app** (click "Try the live demo", no sign-up needed)

![Board with four columns of tasks](screenshots/board.png)

| Dashboard | Board on a phone |
| --- | --- |
| ![Dashboard with task counts and progress](screenshots/dashboard.png) | <img src="screenshots/board-mobile.png" alt="Board on a 375px wide screen" width="280"> |

## What it does

- **Accounts.** Sign up and sign in with email and password. Sessions are stored in the database and carried in an HTTP-only cookie.
- **Projects and tasks.** Create, edit and delete both. Tasks have a stage, a priority and an optional due date.
- **Board.** Drag cards between columns or reorder them inside a column, by mouse, touch or keyboard. A drop shows immediately and is rolled back if the save fails.
- **Dashboard.** Open, due-this-week, overdue and completed counts, tasks by stage, progress per project and what is due next.
- **One-click demo.** "Try the live demo" creates a private workspace with sample data. No sign-up, and no visitor sees another visitor's changes. Demo workspaces are deleted after 24 hours.

## Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript, strict mode |
| Styling | Tailwind CSS 4 |
| Database | Postgres with Drizzle ORM and SQL migrations |
| Auth | Better Auth (email and password) |
| Validation | Zod, shared by forms and API |
| Drag and drop | dnd-kit |
| Tests | Vitest against in-memory Postgres |
| Hosting | Vercel with any hosted Postgres (Neon, Supabase, RDS) |

## Run it locally

Requires Node.js 22.9 or newer and pnpm. No database to install.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

Without a `DATABASE_URL`, the app runs on [PGlite](https://pglite.dev), an embedded Postgres that stores its files in `./.data`. To use a real Postgres server instead, copy `.env.example` to `.env.local` and set `DATABASE_URL`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Applies migrations, then starts the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serves the production build |
| `pnpm test` | Runs the test suite |
| `pnpm typecheck` | Generates route types and type-checks the project |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Creates a SQL migration from changes to `src/db/schema.ts` |
| `pnpm db:migrate` | Applies pending migrations |

## How it is organized

```
src/
  app/
    (marketing)/     Landing page and "How it's built"
    (auth)/          Sign-in and sign-up
    app/             The signed-in application: dashboard, projects, board
    api/             REST endpoints
  components/
    ui/              Button, form fields, dialog, toast, card
    board/           Board, column, task card, task dialog
  db/                Schema, database client, migration runner
  lib/               Code shared by browser and server: validation, types, API client
  server/
    services/        Business rules. The only code that reads or writes data
    http.ts          Session check and error format for every endpoint
drizzle/             SQL migrations
tests/               API, data isolation, board ordering and demo lifecycle
```

Requests go one way: page or endpoint, then a service function, then the database. Every service function takes the signed-in user's id and filters by it, so pages and API share one set of access rules.

Navigation and page layout are prerendered and served as static HTML. Anything that depends on the signed-in user streams in afterwards.

## API

All endpoints except `/api/demo` and `/api/health` need a session cookie.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/projects` | List projects with task counts |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects/:id` | Get one project |
| `PATCH` | `/api/projects/:id` | Update a project |
| `DELETE` | `/api/projects/:id` | Delete a project and its tasks |
| `GET` | `/api/projects/:id/tasks` | List a project's tasks |
| `POST` | `/api/projects/:id/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update a task. Send `status` and/or `position` to move it |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/dashboard` | Numbers shown on the dashboard |
| `POST` | `/api/demo` | Create a demo workspace and sign in |
| `GET` | `/api/health` | Checks that the app and database respond |
| `*` | `/api/auth/*` | Sign-up, sign-in and sign-out, provided by Better Auth |

Errors always have the same shape:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Some fields need attention.",
    "fields": { "name": "Give the project a name." }
  }
}
```

A record that belongs to another user is reported as `404`, the same as one that does not exist.

Try it from a terminal:

```bash
# Start a demo session and keep its cookie
curl -c cookies.txt -X POST http://localhost:3000/api/demo

# List the demo projects
curl -b cookies.txt http://localhost:3000/api/projects

# Create a project
curl -b cookies.txt -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "From the terminal", "color": "sky"}'
```

## Tests

```bash
pnpm test
```

The suite runs the real Route Handlers against an in-memory Postgres that is migrated with the same SQL files as production. It covers:

- requests without a session, or with a forged cookie, are rejected
- invalid input is rejected with a message per field
- one user cannot list, read, change or delete another user's projects and tasks
- cards keep the right order when moved inside a column and between columns
- demo workspaces are seeded per visitor, isolated from each other, and purged after a day

To run the same suite through the production database driver, point it at a Postgres server. Use a scratch database, because the tests create accounts and delete demo accounts:

```bash
TEST_DATABASE_URL=postgres://user:password@localhost:5432/taskline_test pnpm test --no-file-parallelism
```

## Deploy to Vercel

1. Import the repository in Vercel.
2. Add a Postgres database. In the Vercel dashboard, **Storage → Create → Neon** sets `DATABASE_URL` for you. Use the pooled connection string if you set it by hand.
3. Add `BETTER_AUTH_SECRET`. Generate a value with `openssl rand -base64 32`.
4. Deploy. `vercel.json` runs the database migrations before each build.

Optional variables:

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_URL` | Public URL of the app. Only needed on a custom domain |
| `NEXT_PUBLIC_AUTHOR_NAME`, `NEXT_PUBLIC_AUTHOR_URL` | Credit shown in the site footer |
| `NEXT_PUBLIC_REPO_URL` | "Source code" link in the site footer, and links from the file paths on the "How it's built" page |

## Not included

Left out on purpose to keep the project small:

- teams, invitations and roles
- password reset and email verification, which need an email provider
- live updates between two open browsers
- a dark theme
