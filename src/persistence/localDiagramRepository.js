import { db } from "../data/db";
import { normalizeDiagram } from "../domain/normalizeDiagram";

const DEFAULT_RECENT_LIMIT = 10;

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
    const rows = await diagrams
      .orderBy("lastModified")
      .reverse()
      .limit(limit)
      .toArray();

    return rows.map(toSummary);
  }

  async function getDiagramById(diagramId) {
    return toDiagram(await getRawByDiagramId(diagramId));
  }

  async function saveDiagram(diagram) {
    const existingRecord = await getRawByDiagramId(diagram.diagramId);
    const storedDiagram = toStoredDiagram(diagram, existingRecord);

    if (existingRecord) {
      await diagrams.put(storedDiagram);
    } else {
      const id = await diagrams.add(storedDiagram);
      storedDiagram.id = id;
    }

    return toDiagram(storedDiagram);
  }

  async function deleteDiagram(diagramId) {
    return diagrams.where("diagramId").equals(diagramId).delete();
  }

  async function duplicateDiagram(diagramId, overrides = {}) {
    const source = await getDiagramById(diagramId);
    if (!source) return null;

    const diagram = { ...source };
    delete diagram.id;
    delete diagram.lastModified;

    return saveDiagram({
      ...diagram,
      diagramId: overrides.diagramId ?? createDiagramId(),
      name: overrides.name ?? `${source.name} copy`,
      lastModified: overrides.lastModified,
    });
  }

  return {
    listRecentDiagrams,
    getDiagramById,
    saveDiagram,
    deleteDiagram,
    duplicateDiagram,
  };
}
