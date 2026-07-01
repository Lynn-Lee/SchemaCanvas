import { describe, expect, it } from "vitest";

import { DB } from "../../data/constants";
import { IMPORT_MODE, applyImportMode } from "./applyImportMode";

const field = (id, name = "id") => ({
  id,
  name,
  type: "INTEGER",
  primary: name === "id",
  unique: false,
  notNull: name === "id",
  increment: false,
  default: "",
  check: "",
  comment: "",
});

const table = (id, name, fields = [field(`${id}_id`)]) => ({
  id,
  name,
  x: 0,
  y: 0,
  fields,
  indices: [],
  uniqueConstraints: [],
  comment: "",
});

const diagram = (overrides = {}) => ({
  diagramId: "current-diagram",
  name: "Current diagram",
  database: DB.GENERIC,
  tables: [
    table("users", "users", [
      field("users_id", "id"),
      field("users_org_id", "organization_id"),
    ]),
  ],
  relationships: [],
  notes: [],
  areas: [],
  types: [],
  enums: [],
  pan: { x: 120, y: 80 },
  zoom: 0.75,
  ...overrides,
});

describe("applyImportMode", () => {
  it("overwrites the current diagram content while keeping the current diagram identity", () => {
    const imported = diagram({
      diagramId: "imported-diagram",
      name: "Imported diagram",
      tables: [table("orders", "orders")],
    });

    const result = applyImportMode({
      currentDiagram: diagram(),
      importedDiagram: imported,
      mode: IMPORT_MODE.OVERWRITE,
    });

    expect(result.isNewDiagram).toBe(false);
    expect(result.diagram.diagramId).toBe("current-diagram");
    expect(result.diagram.name).toBe("Imported diagram");
    expect(result.diagram.tables.map((item) => item.name)).toEqual(["orders"]);
    expect(result.diagram.pan).toEqual({ x: 0, y: 0 });
    expect(result.diagram.zoom).toBe(1);
  });

  it("merges imported entities and remaps conflicting table, field, and relationship ids", () => {
    const imported = diagram({
      diagramId: "imported-diagram",
      tables: [
        table("users", "imported_users", [
          field("users_id", "id"),
          field("users_org_id", "organization_id"),
        ]),
        table("organizations", "organizations", [field("org_id", "id")]),
      ],
      relationships: [
        {
          id: "fk_users_orgs",
          name: "fk_users_orgs",
          startTableId: "users",
          startFieldId: "users_org_id",
          endTableId: "organizations",
          endFieldId: "org_id",
        },
      ],
    });

    const result = applyImportMode({
      currentDiagram: diagram({
        relationships: [
          {
            id: "fk_users_orgs",
            name: "existing relationship",
            startTableId: "users",
            startFieldId: "users_id",
            endTableId: "users",
            endFieldId: "users_id",
          },
        ],
      }),
      importedDiagram: imported,
      mode: IMPORT_MODE.MERGE,
    });

    expect(result.isNewDiagram).toBe(false);
    expect(result.diagram.diagramId).toBe("current-diagram");
    expect(result.diagram.tables).toHaveLength(3);

    const importedUsers = result.diagram.tables.find(
      (item) => item.name === "imported_users",
    );
    expect(importedUsers.id).not.toBe("users");
    expect(importedUsers.fields.map((item) => item.id)).not.toContain(
      "users_org_id",
    );

    const importedRelationship = result.diagram.relationships.find(
      (item) => item.name === "fk_users_orgs",
    );
    expect(importedRelationship.id).not.toBe("fk_users_orgs");
    expect(importedRelationship.startTableId).toBe(importedUsers.id);
    expect(importedRelationship.startFieldId).toBe(
      importedUsers.fields.find((item) => item.name === "organization_id").id,
    );
  });

  it("marks imported content as a new diagram without preserving current content", () => {
    const result = applyImportMode({
      currentDiagram: diagram(),
      importedDiagram: diagram({
        diagramId: "imported-diagram",
        name: "Imported as new",
        tables: [table("orders", "orders")],
      }),
      mode: IMPORT_MODE.NEW,
    });

    expect(result.isNewDiagram).toBe(true);
    expect(result.diagram.diagramId).toBe("imported-diagram");
    expect(result.diagram.name).toBe("Imported as new");
    expect(result.diagram.tables.map((item) => item.name)).toEqual(["orders"]);
  });
});
