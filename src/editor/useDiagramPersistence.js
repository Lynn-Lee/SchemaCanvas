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

export function useDiagramPersistence({
  repository,
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
      const diagram = {
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

      const savedDiagram = await repository.saveDiagram(diagram);

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

  return { saveLocalDiagram };
}
