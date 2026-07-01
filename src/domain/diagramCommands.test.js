import { describe, expect, it } from "vitest";

import {
  createArea,
  createDiagram,
  createEnum,
  createField,
  createNote,
  createRelationship,
  createTable,
  createType,
} from "./diagramModel";
import { applyCommand } from "./diagramCommands";

describe("diagramCommands", () => {
  it("creates a table immutably and returns a delete inverse", () => {
    const diagram = createDiagram({ diagramId: "d1", tables: [] });

    const result = applyCommand(diagram, {
      type: "table.create",
      payload: { table: createTable({ id: "users", name: "users" }) },
    });

    expect(result.diagram.tables).toHaveLength(1);
    expect(result.diagram.tables[0]).toMatchObject({ id: "users", name: "users" });
    expect(result.inverseCommand).toEqual({
      type: "table.delete",
      payload: { tableId: "users" },
    });
    expect(result.messageKey).toBe("table_created");
    expect(diagram.tables).toEqual([]);
  });

  it("updates a field immutably and can restore the previous field", () => {
    const diagram = createDiagram({
      diagramId: "d1",
      tables: [
        createTable({
          id: "users",
          name: "users",
          fields: [createField({ id: "email", name: "email", type: "TEXT" })],
        }),
      ],
    });

    const result = applyCommand(diagram, {
      type: "field.update",
      payload: {
        tableId: "users",
        fieldId: "email",
        changes: { name: "contact_email", notNull: true },
      },
    });

    expect(result.diagram.tables[0].fields[0]).toMatchObject({
      id: "email",
      name: "contact_email",
      notNull: true,
    });
    expect(result.inverseCommand).toEqual({
      type: "field.update",
      payload: {
        tableId: "users",
        fieldId: "email",
        changes: { name: "email", notNull: false },
      },
    });
    expect(diagram.tables[0].fields[0]).toMatchObject({
      name: "email",
      notNull: false,
    });
  });

  it("deletes a relationship and returns a create inverse", () => {
    const relationship = createRelationship({
      id: "r1",
      startTableId: "orders",
      startFieldId: "user_id",
      endTableId: "users",
      endFieldId: "id",
    });
    const diagram = createDiagram({
      diagramId: "d1",
      tables: [
        createTable({ id: "users", name: "users" }),
        createTable({ id: "orders", name: "orders" }),
      ],
      relationships: [relationship],
    });

    const result = applyCommand(diagram, {
      type: "relationship.delete",
      payload: { relationshipId: "r1" },
    });

    expect(result.diagram.relationships).toEqual([]);
    expect(result.inverseCommand).toEqual({
      type: "relationship.create",
      payload: { relationship },
    });
  });

  it("updates note, area, enum, type, and viewport commands", () => {
    const diagram = createDiagram({
      diagramId: "d1",
      notes: [createNote({ id: "n1", title: "old note" })],
      areas: [createArea({ id: "a1", name: "old area" })],
      enums: [createEnum({ id: "e1", name: "status", values: ["draft"] })],
      types: [createType({ id: "ty1", name: "money" })],
      pan: { x: 0, y: 0 },
      zoom: 1,
    });

    const noteResult = applyCommand(diagram, {
      type: "note.update",
      payload: { noteId: "n1", changes: { title: "new note" } },
    });
    const areaResult = applyCommand(noteResult.diagram, {
      type: "area.update",
      payload: { areaId: "a1", changes: { name: "new area" } },
    });
    const enumResult = applyCommand(areaResult.diagram, {
      type: "enum.update",
      payload: { enumId: "e1", changes: { values: ["draft", "published"] } },
    });
    const typeResult = applyCommand(enumResult.diagram, {
      type: "type.update",
      payload: { typeId: "ty1", changes: { name: "currency" } },
    });
    const viewportResult = applyCommand(typeResult.diagram, {
      type: "viewport.update",
      payload: { pan: { x: 10, y: 20 }, zoom: 0.75 },
    });

    expect(viewportResult.diagram.notes[0]).toMatchObject({ title: "new note" });
    expect(viewportResult.diagram.areas[0]).toMatchObject({ name: "new area" });
    expect(viewportResult.diagram.enums[0]).toMatchObject({
      values: ["draft", "published"],
    });
    expect(viewportResult.diagram.types[0]).toMatchObject({ name: "currency" });
    expect(viewportResult.diagram.pan).toEqual({ x: 10, y: 20 });
    expect(viewportResult.diagram.zoom).toBe(0.75);
    expect(viewportResult.inverseCommand).toEqual({
      type: "viewport.update",
      payload: { pan: { x: 0, y: 0 }, zoom: 1 },
    });
  });
});
