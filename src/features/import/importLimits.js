const MB = 1024 * 1024;

export const IMPORT_LIMITS = {
  maxFileBytes: 5 * MB,
  maxTextBytes: 2 * MB,
  maxTables: 500,
  maxFields: 10000,
  maxRelationships: 5000,
  maxStringLength: 10000,
};

const byteLength = (value) => new TextEncoder().encode(value ?? "").length;

const formatMB = (bytes) => `${Math.round(bytes / MB)} MB`;

const ok = () => ({ ok: true });

const error = (message) => ({ ok: false, message });

export function validateImportFile(file) {
  if (!file || typeof file.size !== "number") return ok();

  if (file.size > IMPORT_LIMITS.maxFileBytes) {
    return error(
      `${file.name || "Import file"} is larger than the ${formatMB(
        IMPORT_LIMITS.maxFileBytes,
      )} import limit.`,
    );
  }

  return ok();
}

export function validateImportText(text, { label = "Import" } = {}) {
  if (byteLength(text) > IMPORT_LIMITS.maxTextBytes) {
    return error(
      `${label} input is larger than the ${formatMB(
        IMPORT_LIMITS.maxTextBytes,
      )} text limit.`,
    );
  }

  return ok();
}

const countFields = (tables) =>
  tables.reduce((sum, table) => sum + (table.fields?.length ?? 0), 0);

const hasLongString = (value) => {
  if (typeof value === "string") {
    return value.length > IMPORT_LIMITS.maxStringLength;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasLongString(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => hasLongString(item));
  }

  return false;
};

export function validateDiagramImportObject(diagram) {
  const tables = Array.isArray(diagram?.tables) ? diagram.tables : [];
  const relationships = Array.isArray(diagram?.relationships)
    ? diagram.relationships
    : [];
  const fieldCount = countFields(tables);

  if (tables.length > IMPORT_LIMITS.maxTables) {
    return error(
      `Diagram import has ${tables.length} tables, above the ${IMPORT_LIMITS.maxTables} table limit.`,
    );
  }

  if (fieldCount > IMPORT_LIMITS.maxFields) {
    return error(
      `Diagram import has ${fieldCount} fields, above the ${IMPORT_LIMITS.maxFields} field limit.`,
    );
  }

  if (relationships.length > IMPORT_LIMITS.maxRelationships) {
    return error(
      `Diagram import has ${relationships.length} relationships, above the ${IMPORT_LIMITS.maxRelationships} relationship limit.`,
    );
  }

  if (hasLongString(diagram)) {
    return error(
      `Diagram import contains a string longer than the ${IMPORT_LIMITS.maxStringLength} character limit.`,
    );
  }

  return ok();
}
