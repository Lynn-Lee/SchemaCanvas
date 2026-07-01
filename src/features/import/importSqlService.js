import { Parser } from "node-sql-parser";
import { Parser as OracleParser } from "oracle-sql-parser";
import { DB } from "../../data/constants";
import { normalizeDiagram } from "../../domain/normalizeDiagram";
import { validateDiagram } from "../../domain/validateDiagram";
import { importSQL } from "../../utils/importSQL";
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
    message: `SQL statement type "${statement?.type ?? "unknown"}" is not imported yet.`,
    fixHint: "Only table, index, and supported foreign key statements are imported in this phase.",
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

function parseMssql(sql) {
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

function parseSql({ sql, dialect }) {
  if (dialect === DB.ORACLESQL) {
    return new OracleParser().parse(sql);
  }

  if (dialect === DB.MSSQL) {
    return parseMssql(sql);
  }

  return new Parser().astify(sql, { database: dialect });
}

export function importSqlText({ sql, dialect, diagramDatabase }) {
  if (!sql || sql.trim() === "") {
    return failed(
      issue({
        id: "empty-sql",
        message: "SQL input is empty.",
        fixHint: "Paste SQL text or upload a .sql file before importing.",
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
    ast = parseSql({ sql, dialect });
  } catch (error) {
    return failed(
      issue({
        id: "invalid-sql",
        message: formatParserError(error),
        fixHint: "Fix the SQL syntax or remove unsupported statements before importing.",
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
        message: "Please check for syntax errors or let us know about the error.",
        fixHint: "Try importing a smaller SQL file or remove unsupported statements.",
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
