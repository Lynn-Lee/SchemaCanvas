import { describe, expect, it } from "vitest";

import { CURRENT_SCHEMA_VERSION } from "./diagramModel";
import { normalizeDiagram } from "./normalizeDiagram";

describe("normalizeDiagram", () => {
  it("converts legacy references to relationships and string ids", () => {
    const result = normalizeDiagram({
      diagramId: 123,
      database: "postgres",
      name: "Legacy",
      tables: [
        { id: 1, name: "users", fields: [{ id: 2, name: "id", primary: true }] },
      ],
      references: [{ id: 3, startTableId: 1, endTableId: 1 }],
      pan: { x: 10, y: 20 },
      zoom: 0.8,
    });

    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.diagramId).toBe("123");
    expect(result.tables[0].id).toBe("1");
    expect(result.tables[0].fields[0].id).toBe("2");
    expect(result.relationships[0]).toMatchObject({
      id: "3",
      startTableId: "1",
      endTableId: "1",
    });
    expect(result.references).toBeUndefined();
  });

  it("defaults missing local diagram metadata to the normalized baseline", () => {
    const result = normalizeDiagram({
      id: "template-1",
      tables: [{ id: "users", name: "users", fields: [] }],
    });

    expect(result).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      diagramId: "template-1",
      database: "generic",
      pan: { x: 0, y: 0 },
      zoom: 1,
      relationships: [],
      notes: [],
      areas: [],
      types: [],
      enums: [],
    });
  });
});
