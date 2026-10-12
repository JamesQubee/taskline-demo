import { CalendarDays, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { describeDue, formatDate } from "@/lib/dates";

/**
 * Due date relative to today. Late dates get an icon as well as a color.
 * Finished work shows the plain date: it can no longer be late or urgent.
 */
export function DueBadge({
  dueDate,
  today,
  done = false,
}: {
  dueDate: string;
  today: string;
  done?: boolean;
}) {
  if (done) {
    return (
      <Badge>
        <CalendarDays className="size-3" aria-hidden="true" />
        {formatDate(dueDate)}
      </Badge>
    );
  }

  const { label, state } = describeDue(dueDate, today);
  const late = state === "overdue";

  return (
    <Badge tone={late ? "danger" : state === "today" ? "warn" : "neutral"}>
      {late ? (
        <CircleAlert className="size-3" aria-hidden="true" />
      ) : (
        <CalendarDays className="size-3" aria-hidden="true" />
      )}
      {late && <span className="sr-only">Overdue: </span>}
      {label}
    </Badge>
  );
}
