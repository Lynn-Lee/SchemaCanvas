import { DB } from "../../data/constants";
import { normalizeDiagram } from "../../domain/normalizeDiagram";
import { validateDiagram } from "../../domain/validateDiagram";
import { importSQL } from "../../utils/importSQL";
import i18n from "../../i18n/i18n";
import {
  validateDiagramImportObject,
  validateImportText,
} from "./importLimits";

const issue = ({
  id,
  severity = "error",
  objectType = "source",
  objectId = "",
  messageKey = id,
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

const failed = (importIssue) => ({
  ok: false,
  diagram: null,
  preview: null,
  issues: [importIssue],
});

const createPreview = (diagram, issues) => ({
  tableCount: diagram.tables.length,
  relationshipCount: diagram.relationships.length,
  typeCount: diagram.types.length,
  enumCount: diagram.enums.length,
  warningCount: issues.filter((item) => item.severity === "warning").length,
  errorCount: issues.filter((item) => item.severity === "error").length,
});

const asStatements = (ast) => (Array.isArray(ast) ? ast : [ast]);

const isSupportedStatement = (statement) => {
  if (statement?.type === "alter") return true;
  if (statement?.type !== "create") return false;

  return statement.keyword === "table" || statement.keyword === "index";
};

const unsupportedStatementIssue = (statement) =>
  issue({
    id: `unsupported-sql-statement:${statement?.type ?? "unknown"}`,
    severity: "warning",
    message: i18n.t("sql_statement_not_imported", {
      type: statement?.type ?? "unknown",
    }),
    fixHint: i18n.t("sql_statement_not_imported_fix_hint"),
  });

const formatParserError = (error) => {
  if (error.location) {
    return `${error.name} [Ln ${error.location.start.line}, Col ${error.location.start.column}]: ${error.message}`;
  }

  return error.message;
};

function parseMssqlForeignKeyAlter(statement) {
  const match = statement.match(
    /^ALTER\s+TABLE\s+(\w+)\s+ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s+\((\w+)\)\s+REFERENCES\s+(\w+)\s+\((\w+)\)$/i,
  );
  if (!match) {
    throw new Error(`Unsupported MSSQL ALTER TABLE statement: ${statement}`);
  }

  const [, startTable, startField, endTable, endField] = match;

  return {
    type: "alter",
    table: [{ table: startTable }],
    expr: [
      {
        action: "add",
        create_definitions: {
          constraint_type: "foreign key",
          definition: [{ column: startField }],
          reference_definition: {
            table: [{ table: endTable }],
            definition: [{ column: endField }],
            on_action: [],
          },
        },
      },
    ],
  };
}

async function loadSqlParsers() {
  const [{ Parser }, { Parser: OracleParser }] = await Promise.all([
    import("node-sql-parser"),
    import("oracle-sql-parser"),
  ]);

  return { Parser, OracleParser };
}

function parseMssql(sql, Parser) {
  const parser = new Parser();

  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => {
      if (/^ALTER\s+TABLE/i.test(statement)) {
        return parseMssqlForeignKeyAlter(statement);
      }

      return parser.astify(statement, { database: DB.MSSQL });
    });
}

async function parseSql({ sql, dialect }) {
  const { Parser, OracleParser } = await loadSqlParsers();

  if (dialect === DB.ORACLESQL) {
    return new OracleParser().parse(sql);
  }

  if (dialect === DB.MSSQL) {
    return parseMssql(sql, Parser);
  }

  return new Parser().astify(sql, { database: dialect });
}

export async function importSqlText({ sql, dialect, diagramDatabase }) {
  if (!sql || sql.trim() === "") {
    return failed(
      issue({
        id: "empty-sql",
        message: i18n.t("sql_input_empty"),
        fixHint: i18n.t("sql_input_empty_fix_hint"),
      }),
    );
  }

  const limitResult = validateImportText(sql, { label: "SQL" });
  if (!limitResult.ok) {
    return failed(
      issue({
        id: "sql-import-limit",
        message: limitResult.message,
      }),
    );
  }

  let ast;
  try {
    ast = await parseSql({ sql, dialect });
  } catch (error) {
    return failed(
      issue({
        id: "invalid-sql",
        message: formatParserError(error),
        fixHint: i18n.t("sql_syntax_fix_hint"),
      }),
    );
  }

  const statements = asStatements(ast);
  const supportedStatements = statements.filter(isSupportedStatement);
  const unsupportedIssues = statements
    .filter((statement) => !isSupportedStatement(statement))
    .map(unsupportedStatementIssue);

  let importedDiagram;
  try {
    importedDiagram = importSQL(
      supportedStatements,
      dialect,
      diagramDatabase ?? dialect,
    );
  } catch {
    return failed(
      issue({
        id: "sql-import-failed",
        message: i18n.t("sql_import_failed"),
        fixHint: i18n.t("sql_import_failed_fix_hint"),
      }),
    );
  }

  const limitDiagramResult = validateDiagramImportObject(importedDiagram);
  if (!limitDiagramResult.ok) {
    return failed(
      issue({
        id: "sql-diagram-import-limit",
        message: limitDiagramResult.message,
      }),
    );
  }

  const diagram = normalizeDiagram({
    ...importedDiagram,
    database: diagramDatabase ?? dialect,
  });
  const validationIssues = validateDiagram(diagram);
  const issues = [...unsupportedIssues, ...validationIssues];

  return {
    ok: !issues.some((item) => item.severity === "error"),
    diagram,
    preview: createPreview(diagram, issues),
    issues,
  };
}
