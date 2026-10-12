import Link from "next/link";
import {
  ArrowRight,
  Database,
  FlaskConical,
  LockKeyhole,
  Rocket,
  Smartphone,
  Workflow,
} from "lucide-react";
import { DemoButton } from "@/components/demo-button";
import { BoardPreview } from "@/components/marketing/board-preview";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";

const FEATURES = [
  {
    icon: LockKeyhole,
    title: "Accounts and sign-in",
    body: "Email and password sign-up with secure session cookies. The server checks who you are on every request.",
  },
  {
    icon: Database,
    title: "Postgres database",
    body: "Projects and tasks live in a relational schema with versioned migrations, so changes are repeatable.",
  },
  {
    icon: Workflow,
    title: "REST API",
    body: "Every action in the app goes through a JSON endpoint with input validation and clear error messages.",
  },
  {
    icon: Smartphone,
    title: "Phone to desktop",
    body: "The board shows one column at a time on a phone and all four on a wide screen. Touch, mouse and keyboard all work.",
  },
  {
    icon: FlaskConical,
    title: "Automated tests",
    body: "Tests run against a real database and prove that one user can never read or change another user's data.",
  },
  {
    icon: Rocket,
    title: "Ready to deploy",
    body: "Built for Vercel. The same code runs on your laptop with no database to install.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand">
            Demo for a Next.js full-stack build
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            A working project tracker, built end to end.
          </h1>
          <p className="mt-5 text-lg text-muted text-pretty">
            Taskline is a small but complete web app: accounts, a database, an
            API and a drag-and-drop board. It exists so you can judge the work
            by using it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <DemoButton />
            <Link href="/approach" className={buttonClasses()}>
              See how it&apos;s built
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted">
            No sign-up. You get a private workspace with sample data.
          </p>
        </div>

        <div className="mt-12 sm:mt-16">
          <BoardPreview />
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            What is in the box
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            The pieces most web applications need, each one finished rather
            than sketched.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card className="h-full p-5">
                  <span className="flex size-9 items-center justify-center rounded-control bg-brand-soft text-brand">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <h2 className="text-2xl font-semibold tracking-tight">
          See it for yourself
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Open the demo, drag a task across the board, then reload the page. It
          will still be where you left it.
        </p>
        <div className="mt-6 flex justify-center">
          <DemoButton />
        </div>
      </section>
    </>
  );
}
