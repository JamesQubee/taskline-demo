import { describe, expect, it } from "vitest";
import { addDays, daysBetween, describeDue, todayIso } from "@/lib/dates";

describe("dates", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("counts whole days in both directions", () => {
    expect(daysBetween("2026-03-01", "2026-03-08")).toBe(7);
    expect(daysBetween("2026-03-08", "2026-03-01")).toBe(-7);
  });

  it("reads today's date in UTC", () => {
    expect(todayIso(new Date("2026-10-12T23:59:59Z"))).toBe("2026-10-12");
  });

  it("describes a due date relative to today", () => {
    const today = "2026-10-12";

    expect(describeDue("2026-10-09", today)).toEqual({
      label: "3 days late",
      state: "overdue",
    });
    expect(describeDue("2026-10-11", today).label).toBe("Yesterday");
    expect(describeDue("2026-10-12", today)).toEqual({
      label: "Today",
      state: "today",
    });
    expect(describeDue("2026-10-13", today).label).toBe("Tomorrow");
    expect(describeDue("2026-10-16", today)).toEqual({
      label: "Oct 16",
      state: "soon",
    });
    expect(describeDue("2026-11-30", today)).toEqual({
      label: "Nov 30",
      state: "later",
    });
  });
});
