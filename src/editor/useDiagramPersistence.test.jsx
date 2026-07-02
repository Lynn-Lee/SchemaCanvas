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

  it("marks local save failures without hiding the error", async () => {
    const repository = {
      saveDiagram: vi.fn(async () => {
        throw new Error("IndexedDB unavailable");
      }),
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
        now: () => new Date("2026-07-01T18:00:00Z"),
      }),
    );

    await expect(
      result.current.saveLocalDiagram({
        isNew: true,
        database: DB.GENERIC,
        title: "Unsaved",
        gistId: "",
        loadedFromGistId: "",
        tables: [],
        relationships: [],
        notes: [],
        areas: [],
        transform: { pan: { x: 0, y: 0 }, zoom: 1 },
        types: [],
        enums: [],
      }),
    ).rejects.toThrow("IndexedDB unavailable");

    expect(setSaveState).toHaveBeenCalledWith(State.ERROR);
    expect(setLastSaved).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("returns cloud conflict without overwriting remote data", async () => {
    const savedAt = new Date("2026-07-02T11:45:00Z");
    const cloudRepository = {
      saveCloudDiagram: vi.fn(async () => ({
        ok: false,
        reason: "conflict",
        remoteModifiedAt: "2026-07-02T11:44:00.000Z",
        message: "Cloud diagram changed elsewhere.",
      })),
    };
    const setSaveState = vi.fn();
    const setLastSaved = vi.fn();

    const { result } = renderHook(() =>
      useDiagramPersistence({
        repository: { saveDiagram: vi.fn() },
        cloudRepository,
        navigate: vi.fn(),
        setSaveState,
        setLastSaved,
        now: () => savedAt,
      }),
    );

    const saved = await result.current.saveCloudDiagram({
      cloudDiagramId: "cloud-1",
      cloudModifiedAt: "2026-07-02T11:40:00.000Z",
      database: DB.MYSQL,
      title: "Orders",
      gistId: "",
      loadedFromGistId: "",
      tables: [{ id: "orders", fields: [] }],
      relationships: [],
      notes: [],
      areas: [],
      transform: { pan: { x: 0, y: 0 }, zoom: 1 },
      types: [],
      enums: [],
    });

    expect(cloudRepository.saveCloudDiagram).toHaveBeenCalledWith(
      expect.objectContaining({
        diagramId: "cloud-1",
        name: "Orders",
        lastModified: savedAt,
      }),
      expect.objectContaining({
        expectedModifiedAt: "2026-07-02T11:40:00.000Z",
      }),
    );
    expect(saved).toMatchObject({
      ok: false,
      reason: "conflict",
      pendingDiagram: expect.objectContaining({ diagramId: "cloud-1" }),
      remoteModifiedAt: "2026-07-02T11:44:00.000Z",
    });
    expect(setSaveState).toHaveBeenCalledWith(State.ERROR);
    expect(setLastSaved).not.toHaveBeenCalled();
  });

  it("preserves pending cloud changes when the session expires", async () => {
    const cloudRepository = {
      saveCloudDiagram: vi.fn(async () => ({
        ok: false,
        reason: "auth-expired",
        message: "Sign in again before saving.",
      })),
    };
    const setSaveState = vi.fn();

    const { result } = renderHook(() =>
      useDiagramPersistence({
        repository: { saveDiagram: vi.fn() },
        cloudRepository,
        navigate: vi.fn(),
        setSaveState,
        setLastSaved: vi.fn(),
        now: () => new Date("2026-07-02T11:45:00Z"),
      }),
    );

    const saved = await result.current.saveCloudDiagram({
      cloudDiagramId: "cloud-1",
      cloudModifiedAt: "2026-07-02T11:40:00.000Z",
      database: DB.POSTGRES,
      title: "Billing",
      gistId: "",
      loadedFromGistId: "",
      tables: [{ id: "invoices", fields: [] }],
      relationships: [],
      notes: [],
      areas: [],
      transform: { pan: { x: 0, y: 0 }, zoom: 1 },
      types: [],
      enums: [],
    });

    expect(saved).toMatchObject({
      ok: false,
      reason: "auth-expired",
      pendingDiagram: expect.objectContaining({
        diagramId: "cloud-1",
        name: "Billing",
      }),
    });
    expect(setSaveState).toHaveBeenCalledWith(State.ERROR);
  });
});
