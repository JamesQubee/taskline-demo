import { cn } from "@/lib/cn";
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { STAGE_FILL } from "@/lib/styles";

const percent = (count: number, total: number) =>
  total === 0 ? 0 : Math.round((count / total) * 100);

/**
 * Share of tasks in each workflow stage, as one stacked bar.
 * The legend below repeats every value as text, so nothing depends on color
 * or on hovering.
 */
export function StatusBreakdown({
  byStatus,
  total,
}: {
  byStatus: Record<TaskStatus, number>;
  total: number;
}) {
  const filled = TASK_STATUSES.filter((status) => byStatus[status] > 0);

  return (
    <div>
      <div className="flex h-3 gap-0.5" aria-hidden="true">
        {filled.map((status, index) => (
          <div
            key={status}
            style={{ flexGrow: byStatus[status] }}
            className={cn(
              "group relative min-w-2 basis-0 first:rounded-l last:rounded-r",
              STAGE_FILL[status],
            )}
          >
            <span
              className={cn(
                "pointer-events-none absolute bottom-full z-10 mb-2 rounded-control bg-ink px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100",
                // Keep the tooltip inside the card at both ends of the bar.
                index === 0
                  ? "left-0"
                  : index === filled.length - 1
                    ? "right-0"
                    : "left-1/2 -translate-x-1/2",
              )}
            >
              {STATUS_LABELS[status]}: {byStatus[status]} (
              {percent(byStatus[status], total)}%)
            </span>
          </div>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <div key={status}>
            <dt className="flex items-center gap-2 text-sm text-muted">
              <span
                aria-hidden="true"
                className={cn("size-2.5 shrink-0 rounded-[3px]", STAGE_FILL[status])}
              />
              {STATUS_LABELS[status]}
            </dt>
            <dd className="mt-0.5 pl-[18px] text-sm">
              <span className="font-semibold">{byStatus[status]}</span>
              <span className="text-muted">
                {" "}
                · {percent(byStatus[status], total)}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
