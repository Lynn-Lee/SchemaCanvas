import { useCallback } from "react";

import { DB, State } from "../data/constants";
import { databases } from "../data/databases";
import { normalizeDiagram } from "../domain/normalizeDiagram";

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

function normalizeCloudResult(result) {
  const diagram = result?.diagram ?? result?.cloudDiagram ?? result;
  if (!diagram) {
    return null;
  }

  const normalized = normalizeDiagram({
    ...diagram,
    diagramId: diagram.diagramId ?? diagram.id,
  });
  const permission = diagram.permission ?? result?.permission;

  return {
    ...normalized,
    canWrite:
      typeof diagram.canWrite === "boolean"
        ? diagram.canWrite
        : permission === undefined || permission === "owner" || permission === "editor",
    permission,
    modifiedAt: diagram.modifiedAt ?? diagram.lastModified ?? result?.modifiedAt,
  };
}

export function useDiagramLoader({
  repository,
  cloudRepository,
  navigate,
  setShowSelectDbModal,
  setShowEmptyState,
  setSaveState,
  setRestoreState,
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
      setRestoreState?.({
        source: "local",
        diagramId: diagram.diagramId,
        restoredAt: diagram.lastModified,
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
      setRestoreState,
      setShowSelectDbModal,
      setTables,
      setTitle,
      setTransform,
      setTypes,
      setUndoStack,
    ],
  );

  const loadCloudDiagramById = useCallback(
    async (cloudDiagramId) => {
      if (typeof cloudRepository?.getCloudDiagram !== "function") {
        setSaveState(State.FAILED_TO_LOAD);
        (setShowEmptyState ?? setShowSelectDbModal)(true);
        return false;
      }

      let result;
      try {
        result = await cloudRepository.getCloudDiagram(cloudDiagramId);
      } catch (error) {
        result = {
          ok: false,
          reason: "error",
          message: error?.message,
        };
      }

      if (!result?.ok) {
        setSaveState(State.FAILED_TO_LOAD);
        (setShowEmptyState ?? setShowSelectDbModal)(true);
        return false;
      }

      const diagram = normalizeCloudResult(result);
      if (!diagram) {
        setSaveState(State.FAILED_TO_LOAD);
        (setShowEmptyState ?? setShowSelectDbModal)(true);
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
      setRestoreState?.({
        source: "cloud",
        diagramId: cloudDiagramId,
        restoredAt: diagram.modifiedAt,
        permission: diagram.permission,
      });
      return true;
    },
    [
      cloudRepository,
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
      setRestoreState,
      setShowEmptyState,
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
        setRestoreState?.(null);
        if (selectedDb === "") {
          (setShowEmptyState ?? setShowSelectDbModal)(true);
        }
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
      setRestoreState?.({
        source: "local",
        diagramId: diagram.diagramId,
        restoredAt: diagram.lastModified,
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
      setRestoreState,
      setShowSelectDbModal,
      setShowEmptyState,
      setTables,
      setTitle,
      setTransform,
      setTypes,
      setUndoStack,
    ],
  );

  return {
    loadCloudDiagramById,
    loadLatestLocalDiagram,
    loadLocalDiagramById,
  };
}
