import { describe, expect, it } from "vitest";

import { createDiagram, createTable } from "./diagramModel";
import {
  DEFAULT_HISTORY_LIMIT,
  createHistoryState,
  dispatchHistory,
} from "./diagramHistory";

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

  it("keeps only the latest undo entries when command history exceeds the limit", () => {
    const diagram = createDiagram({ diagramId: "d1", tables: [] });
    const state = Array.from({ length: DEFAULT_HISTORY_LIMIT + 1 }, (_, index) => index).reduce(
      (currentState, index) =>
        dispatchHistory(currentState, {
          type: "table.create",
          payload: {
            table: createTable({
              id: `table_${index}`,
              name: `table_${index}`,
            }),
          },
        }),
      createHistoryState(diagram),
    );

    expect(state.current.tables).toHaveLength(DEFAULT_HISTORY_LIMIT + 1);
    expect(state.undoStack).toHaveLength(DEFAULT_HISTORY_LIMIT);
    expect(state.undoStack[0].command.payload.table.id).toBe("table_1");
  });
});
