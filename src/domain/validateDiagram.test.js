import { describe, expect, it } from "vitest";

import { createDiagram, createField, createTable } from "./diagramModel";
import { validateDiagram } from "./validateDiagram";

describe("validateDiagram", () => {
  it("returns structured issues for duplicate table names", () => {
    const diagram = createDiagram({
      tables: [
        createTable({ id: "t1", name: "users" }),
        createTable({ id: "t2", name: "users" }),
      ],
    });

    expect(validateDiagram(diagram)).toContainEqual({
      id: "duplicate-table-name:t2",
      severity: "error",
      objectType: "table",
      objectId: "t2",
      messageKey: "duplicate_table_by_name",
      message: "Duplicate table name: users",
      fixHint: "Rename one of the duplicate tables.",
    });
  });

  it("returns structured issues for empty field names", () => {
    const diagram = createDiagram({
      tables: [
        createTable({
          id: "t1",
          name: "users",
          fields: [createField({ id: "f1", name: "" })],
        }),
      ],
    });

    expect(validateDiagram(diagram)).toContainEqual({
      id: "empty-field-name:f1",
      severity: "error",
      objectType: "field",
      objectId: "f1",
      messageKey: "empty_field_name",
      message: "Table users has a field without a name.",
      fixHint: "Name the field before exporting or sharing the diagram.",
    });
  });

  it("returns structured issues for tables without primary keys", () => {
    const diagram = createDiagram({
      tables: [
        createTable({
          id: "t1",
          name: "events",
          fields: [createField({ id: "f1", name: "event_name" })],
        }),
      ],
    });

    expect(validateDiagram(diagram)).toContainEqual({
      id: "missing-primary-key:t1",
      severity: "warning",
      objectType: "table",
      objectId: "t1",
      messageKey: "no_primary_key",
      message: "Table events has no primary key.",
      fixHint: "Mark one stable field as the primary key.",
    });
  });
});
