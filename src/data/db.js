import Dexie from "dexie";
import { templateSeeds } from "./seeds";
import {
  CURRENT_INDEXEDDB_VERSION,
  DIAGRAMS_UNIQUE_PREP_VERSION,
  DIAGRAMS_UNIQUE_STORE_SCHEMA,
  DIAGRAMS_V67_STORE_SCHEMA,
  TEMPLATES_STORE_SCHEMA,
  backfillStableIds,
  logSeedError,
} from "./dbMigration";

export const db = new Dexie("drawDB");

// This independent refactor baseline starts at v67; no v1-v66 schema history exists in this repository.
db.version(67)
  .stores({
    diagrams: DIAGRAMS_V67_STORE_SCHEMA,
    templates: TEMPLATES_STORE_SCHEMA,
  })
  .upgrade(backfillStableIds);

db.version(DIAGRAMS_UNIQUE_PREP_VERSION)
  .stores({
    diagrams: DIAGRAMS_V67_STORE_SCHEMA,
    templates: TEMPLATES_STORE_SCHEMA,
  })
  .upgrade(backfillStableIds);

db.version(CURRENT_INDEXEDDB_VERSION).stores({
  diagrams: DIAGRAMS_UNIQUE_STORE_SCHEMA,
  templates: TEMPLATES_STORE_SCHEMA,
});

db.on("populate", (transaction) => {
  transaction.templates.bulkAdd(templateSeeds).catch(logSeedError);
});
