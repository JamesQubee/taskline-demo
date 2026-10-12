import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Board } from "@/components/board/board";
import { Skeleton } from "@/components/ui/primitives";
import { todayIso } from "@/lib/dates";
import { AppError } from "@/server/errors";
import { parseId } from "@/server/http";
import { getProject } from "@/server/services/projects";
import { listTasks } from "@/server/services/tasks";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Board" };

export default function ProjectPage({
  params,
}: PageProps<"/app/projects/[id]">) {
  return (
    <Suspense fallback={<BoardSkeleton />}>
      <ProjectBoard params={params} />
    </Suspense>
  );
}

async function ProjectBoard({
  params,
}: Pick<PageProps<"/app/projects/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser();

  const board = await loadBoard(user.id, id);
  if (!board) notFound();

  return (
    <Board project={board.project} tasks={board.tasks} today={todayIso()} />
  );
}

/** Returns null when the project is missing, malformed, or someone else's. */
async function loadBoard(userId: string, rawId: string) {
  try {
    const projectId = parseId(rawId, "Project");
    const [project, tasks] = await Promise.all([
      getProject(userId, projectId),
      listTasks(userId, projectId),
    ]);
    return { project, tasks };
  } catch (error) {
    if (error instanceof AppError && error.status === 404) return null;
    throw error;
  }
}

function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading board">
      <Skeleton className="mb-3 h-5 w-24" />
      <Skeleton className="mb-2 h-8 w-64 max-w-full" />
      <Skeleton className="mb-6 h-5 w-40" />
      <div className="flex gap-3 overflow-hidden xl:grid xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton
            key={i}
            className="h-72 w-[82vw] max-w-80 shrink-0 rounded-card xl:w-auto xl:max-w-none"
          />
        ))}
      </div>
    </div>
  );
}
