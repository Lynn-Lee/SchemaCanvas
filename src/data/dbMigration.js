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

export const LEGACY_DATABASE_NAME = "drawDB";
export const CURRENT_DATABASE_NAME = "SchemaCanvas";
export const LEGACY_MIGRATION_FLAG_KEY = "schemaCanvasLegacyDrawDbMigrationDone";

// The product was renamed from drawDB to SchemaCanvas on 2026-07-04. Dexie
// identifies a database by name, so renaming it would otherwise strand every
// existing local user's diagrams in the old-named "drawDB" database. This
// runs once (guarded by localStorage) to copy that data into the new
// "SchemaCanvas" database the app now reads from.
export async function migrateLegacyDrawDbDatabase(
  targetDb,
  {
    DexieCtor,
    storage,
    legacyDatabaseName = LEGACY_DATABASE_NAME,
  } = {},
) {
  if (!storage) {
    return { migrated: false, reason: "no-storage" };
  }
  if (storage.getItem(LEGACY_MIGRATION_FLAG_KEY) === "true") {
    return { migrated: false, reason: "already-migrated" };
  }

  try {
    const legacyExists = await DexieCtor.exists(legacyDatabaseName);
    if (!legacyExists) {
      storage.setItem(LEGACY_MIGRATION_FLAG_KEY, "true");
      return { migrated: false, reason: "no-legacy-database" };
    }

    await targetDb.open();
    const diagramCount = await targetDb.diagrams.count();
    if (diagramCount > 0) {
      storage.setItem(LEGACY_MIGRATION_FLAG_KEY, "true");
      return { migrated: false, reason: "target-already-has-diagrams" };
    }

    const legacyDb = new DexieCtor(legacyDatabaseName);
    await legacyDb.open();
    const [legacyDiagrams, legacyTemplates] = await Promise.all([
      legacyDb.table("diagrams").toArray(),
      legacyDb.table("templates").toArray(),
    ]);
    legacyDb.close();

    // Drop the local autoincrement `id`: the new database already seeded its
    // own built-in templates (ids 1-6), so reusing legacy ids risks
    // overwriting them. `diagramId`/`templateId` are the stable identifiers
    // and travel with the row regardless of the local `id`.
    const withoutLocalId = (row) => {
      const copy = { ...row };
      delete copy.id;
      return copy;
    };
    const diagramsToInsert = legacyDiagrams.map(withoutLocalId);
    const customTemplatesToInsert = legacyTemplates
      .filter((template) => Boolean(template.custom))
      .map(withoutLocalId);

    await targetDb.transaction(
      "rw",
      targetDb.diagrams,
      targetDb.templates,
      async () => {
        if (diagramsToInsert.length) {
          await targetDb.diagrams.bulkAdd(diagramsToInsert);
        }
        if (customTemplatesToInsert.length) {
          await targetDb.templates.bulkAdd(customTemplatesToInsert);
        }
      },
    );

    storage.setItem(LEGACY_MIGRATION_FLAG_KEY, "true");
    return {
      migrated: true,
      diagramCount: diagramsToInsert.length,
      templateCount: customTemplatesToInsert.length,
    };
  } catch (error) {
    logSeedError(error);
    return { migrated: false, reason: "error" };
  }
}
