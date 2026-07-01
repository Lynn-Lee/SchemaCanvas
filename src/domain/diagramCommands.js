import {
  createArea,
  createEnum,
  createField,
  createNote,
  createRelationship,
  createTable,
  createType,
} from "./diagramModel";

const collectionByObjectType = {
  table: "tables",
  relationship: "relationships",
  note: "notes",
  area: "areas",
  enum: "enums",
  type: "types",
};

const messageKeys = {
  create: {
    table: "table_created",
    relationship: "relationship_created",
    note: "note_created",
    area: "area_created",
    enum: "enum_created",
    type: "type_created",
  },
  update: {
    table: "table_updated",
    field: "field_updated",
    relationship: "relationship_updated",
    note: "note_updated",
    area: "area_updated",
    enum: "enum_updated",
    type: "type_updated",
    viewport: "viewport_updated",
  },
  delete: {
    table: "table_deleted",
    field: "field_deleted",
    relationship: "relationship_deleted",
    note: "note_deleted",
    area: "area_deleted",
    enum: "enum_deleted",
    type: "type_deleted",
  },
};

const factoryByObjectType = {
  table: createTable,
  relationship: createRelationship,
  note: createNote,
  area: createArea,
  enum: createEnum,
  type: createType,
};

const idKeyByObjectType = {
  table: "tableId",
  relationship: "relationshipId",
  note: "noteId",
  area: "areaId",
  enum: "enumId",
  type: "typeId",
};

function parseCommandType(type) {
  const [objectType, action] = String(type ?? "").split(".");
  return { objectType, action };
}

function cloneEntity(objectType, entity) {
  return factoryByObjectType[objectType](entity);
}

function getCommandEntity(objectType, payload) {
  return payload[objectType] ?? payload.entity;
}

function getCommandId(objectType, payload) {
  return String(payload[idKeyByObjectType[objectType]] ?? payload.id);
}

function getCollection(diagram, objectType) {
  return diagram[collectionByObjectType[objectType]] ?? [];
}

function createEntity(diagram, objectType, payload) {
  const entity = cloneEntity(objectType, getCommandEntity(objectType, payload));
  const collectionName = collectionByObjectType[objectType];

  return {
    diagram: {
      ...diagram,
      [collectionName]: [...getCollection(diagram, objectType), entity],
    },
    inverseCommand: {
      type: `${objectType}.delete`,
      payload: { [idKeyByObjectType[objectType]]: entity.id },
    },
    messageKey: messageKeys.create[objectType],
  };
}

function updateEntity(diagram, objectType, payload) {
  const collectionName = collectionByObjectType[objectType];
  const entityId = getCommandId(objectType, payload);
  let previousEntity;
  const nextCollection = getCollection(diagram, objectType).map((entity) => {
    if (String(entity.id) !== entityId) return entity;
    previousEntity = entity;
    return cloneEntity(objectType, { ...entity, ...payload.changes });
  });

  if (!previousEntity) {
    throw new Error(`${objectType} not found: ${entityId}`);
  }

  return {
    diagram: { ...diagram, [collectionName]: nextCollection },
    inverseCommand: {
      type: `${objectType}.update`,
      payload: {
        [idKeyByObjectType[objectType]]: entityId,
        changes: Object.fromEntries(
          Object.keys(payload.changes ?? {}).map((key) => [key, previousEntity[key]]),
        ),
      },
    },
    messageKey: messageKeys.update[objectType],
  };
}

function deleteEntity(diagram, objectType, payload) {
  const collectionName = collectionByObjectType[objectType];
  const entityId = getCommandId(objectType, payload);
  let deletedEntity;
  const nextCollection = getCollection(diagram, objectType).filter((entity) => {
    if (String(entity.id) !== entityId) return true;
    deletedEntity = entity;
    return false;
  });

  if (!deletedEntity) {
    throw new Error(`${objectType} not found: ${entityId}`);
  }

  return {
    diagram: { ...diagram, [collectionName]: nextCollection },
    inverseCommand: {
      type: `${objectType}.create`,
      payload: { [objectType]: cloneEntity(objectType, deletedEntity) },
    },
    messageKey: messageKeys.delete[objectType],
  };
}

function updateField(diagram, payload) {
  const tableId = String(payload.tableId);
  const fieldId = String(payload.fieldId);
  let previousField;

  const tables = diagram.tables.map((table) => {
    if (String(table.id) !== tableId) return table;

    return {
      ...table,
      fields: table.fields.map((field) => {
        if (String(field.id) !== fieldId) return field;
        previousField = field;
        return createField({ ...field, ...payload.changes });
      }),
    };
  });

  if (!previousField) {
    throw new Error(`field not found: ${tableId}.${fieldId}`);
  }

  return {
    diagram: { ...diagram, tables },
    inverseCommand: {
      type: "field.update",
      payload: {
        tableId,
        fieldId,
        changes: Object.fromEntries(
          Object.keys(payload.changes ?? {}).map((key) => [key, previousField[key]]),
        ),
      },
    },
    messageKey: messageKeys.update.field,
  };
}

function createFieldInTable(diagram, payload) {
  const tableId = String(payload.tableId);
  const field = createField(payload.field);
  let tableFound = false;

  const tables = diagram.tables.map((table) => {
    if (String(table.id) !== tableId) return table;
    tableFound = true;
    return { ...table, fields: [...table.fields, field] };
  });

  if (!tableFound) {
    throw new Error(`table not found: ${tableId}`);
  }

  return {
    diagram: { ...diagram, tables },
    inverseCommand: {
      type: "field.delete",
      payload: { tableId, fieldId: field.id },
    },
    messageKey: "field_created",
  };
}

function deleteField(diagram, payload) {
  const tableId = String(payload.tableId);
  const fieldId = String(payload.fieldId);
  let deletedField;

  const tables = diagram.tables.map((table) => {
    if (String(table.id) !== tableId) return table;

    return {
      ...table,
      fields: table.fields.filter((field) => {
        if (String(field.id) !== fieldId) return true;
        deletedField = field;
        return false;
      }),
    };
  });

  if (!deletedField) {
    throw new Error(`field not found: ${tableId}.${fieldId}`);
  }

  return {
    diagram: { ...diagram, tables },
    inverseCommand: {
      type: "field.create",
      payload: { tableId, field: createField(deletedField) },
    },
    messageKey: messageKeys.delete.field,
  };
}

function updateViewport(diagram, payload) {
  const previous = { pan: diagram.pan, zoom: diagram.zoom };
  return {
    diagram: {
      ...diagram,
      pan: payload.pan ?? diagram.pan,
      zoom: payload.zoom ?? diagram.zoom,
    },
    inverseCommand: {
      type: "viewport.update",
      payload: previous,
    },
    messageKey: messageKeys.update.viewport,
  };
}

export function applyCommand(diagram, command) {
  const { objectType, action } = parseCommandType(command.type);
  const payload = command.payload ?? {};

  if (objectType === "field") {
    if (action === "create") return createFieldInTable(diagram, payload);
    if (action === "update") return updateField(diagram, payload);
    if (action === "delete") return deleteField(diagram, payload);
  }

  if (objectType === "viewport" && action === "update") {
    return updateViewport(diagram, payload);
  }

  if (collectionByObjectType[objectType]) {
    if (action === "create") return createEntity(diagram, objectType, payload);
    if (action === "update") return updateEntity(diagram, objectType, payload);
    if (action === "delete") return deleteEntity(diagram, objectType, payload);
  }

  throw new Error(`Unsupported diagram command: ${command.type}`);
}
