import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleAlert, FolderKanban, Info } from "lucide-react";
import { ProgressMeter } from "@/components/dashboard/progress-meter";
import { StatusBreakdown } from "@/components/dashboard/status-breakdown";
import { DueBadge } from "@/components/due-badge";
import { NewProjectButton } from "@/components/projects/new-project-button";
import {
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { todayIso } from "@/lib/dates";
import { PROJECT_FILL } from "@/lib/styles";
import { getDashboard } from "@/server/services/dashboard";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Where things stand across all your projects."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: React.ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 min-h-4 text-xs text-muted">{note}</p>
    </Card>
  );
}

async function DashboardContent() {
  const user = await requireUser();
  const today = todayIso();
  const data = await getDashboard(user.id, today);

  if (data.projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="size-5" aria-hidden="true" />}
        title="No projects yet"
        description="Create a project to start adding tasks. Your numbers will show up here."
        action={<NewProjectButton />}
      />
    );
  }

  const open = data.total - data.byStatus.done;
  const donePercent =
    data.total === 0 ? 0 : Math.round((data.byStatus.done / data.total) * 100);

  return (
    <div className="flex flex-col gap-6">
      {user.isDemo && (
        <p className="flex items-start gap-2.5 rounded-card border border-line bg-brand-soft px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <span>
            This is your private demo workspace with sample data. Change
            anything you like. It is deleted after 24 hours.
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Open tasks"
          value={open}
          note={`${data.byStatus.in_progress} in progress`}
        />
        <StatTile label="Due this week" value={data.dueSoon} note="Next 7 days" />
        <StatTile
          label="Overdue"
          value={data.overdue}
          note={
            data.overdue > 0 ? (
              <span className="inline-flex items-center gap-1 font-medium text-danger">
                <CircleAlert className="size-3" aria-hidden="true" />
                Needs attention
              </span>
            ) : (
              "Nothing is late"
            )
          }
        />
        <StatTile
          label="Completed"
          value={data.byStatus.done}
          note={`${donePercent}% of all tasks`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold">Tasks by stage</h2>
            <StatusBreakdown byStatus={data.byStatus} total={data.total} />
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold">Project progress</h2>
              <Link
                href="/app/projects"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                All projects
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <ul className="flex flex-col gap-4">
              {data.projects.map((project) => (
                <li key={project.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <Link
                      href={`/app/projects/${project.id}`}
                      className="flex min-w-0 items-center gap-2 text-sm font-medium hover:underline"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          PROJECT_FILL[project.color],
                        )}
                      />
                      <span className="truncate">{project.name}</span>
                    </Link>
                    <span className="shrink-0 text-sm text-muted">
                      {project.doneCount} of {project.taskCount} done
                    </span>
                  </div>
                  <ProgressMeter
                    done={project.doneCount}
                    total={project.taskCount}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Up next</h2>
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-muted">
              No open tasks have a due date. Add one to a task to see it here.
            </p>
          ) : (
            <ul className="-my-3 divide-y divide-line">
              {data.upcoming.map((task) => (
                <li key={task.id} className="py-3">
                  <Link
                    href={`/app/projects/${task.projectId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {task.title}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <DueBadge dueDate={task.dueDate!} today={today} />
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          PROJECT_FILL[task.projectColor],
                        )}
                      />
                      <span className="truncate">{task.projectName}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-card" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
        <Skeleton className="h-96 rounded-card lg:col-span-2" />
      </div>
    </div>
  );
}
