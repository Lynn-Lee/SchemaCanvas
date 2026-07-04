export const DIAGRAMS_V67_STORE_SCHEMA =
  "++id, lastModified, loadedFromGistId, diagramId";
export const DIAGRAMS_UNIQUE_STORE_SCHEMA =
  "++id, lastModified, loadedFromGistId, &diagramId";

export const TEMPLATES_STORE_SCHEMA = "++id, custom, templateId";

export const DIAGRAMS_UNIQUE_PREP_VERSION = 68;
export const DIAGRAMS_UNIQUE_INDEX_VERSION = 69;
export const CURRENT_INDEXEDDB_VERSION = DIAGRAMS_UNIQUE_INDEX_VERSION;

export const INDEXEDDB_VERSION_JUMP_NOTE =
  "Lynn Lee's independent refactor baseline starts at Dexie version 67; this repository has no v1-v66 schema history to replay.";

export async function backfillStableIds(tx) {
  const diagramIds = new Set();
  await tx.diagrams.toCollection().modify((diagram) => {
    if (!diagram.diagramId || diagramIds.has(diagram.diagramId)) {
      diagram.diagramId = createUniqueStableId(diagramIds);
    }
    diagramIds.add(diagram.diagramId);
  });
  await tx.templates.toCollection().modify((template) => {
    if (!template.templateId) {
      template.templateId = crypto.randomUUID();
    }
  });
}

function createUniqueStableId(existingIds) {
  let stableId = crypto.randomUUID();
  while (existingIds.has(stableId)) {
    stableId = crypto.randomUUID();
  }
  return stableId;
}

export function logSeedError(error, env = import.meta.env) {
  if (env.DEV || env.dev) {
    console.error(error);
  }
}
