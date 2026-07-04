import { describe, expect, it, vi } from "vitest";

import {
  CURRENT_DATABASE_NAME,
  CURRENT_INDEXEDDB_VERSION,
  DIAGRAMS_UNIQUE_INDEX_VERSION,
  DIAGRAMS_UNIQUE_PREP_VERSION,
  DIAGRAMS_UNIQUE_STORE_SCHEMA,
  DIAGRAMS_V67_STORE_SCHEMA,
  INDEXEDDB_VERSION_JUMP_NOTE,
  LEGACY_DATABASE_NAME,
  LEGACY_MIGRATION_FLAG_KEY,
  backfillStableIds,
  logSeedError,
  migrateLegacyDrawDbDatabase,
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

function createFakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
  };
}

function createFakeDexieCtor({ exists, legacyDiagrams = [], legacyTemplates = [] }) {
  function FakeDexie() {}
  FakeDexie.exists = vi.fn().mockResolvedValue(exists);
  FakeDexie.prototype.open = vi.fn().mockResolvedValue(undefined);
  FakeDexie.prototype.close = vi.fn();
  FakeDexie.prototype.table = vi.fn((tableName) => ({
    toArray: () =>
      Promise.resolve(tableName === "diagrams" ? legacyDiagrams : legacyTemplates),
  }));
  return FakeDexie;
}

function createFakeTargetDb({ existingDiagramCount = 0 } = {}) {
  const diagramsAdded = [];
  const templatesAdded = [];
  return {
    open: vi.fn().mockResolvedValue(undefined),
    diagrams: {
      count: vi.fn().mockResolvedValue(existingDiagramCount),
      bulkAdd: vi.fn((rows) => {
        diagramsAdded.push(...rows);
        return Promise.resolve();
      }),
    },
    templates: {
      bulkAdd: vi.fn((rows) => {
        templatesAdded.push(...rows);
        return Promise.resolve();
      }),
    },
    transaction: vi.fn((_mode, _t1, _t2, callback) => callback()),
    diagramsAdded,
    templatesAdded,
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

  it("documents the renamed database name", () => {
    expect(CURRENT_DATABASE_NAME).toBe("SchemaCanvas");
    expect(LEGACY_DATABASE_NAME).toBe("drawDB");
  });

  it("skips migration and marks it done when no legacy database exists", async () => {
    const storage = createFakeStorage();
    const DexieCtor = createFakeDexieCtor({ exists: false });
    const targetDb = createFakeTargetDb();

    const result = await migrateLegacyDrawDbDatabase(targetDb, {
      DexieCtor,
      storage,
    });

    expect(result).toEqual({ migrated: false, reason: "no-legacy-database" });
    expect(storage.getItem(LEGACY_MIGRATION_FLAG_KEY)).toBe("true");
    expect(targetDb.open).not.toHaveBeenCalled();
  });

  it("skips migration on repeat runs once already marked done", async () => {
    const storage = createFakeStorage();
    storage.setItem(LEGACY_MIGRATION_FLAG_KEY, "true");
    const DexieCtor = createFakeDexieCtor({ exists: true });
    const targetDb = createFakeTargetDb();

    const result = await migrateLegacyDrawDbDatabase(targetDb, {
      DexieCtor,
      storage,
    });

    expect(result).toEqual({ migrated: false, reason: "already-migrated" });
    expect(DexieCtor.exists).not.toHaveBeenCalled();
  });

  it("skips migration without touching the legacy database when the target already has diagrams", async () => {
    const storage = createFakeStorage();
    const DexieCtor = createFakeDexieCtor({ exists: true });
    const targetDb = createFakeTargetDb({ existingDiagramCount: 2 });

    const result = await migrateLegacyDrawDbDatabase(targetDb, {
      DexieCtor,
      storage,
    });

    expect(result).toEqual({
      migrated: false,
      reason: "target-already-has-diagrams",
    });
    expect(storage.getItem(LEGACY_MIGRATION_FLAG_KEY)).toBe("true");
  });

  it("copies legacy diagrams and only custom legacy templates into the renamed database", async () => {
    const storage = createFakeStorage();
    const legacyDiagrams = [
      { id: 1, name: "My diagram", diagramId: "diagram-1" },
      { id: 2, name: "Another diagram", diagramId: "diagram-2" },
    ];
    const legacyTemplates = [
      { id: 1, name: "Built-in template", custom: 0, templateId: "seed-1" },
      { id: 2, name: "My saved template", custom: 1, templateId: "custom-1" },
    ];
    const DexieCtor = createFakeDexieCtor({
      exists: true,
      legacyDiagrams,
      legacyTemplates,
    });
    const targetDb = createFakeTargetDb({ existingDiagramCount: 0 });

    const result = await migrateLegacyDrawDbDatabase(targetDb, {
      DexieCtor,
      storage,
    });

    expect(result).toEqual({
      migrated: true,
      diagramCount: 2,
      templateCount: 1,
    });
    expect(targetDb.diagramsAdded).toEqual([
      { name: "My diagram", diagramId: "diagram-1" },
      { name: "Another diagram", diagramId: "diagram-2" },
    ]);
    expect(targetDb.templatesAdded).toEqual([
      { name: "My saved template", custom: 1, templateId: "custom-1" },
    ]);
    expect(storage.getItem(LEGACY_MIGRATION_FLAG_KEY)).toBe("true");
  });

  it("returns a structured result instead of throwing when the legacy lookup fails", async () => {
    const storage = createFakeStorage();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const DexieCtor = { exists: vi.fn().mockRejectedValue(new Error("boom")) };
    const targetDb = createFakeTargetDb();

    const result = await migrateLegacyDrawDbDatabase(targetDb, {
      DexieCtor,
      storage,
    });

    expect(result).toEqual({ migrated: false, reason: "error" });
    consoleError.mockRestore();
  });
});
