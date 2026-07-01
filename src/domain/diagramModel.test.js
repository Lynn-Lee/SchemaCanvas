import { describe, expect, it } from "vitest";

import { DB } from "../data/constants";
import {
  CURRENT_SCHEMA_VERSION,
  createDiagram,
  createField,
  createTable,
} from "./diagramModel";

describe("diagramModel", () => {
  it("creates a normalized local-first diagram with string ids", () => {
    const table = createTable({ id: 42, name: "users" });
    const diagram = createDiagram({
      diagramId: 7,
      database: DB.POSTGRES,
      name: "Auth",
      tables: [table],
    });

    expect(diagram.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(diagram.diagramId).toBe("7");
    expect(diagram.database).toBe(DB.POSTGRES);
    expect(diagram.tables[0].id).toBe("42");
    expect(diagram.tables[0].fields[0]).toMatchObject({
      name: "id",
      primary: true,
      notNull: true,
    });
    expect(diagram.relationships).toEqual([]);
  });

  it("normalizes field defaults without dropping database attributes", () => {
    expect(
      createField({ id: 10, name: "email", type: "VARCHAR" }),
    ).toMatchObject({
      id: "10",
      name: "email",
      type: "VARCHAR",
      default: "",
      check: "",
      primary: false,
      unique: false,
      notNull: false,
      increment: false,
      comment: "",
    });
  });

  it("converts legacy references to standard relationships", () => {
    const diagram = createDiagram({
      tables: [createTable({ id: 1, name: "users" })],
      references: [{ id: 2, startTableId: 1, endTableId: 1 }],
    });

    expect(diagram.relationships).toMatchObject([
      { id: "2", startTableId: "1", endTableId: "1" },
    ]);
    expect(diagram.references).toBeUndefined();
  });
});
