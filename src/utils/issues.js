import { validateDiagram } from "../domain/validateDiagram";

export function getIssues(diagram) {
  return validateDiagram(diagram).map((issue) => issue.message);
}
