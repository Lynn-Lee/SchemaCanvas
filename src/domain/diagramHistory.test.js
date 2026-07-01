import { describe, expect, it } from "vitest";

import { createDiagram, createTable } from "./diagramModel";
import { createHistoryState, dispatchHistory } from "./diagramHistory";

describe("diagramHistory", () => {
  it("pushes executed commands to undo stack and clears redo stack", () => {
    const diagram = createDiagram({ diagramId: "d1", tables: [] });
    const state = createHistoryState(diagram);

    const next = dispatchHistory(state, {
      type: "table.create",
      payload: { table: createTable({ id: "users", name: "users" }) },
    });

    expect(next.current.tables).toHaveLength(1);
    expect(next.undoStack).toHaveLength(1);
    expect(next.redoStack).toEqual([]);
  });

  it("undoes and redoes diagram commands without mutating history snapshots", () => {
    const diagram = createDiagram({ diagramId: "d1", tables: [] });
    const afterCreate = dispatchHistory(createHistoryState(diagram), {
      type: "table.create",
      payload: { table: createTable({ id: "users", name: "users" }) },
    });

    const afterUndo = dispatchHistory(afterCreate, { type: "history.undo" });
    const afterRedo = dispatchHistory(afterUndo, { type: "history.redo" });

    expect(afterUndo.current.tables).toEqual([]);
    expect(afterUndo.undoStack).toEqual([]);
    expect(afterUndo.redoStack).toHaveLength(1);
    expect(afterRedo.current.tables).toHaveLength(1);
    expect(afterRedo.current.tables[0]).toMatchObject({ id: "users", name: "users" });
    expect(afterCreate.current.tables).toHaveLength(1);
  });
});
