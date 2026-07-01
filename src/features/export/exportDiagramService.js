import { DB } from "../../data/constants";
import { normalizeDiagram } from "../../domain/normalizeDiagram";
import { toDBML } from "../../utils/exportAs/dbml";
import { exportSQL } from "../../utils/exportSQL";

const SQL_DATABASES = new Set([
  DB.MYSQL,
  DB.POSTGRES,
  DB.SQLITE,
  DB.MARIADB,
  DB.MSSQL,
  DB.ORACLESQL,
]);

function ensureTrailingNewline(value) {
  const normalized = String(value ?? "").replace(/\r\n/g, "\n");
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}

function exportableDiagram(diagram) {
  const normalized = normalizeDiagram(diagram);
  return {
    ...normalized,
    references: normalized.relationships,
  };
}

function issue(id, message) {
  return {
    id,
    severity: "error",
    objectType: "export",
    message,
  };
}

export function exportDiagram({ diagram, format }) {
  const normalizedFormat = String(format ?? "").toLowerCase();
  const model = exportableDiagram(diagram);

  if (normalizedFormat === "sql") {
    if (!SQL_DATABASES.has(model.database)) {
      return {
        ok: false,
        format: normalizedFormat,
        extension: "sql",
        content: "",
        issues: [
          issue(
            "unsupported-sql-export-database",
            "SQL export is not supported for this diagram database.",
          ),
        ],
      };
    }

    return {
      ok: true,
      format: normalizedFormat,
      extension: "sql",
      content: ensureTrailingNewline(exportSQL(model)),
      issues: [],
    };
  }

  if (normalizedFormat === "dbml") {
    return {
      ok: true,
      format: normalizedFormat,
      extension: "dbml",
      content: ensureTrailingNewline(toDBML(model)),
      issues: [],
    };
  }

  return {
    ok: false,
    format: normalizedFormat,
    extension: "",
    content: "",
    issues: [
      issue(
        "unsupported-export-format",
        "The requested export format is not supported.",
      ),
    ],
  };
}
