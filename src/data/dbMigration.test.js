import { describe, expect, it, vi } from "vitest";

import {
  CURRENT_INDEXEDDB_VERSION,
  DIAGRAMS_UNIQUE_INDEX_VERSION,
  DIAGRAMS_UNIQUE_PREP_VERSION,
  DIAGRAMS_UNIQUE_STORE_SCHEMA,
  DIAGRAMS_V67_STORE_SCHEMA,
  INDEXEDDB_VERSION_JUMP_NOTE,
  backfillStableIds,
  logSeedError,
} from "./dbMigration";

function createStore(rows) {
  return {
    toCollection() {
      return {
        async modify(callback) {
          rows.forEach(callback);
        },
      };
    },
  };
}

describe("IndexedDB migration helpers", () => {
  it("documents the IndexedDB version jump and diagramId unique-index migration", () => {
    expect(CURRENT_INDEXEDDB_VERSION).toBe(69);
    expect(DIAGRAMS_UNIQUE_PREP_VERSION).toBe(68);
    expect(DIAGRAMS_UNIQUE_INDEX_VERSION).toBe(69);
    expect(DIAGRAMS_V67_STORE_SCHEMA).toBe(
      "++id, lastModified, loadedFromGistId, diagramId",
    );
    expect(DIAGRAMS_UNIQUE_STORE_SCHEMA).toBe(
      "++id, lastModified, loadedFromGistId, &diagramId",
    );
    expect(INDEXEDDB_VERSION_JUMP_NOTE).toContain("independent refactor baseline");
    expect(INDEXEDDB_VERSION_JUMP_NOTE).toContain("no v1-v66 schema history");
  });

  it("backfills stable ids for legacy rows and repairs duplicate diagram ids before the unique index migration", async () => {
    const randomUUID = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("diagram-duplicate-repair")
      .mockReturnValueOnce("diagram-generated")
      .mockReturnValueOnce("template-generated");

    const diagrams = [
      { id: 1, name: "Original diagram", diagramId: "diagram-existing" },
      { id: 2, name: "Duplicate diagram", diagramId: "diagram-existing" },
      { id: 3, name: "Legacy diagram" },
    ];
    const templates = [
      { id: 1, name: "Legacy template" },
      { id: 2, name: "Existing template", templateId: "template-existing" },
    ];

    await backfillStableIds({
      diagrams: createStore(diagrams),
      templates: createStore(templates),
    });

    expect(diagrams).toEqual([
      { id: 1, name: "Original diagram", diagramId: "diagram-existing" },
      { id: 2, name: "Duplicate diagram", diagramId: "diagram-duplicate-repair" },
      { id: 3, name: "Legacy diagram", diagramId: "diagram-generated" },
    ]);
    expect(templates).toEqual([
      { id: 1, name: "Legacy template", templateId: "template-generated" },
      { id: 2, name: "Existing template", templateId: "template-existing" },
    ]);
    expect(randomUUID).toHaveBeenCalledTimes(3);
  });

  it("logs seed errors only in development", () => {
    const error = new Error("seed failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    logSeedError(error, { dev: false });
    expect(consoleError).not.toHaveBeenCalled();

    logSeedError(error, { dev: true });
    expect(consoleError).toHaveBeenCalledWith(error);
  });
});
