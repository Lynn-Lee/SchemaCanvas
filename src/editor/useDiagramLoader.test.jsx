import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DB, State } from "../data/constants";
import { useDiagramLoader } from "./useDiagramLoader";

function createSetters(overrides = {}) {
  return {
    setDatabase: vi.fn(),
    setGistId: vi.fn(),
    setLoadedFromGistId: vi.fn(),
    setTitle: vi.fn(),
    setTables: vi.fn(),
    setRelationships: vi.fn(),
    setNotes: vi.fn(),
    setAreas: vi.fn(),
    setTransform: vi.fn(),
    setTypes: vi.fn(),
    setEnums: vi.fn(),
    setUndoStack: vi.fn(),
    setRedoStack: vi.fn(),
    setSaveState: vi.fn(),
    setShowSelectDbModal: vi.fn(),
    setLayout: vi.fn(),
    navigate: vi.fn(),
    ...overrides,
  };
}

describe("useDiagramLoader", () => {
  it("loads the most recent local diagram into editor state", async () => {
    const diagram = {
      diagramId: "local-1",
      database: DB.POSTGRES,
      name: "Local Auth",
      gistId: "gist-1",
      loadedFromGistId: "share-1",
      tables: [{ id: "users", name: "users", fields: [] }],
      relationships: [{ id: "rel-1", startTableId: "users" }],
      notes: [{ id: "note-1" }],
      areas: [{ id: "area-1" }],
      types: [{ id: "type-1", fields: [] }],
      enums: [{ id: "enum-1", values: [] }],
      pan: { x: 12, y: 24 },
      zoom: 0.75,
    };
    const repository = {
      listRecentDiagrams: vi.fn().mockResolvedValue([{ diagramId: "local-1" }]),
      getDiagramById: vi.fn().mockResolvedValue(diagram),
    };
    const setters = createSetters();

    const { result } = renderHook(() =>
      useDiagramLoader({ repository, ...setters }),
    );

    await result.current.loadLatestLocalDiagram();

    expect(repository.listRecentDiagrams).toHaveBeenCalledWith({ limit: 1 });
    expect(repository.getDiagramById).toHaveBeenCalledWith("local-1");
    expect(setters.setDatabase).toHaveBeenCalledWith(DB.POSTGRES);
    expect(setters.setTitle).toHaveBeenCalledWith("Local Auth");
    expect(setters.setTables).toHaveBeenCalledWith(diagram.tables);
    expect(setters.setRelationships).toHaveBeenCalledWith(diagram.relationships);
    expect(setters.setTransform).toHaveBeenCalledWith({
      pan: diagram.pan,
      zoom: diagram.zoom,
    });
    expect(setters.setTypes).toHaveBeenCalledWith(diagram.types);
    expect(setters.setEnums).toHaveBeenCalledWith(diagram.enums);
    expect(setters.navigate).toHaveBeenCalledWith("/editor/diagrams/local-1", {
      replace: true,
    });
  });

  it("marks route diagram load failure when a local diagram is missing", async () => {
    const repository = {
      getDiagramById: vi.fn().mockResolvedValue(null),
    };
    const setters = createSetters();

    const { result } = renderHook(() =>
      useDiagramLoader({ repository, ...setters }),
    );

    const loaded = await result.current.loadLocalDiagramById("missing");

    expect(loaded).toBe(false);
    expect(repository.getDiagramById).toHaveBeenCalledWith("missing");
    expect(setters.setSaveState).toHaveBeenCalledWith(State.FAILED_TO_LOAD);
    expect(setters.setShowSelectDbModal).toHaveBeenCalledWith(true);
  });
});
