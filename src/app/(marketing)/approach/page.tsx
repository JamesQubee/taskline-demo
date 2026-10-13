import type { Metadata } from "next";
import { ArrowDown } from "lucide-react";
import { DemoButton } from "@/components/demo-button";
import { Card } from "@/components/ui/primitives";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it's built",
  description:
    "What the job post asked for, where each item is in this demo, and how the real project would be run.",
};

const REQUIREMENTS = [
  {
    asked: "A responsive web app with Next.js, React and TypeScript",
    built: "Next.js 16 with the App Router, React 19, and TypeScript in strict mode throughout.",
    where: ["src/app/"],
  },
  {
    asked: "A clean interface with Tailwind CSS",
    built: "Tailwind CSS 4 with one set of brand tokens. Change the colors in one file and the whole app follows.",
    where: ["src/app/globals.css"],
  },
  {
    asked: "Core features and reusable components",
    built: "Buttons, form fields, dialogs and notifications are written once and reused on every screen.",
    where: ["src/components/ui/"],
  },
  {
    asked: "Backend APIs and a database",
    built: "REST endpoints backed by Postgres. Every schema change is a SQL migration kept in the repository.",
    where: ["src/app/api/", "src/db/"],
  },
  {
    asked: "User authentication",
    built: "Email and password accounts with session cookies. Access is enforced next to the data, not only in the interface.",
    where: ["src/lib/auth.ts", "src/server/"],
  },
  {
    asked: "Works on desktop and mobile",
    built: "Layouts are designed for phones first. The board works by touch, mouse and keyboard.",
    where: ["src/components/board/"],
  },
  {
    asked: "Deployed to Vercel",
    built: "Deployed from the repository. Database migrations run as part of every deploy.",
    where: ["vercel.json"],
  },
  {
    asked: "Clean, maintainable code",
    built: "Business rules live in one layer shared by pages and the API, covered by automated tests.",
    where: ["src/server/services/", "tests/"],
  },
];

const DECISIONS = [
  {
    title: "One place for the rules",
    body: "Pages and API endpoints call the same service functions. Each one takes the signed-in user's id and filters by it, so there is no route to the data that skips the check.",
  },
  {
    title: "One definition of valid input",
    body: "The same schema validates a form in the browser and the request on the server. The two cannot drift apart.",
  },
  {
    title: "The frame loads first",
    body: "Navigation and page layout are prepared ahead of time and appear immediately. Personal data streams in a moment later instead of holding up the whole page.",
  },
  {
    title: "Nothing to install",
    body: "Without a database address the app runs on an embedded Postgres, so anyone can clone it and start it with one command. Production uses hosted Postgres with the same SQL.",
  },
];

const STEPS = [
  {
    title: "Agree on the first version in writing",
    body: "A short list of screens and features, and an equally clear list of what waits for later. This is the scope we both work from.",
  },
  {
    title: "Put a live URL up at the start",
    body: "An almost empty but real deployment, so you follow progress by clicking through the app rather than reading status reports.",
  },
  {
    title: "Build one complete slice at a time",
    body: "Each feature is finished across database, API and interface before the next begins, and is deployed for you to try.",
  },
  {
    title: "Hand everything over",
    body: "The repository, setup instructions, documented environment variables and passing tests. You own all of it.",
  },
];

const LEFT_OUT = [
  "Teams, invitations and roles",
  "Password reset and email verification, which need an email provider",
  "Live updates between two open browsers",
  "A dark theme",
];

/** A file or folder path. Opens that place in the repository when one is set. */
function SourcePath({ path }: { path: string }) {
  const className =
    "rounded bg-sunken px-1.5 py-0.5 font-mono text-xs break-all";
  if (!site.repoUrl) return <code className={className}>{path}</code>;

  // GitHub shows folders under /tree and single files under /blob.
  const view = path.endsWith("/") ? "tree" : "blob";
  return (
    <a
      href={`${site.repoUrl}/${view}/main/${path}`}
      className={`${className} text-brand-strong underline decoration-line-strong underline-offset-2 hover:decoration-brand`}
    >
      {path}
    </a>
  );
}

function Layer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3 text-center shadow-card">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-sm text-muted">{children}</p>
    </div>
  );
}

function Flow() {
  return (
    <div className="flex justify-center py-1.5 text-subtle" aria-hidden="true">
      <ArrowDown className="size-4" />
    </div>
  );
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 sm:mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function ApproachPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          How this demo is built, and how I would build yours
        </h1>
        <p className="mt-4 text-lg text-muted text-pretty">
          The job post lists what the application needs. This page shows where
          each item is in the demo, the decisions behind it, and how the real
          project would run.
        </p>
      </div>

      <Section title="What you asked for, and where it is">
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_1.5fr_1fr] gap-6 border-b border-line bg-sunken px-5 py-2.5 text-xs font-semibold tracking-wide text-muted uppercase md:grid">
            <span>From the job post</span>
            <span>In this demo</span>
            <span>Where to look</span>
          </div>
          <ul className="divide-y divide-line">
            {REQUIREMENTS.map(({ asked, built, where }) => (
              <li
                key={asked}
                className="grid gap-x-6 gap-y-1.5 px-5 py-4 md:grid-cols-[1fr_1.5fr_1fr]"
              >
                <p className="font-medium">{asked}</p>
                <p className="text-sm text-muted md:text-base">{built}</p>
                <p className="flex flex-wrap gap-1.5 self-start">
                  {where.map((path) => (
                    <SourcePath key={path} path={path} />
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section
        title="How the pieces fit"
        intro="Requests travel down through four layers. Each layer has one job."
      >
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div>
            <Layer title="Browser">Pages, forms and the drag-and-drop board</Layer>
            <Flow />
            <Layer title="Next.js on Vercel">
              Server-rendered pages and the REST API
            </Layer>
            <Flow />
            <Layer title="Service layer">
              Business rules and ownership checks
            </Layer>
            <Flow />
            <Layer title="Postgres">Users, projects and tasks</Layer>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2">
            {DECISIONS.map(({ title, body }) => (
              <li key={title}>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section
        title="How I would run your project"
        intro="The same steps whether the application is a tracker like this one or something else entirely."
      >
        <ol className="grid gap-4 sm:grid-cols-2">
          {STEPS.map(({ title, body }, index) => (
            <li key={title}>
              <Card className="h-full p-5">
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong"
                >
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        title="What this demo leaves out"
        intro="These are deliberate omissions that keep the demo small. Which of them your application needs is part of the scope conversation."
      >
        <ul className="list-disc space-y-1.5 pl-5 text-muted marker:text-subtle">
          {LEFT_OUT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <div className="mt-14 flex flex-wrap items-center gap-4 rounded-card bg-brand-soft p-6 sm:mt-20">
        <p className="min-w-0 flex-1 basis-64 font-medium">
          The quickest way to judge all of this is to use the app.
        </p>
        <DemoButton />
      </div>
    </div>
  );
}
