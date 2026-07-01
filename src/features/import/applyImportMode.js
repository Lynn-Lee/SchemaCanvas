import { normalizeDiagram } from "../../domain/normalizeDiagram";

export const IMPORT_MODE = {
  OVERWRITE: "overwrite",
  MERGE: "merge",
  NEW: "new",
};

const RESET_TRANSFORM = {
  pan: { x: 0, y: 0 },
  zoom: 1,
};

const entityCollections = [
  "tables",
  "relationships",
  "notes",
  "areas",
  "types",
  "enums",
];

const collectIds = (diagram) => {
  const ids = new Set();

  for (const collection of entityCollections) {
    for (const entity of diagram[collection] ?? []) {
      if (entity.id !== undefined && entity.id !== null) {
        ids.add(String(entity.id));
      }
      if (collection === "tables") {
        for (const field of entity.fields ?? []) {
          if (field.id !== undefined && field.id !== null) {
            ids.add(String(field.id));
          }
        }
      }
    }
  }

  return ids;
};

const uniqueId = (baseId, usedIds) => {
  let candidate = `${baseId}_imported`;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${baseId}_imported_${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
};

const remapId = ({ id, idMap, usedIds }) => {
  const normalizedId = String(id);
  if (!usedIds.has(normalizedId)) {
    usedIds.add(normalizedId);
    return normalizedId;
  }

  const nextId = uniqueId(normalizedId, usedIds);
  idMap.set(normalizedId, nextId);
  return nextId;
};

const mapReference = (id, idMap) => {
  const normalizedId = String(id);
  return idMap.get(normalizedId) ?? normalizedId;
};

const remapImportedDiagram = ({ currentDiagram, importedDiagram }) => {
  const usedIds = collectIds(currentDiagram);
  const idMap = new Map();

  const tables = importedDiagram.tables.map((table) => {
    const tableId = remapId({ id: table.id, idMap, usedIds });
    const fields = table.fields.map((field) => ({
      ...field,
      id: remapId({ id: field.id, idMap, usedIds }),
    }));

    return {
      ...table,
      id: tableId,
      fields,
    };
  });

  const remapEntityCollection = (collection) =>
    importedDiagram[collection].map((entity) => ({
      ...entity,
      id: remapId({ id: entity.id, idMap, usedIds }),
    }));

  const relationships = importedDiagram.relationships.map((relationship) => ({
    ...relationship,
    id: remapId({ id: relationship.id, idMap, usedIds }),
    startTableId: mapReference(relationship.startTableId, idMap),
    startFieldId: mapReference(relationship.startFieldId, idMap),
    endTableId: mapReference(relationship.endTableId, idMap),
    endFieldId: mapReference(relationship.endFieldId, idMap),
    fields: relationship.fields?.map((field) => ({
      ...field,
      startFieldId: mapReference(field.startFieldId, idMap),
      endFieldId: mapReference(field.endFieldId, idMap),
    })),
  }));

  return {
    ...importedDiagram,
    tables,
    relationships,
    notes: remapEntityCollection("notes"),
    areas: remapEntityCollection("areas"),
    types: remapEntityCollection("types"),
    enums: remapEntityCollection("enums"),
  };
};

export function applyImportMode({ currentDiagram, importedDiagram, mode }) {
  const current = normalizeDiagram(currentDiagram);
  const imported = normalizeDiagram(importedDiagram);

  if (mode === IMPORT_MODE.NEW) {
    return {
      isNewDiagram: true,
      diagram: {
        ...imported,
        ...RESET_TRANSFORM,
      },
    };
  }

  if (mode === IMPORT_MODE.MERGE) {
    const remappedImport = remapImportedDiagram({
      currentDiagram: current,
      importedDiagram: imported,
    });

    return {
      isNewDiagram: false,
      diagram: {
        ...current,
        tables: [...current.tables, ...remappedImport.tables],
        relationships: [
          ...current.relationships,
          ...remappedImport.relationships,
        ],
        notes: [...current.notes, ...remappedImport.notes],
        areas: [...current.areas, ...remappedImport.areas],
        types: [...current.types, ...remappedImport.types],
        enums: [...current.enums, ...remappedImport.enums],
      },
    };
  }

  return {
    isNewDiagram: false,
    diagram: {
      ...imported,
      diagramId: current.diagramId,
      ...RESET_TRANSFORM,
    },
  };
}
