import { DB, IMPORT_FROM } from "../../data/constants";
import { normalizeDiagram } from "../../domain/normalizeDiagram";
import { validateDiagram } from "../../domain/validateDiagram";
import {
  ddbDiagramIsValid,
  jsonDiagramIsValid,
} from "../../utils/validateSchema";
import { fromDBML } from "../../utils/importFrom/dbml";
import {
  validateDiagramImportObject,
  validateImportText,
} from "./importLimits";

const errorIssue = ({ id, message, objectType = "import", objectId = "" }) => ({
  id,
  severity: "error",
  objectType,
  objectId,
  messageKey: id,
  message,
});

const failed = (issue) => ({
  ok: false,
  diagram: null,
  preview: null,
  issues: [issue],
});

const getFileExtension = (fileName = "") =>
  fileName.split(".").pop()?.toLowerCase() ?? "";

const isDdbFile = (fileName) => getFileExtension(fileName) === "ddb";

const isJsonFile = ({ fileName, fileType }) =>
  fileType === "application/json" || getFileExtension(fileName) === "json";

const createPreview = (diagram, issues) => ({
  tables: diagram.tables.length,
  relationships: diagram.relationships.length,
  types: diagram.types.length,
  enums: diagram.enums.length,
  warnings: issues.filter((issue) => issue.severity === "warning").length,
});

const formatDbmlError = (error) => {
  const firstDiagnostic = error?.diags?.[0];
  if (!firstDiagnostic) return error.message;

  return `${firstDiagnostic.name} [Ln ${firstDiagnostic.location.start.line}, Col ${firstDiagnostic.location.start.column}]: ${firstDiagnostic.message}`;
};

const parseJsonContent = (content) => {
  try {
    return { ok: true, value: JSON.parse(content) };
  } catch {
    return {
      ok: false,
      issue: errorIssue({
        id: "invalid-json",
        message: "The file contains an error.",
      }),
    };
  }
};

const validateJsonDiagramShape = ({ diagram, fileName, fileType }) => {
  if (isDdbFile(fileName)) {
    return ddbDiagramIsValid(diagram);
  }

  if (isJsonFile({ fileName, fileType })) {
    return jsonDiagramIsValid(diagram);
  }

  return true;
};

const findRelationshipReferenceIssue = (diagram) => {
  for (const relationship of diagram.relationships) {
    const startTable = diagram.tables.find(
      (table) => table.id === relationship.startTableId,
    );
    const endTable = diagram.tables.find(
      (table) => table.id === relationship.endTableId,
    );

    if (!startTable || !endTable) {
      return errorIssue({
        id: `missing-relationship-table:${relationship.id}`,
        objectType: "relationship",
        objectId: relationship.id,
        message: `Relationship ${relationship.name} references a table that does not exist.`,
      });
    }

    if (
      !startTable.fields.find((field) => field.id === relationship.startFieldId) ||
      !endTable.fields.find((field) => field.id === relationship.endFieldId)
    ) {
      return errorIssue({
        id: `missing-relationship-field:${relationship.id}`,
        objectType: "relationship",
        objectId: relationship.id,
        message: `Relationship ${relationship.name} references a field that does not exist.`,
      });
    }
  }

  return null;
};

const importJsonDiagram = ({ content, fileName, fileType, currentDatabase }) => {
  const parsed = parseJsonContent(content);
  if (!parsed.ok) return failed(parsed.issue);

  if (
    !validateJsonDiagramShape({
      diagram: parsed.value,
      fileName,
      fileType,
    })
  ) {
    return failed(
      errorIssue({
        id: "invalid-diagram-shape",
        message: "The file is missing necessary properties for a diagram.",
      }),
    );
  }

  const limitResult = validateDiagramImportObject(parsed.value);
  if (!limitResult.ok) {
    return failed(
      errorIssue({
        id: "diagram-import-limit",
        message: limitResult.message,
      }),
    );
  }

  const diagram = normalizeDiagram({
    ...parsed.value,
    database: parsed.value.database ?? DB.GENERIC,
  });

  if (diagram.database !== currentDatabase) {
    return failed(
      errorIssue({
        id: "database-mismatch",
        message:
          "The imported diagram and the open diagram don't use matching databases.",
      }),
    );
  }

  const relationshipIssue = findRelationshipReferenceIssue(diagram);
  if (relationshipIssue) return failed(relationshipIssue);

  const issues = validateDiagram(diagram);

  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    diagram,
    preview: createPreview(diagram, issues),
    issues,
  };
};

const importDbmlDiagram = ({ content }) => {
  const limitResult = validateImportText(content, { label: "DBML" });
  if (!limitResult.ok) {
    return failed(
      errorIssue({
        id: "dbml-import-limit",
        message: limitResult.message,
      }),
    );
  }

  let importedDiagram;
  try {
    importedDiagram = fromDBML(content);
  } catch (error) {
    return failed(
      errorIssue({
        id: "invalid-dbml",
        message: formatDbmlError(error),
      }),
    );
  }

  const diagram = normalizeDiagram(importedDiagram);
  const relationshipIssue = findRelationshipReferenceIssue(diagram);
  if (relationshipIssue) return failed(relationshipIssue);

  const issues = validateDiagram(diagram);

  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    diagram,
    preview: createPreview(diagram, issues),
    issues,
  };
};

export function importDiagramFileContent({
  content,
  fileName = "",
  fileType = "",
  importFrom,
  currentDatabase,
}) {
  if (importFrom === IMPORT_FROM.DBML) {
    return importDbmlDiagram({ content });
  }

  return importJsonDiagram({
    content,
    fileName,
    fileType,
    currentDatabase,
  });
}
