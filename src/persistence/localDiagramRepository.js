import { db } from "../data/db";
import { normalizeDiagram } from "../domain/normalizeDiagram";

const DEFAULT_RECENT_LIMIT = 10;
const LOCAL_REPOSITORY_ERROR_REASON = "dexie-error";

export function isLocalRepositoryError(result) {
  return result?.ok === false;
}

function repositoryError(operation, error) {
  return {
    ok: false,
    reason: LOCAL_REPOSITORY_ERROR_REASON,
    operation,
    message: error?.message || "Local diagram storage operation failed.",
  };
}

function createDiagramId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `diagram-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toStoredDiagram(diagram, existingRecord = null) {
  const normalized = normalizeDiagram(diagram);

  return {
    ...(existingRecord?.id ? { id: existingRecord.id } : {}),
    ...normalized,
    lastModified: diagram.lastModified ?? new Date(),
  };
}

function toDiagram(record) {
  if (!record) return null;

  return {
    ...(record.id ? { id: record.id } : {}),
    ...normalizeDiagram(record),
    lastModified: record.lastModified,
  };
}

function toSummary(record) {
  const diagram = toDiagram(record);

  return {
    diagramId: diagram.diagramId,
    name: diagram.name,
    database: diagram.database,
    lastModified: diagram.lastModified,
    tableCount: diagram.tables.length,
    relationshipCount: diagram.relationships.length,
    loadedFromGistId: diagram.loadedFromGistId,
  };
}

export function createLocalDiagramRepository(database = db) {
  const { diagrams } = database;

  async function getRawByDiagramId(diagramId) {
    return diagrams.where("diagramId").equals(diagramId).first();
  }

  async function listRecentDiagrams({ limit = DEFAULT_RECENT_LIMIT } = {}) {
    try {
      const rows = await diagrams
        .orderBy("lastModified")
        .reverse()
        .limit(limit)
        .toArray();

      return rows.map(toSummary);
    } catch (error) {
      return repositoryError("listRecentDiagrams", error);
    }
  }

  async function getDiagramById(diagramId) {
    try {
      return toDiagram(await getRawByDiagramId(diagramId));
    } catch (error) {
      return repositoryError("getDiagramById", error);
    }
  }

  async function saveDiagram(diagram) {
    try {
      return await database.transaction("rw", diagrams, async () => {
        const existingRecord = await getRawByDiagramId(diagram.diagramId);
        const storedDiagram = toStoredDiagram(diagram, existingRecord);

        if (existingRecord) {
          await diagrams.put(storedDiagram);
        } else {
          const id = await diagrams.add(storedDiagram);
          storedDiagram.id = id;
        }

        return toDiagram(storedDiagram);
      });
    } catch (error) {
      return repositoryError("saveDiagram", error);
    }
  }

  async function deleteDiagram(diagramId) {
    try {
      return await diagrams.where("diagramId").equals(diagramId).delete();
    } catch (error) {
      return repositoryError("deleteDiagram", error);
    }
  }

  async function duplicateDiagram(diagramId, overrides = {}) {
    try {
      const source = await getDiagramById(diagramId);
      if (isLocalRepositoryError(source)) return source;
      if (!source) return null;

      const diagram = { ...source };
      delete diagram.id;
      delete diagram.lastModified;

      return await saveDiagram({
        ...diagram,
        diagramId: overrides.diagramId ?? createDiagramId(),
        name: overrides.name ?? `${source.name} copy`,
        lastModified: overrides.lastModified,
      });
    } catch (error) {
      return repositoryError("duplicateDiagram", error);
    }
  }

  return {
    listRecentDiagrams,
    getDiagramById,
    saveDiagram,
    deleteDiagram,
    duplicateDiagram,
  };
}
