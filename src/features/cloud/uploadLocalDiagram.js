import { normalizeDiagram } from "../../domain/normalizeDiagram";

function normalizeUploadSuccess(result) {
  const diagram = result.diagram ?? result.cloudDiagram ?? result;
  return {
    ok: true,
    cloudDiagramId: diagram.id ?? diagram.diagramId ?? result.cloudDiagramId,
    modifiedAt: diagram.modifiedAt ?? diagram.lastModified ?? result.modifiedAt,
    permission: diagram.permission ?? result.permission,
  };
}

export async function uploadLocalDiagram({ repository, diagram }) {
  if (typeof repository?.saveCloudDiagram !== "function") {
    return {
      ok: false,
      reason: "unavailable",
      message: "Cloud upload is not configured for this SchemaCanvas instance.",
    };
  }

  try {
    const result = await repository.saveCloudDiagram(normalizeDiagram(diagram));
    if (!result?.ok) {
      return {
        ok: false,
        reason: result?.reason ?? "error",
        message: result?.message,
      };
    }
    return normalizeUploadSuccess(result);
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error?.message,
    };
  }
}
