import { describe, expect, it, vi } from "vitest";

import { DB } from "../data/constants";
import { CURRENT_SCHEMA_VERSION } from "../domain/diagramModel";
import { createLocalDiagramRepository } from "./localDiagramRepository";

function createFakeDatabase(seedDiagrams = []) {
  const rows = seedDiagrams.map((diagram, index) => ({
    id: index + 1,
    ...diagram,
  }));

  const diagrams = {
    orderBy(field) {
      let result = [...rows].sort((a, b) => {
        const first = new Date(a[field]).getTime();
        const second = new Date(b[field]).getTime();
        return first - second;
      });

      return {
        reverse() {
          result = result.reverse();
          return this;
        },
        limit(count) {
          result = result.slice(0, count);
          return this;
        },
        toArray: async () => [...result],
      };
    },
    where(field) {
      return {
        equals(value) {
          const matches = rows.filter((row) => row[field] === value);
          return {
            first: async () => matches[0],
            delete: async () => {
              for (const match of matches) {
                const index = rows.indexOf(match);
                if (index >= 0) rows.splice(index, 1);
              }
              return matches.length;
            },
          };
        },
      };
    },
    add: async (diagram) => {
      const id = rows.length + 1;
      rows.push({ id, ...diagram });
      return id;
    },
    put: async (diagram) => {
      const index = rows.findIndex((row) => row.id === diagram.id);
      if (index >= 0) {
        rows[index] = { ...diagram };
        return diagram.id;
      }

      const id = diagram.id ?? rows.length + 1;
      rows.push({ id, ...diagram });
      return id;
    },
    toArray: async () => [...rows],
  };
  diagrams.__rows = rows;

  return {
    diagrams,
    transaction: vi.fn(async (_mode, _table, callback) => {
      const snapshot = rows.map((row) => ({ ...row }));
      try {
        return await callback();
      } catch (error) {
        rows.splice(0, rows.length, ...snapshot);
        throw error;
      }
    }),
  };
}

describe("createLocalDiagramRepository", () => {
  it("lists recent diagrams by lastModified descending as normalized summaries", async () => {
    const repository = createLocalDiagramRepository(
      createFakeDatabase([
        {
          diagramId: "older",
          name: "Older",
          database: DB.MYSQL,
          lastModified: new Date("2026-01-01T00:00:00Z"),
          tables: [{ id: 1, name: "users", fields: [] }],
          references: [{ id: 2, startTableId: 1, endTableId: 1 }],
        },
        {
          diagramId: "newer",
          name: "Newer",
          lastModified: new Date("2026-01-02T00:00:00Z"),
          tables: [{ id: 3, name: "orders", fields: [] }],
        },
      ]),
    );

    const diagrams = await repository.listRecentDiagrams({ limit: 1 });

    expect(diagrams).toEqual([
      {
        diagramId: "newer",
        name: "Newer",
        database: DB.GENERIC,
        lastModified: new Date("2026-01-02T00:00:00Z"),
        tableCount: 1,
        relationshipCount: 0,
        loadedFromGistId: null,
      },
    ]);
  });

  it("returns null when a diagram id cannot be found", async () => {
    const repository = createLocalDiagramRepository(createFakeDatabase());

    await expect(repository.getDiagramById("missing")).resolves.toBeNull();
  });

  it("normalizes diagrams before saving and updates existing records by diagramId", async () => {
    const database = createFakeDatabase([
      {
        diagramId: "existing",
        name: "Before",
        lastModified: new Date("2026-01-01T00:00:00Z"),
        tables: [],
      },
    ]);
    const repository = createLocalDiagramRepository(database);

    const saved = await repository.saveDiagram({
      diagramId: "existing",
      name: "After",
      tables: [{ id: 7, name: "users", fields: [{ id: 8, name: "id" }] }],
      references: [{ id: 9, startTableId: 7, endTableId: 7 }],
    });

    expect(saved).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      diagramId: "existing",
      name: "After",
      relationships: [{ id: "9", startTableId: "7", endTableId: "7" }],
    });
    expect(saved.tables[0].id).toBe("7");

    const rows = await database.diagrams.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 1,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      diagramId: "existing",
      name: "After",
    });
  });

  it("deletes and duplicates diagrams by stable diagramId", async () => {
    const database = createFakeDatabase([
      {
        diagramId: "source",
        name: "Source",
        lastModified: new Date("2026-01-01T00:00:00Z"),
        tables: [{ id: 1, name: "users", fields: [] }],
      },
    ]);
    const repository = createLocalDiagramRepository(database);

    const duplicate = await repository.duplicateDiagram("source", {
      diagramId: "copy",
      name: "Source copy",
    });
    const deletedCount = await repository.deleteDiagram("source");

    expect(duplicate).toMatchObject({
      diagramId: "copy",
      name: "Source copy",
      tables: [{ id: "1", name: "users" }],
    });
    expect(deletedCount).toBe(1);
    await expect(repository.getDiagramById("source")).resolves.toBeNull();
    await expect(repository.getDiagramById("copy")).resolves.toMatchObject({
      diagramId: "copy",
    });
  });

  it("returns structured errors when Dexie operations fail", async () => {
    const database = createFakeDatabase();
    database.diagrams.orderBy = () => {
      throw new Error("IndexedDB unavailable");
    };
    database.diagrams.where = () => {
      throw new Error("IndexedDB unavailable");
    };
    const repository = createLocalDiagramRepository(database);

    await expect(repository.listRecentDiagrams()).resolves.toMatchObject({
      ok: false,
      reason: "dexie-error",
      operation: "listRecentDiagrams",
      message: "IndexedDB unavailable",
    });
    await expect(repository.getDiagramById("missing")).resolves.toMatchObject({
      ok: false,
      reason: "dexie-error",
      operation: "getDiagramById",
      message: "IndexedDB unavailable",
    });
    await expect(repository.deleteDiagram("missing")).resolves.toMatchObject({
      ok: false,
      reason: "dexie-error",
      operation: "deleteDiagram",
      message: "IndexedDB unavailable",
    });
  });

  it("wraps saveDiagram in a transaction and leaves no new row when writing fails", async () => {
    const database = createFakeDatabase();
    database.diagrams.add = async (diagram) => {
      const rows = database.diagrams.__rows;
      rows.push({ id: rows.length + 1, ...diagram });
      throw new Error("Quota exceeded");
    };
    const repository = createLocalDiagramRepository(database);

    const saved = await repository.saveDiagram({
      diagramId: "new-diagram",
      name: "New diagram",
      tables: [],
      relationships: [],
    });

    expect(saved).toMatchObject({
      ok: false,
      reason: "dexie-error",
      operation: "saveDiagram",
      message: "Quota exceeded",
    });
    expect(database.transaction).toHaveBeenCalledWith(
      "rw",
      database.diagrams,
      expect.any(Function),
    );
    await expect(database.diagrams.toArray()).resolves.toEqual([]);
  });
});
