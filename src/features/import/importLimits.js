import i18n from "../../i18n/i18n";

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
      i18n.t("import_file_too_large", {
        fileName: file.name || i18n.t("import_file_default_name"),
        limit: formatMB(IMPORT_LIMITS.maxFileBytes),
      }),
    );
  }

  return ok();
}

export function validateImportText(text, { label = i18n.t("import_default_label") } = {}) {
  if (byteLength(text) > IMPORT_LIMITS.maxTextBytes) {
    return error(
      i18n.t("import_text_too_large", {
        label,
        limit: formatMB(IMPORT_LIMITS.maxTextBytes),
      }),
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
      i18n.t("import_too_many_tables", {
        count: tables.length,
        limit: IMPORT_LIMITS.maxTables,
      }),
    );
  }

  if (fieldCount > IMPORT_LIMITS.maxFields) {
    return error(
      i18n.t("import_too_many_fields", {
        count: fieldCount,
        limit: IMPORT_LIMITS.maxFields,
      }),
    );
  }

  if (relationships.length > IMPORT_LIMITS.maxRelationships) {
    return error(
      i18n.t("import_too_many_relationships", {
        count: relationships.length,
        limit: IMPORT_LIMITS.maxRelationships,
      }),
    );
  }

  if (hasLongString(diagram)) {
    return error(
      i18n.t("import_string_too_long", {
        limit: IMPORT_LIMITS.maxStringLength,
      }),
    );
  }

  return ok();
}
