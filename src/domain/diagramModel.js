import { nanoid } from "nanoid";

import {
  Constraint,
  DB,
  defaultBlue,
  defaultNoteTheme,
  noteWidth,
} from "../data/constants";

export const CURRENT_SCHEMA_VERSION = 1;

const toId = (value) => String(value ?? nanoid());

const normalizeIdValue = (value) =>
  value === undefined || value === null ? value : String(value);

const normalizeRelationshipField = (field = {}) => ({
  ...field,
  startFieldId: normalizeIdValue(field.startFieldId),
  endFieldId: normalizeIdValue(field.endFieldId),
});

export function createField(values = {}) {
  return {
    name: "id",
    type: "INTEGER",
    default: "",
    check: "",
    primary: false,
    unique: false,
    unsigned: false,
    notNull: false,
    increment: false,
    comment: "",
    ...values,
    id: toId(values.id),
  };
}

export function createTable(values = {}) {
  const fields = values.fields?.length
    ? values.fields.map((field) => createField(field))
    : [
        createField({
          name: "id",
          primary: true,
          notNull: true,
          increment: true,
          unsigned: true,
        }),
      ];

  return {
    name: "table",
    x: 0,
    y: 0,
    locked: false,
    comment: "",
    indices: [],
    uniqueConstraints: [],
    color: defaultBlue,
    collapsed: false,
    ...values,
    id: toId(values.id),
    fields,
  };
}

export function createRelationship(values = {}) {
  return {
    name: "",
    cardinality: "",
    updateConstraint: Constraint.NONE,
    deleteConstraint: Constraint.NONE,
    ...values,
    id: toId(values.id),
    startTableId: normalizeIdValue(values.startTableId),
    startFieldId: normalizeIdValue(values.startFieldId),
    endTableId: normalizeIdValue(values.endTableId),
    endFieldId: normalizeIdValue(values.endFieldId),
    fields: values.fields?.map(normalizeRelationshipField),
  };
}

export function createNote(values = {}) {
  return {
    title: "note",
    content: "",
    x: 0,
    y: 0,
    locked: false,
    color: defaultNoteTheme,
    height: 88,
    width: noteWidth,
    ...values,
    id: toId(values.id),
  };
}

export function createArea(values = {}) {
  return {
    name: "area",
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    color: defaultBlue,
    locked: false,
    ...values,
    id: toId(values.id),
  };
}

export function createType(values = {}) {
  return {
    name: "type",
    comment: "",
    ...values,
    id: toId(values.id),
    fields: values.fields ?? [],
  };
}

export function createEnum(values = {}) {
  return {
    name: "enum",
    ...values,
    id: toId(values.id),
    values: values.values ?? [],
  };
}

export function createDiagram(values = {}) {
  const relationships = values.relationships ?? values.references ?? [];

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    diagramId: toId(values.diagramId ?? values.id),
    name: values.name ?? values.title ?? "",
    database: values.database ?? DB.GENERIC,
    tables: (values.tables ?? []).map((table) => createTable(table)),
    relationships: relationships.map((relationship) =>
      createRelationship(relationship),
    ),
    notes: (values.notes ?? []).map((note) => createNote(note)),
    areas: (values.areas ?? values.subjectAreas ?? []).map((area) =>
      createArea(area),
    ),
    types: (values.types ?? []).map((type) => createType(type)),
    enums: (values.enums ?? []).map((enumValue) => createEnum(enumValue)),
    pan: values.pan ?? { x: 0, y: 0 },
    zoom: values.zoom ?? 1,
    gistId: values.gistId ?? null,
    loadedFromGistId: values.loadedFromGistId ?? null,
  };
}
