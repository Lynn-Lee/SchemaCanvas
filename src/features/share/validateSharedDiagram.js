import { normalizeDiagram } from "../../domain/normalizeDiagram";
import { validateDiagram } from "../../domain/validateDiagram";
import { validateDiagramImportObject } from "../import/importLimits";
import i18n from "../../i18n/i18n";

const error = (reason, message, extra = {}) => ({
  ok: false,
  reason,
  message,
  ...extra,
});

const toNormalizedInput = (diagram) => ({
  ...diagram,
  pan: diagram?.pan ?? diagram?.transform?.pan,
  zoom: diagram?.zoom ?? diagram?.transform?.zoom,
});

export function validateSharedDiagramContent(content) {
  let parsedDiagram;

  try {
    parsedDiagram = JSON.parse(content);
  } catch (parseError) {
    return error("invalid-json", i18n.t("share_invalid_json"), {
      cause: parseError,
    });
  }

  const importValidation = validateDiagramImportObject(parsedDiagram);
  if (!importValidation.ok) {
    return error("import-limit", importValidation.message);
  }

  const diagram = normalizeDiagram(toNormalizedInput(parsedDiagram));
  const issues = validateDiagram(diagram);
  const blockingIssues = issues.filter((issue) =>
    ["critical", "error"].includes(issue.severity),
  );

  if (blockingIssues.length > 0) {
    return error(
      "diagram-validation",
      i18n.t("share_diagram_validation_failed"),
      { issues: blockingIssues },
    );
  }

  return {
    ok: true,
    diagram,
  };
}
