import { describe, expect, it } from "vitest";

import { DB } from "../data/constants";
import { createDiagram, createField, createTable } from "./diagramModel";
import { validateDiagram } from "./validateDiagram";

const invalidDefaultIssues = (diagram) =>
  validateDiagram(diagram).filter(
    (issue) => issue.messageKey === "default_doesnt_match_type",
  );

const diagramWithDefault = ({ type, defaultValue }) =>
  createDiagram({
    database: DB.POSTGRES,
    tables: [
      createTable({
        id: "t1",
        name: "locations",
        fields: [
          createField({
            id: "f1",
            name: "shape",
            type,
            default: defaultValue,
          }),
        ],
      }),
    ],
  });

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

  it("rejects overlong PostgreSQL geometry defaults before regex validation", () => {
    const overlongValidLine = Array.from(
      { length: 170 },
      (_, index) => `(${index},${index + 1})`,
    ).join(",");

    expect(overlongValidLine.length).toBeGreaterThan(1000);

    const issues = invalidDefaultIssues(
      diagramWithDefault({
        type: "LINE",
        defaultValue: overlongValidLine,
      }),
    );

    expect(issues).toContainEqual(
      expect.objectContaining({
        id: "invalid-default:f1",
        objectType: "field",
        objectId: "f1",
      }),
    );
  });

  it("keeps legal PostgreSQL geometry defaults while rejecting malformed input", () => {
    const legalDefaults = [
      ["LINE", "(1,2),(3,4)"],
      ["LSEG", "(1,2),(3,4)"],
      ["PATH", "(1,2,3.5,4.25)"],
      ["POLYGON", "(1,2,3.5,4.25)"],
    ];

    legalDefaults.forEach(([type, defaultValue]) => {
      expect(
        invalidDefaultIssues(diagramWithDefault({ type, defaultValue })),
      ).toEqual([]);
    });

    const malformedPath = `(${Array.from({ length: 100 }, () => "(1,2").join(
      ",",
    )}`;
    const startedAt = performance.now();
    const issues = invalidDefaultIssues(
      diagramWithDefault({
        type: "PATH",
        defaultValue: malformedPath,
      }),
    );
    const elapsedMs = performance.now() - startedAt;

    expect(elapsedMs).toBeLessThan(200);
    expect(issues).toContainEqual(
      expect.objectContaining({
        id: "invalid-default:f1",
        objectType: "field",
        objectId: "f1",
      }),
    );
  });
});
