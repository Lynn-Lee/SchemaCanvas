import { describe, expect, it } from "vitest";

import { DB, IMPORT_FROM } from "../../data/constants";
import { importDiagramFileContent } from "./importDiagramService";

const createField = (id, name = "id") => ({
  id,
  name,
  type: "INTEGER",
  default: "",
  check: "",
  primary: name === "id",
  unique: name === "id",
  notNull: name === "id",
  increment: false,
  comment: "",
});

const createTable = (id, name, fields = [createField(`${id}_id`)]) => ({
  id,
  name,
  x: 0,
  y: 0,
  fields,
  comment: "",
  indices: [],
  uniqueConstraints: [],
  color: "#175e7a",
});

const validDiagram = (overrides = {}) => ({
  title: "Imported diagram",
  database: DB.GENERIC,
  tables: [
    createTable("users", "users", [
      createField("users_id", "id"),
      createField("users_org_id", "organization_id"),
    ]),
    createTable("organizations", "organizations", [createField("org_id", "id")]),
  ],
  relationships: [
    {
      id: "fk_users_organizations",
      name: "fk_users_organizations",
      startTableId: "users",
      startFieldId: "users_org_id",
      endTableId: "organizations",
      endFieldId: "org_id",
      cardinality: "many_to_one",
      updateConstraint: "No action",
      deleteConstraint: "No action",
    },
  ],
  notes: [],
  subjectAreas: [],
  types: [],
  enums: [],
  ...overrides,
});

describe("importDiagramFileContent", () => {
  it("imports valid JSON diagram content with a normalized preview", () => {
    const result = importDiagramFileContent({
      content: JSON.stringify(validDiagram()),
      fileName: "schema.json",
      fileType: "application/json",
      importFrom: IMPORT_FROM.JSON,
      currentDatabase: DB.GENERIC,
    });

    expect(result.ok).toBe(true);
    expect(result.diagram.database).toBe(DB.GENERIC);
    expect(result.diagram.tables.map((table) => table.name)).toEqual([
      "users",
      "organizations",
    ]);
    expect(result.preview).toEqual({
      tables: 2,
      relationships: 1,
      types: 0,
      enums: 0,
      warnings: 0,
    });
    expect(result.issues).toEqual([]);
  });

  it("imports valid DDB content using the same service path", () => {
    const result = importDiagramFileContent({
      content: JSON.stringify(
        validDiagram({
          author: "drawDB",
          project: "demo",
          date: "2026-07-01",
        }),
      ),
      fileName: "schema.ddb",
      fileType: "",
      importFrom: IMPORT_FROM.JSON,
      currentDatabase: DB.GENERIC,
    });

    expect(result.ok).toBe(true);
    expect(result.diagram.name).toBe("Imported diagram");
    expect(result.preview.tables).toBe(2);
  });

  it("imports DBML content and returns table, relationship, and enum preview", () => {
    const result = importDiagramFileContent({
      content: `
        Enum user_status {
          active
          blocked
        }

        Table organizations {
          id integer [pk]
        }

        Table users {
          id integer [pk]
          organization_id integer [not null]
          status user_status
        }

        Ref: users.organization_id > organizations.id
      `,
      fileName: "schema.dbml",
      fileType: "",
      importFrom: IMPORT_FROM.DBML,
      currentDatabase: DB.GENERIC,
    });

    expect(result.ok).toBe(true);
    expect(result.diagram.tables.map((table) => table.name).sort()).toEqual([
      "organizations",
      "users",
    ]);
    expect(result.preview).toMatchObject({
      tables: 2,
      relationships: 1,
      enums: 1,
    });
  });

  it("returns issues for invalid JSON without throwing", () => {
    const result = importDiagramFileContent({
      content: "{ invalid json",
      fileName: "broken.json",
      fileType: "application/json",
      importFrom: IMPORT_FROM.JSON,
      currentDatabase: DB.GENERIC,
    });

    expect(result.ok).toBe(false);
    expect(result.diagram).toBeNull();
    expect(result.issues[0]).toMatchObject({
      severity: "error",
      message: "The file contains an error.",
    });
  });

  it("rejects diagrams that do not match the open diagram database", () => {
    const result = importDiagramFileContent({
      content: JSON.stringify(validDiagram({ database: DB.MYSQL })),
      fileName: "schema.json",
      fileType: "application/json",
      importFrom: IMPORT_FROM.JSON,
      currentDatabase: DB.POSTGRES,
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toBe(
      "The imported diagram and the open diagram don't use matching databases.",
    );
  });

  it("rejects relationships that reference missing tables or fields", () => {
    const result = importDiagramFileContent({
      content: JSON.stringify(
        validDiagram({
          relationships: [
            {
              ...validDiagram().relationships[0],
              startFieldId: "missing_field",
            },
          ],
        }),
      ),
      fileName: "schema.json",
      fileType: "application/json",
      importFrom: IMPORT_FROM.JSON,
      currentDatabase: DB.GENERIC,
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({
      objectType: "relationship",
      message: "Relationship fk_users_organizations references a field that does not exist.",
    });
  });
});
