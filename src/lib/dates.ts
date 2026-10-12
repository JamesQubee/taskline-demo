// Due dates are calendar dates (YYYY-MM-DD) with no time zone. These helpers do
// their arithmetic in UTC so a date never shifts by a day on the way through.

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return new Date(toUtc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`; negative when `to` is in the past. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(date: string): string {
  return shortDate.format(toUtc(date));
}

export type DueState = "overdue" | "today" | "soon" | "later";

/** Describes a due date relative to today, e.g. "Tomorrow" or "3 days late". */
export function describeDue(
  dueDate: string,
  today: string,
): { label: string; state: DueState } {
  const days = daysBetween(today, dueDate);

  if (days < -1) return { label: `${-days} days late`, state: "overdue" };
  if (days === -1) return { label: "Yesterday", state: "overdue" };
  if (days === 0) return { label: "Today", state: "today" };
  if (days === 1) return { label: "Tomorrow", state: "soon" };
  if (days <= 7) return { label: formatDate(dueDate), state: "soon" };
  return { label: formatDate(dueDate), state: "later" };
}
