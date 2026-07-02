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
    setRestoreState: vi.fn(),
    setShowSelectDbModal: vi.fn(),
    setShowEmptyState: vi.fn(),
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
    expect(setters.setRestoreState).toHaveBeenCalledWith({
      source: "local",
      diagramId: "local-1",
      restoredAt: diagram.lastModified,
    });
    expect(setters.navigate).toHaveBeenCalledWith("/editor/diagrams/local-1", {
      replace: true,
    });
  });

  it("exposes local restore source when loading a route diagram", async () => {
    const diagram = {
      diagramId: "route-local",
      database: DB.GENERIC,
      name: "Route Local",
      lastModified: new Date("2026-07-02T00:00:00Z"),
      tables: [],
      relationships: [],
      notes: [],
      areas: [],
      pan: { x: 0, y: 0 },
      zoom: 1,
    };
    const repository = {
      getDiagramById: vi.fn().mockResolvedValue(diagram),
    };
    const setters = createSetters();

    const { result } = renderHook(() =>
      useDiagramLoader({ repository, ...setters }),
    );

    const loaded = await result.current.loadLocalDiagramById("route-local");

    expect(loaded).toBe(true);
    expect(setters.setRestoreState).toHaveBeenCalledWith({
      source: "local",
      diagramId: "route-local",
      restoredAt: diagram.lastModified,
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

  it("loads a cloud diagram through the cloud repository", async () => {
    const diagram = {
      id: "cloud-1",
      database: DB.POSTGRES,
      name: "Cloud Billing",
      tables: [{ id: "invoices", name: "invoices", fields: [] }],
      relationships: [],
      notes: [],
      areas: [],
      pan: { x: 8, y: 12 },
      zoom: 0.9,
      permission: "editor",
      modifiedAt: "2026-07-02T09:00:00Z",
    };
    const cloudRepository = {
      getCloudDiagram: vi.fn().mockResolvedValue({
        ok: true,
        diagram,
      }),
    };
    const setters = createSetters();

    const { result } = renderHook(() =>
      useDiagramLoader({
        repository: {},
        cloudRepository,
        ...setters,
      }),
    );

    const loaded = await result.current.loadCloudDiagramById("cloud-1");

    expect(loaded).toBe(true);
    expect(cloudRepository.getCloudDiagram).toHaveBeenCalledWith("cloud-1");
    expect(setters.setDatabase).toHaveBeenCalledWith(DB.POSTGRES);
    expect(setters.setTitle).toHaveBeenCalledWith("Cloud Billing");
    expect(setters.setTables).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "invoices",
        name: "invoices",
      }),
    ]);
    expect(setters.setLayout).toHaveBeenCalledWith(expect.any(Function));
    expect(setters.setRestoreState).toHaveBeenCalledWith({
      source: "cloud",
      diagramId: "cloud-1",
      restoredAt: diagram.modifiedAt,
      permission: "editor",
    });
    expect(setters.setShowSelectDbModal).not.toHaveBeenCalled();
  });

  it("falls back to local new diagram when cloud loading is unavailable", async () => {
    const cloudRepository = {
      getCloudDiagram: vi.fn().mockResolvedValue({
        ok: false,
        reason: "unavailable",
        message: "Cloud unavailable",
      }),
    };
    const setters = createSetters();

    const { result } = renderHook(() =>
      useDiagramLoader({
        repository: {},
        cloudRepository,
        ...setters,
      }),
    );

    const loaded = await result.current.loadCloudDiagramById("cloud-1");

    expect(loaded).toBe(false);
    expect(setters.setSaveState).toHaveBeenCalledWith(State.FAILED_TO_LOAD);
    expect(setters.setShowEmptyState).toHaveBeenCalledWith(true);
    expect(setters.setTables).not.toHaveBeenCalled();
    expect(setters.setRelationships).not.toHaveBeenCalled();
  });

  it("does not overwrite local editor state when cloud loading is unauthorized", async () => {
    const cloudRepository = {
      getCloudDiagram: vi.fn().mockResolvedValue({
        ok: false,
        reason: "unauthorized",
        message: "Sign in before opening this cloud diagram.",
      }),
    };
    const setters = createSetters();

    const { result } = renderHook(() =>
      useDiagramLoader({
        repository: {},
        cloudRepository,
        ...setters,
      }),
    );

    const loaded = await result.current.loadCloudDiagramById("cloud-private");

    expect(loaded).toBe(false);
    expect(setters.setSaveState).toHaveBeenCalledWith(State.FAILED_TO_LOAD);
    expect(setters.setShowEmptyState).toHaveBeenCalledWith(true);
    expect(setters.setDatabase).not.toHaveBeenCalled();
    expect(setters.setTitle).not.toHaveBeenCalled();
    expect(setters.setTables).not.toHaveBeenCalled();
  });
});
