import { ObjectType } from "../../data/constants";

export function createDragPreview({
  selectedElements,
  dragging,
  pointerDiagram,
  snapToGrid,
}) {
  const mainElement = selectedElements.find(
    (element) => element.id === dragging.id && element.type === dragging.type,
  );

  if (!mainElement) return selectedElements;

  const mainElementFinalCoords = snapToGrid({
    x: pointerDiagram.x - dragging.grabOffset.x,
    y: pointerDiagram.y - dragging.grabOffset.y,
  });
  const deltaX = mainElementFinalCoords.x - mainElement.currentCoords.x;
  const deltaY = mainElementFinalCoords.y - mainElement.currentCoords.y;

  return selectedElements.map((element) => ({
    ...element,
    currentCoords: {
      x: element.currentCoords.x + deltaX,
      y: element.currentCoords.y + deltaY,
    },
  }));
}

export function applyDragPreviewToElements(elements, previewElements, type) {
  if (previewElements.length === 0) return elements;

  const previewById = new Map(
    previewElements
      .filter((element) => element.type === type)
      .map((element) => [element.id, element.currentCoords]),
  );

  if (previewById.size === 0) return elements;

  return elements.map((element) => {
    const preview = previewById.get(element.id);
    return preview ? { ...element, ...preview } : element;
  });
}

export function commitDragPreview({
  previewElements,
  updateTable,
  updateArea,
  updateNote,
}) {
  previewElements.forEach((element) => {
    if (element.type === ObjectType.TABLE) {
      updateTable(element.id, { ...element.currentCoords });
    }
    if (element.type === ObjectType.AREA) {
      updateArea(element.id, { ...element.currentCoords });
    }
    if (element.type === ObjectType.NOTE) {
      updateNote(element.id, { ...element.currentCoords });
    }
  });
}

export function buildDragUndoElements(previewElements) {
  return previewElements.map((element) => ({
    id: element.id,
    type: element.type,
    undo: element.initialCoords,
    redo: element.currentCoords,
  }));
}
