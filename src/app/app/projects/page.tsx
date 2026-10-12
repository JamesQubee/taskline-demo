import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { ProgressMeter } from "@/components/dashboard/progress-meter";
import { NewProjectButton } from "@/components/projects/new-project-button";
import {
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { PROJECT_FILL } from "@/lib/styles";
import { listProjects } from "@/server/services/projects";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Each project has its own board."
        actions={<NewProjectButton />}
      />
      <Suspense fallback={<ProjectGridSkeleton />}>
        <ProjectGrid />
      </Suspense>
    </>
  );
}

async function ProjectGrid() {
  const user = await requireUser();
  const projects = await listProjects(user.id);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="size-5" aria-hidden="true" />}
        title="No projects yet"
        description="A project groups related tasks on one board. Create your first one to get started."
        action={<NewProjectButton />}
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const open = project.taskCount - project.doneCount;
        return (
          <li key={project.id}>
            <Link
              href={`/app/projects/${project.id}`}
              className="group block h-full rounded-card"
            >
              <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-lift">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-3 shrink-0 rounded-full",
                      PROJECT_FILL[project.color],
                    )}
                  />
                  <h2 className="truncate text-base font-semibold">
                    {project.name}
                  </h2>
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted">
                  {project.description || "No description."}
                </p>
                <div className="mt-auto pt-5">
                  <div className="mb-1.5 flex justify-between gap-4 text-sm text-muted">
                    <span>
                      {project.taskCount === 0
                        ? "No tasks yet"
                        : `${project.doneCount} of ${project.taskCount} done`}
                    </span>
                    {open > 0 && <span>{open} open</span>}
                  </div>
                  <ProgressMeter
                    done={project.doneCount}
                    total={project.taskCount}
                  />
                </div>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ProjectGridSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading projects"
    >
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-[168px] rounded-card" />
      ))}
    </div>
  );
}
