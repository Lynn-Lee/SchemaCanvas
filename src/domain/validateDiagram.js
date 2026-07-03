import { dbToTypes } from "../data/datatypes";
import { isFunction } from "../utils/utils";

const normalizeName = (value) => String(value ?? "").trim().toLowerCase();

const objectId = (value, fallback) => String(value ?? fallback);
const MAX_DEFAULT_VALUE_LENGTH = 1000;

const issue = ({
  id,
  severity = "error",
  objectType,
  objectId,
  messageKey,
  message,
  fixHint,
}) => ({
  id,
  severity,
  objectType,
  objectId,
  messageKey,
  message,
  fixHint,
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
            message: `Duplicate table name: ${tableName}`,
            fixHint: "Rename one of the duplicate tables.",
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
          message: "Table is missing a name.",
          fixHint: "Name the table before exporting or sharing the diagram.",
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
            message: `Table ${tableName} has a field without a name.`,
            fixHint: "Name the field before exporting or sharing the diagram.",
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
            message: `Field ${fieldName || fieldId} in table ${tableName} has no type.`,
            fixHint: "Choose a data type for the field.",
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
            message: `Field ${fieldName} in table ${tableName} has no ${field.type} values.`,
            fixHint: `Add at least one ${field.type} value.`,
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
            message: `Default value for ${tableName}.${fieldName} does not match its type.`,
            fixHint: "Update the default value or choose a compatible field type.",
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
            message: `Field ${tableName}.${fieldName} is not null but defaults to null.`,
            fixHint: "Remove the null default or allow null values.",
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
              message: `Duplicate field name in table ${tableName}: ${fieldName}`,
              fixHint: "Rename one of the duplicate fields.",
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
            message: `Field ${fieldName} in table ${tableName} conflicts with an inherited field.`,
            fixHint: "Rename the local field or remove the inherited duplicate.",
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
            message: `Duplicate index name in table ${tableName}: ${indexName}`,
            fixHint: "Rename one of the duplicate indexes.",
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
            message: `Table ${tableName} has an index without a name.`,
            fixHint: "Name the index or remove it.",
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
            message: `Index ${indexName || indexId} in table ${tableName} has no fields.`,
            fixHint: "Add at least one field to the index or remove it.",
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
                message: `Index ${indexName || indexId} in table ${tableName} references a missing field: ${fieldReference}.`,
                fixHint: "Remove the missing field reference or choose an existing field.",
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
            message: `Duplicate unique constraint in table ${tableName}: ${constraintName}`,
            fixHint: "Rename one of the duplicate unique constraints.",
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
            message: `Unique constraint ${constraintName || constraintId} in table ${tableName} has no fields.`,
            fixHint: "Add at least one field to the unique constraint or remove it.",
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
                message: `Unique constraint ${constraintName || constraintId} in table ${tableName} references a missing field: ${fieldReference}.`,
                fixHint: "Remove the missing field reference or choose an existing field.",
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
          message: `Table ${tableName} has no primary key.`,
          fixHint: "Mark one stable field as the primary key.",
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
          message: "Type is missing a name.",
          fixHint: "Name the type before exporting or sharing the diagram.",
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
            message: `Duplicate type name: ${typeName}`,
            fixHint: "Rename one of the duplicate types.",
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
          message: `Type ${typeName} has no fields.`,
          fixHint: "Add at least one field to the type or remove it.",
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
            message: `Type ${typeName} has a field without a name.`,
            fixHint: "Name the type field.",
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
            message: `Field ${fieldName || fieldId} in type ${typeName} has no type.`,
            fixHint: "Choose a data type for the type field.",
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
            message: `Field ${fieldName} in type ${typeName} has no ${field.type} values.`,
            fixHint: `Add at least one ${field.type} value.`,
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
              message: `Duplicate field name in type ${typeName}: ${fieldName}`,
              fixHint: "Rename one of the duplicate type fields.",
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
          message: "Enum is missing a name.",
          fixHint: "Name the enum before exporting or sharing the diagram.",
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
            message: `Duplicate enum name: ${enumName}`,
            fixHint: "Rename one of the duplicate enums.",
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
          message: `Enum ${enumName} has no values.`,
          fixHint: "Add at least one enum value or remove it.",
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
              message: `Duplicate enum value in ${enumName}: ${value}`,
              fixHint: "Remove or rename one of the duplicate enum values.",
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
          message: `Duplicate relationship name: ${relationshipName}`,
          fixHint: "Rename one of the duplicate relationships.",
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

      if (!table) {
        issues.push(
          issue({
            id: `missing-relationship-table:${relationshipId}:${direction}:${normalizedTableId}`,
            severity: "critical",
            objectType: "relationship",
            objectId: relationshipId,
            messageKey: "relationship_table_missing",
            message: `Relationship ${relationshipName || relationshipId} references a missing ${direction} table: ${normalizedTableId}.`,
            fixHint: "Reconnect the relationship to an existing table or remove it.",
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
            message: `Relationship ${relationshipName || relationshipId} references a missing ${direction} field: ${normalizedFieldId}.`,
            fixHint: "Reconnect the relationship to an existing field or remove it.",
          }),
        );
      }
    });

    if (Array.isArray(relationship.fields)) {
      relationship.fields.forEach((field, index) => {
        const startTable = tablesById.get(String(relationship.startTableId));
        const endTable = tablesById.get(String(relationship.endTableId));

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
              message: `Relationship ${relationshipName || relationshipId} references a missing start field: ${field.startFieldId}.`,
              fixHint: "Reconnect the relationship to an existing field or remove it.",
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
              message: `Relationship ${relationshipName || relationshipId} references a missing end field: ${field.endFieldId}.`,
              fixHint: "Reconnect the relationship to an existing field or remove it.",
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
          message: `Circular relationship detected at table ${table?.name ?? tableId}.`,
          fixHint: "Break the circular reference or confirm it is intentional.",
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
