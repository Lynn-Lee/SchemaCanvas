import { useCallback } from "react";

import { State } from "../data/constants";
import { databases } from "../data/databases";

function createDiagramId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `diagram-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultFormatLastSaved(date) {
  return date.toLocaleString();
}

function buildDiagramPayload({
  diagramId,
  database,
  title,
  gistId,
  loadedFromGistId,
  savedAt,
  tables,
  relationships,
  notes,
  areas,
  transform,
  types,
  enums,
}) {
  return {
    diagramId,
    database,
    name: title,
    gistId: gistId ?? "",
    loadedFromGistId: loadedFromGistId ?? "",
    lastModified: savedAt,
    tables,
    relationships,
    notes,
    areas,
    pan: transform.pan,
    zoom: transform.zoom,
    ...(databases[database].hasEnums && { enums }),
    ...(databases[database].hasTypes && { types }),
  };
}

export function useDiagramPersistence({
  repository,
  cloudRepository,
  navigate,
  setSaveState,
  setLastSaved,
  createDiagramId: createId = createDiagramId,
  now = () => new Date(),
  formatLastSaved = defaultFormatLastSaved,
}) {
  const saveLocalDiagram = useCallback(
    async ({
      isNew,
      loadedDiagramId,
      database,
      title,
      gistId,
      loadedFromGistId,
      tables,
      relationships,
      notes,
      areas,
      transform,
      types,
      enums,
    }) => {
      const diagramId = isNew ? createId() : loadedDiagramId;
      const savedAt = now();
      const diagram = buildDiagramPayload({
        diagramId,
        database,
        title,
        gistId,
        loadedFromGistId,
        savedAt,
        tables,
        relationships,
        notes,
        areas,
        transform,
        types,
        enums,
      });

      let savedDiagram;
      try {
        savedDiagram = await repository.saveDiagram(diagram);
      } catch (error) {
        setSaveState(State.ERROR);
        throw error;
      }

      if (isNew) {
        navigate(`/editor/diagrams/${savedDiagram.diagramId}`, {
          replace: true,
        });
      }

      setSaveState(State.SAVED);
      setLastSaved(formatLastSaved(savedAt));
      return savedDiagram;
    },
    [
      createId,
      formatLastSaved,
      navigate,
      now,
      repository,
      setLastSaved,
      setSaveState,
    ],
  );

  const saveCloudDiagram = useCallback(
    async ({
      cloudDiagramId,
      cloudModifiedAt,
      database,
      title,
      gistId,
      loadedFromGistId,
      tables,
      relationships,
      notes,
      areas,
      transform,
      types,
      enums,
      conflictResolution,
    }) => {
      if (typeof cloudRepository?.saveCloudDiagram !== "function") {
        const error = new Error("Cloud save is not configured.");
        setSaveState(State.ERROR);
        throw error;
      }

      const savedAt = now();
      const diagram = buildDiagramPayload({
        diagramId: cloudDiagramId,
        database,
        title,
        gistId,
        loadedFromGistId,
        savedAt,
        tables,
        relationships,
        notes,
        areas,
        transform,
        types,
        enums,
      });

      let result;
      try {
        result = await cloudRepository.saveCloudDiagram(diagram, {
          expectedModifiedAt: cloudModifiedAt,
          conflictResolution,
        });
      } catch (error) {
        setSaveState(State.ERROR);
        throw error;
      }

      if (!result?.ok) {
        setSaveState(State.ERROR);
        return {
          ok: false,
          reason: result?.reason ?? "error",
          message: result?.message,
          remoteModifiedAt: result?.remoteModifiedAt,
          pendingDiagram: diagram,
        };
      }

      setSaveState(State.SAVED);
      setLastSaved(formatLastSaved(savedAt));
      return {
        ok: true,
        diagram: result.diagram ?? result.cloudDiagram ?? result,
        pendingDiagram: diagram,
      };
    },
    [
      cloudRepository,
      formatLastSaved,
      now,
      setLastSaved,
      setSaveState,
    ],
  );

  return { saveLocalDiagram, saveCloudDiagram };
}
