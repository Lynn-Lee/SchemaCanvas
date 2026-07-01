import { useCallback } from "react";

import { DB, State } from "../data/constants";
import { databases } from "../data/databases";

function valueOrDefault(value, fallback) {
  return value === undefined || value === null ? fallback : value;
}

function applyDiagramToState(diagram, setters) {
  const loadedDatabase = diagram.database ?? DB.GENERIC;

  if (typeof diagram.canWrite === "boolean") {
    setters.setLayout?.((prev) => ({ ...prev, readOnly: !diagram.canWrite }));
  }

  setters.setDatabase(loadedDatabase);
  setters.setGistId(valueOrDefault(diagram.gistId, ""));
  setters.setLoadedFromGistId(valueOrDefault(diagram.loadedFromGistId, ""));
  setters.setTitle(diagram.name ?? "Untitled Diagram");
  setters.setTables(diagram.tables ?? []);
  setters.setRelationships(diagram.relationships ?? diagram.references ?? []);
  setters.setNotes(diagram.notes ?? []);
  setters.setAreas(diagram.areas ?? diagram.subjectAreas ?? []);
  setters.setTransform({
    pan: diagram.pan ?? { x: 0, y: 0 },
    zoom: diagram.zoom ?? 1,
  });
  setters.setUndoStack([]);
  setters.setRedoStack([]);

  if (databases[loadedDatabase].hasTypes) {
    setters.setTypes(diagram.types ?? []);
  } else {
    setters.setTypes([]);
  }

  if (databases[loadedDatabase].hasEnums) {
    setters.setEnums(diagram.enums ?? []);
  } else {
    setters.setEnums([]);
  }
}

export function useDiagramLoader({
  repository,
  navigate,
  setShowSelectDbModal,
  setSaveState,
  setDatabase,
  setGistId,
  setLoadedFromGistId,
  setTitle,
  setTables,
  setRelationships,
  setNotes,
  setAreas,
  setTransform,
  setTypes,
  setEnums,
  setUndoStack,
  setRedoStack,
  setLayout,
}) {
  const loadLocalDiagramById = useCallback(
    async (diagramId) => {
      const diagram = await repository.getDiagramById(diagramId);

      if (!diagram) {
        setSaveState(State.FAILED_TO_LOAD);
        setShowSelectDbModal(true);
        return false;
      }

      applyDiagramToState(diagram, {
        setDatabase,
        setGistId,
        setLoadedFromGistId,
        setTitle,
        setTables,
        setRelationships,
        setNotes,
        setAreas,
        setTransform,
        setTypes,
        setEnums,
        setUndoStack,
        setRedoStack,
        setLayout,
      });
      return true;
    },
    [
      repository,
      setAreas,
      setDatabase,
      setEnums,
      setGistId,
      setLayout,
      setLoadedFromGistId,
      setNotes,
      setRedoStack,
      setRelationships,
      setSaveState,
      setShowSelectDbModal,
      setTables,
      setTitle,
      setTransform,
      setTypes,
      setUndoStack,
    ],
  );

  const loadLatestLocalDiagram = useCallback(
    async ({ selectedDb = "" } = {}) => {
      const recentDiagrams = await repository.listRecentDiagrams({ limit: 1 });
      const latestDiagramId = recentDiagrams[0]?.diagramId;

      if (!latestDiagramId) {
        if (selectedDb === "") setShowSelectDbModal(true);
        return false;
      }

      const diagram = await repository.getDiagramById(latestDiagramId);
      if (!diagram) {
        setSaveState(State.FAILED_TO_LOAD);
        setShowSelectDbModal(true);
        return false;
      }

      applyDiagramToState(diagram, {
        setDatabase,
        setGistId,
        setLoadedFromGistId,
        setTitle,
        setTables,
        setRelationships,
        setNotes,
        setAreas,
        setTransform,
        setTypes,
        setEnums,
        setUndoStack,
        setRedoStack,
        setLayout,
      });
      navigate(`/editor/diagrams/${diagram.diagramId}`, { replace: true });
      return true;
    },
    [
      navigate,
      repository,
      setAreas,
      setDatabase,
      setEnums,
      setGistId,
      setLayout,
      setLoadedFromGistId,
      setNotes,
      setRedoStack,
      setRelationships,
      setSaveState,
      setShowSelectDbModal,
      setTables,
      setTitle,
      setTransform,
      setTypes,
      setUndoStack,
    ],
  );

  return {
    loadLatestLocalDiagram,
    loadLocalDiagramById,
  };
}
