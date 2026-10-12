import { describe, expect, it } from "vitest";
import {
  locate,
  moveTask,
  removeTask,
  toColumns,
  upsertTask,
  type Columns,
} from "@/components/board/board-state";
import type { TaskStatus } from "@/lib/constants";
import type { Task } from "@/lib/types";

function task(id: string, status: TaskStatus, position: number): Task {
  return {
    id,
    projectId: "p",
    title: id,
    description: "",
    status,
    priority: "medium",
    dueDate: null,
    position,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

const ids = (columns: Columns, status: TaskStatus) =>
  columns[status].map((item) => item.id);

const board = () =>
  toColumns([
    task("b", "todo", 1),
    task("a", "todo", 0),
    task("c", "todo", 2),
    task("x", "done", 0),
  ]);

describe("board state", () => {
  it("groups tasks by status in position order", () => {
    const columns = board();

    expect(ids(columns, "todo")).toEqual(["a", "b", "c"]);
    expect(ids(columns, "done")).toEqual(["x"]);
    expect(ids(columns, "backlog")).toEqual([]);
  });

  it("reorders inside a column and renumbers positions", () => {
    const columns = moveTask(board(), "c", "todo", 0);

    expect(ids(columns, "todo")).toEqual(["c", "a", "b"]);
    expect(columns.todo.map((item) => item.position)).toEqual([0, 1, 2]);
  });

  it("moves a task to another column and updates its status", () => {
    const columns = moveTask(board(), "a", "done", 0);

    expect(ids(columns, "todo")).toEqual(["b", "c"]);
    expect(ids(columns, "done")).toEqual(["a", "x"]);
    expect(columns.done[0]).toMatchObject({ status: "done", position: 0 });
    expect(columns.todo.map((item) => item.position)).toEqual([0, 1]);
  });

  it("treats an index past the end as the bottom of the column", () => {
    const columns = moveTask(board(), "a", "done", 99);

    expect(locate(columns, "a")).toEqual({ status: "done", index: 1 });
  });

  it("returns the same object when nothing moves", () => {
    const columns = board();

    expect(moveTask(columns, "b", "todo", 1)).toBe(columns);
    expect(moveTask(columns, "missing", "todo", 0)).toBe(columns);
  });

  it("does not mutate the previous state", () => {
    const before = board();
    moveTask(before, "a", "done", 0);

    expect(ids(before, "todo")).toEqual(["a", "b", "c"]);
    expect(ids(before, "done")).toEqual(["x"]);
  });

  it("inserts a saved task where the server put it", () => {
    const created = upsertTask(board(), task("new", "todo", 3));
    expect(ids(created, "todo")).toEqual(["a", "b", "c", "new"]);

    // Editing a task's status in the dialog moves it between columns.
    const edited = upsertTask(created, { ...task("b", "done", 1), title: "B!" });
    expect(ids(edited, "todo")).toEqual(["a", "c", "new"]);
    expect(edited.done[1]).toMatchObject({ id: "b", title: "B!" });
  });

  it("removes a task and closes the gap", () => {
    const columns = removeTask(board(), "a");

    expect(ids(columns, "todo")).toEqual(["b", "c"]);
    expect(columns.todo.map((item) => item.position)).toEqual([0, 1]);
  });
});
