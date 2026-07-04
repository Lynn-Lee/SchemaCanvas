import { describe, expect, it } from "vitest";

import { DB } from "../data/constants";
import {
  createDiagram,
  createEnum,
  createField,
  createRelationship,
  createTable,
  createType,
} from "./diagramModel";
import { validateDiagram } from "./validateDiagram";

const invalidDefaultIssues = (diagram) =>
  validateDiagram(diagram).filter(
    (issue) => issue.messageKey === "default_doesnt_match_type",
  );

const diagramWithDefault = ({ type, defaultValue, ...fieldValues }) =>
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
            ...fieldValues,
          }),
        ],
      }),
    ],
  });

const issueKeys = (diagram) =>
  validateDiagram(diagram).map((issue) => issue.messageKey);

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

  it("returns structured issues for empty table names", () => {
    const diagram = createDiagram({
      tables: [createTable({ id: "t1", name: "" })],
    });

    expect(validateDiagram(diagram)).toContainEqual(
      expect.objectContaining({
        id: "empty-table-name:t1",
        messageKey: "table_w_no_name",
        objectType: "table",
        objectId: "t1",
      }),
    );
  });

  it("returns structured issues for duplicate field names", () => {
    const diagram = createDiagram({
      tables: [
        createTable({
          id: "t1",
          name: "users",
          fields: [
            createField({ id: "f1", name: "email" }),
            createField({ id: "f2", name: "Email" }),
          ],
        }),
      ],
    });

    expect(validateDiagram(diagram)).toContainEqual(
      expect.objectContaining({
        id: "duplicate-field-name:f2",
        messageKey: "duplicate_fields",
        objectType: "field",
        objectId: "f2",
      }),
    );
  });

  it("returns structured issues for fields without a type", () => {
    const diagram = createDiagram({
      tables: [
        createTable({
          id: "t1",
          name: "users",
          fields: [createField({ id: "f1", name: "status", type: "" })],
        }),
      ],
    });

    expect(validateDiagram(diagram)).toContainEqual(
      expect.objectContaining({
        id: "empty-field-type:f1",
        messageKey: "empty_field_type",
        objectType: "field",
        objectId: "f1",
      }),
    );
  });

  it("returns structured issues for duplicate index and unique constraint names", () => {
    const diagram = createDiagram({
      tables: [
        createTable({
          id: "users",
          name: "users",
          fields: [createField({ id: "user_id", name: "id", primary: true })],
          indices: [
            { id: "idx1", name: "idx_users_id", fields: ["user_id"] },
            { id: "idx2", name: "idx_users_id", fields: ["user_id"] },
          ],
          uniqueConstraints: [
            { id: "uc1", name: "users_email_unique", fields: ["user_id"] },
            { id: "uc2", name: "users_email_unique", fields: ["user_id"] },
          ],
        }),
      ],
    });

    expect(validateDiagram(diagram)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "duplicate-index:idx2",
          messageKey: "duplicate_index",
          objectType: "index",
          objectId: "idx2",
        }),
        expect.objectContaining({
          id: "duplicate-unique-constraint:uc2",
          messageKey: "duplicate_index",
          objectType: "index",
          objectId: "uc2",
        }),
      ]),
    );
  });

  it("reports critical issues for relationships pointing at missing tables or fields", () => {
    const diagram = createDiagram({
      tables: [
        createTable({
          id: "users",
          name: "users",
          fields: [
            createField({ id: "user_id", name: "id", primary: true }),
          ],
        }),
        createTable({
          id: "orders",
          name: "orders",
          fields: [
            createField({ id: "order_id", name: "id", primary: true }),
          ],
        }),
      ],
      relationships: [
        createRelationship({
          id: "r1",
          name: "fk_orders_users",
          startTableId: "orders",
          startFieldId: "missing_order_field",
          endTableId: "missing_users_table",
          endFieldId: "user_id",
        }),
      ],
    });

    expect(validateDiagram(diagram)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "missing-relationship-field:r1:start:missing_order_field",
          severity: "critical",
          messageKey: "relationship_field_missing",
          objectType: "relationship",
          objectId: "r1",
        }),
        expect.objectContaining({
          id: "missing-relationship-table:r1:end:missing_users_table",
          severity: "critical",
          messageKey: "relationship_table_missing",
          objectType: "relationship",
          objectId: "r1",
        }),
      ]),
    );
  });

  it("detects circular relationships across two and three tables", () => {
    const tables = ["a", "b", "c"].map((id) =>
      createTable({
        id,
        name: id,
        fields: [createField({ id: `${id}_id`, name: "id", primary: true })],
      }),
    );

    const twoTableCycle = createDiagram({
      tables: tables.slice(0, 2),
      relationships: [
        createRelationship({ id: "ab", startTableId: "a", endTableId: "b" }),
        createRelationship({ id: "ba", startTableId: "b", endTableId: "a" }),
      ],
    });
    const threeTableCycle = createDiagram({
      tables,
      relationships: [
        createRelationship({ id: "ab", startTableId: "a", endTableId: "b" }),
        createRelationship({ id: "bc", startTableId: "b", endTableId: "c" }),
        createRelationship({ id: "ca", startTableId: "c", endTableId: "a" }),
      ],
    });

    expect(issueKeys(twoTableCycle)).toContain("circular_dependency");
    expect(issueKeys(threeTableCycle)).toContain("circular_dependency");
  });

  it("reports duplicate type field names and duplicate enum values", () => {
    const diagram = createDiagram({
      types: [
        createType({
          id: "type1",
          name: "address",
          fields: [
            createField({ id: "tf1", name: "street" }),
            createField({ id: "tf2", name: "Street" }),
          ],
        }),
      ],
      enums: [
        createEnum({
          id: "enum1",
          name: "status",
          values: ["draft", "published", "Draft"],
        }),
      ],
    });

    expect(validateDiagram(diagram)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "duplicate-type-field-name:tf2",
          messageKey: "duplicate_type_fields",
          objectType: "field",
          objectId: "tf2",
        }),
        expect.objectContaining({
          id: "duplicate-enum-value:enum1:draft",
          messageKey: "duplicate_enum_values",
          objectType: "enum",
          objectId: "enum1",
        }),
      ]),
    );
  });

  it("reports empty type fields and empty enum values", () => {
    const diagram = createDiagram({
      types: [createType({ id: "type1", name: "address", fields: [] })],
      enums: [createEnum({ id: "enum1", name: "status", values: [] })],
    });

    expect(validateDiagram(diagram)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "empty-type-fields:type1",
          messageKey: "type_w_no_fields",
          objectType: "type",
          objectId: "type1",
        }),
        expect.objectContaining({
          id: "empty-enum-values:enum1",
          messageKey: "enum_w_no_values",
          objectType: "enum",
          objectId: "enum1",
        }),
      ]),
    );
  });

  it("reports indices and unique constraints that reference missing fields", () => {
    const diagram = createDiagram({
      tables: [
        createTable({
          id: "users",
          name: "users",
          fields: [createField({ id: "user_id", name: "id", primary: true })],
          indices: [
            {
              id: "idx1",
              name: "idx_users_missing",
              fields: ["missing_index_field"],
            },
          ],
          uniqueConstraints: [
            {
              id: "uc1",
              name: "users_missing_unique",
              fields: ["missing_unique_field"],
            },
          ],
        }),
      ],
    });

    expect(validateDiagram(diagram)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "missing-index-field:idx1:missing_index_field",
          messageKey: "index_field_missing",
          objectType: "index",
          objectId: "idx1",
        }),
        expect.objectContaining({
          id: "missing-unique-constraint-field:uc1:missing_unique_field",
          messageKey: "unique_constraint_field_missing",
          objectType: "index",
          objectId: "uc1",
        }),
      ]),
    );
  });

  it("validates defaults for common scalar types", () => {
    const validDefaults = [
      [{ type: "INTEGER", defaultValue: "42" }],
      [{ type: "DECIMAL", defaultValue: "12.34" }],
      [{ type: "VARCHAR", defaultValue: "hello", size: 255 }],
      [{ type: "BOOLEAN", defaultValue: "true" }],
      [{ type: "DATE", defaultValue: "2026-07-04" }],
    ];
    const invalidDefaults = [
      [{ type: "INTEGER", defaultValue: "forty-two" }],
      [{ type: "DECIMAL", defaultValue: "12x34" }],
      [{ type: "BOOLEAN", defaultValue: "maybe" }],
      [{ type: "DATE", defaultValue: "not-a-date" }],
    ];

    validDefaults.forEach(([field]) => {
      expect(
        invalidDefaultIssues(diagramWithDefault(field)),
      ).toEqual([]);
    });
    invalidDefaults.forEach(([field]) => {
      expect(
        invalidDefaultIssues(diagramWithDefault(field)),
      ).toContainEqual(
        expect.objectContaining({
          id: "invalid-default:f1",
          messageKey: "default_doesnt_match_type",
        }),
      );
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
