import { describe, expect, it } from "vitest";
import {
  IMPORT_LIMITS,
  validateDiagramImportObject,
  validateImportFile,
  validateImportText,
} from "./importLimits";

const createDiagram = (overrides = {}) => ({
  tables: [],
  relationships: [],
  notes: [],
  subjectAreas: [],
  types: [],
  enums: [],
  ...overrides,
});

describe("importLimits", () => {
  it("rejects files larger than the import file limit before parsing", () => {
    const result = validateImportFile({
      name: "large-schema.json",
      size: IMPORT_LIMITS.maxFileBytes + 1,
    });

    expect(result).toEqual({
      ok: false,
      message: "large-schema.json is larger than the 5 MB import limit.",
    });
  });

  it("rejects SQL and DBML text larger than their parser limit", () => {
    const sql = validateImportText("x".repeat(IMPORT_LIMITS.maxTextBytes + 1), {
      label: "SQL",
    });
    const dbml = validateImportText("x".repeat(IMPORT_LIMITS.maxTextBytes + 1), {
      label: "DBML",
    });

    expect(sql.ok).toBe(false);
    expect(sql.message).toBe("SQL input is larger than the 2 MB text limit.");
    expect(dbml.ok).toBe(false);
    expect(dbml.message).toBe("DBML input is larger than the 2 MB text limit.");
  });

  it("rejects diagram objects with too many tables, fields, or relationships", () => {
    const tooManyTables = createDiagram({
      tables: Array.from({ length: IMPORT_LIMITS.maxTables + 1 }, (_, id) => ({
        id,
        name: `table_${id}`,
        fields: [],
      })),
    });
    const tooManyFields = createDiagram({
      tables: [
        {
          id: "users",
          name: "users",
          fields: Array.from(
            { length: IMPORT_LIMITS.maxFields + 1 },
            (_, id) => ({ id, name: `field_${id}` }),
          ),
        },
      ],
    });
    const tooManyRelationships = createDiagram({
      relationships: Array.from(
        { length: IMPORT_LIMITS.maxRelationships + 1 },
        (_, id) => ({ id, name: `relationship_${id}` }),
      ),
    });

    expect(validateDiagramImportObject(tooManyTables)).toEqual({
      ok: false,
      message: "Diagram import has 501 tables, above the 500 table limit.",
    });
    expect(validateDiagramImportObject(tooManyFields)).toEqual({
      ok: false,
      message: "Diagram import has 10001 fields, above the 10000 field limit.",
    });
    expect(validateDiagramImportObject(tooManyRelationships)).toEqual({
      ok: false,
      message:
        "Diagram import has 5001 relationships, above the 5000 relationship limit.",
    });
  });

  it("rejects diagram objects with strings above the string length limit", () => {
    const result = validateDiagramImportObject(
      createDiagram({
        title: "x".repeat(IMPORT_LIMITS.maxStringLength + 1),
      }),
    );

    expect(result).toEqual({
      ok: false,
      message:
        "Diagram import contains a string longer than the 10000 character limit.",
    });
  });

  it("allows small import files, text, and diagram objects", () => {
    expect(validateImportFile({ name: "schema.sql", size: 1024 })).toEqual({
      ok: true,
    });
    expect(validateImportText("CREATE TABLE users (id int);", { label: "SQL" }))
      .toEqual({
        ok: true,
      });
    expect(
      validateDiagramImportObject(
        createDiagram({
          tables: [{ id: "users", name: "users", fields: [] }],
        }),
      ),
    ).toEqual({ ok: true });
  });
});
