import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DB, State } from "../data/constants";
import { useDiagramPersistence } from "./useDiagramPersistence";

describe("useDiagramPersistence", () => {
  it("saves a new local diagram and marks the editor as saved", async () => {
    const savedAt = new Date("2026-07-01T18:00:00Z");
    const repository = {
      saveDiagram: vi.fn(async (diagram) => ({
        ...diagram,
        lastModified: savedAt,
      })),
    };
    const navigate = vi.fn();
    const setSaveState = vi.fn();
    const setLastSaved = vi.fn();

    const { result } = renderHook(() =>
      useDiagramPersistence({
        repository,
        navigate,
        setSaveState,
        setLastSaved,
        createDiagramId: () => "new-diagram",
        now: () => savedAt,
        formatLastSaved: (date) => date.toISOString(),
      }),
    );

    const saved = await result.current.saveLocalDiagram({
      isNew: true,
      database: DB.MYSQL,
      title: "Orders",
      gistId: "",
      loadedFromGistId: "share-1",
      tables: [{ id: "orders", fields: [] }],
      relationships: [],
      notes: [],
      areas: [],
      transform: { pan: { x: 0, y: 0 }, zoom: 1 },
      types: [],
      enums: [],
    });

    expect(repository.saveDiagram).toHaveBeenCalledWith(
      expect.objectContaining({
        diagramId: "new-diagram",
        database: DB.MYSQL,
        name: "Orders",
        loadedFromGistId: "share-1",
        lastModified: savedAt,
      }),
    );
    expect(navigate).toHaveBeenCalledWith("/editor/diagrams/new-diagram", {
      replace: true,
    });
    expect(setSaveState).toHaveBeenCalledWith(State.SAVED);
    expect(setLastSaved).toHaveBeenCalledWith("2026-07-01T18:00:00.000Z");
    expect(saved.diagramId).toBe("new-diagram");
  });
});
