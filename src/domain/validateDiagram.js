import { dbToTypes } from "../data/datatypes";
import { isFunction } from "../utils/utils";
import i18n from "../i18n/i18n";

const normalizeName = (value) => String(value ?? "").trim().toLowerCase();

const objectId = (value, fallback) => String(value ?? fallback);
const MAX_DEFAULT_VALUE_LENGTH = 1000;

const directionLabel = (direction) =>
  i18n.t(
    direction === "start"
      ? "relationship_direction_start"
      : "relationship_direction_end",
  );

const issue = ({
  id,
  severity = "error",
  objectType,
  objectId,
  messageKey,
  messageParams,
  fixHintKey,
  fixHintParams,
}) => ({
  id,
  severity,
  objectType,
  objectId,
  messageKey,
  message: i18n.t(messageKey, messageParams),
  fixHint: i18n.t(fixHintKey, fixHintParams),
});

function checkDefault(field, database) {
  if (field.default === "") return true;
  if (isFunction(field.default)) return true;
  if (
    !field.notNull &&
    typeof field.default === "string" &&
    field.default.toLowerCase() === "null"
  ) {
    return true;
  }
  if (
    typeof field.default === "string" &&
    field.default.length > MAX_DEFAULT_VALUE_LENGTH
  ) {
    return false;
  }

  const checkDefaultForType = dbToTypes[database]?.[field.type]?.checkDefault;
  if (!checkDefaultForType) return true;

  return checkDefaultForType(field);
}

const fieldReferenceExists = (table, fieldReference) => {
  const reference = String(fieldReference ?? "");
  return (Array.isArray(table?.fields) ? table.fields : []).some(
    (field) => String(field.id) === reference || String(field.name) === reference,
  );
};

export function validateDiagram(diagram) {
  const issues = [];
  const tables = Array.isArray(diagram?.tables) ? diagram.tables : [];
  const relationships = Array.isArray(diagram?.relationships)
    ? diagram.relationships
    : [];
  const types = Array.isArray(diagram?.types) ? diagram.types : [];
  const enums = Array.isArray(diagram?.enums) ? diagram.enums : [];
  const tablesById = new Map(
    tables.map((table) => [String(table.id), table]),
  );
  const tableNames = new Map();

  tables.forEach((table) => {
    const tableId = String(table.id);
    const tableName = String(table.name ?? "");
    const normalizedTableName = normalizeName(table.name);

    if (normalizedTableName) {
      if (tableNames.has(normalizedTableName)) {
        issues.push(
          issue({
            id: `duplicate-table-name:${tableId}`,
            objectType: "table",
            objectId: tableId,
            messageKey: "duplicate_table_by_name",
            messageParams: { tableName },
            fixHintKey: "duplicate_table_by_name_fix_hint",
          }),
        );
      } else {
        tableNames.set(normalizedTableName, tableId);
      }
    }

    if (tableName.trim() === "") {
      issues.push(
        issue({
          id: `empty-table-name:${tableId}`,
          objectType: "table",
          objectId: tableId,
          messageKey: "table_w_no_name",
          fixHintKey: "table_w_no_name_fix_hint",
        }),
      );
    }

    const fields = Array.isArray(table.fields) ? table.fields : [];
    const inheritedFields =
      table.inherits
        ?.map((parentName) => {
          const parent = tables.find((candidate) => candidate.name === parentName);
          return parent ? parent.fields.map((field) => field.name) : [];
        })
        .flat() ?? [];
    const fieldNames = new Map();
    let hasPrimaryKey = false;

    fields.forEach((field) => {
      const fieldId = objectId(field.id, `${tableId}:${field.name}`);
      const fieldName = String(field.name ?? "");

      if (field.primary) {
        hasPrimaryKey = true;
      }

      if (fieldName.trim() === "") {
        issues.push(
          issue({
            id: `empty-field-name:${fieldId}`,
            objectType: "field",
            objectId: fieldId,
            messageKey: "empty_field_name",
            messageParams: { tableName },
            fixHintKey: "empty_field_name_fix_hint",
          }),
        );
      }

      if (String(field.type ?? "").trim() === "") {
        issues.push(
          issue({
            id: `empty-field-type:${fieldId}`,
            objectType: "field",
            objectId: fieldId,
            messageKey: "empty_field_type",
            messageParams: { tableName },
            fixHintKey: "empty_field_type_fix_hint",
          }),
        );
      } else if (
        (field.type === "ENUM" || field.type === "SET") &&
        (!field.values || field.values.length === 0)
      ) {
        issues.push(
          issue({
            id: `empty-field-values:${fieldId}`,
            objectType: "field",
            objectId: fieldId,
            messageKey: "no_values_for_field",
            messageParams: { tableName, fieldName, type: field.type },
            fixHintKey: "no_values_for_field_fix_hint",
            fixHintParams: { type: field.type },
          }),
        );
      }

      if (!checkDefault(field, diagram?.database)) {
        issues.push(
          issue({
            id: `invalid-default:${fieldId}`,
            objectType: "field",
            objectId: fieldId,
            messageKey: "default_doesnt_match_type",
            messageParams: { tableName, fieldName },
            fixHintKey: "default_doesnt_match_type_fix_hint",
          }),
        );
      }

      if (
        field.notNull &&
        typeof field.default === "string" &&
        field.default.toLowerCase() === "null"
      ) {
        issues.push(
          issue({
            id: `not-null-default-null:${fieldId}`,
            objectType: "field",
            objectId: fieldId,
            messageKey: "not_null_is_null",
            messageParams: { tableName, fieldName },
            fixHintKey: "not_null_is_null_fix_hint",
          }),
        );
      }

      const normalizedFieldName = normalizeName(field.name);
      if (normalizedFieldName) {
        if (fieldNames.has(normalizedFieldName)) {
          issues.push(
            issue({
              id: `duplicate-field-name:${fieldId}`,
              objectType: "field",
              objectId: fieldId,
              messageKey: "duplicate_fields",
              messageParams: { tableName, fieldName },
              fixHintKey: "duplicate_fields_fix_hint",
            }),
          );
        } else {
          fieldNames.set(normalizedFieldName, fieldId);
        }
      }

      if (inheritedFields.includes(field.name)) {
        issues.push(
          issue({
            id: `inherited-field-conflict:${fieldId}`,
            objectType: "field",
            objectId: fieldId,
            messageKey: "merging_column_w_inherited_definition",
            messageParams: { tableName, fieldName },
            fixHintKey: "merging_column_w_inherited_definition_fix_hint",
          }),
        );
      }
    });

    const indices = Array.isArray(table.indices) ? table.indices : [];
    const indexNames = new Map();

    indices.forEach((index) => {
      const indexId = objectId(index.id, `${tableId}:${index.name}`);
      const indexName = String(index.name ?? "");

      if (indexNames.has(indexName)) {
        issues.push(
          issue({
            id: `duplicate-index:${indexId}`,
            objectType: "index",
            objectId: indexId,
            messageKey: "duplicate_index",
            messageParams: { tableName, indexName },
            fixHintKey: "duplicate_index_fix_hint",
          }),
        );
      } else {
        indexNames.set(indexName, indexId);
      }

      if (indexName.trim() === "") {
        issues.push(
          issue({
            id: `empty-index-name:${indexId}`,
            objectType: "index",
            objectId: indexId,
            messageKey: "empty_index_name",
            messageParams: { tableName },
            fixHintKey: "empty_index_name_fix_hint",
          }),
        );
      }

      if (!Array.isArray(index.fields) || index.fields.length === 0) {
        issues.push(
          issue({
            id: `empty-index:${indexId}`,
            objectType: "index",
            objectId: indexId,
            messageKey: "empty_index",
            messageParams: { tableName },
            fixHintKey: "empty_index_fix_hint",
          }),
        );
      } else {
        index.fields.forEach((fieldReference) => {
          if (!fieldReferenceExists(table, fieldReference)) {
            issues.push(
              issue({
                id: `missing-index-field:${indexId}:${fieldReference}`,
                objectType: "index",
                objectId: indexId,
                messageKey: "index_field_missing",
                messageParams: {
                  tableName,
                  indexName: indexName || indexId,
                  fieldReference,
                },
                fixHintKey: "index_field_missing_fix_hint",
              }),
            );
          }
        });
      }
    });

    const uniqueConstraints = Array.isArray(table.uniqueConstraints)
      ? table.uniqueConstraints
      : [];
    const uniqueConstraintNames = new Map();

    uniqueConstraints.forEach((constraint) => {
      const constraintId = objectId(
        constraint.id,
        `${tableId}:${constraint.name}`,
      );
      const constraintName = String(constraint.name ?? "");

      if (uniqueConstraintNames.has(constraintName)) {
        issues.push(
          issue({
            id: `duplicate-unique-constraint:${constraintId}`,
            objectType: "index",
            objectId: constraintId,
            messageKey: "duplicate_index",
            messageParams: { tableName, indexName: constraintName },
            fixHintKey: "duplicate_unique_constraint_fix_hint",
          }),
        );
      } else {
        uniqueConstraintNames.set(constraintName, constraintId);
      }

      if (!Array.isArray(constraint.fields) || constraint.fields.length === 0) {
        issues.push(
          issue({
            id: `empty-unique-constraint:${constraintId}`,
            objectType: "index",
            objectId: constraintId,
            messageKey: "empty_index",
            messageParams: { tableName },
            fixHintKey: "empty_unique_constraint_fix_hint",
          }),
        );
      } else {
        constraint.fields.forEach((fieldReference) => {
          if (!fieldReferenceExists(table, fieldReference)) {
            issues.push(
              issue({
                id: `missing-unique-constraint-field:${constraintId}:${fieldReference}`,
                objectType: "index",
                objectId: constraintId,
                messageKey: "unique_constraint_field_missing",
                messageParams: {
                  tableName,
                  constraintName: constraintName || constraintId,
                  fieldReference,
                },
                fixHintKey: "index_field_missing_fix_hint",
              }),
            );
          }
        });
      }
    });

    if (!hasPrimaryKey) {
      issues.push(
        issue({
          id: `missing-primary-key:${tableId}`,
          severity: "warning",
          objectType: "table",
          objectId: tableId,
          messageKey: "no_primary_key",
          messageParams: { tableName },
          fixHintKey: "no_primary_key_fix_hint",
        }),
      );
    }
  });

  const typeNames = new Map();

  types.forEach((type) => {
    const typeId = objectId(type.id, type.name);
    const typeName = String(type.name ?? "");

    if (typeName.trim() === "") {
      issues.push(
        issue({
          id: `empty-type-name:${typeId}`,
          objectType: "type",
          objectId: typeId,
          messageKey: "type_with_no_name",
          fixHintKey: "type_with_no_name_fix_hint",
        }),
      );
    }

    const normalizedTypeName = normalizeName(type.name);
    if (normalizedTypeName) {
      if (typeNames.has(normalizedTypeName)) {
        issues.push(
          issue({
            id: `duplicate-type-name:${typeId}`,
            objectType: "type",
            objectId: typeId,
            messageKey: "duplicate_types",
            messageParams: { typeName },
            fixHintKey: "duplicate_types_fix_hint",
          }),
        );
      } else {
        typeNames.set(normalizedTypeName, typeId);
      }
    }

    const typeFields = Array.isArray(type.fields) ? type.fields : [];
    if (typeFields.length === 0) {
      issues.push(
        issue({
          id: `empty-type-fields:${typeId}`,
          objectType: "type",
          objectId: typeId,
          messageKey: "type_w_no_fields",
          messageParams: { typeName },
          fixHintKey: "type_w_no_fields_fix_hint",
        }),
      );
      return;
    }

    const typeFieldNames = new Map();
    typeFields.forEach((field) => {
      const fieldId = objectId(field.id, `${typeId}:${field.name}`);
      const fieldName = String(field.name ?? "");

      if (fieldName.trim() === "") {
        issues.push(
          issue({
            id: `empty-type-field-name:${fieldId}`,
            objectType: "field",
            objectId: fieldId,
            messageKey: "empty_type_field_name",
            messageParams: { typeName },
            fixHintKey: "empty_type_field_name_fix_hint",
          }),
        );
      }

      if (String(field.type ?? "").trim() === "") {
        issues.push(
          issue({
            id: `empty-type-field-type:${fieldId}`,
            objectType: "field",
            objectId: fieldId,
            messageKey: "empty_type_field_type",
            messageParams: { typeName },
            fixHintKey: "empty_type_field_type_fix_hint",
          }),
        );
      } else if (
        (field.type === "ENUM" || field.type === "SET") &&
        (!field.values || field.values.length === 0)
      ) {
        issues.push(
          issue({
            id: `empty-type-field-values:${fieldId}`,
            objectType: "field",
            objectId: fieldId,
            messageKey: "no_values_for_type_field",
            messageParams: { typeName, fieldName, type: field.type },
            fixHintKey: "no_values_for_field_fix_hint",
            fixHintParams: { type: field.type },
          }),
        );
      }

      const normalizedFieldName = normalizeName(field.name);
      if (normalizedFieldName) {
        if (typeFieldNames.has(normalizedFieldName)) {
          issues.push(
            issue({
              id: `duplicate-type-field-name:${fieldId}`,
              objectType: "field",
              objectId: fieldId,
              messageKey: "duplicate_type_fields",
              messageParams: { typeName, fieldName },
              fixHintKey: "duplicate_type_fields_fix_hint",
            }),
          );
        } else {
          typeFieldNames.set(normalizedFieldName, fieldId);
        }
      }
    });
  });

  const enumNames = new Map();

  enums.forEach((enumValue) => {
    const enumId = objectId(enumValue.id, enumValue.name);
    const enumName = String(enumValue.name ?? "");

    if (enumName.trim() === "") {
      issues.push(
        issue({
          id: `empty-enum-name:${enumId}`,
          objectType: "enum",
          objectId: enumId,
          messageKey: "enum_w_no_name",
          fixHintKey: "enum_w_no_name_fix_hint",
        }),
      );
    }

    const normalizedEnumName = normalizeName(enumValue.name);
    if (normalizedEnumName) {
      if (enumNames.has(normalizedEnumName)) {
        issues.push(
          issue({
            id: `duplicate-enum-name:${enumId}`,
            objectType: "enum",
            objectId: enumId,
            messageKey: "duplicate_enums",
            messageParams: { enumName },
            fixHintKey: "duplicate_enums_fix_hint",
          }),
        );
      } else {
        enumNames.set(normalizedEnumName, enumId);
      }
    }

    if (!Array.isArray(enumValue.values) || enumValue.values.length === 0) {
      issues.push(
        issue({
          id: `empty-enum-values:${enumId}`,
          objectType: "enum",
          objectId: enumId,
          messageKey: "enum_w_no_values",
          messageParams: { enumName },
          fixHintKey: "enum_w_no_values_fix_hint",
        }),
      );
    } else {
      const enumValues = new Map();
      enumValue.values.forEach((value) => {
        const normalizedValue = normalizeName(value);
        if (!normalizedValue) return;
        if (enumValues.has(normalizedValue)) {
          issues.push(
            issue({
              id: `duplicate-enum-value:${enumId}:${normalizedValue}`,
              objectType: "enum",
              objectId: enumId,
              messageKey: "duplicate_enum_values",
              messageParams: { enumName, value },
              fixHintKey: "duplicate_enum_values_fix_hint",
            }),
          );
        } else {
          enumValues.set(normalizedValue, value);
        }
      });
    }
  });

  const relationshipNames = new Map();

  relationships.forEach((relationship) => {
    const relationshipId = objectId(relationship.id, relationship.name);
    const relationshipName = String(relationship.name ?? "");

    if (relationshipNames.has(relationshipName)) {
      issues.push(
        issue({
          id: `duplicate-relationship-name:${relationshipId}`,
          objectType: "relationship",
          objectId: relationshipId,
          messageKey: "duplicate_reference",
          messageParams: { refName: relationshipName },
          fixHintKey: "duplicate_reference_fix_hint",
        }),
      );
    } else {
      relationshipNames.set(relationshipName, relationshipId);
    }

    const relationshipTables = [
      {
        direction: "start",
        tableId: relationship.startTableId,
        fieldId: relationship.startFieldId,
      },
      {
        direction: "end",
        tableId: relationship.endTableId,
        fieldId: relationship.endFieldId,
      },
    ];

    relationshipTables.forEach(({ direction, tableId, fieldId }) => {
      const normalizedTableId = String(tableId ?? "");
      const table = tablesById.get(normalizedTableId);
      const refName = relationshipName || relationshipId;

      if (!table) {
        issues.push(
          issue({
            id: `missing-relationship-table:${relationshipId}:${direction}:${normalizedTableId}`,
            severity: "critical",
            objectType: "relationship",
            objectId: relationshipId,
            messageKey: "relationship_table_missing",
            messageParams: {
              refName,
              direction: directionLabel(direction),
              tableId: normalizedTableId,
            },
            fixHintKey: "relationship_table_missing_fix_hint",
          }),
        );
        return;
      }

      const normalizedFieldId = String(fieldId ?? "");
      if (!fieldReferenceExists(table, normalizedFieldId)) {
        issues.push(
          issue({
            id: `missing-relationship-field:${relationshipId}:${direction}:${normalizedFieldId}`,
            severity: "critical",
            objectType: "relationship",
            objectId: relationshipId,
            messageKey: "relationship_field_missing",
            messageParams: {
              refName,
              direction: directionLabel(direction),
              fieldId: normalizedFieldId,
            },
            fixHintKey: "relationship_field_missing_fix_hint",
          }),
        );
      }
    });

    if (Array.isArray(relationship.fields)) {
      relationship.fields.forEach((field, index) => {
        const startTable = tablesById.get(String(relationship.startTableId));
        const endTable = tablesById.get(String(relationship.endTableId));
        const refName = relationshipName || relationshipId;

        if (
          startTable &&
          !fieldReferenceExists(startTable, field.startFieldId)
        ) {
          issues.push(
            issue({
              id: `missing-relationship-field:${relationshipId}:start:${field.startFieldId ?? index}`,
              severity: "critical",
              objectType: "relationship",
              objectId: relationshipId,
              messageKey: "relationship_field_missing",
              messageParams: {
                refName,
                direction: directionLabel("start"),
                fieldId: field.startFieldId,
              },
              fixHintKey: "relationship_field_missing_fix_hint",
            }),
          );
        }

        if (endTable && !fieldReferenceExists(endTable, field.endFieldId)) {
          issues.push(
            issue({
              id: `missing-relationship-field:${relationshipId}:end:${field.endFieldId ?? index}`,
              severity: "critical",
              objectType: "relationship",
              objectId: relationshipId,
              messageKey: "relationship_field_missing",
              messageParams: {
                refName,
                direction: directionLabel("end"),
                fieldId: field.endFieldId,
              },
              fixHintKey: "relationship_field_missing_fix_hint",
            }),
          );
        }
      });
    }
  });

  const visitedTables = new Set();

  function checkCircularRelationships(tableId, visited = []) {
    if (visited.includes(tableId)) {
      const table = tables.find((candidate) => candidate.id === tableId);
      issues.push(
        issue({
          id: `circular-relationship:${tableId}`,
          objectType: "table",
          objectId: String(tableId),
          messageKey: "circular_dependency",
          messageParams: { refName: table?.name ?? tableId },
          fixHintKey: "circular_dependency_fix_hint",
        }),
      );
      return;
    }

    visited.push(tableId);
    visitedTables.add(tableId);

    relationships.forEach((relationship) => {
      if (
        relationship.startTableId === tableId &&
        relationship.startTableId !== relationship.endTableId
      ) {
        checkCircularRelationships(relationship.endTableId, [...visited]);
      }
    });
  }

  tables.forEach((table) => {
    if (!visitedTables.has(table.id)) {
      checkCircularRelationships(table.id);
    }
  });

  return issues;
}
