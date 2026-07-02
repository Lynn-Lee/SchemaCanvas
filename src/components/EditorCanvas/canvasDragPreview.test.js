import { describe, expect, it, vi } from "vitest";
import { ObjectType } from "../../data/constants";
import {
  applyDragPreviewToElements,
  buildDragUndoElements,
  commitDragPreview,
  createDragPreview,
} from "./canvasDragPreview";

const selectedElements = [
  {
    id: "users",
    type: ObjectType.TABLE,
    initialCoords: { x: 100, y: 120 },
    currentCoords: { x: 100, y: 120 },
  },
  {
    id: 1,
    type: ObjectType.AREA,
    initialCoords: { x: 20, y: 40 },
    currentCoords: { x: 20, y: 40 },
  },
  {
    id: 2,
    type: ObjectType.NOTE,
    initialCoords: { x: 300, y: 340 },
    currentCoords: { x: 300, y: 340 },
  },
];

describe("canvas drag preview", () => {
  it("computes local drag coordinates without committing diagram updates", () => {
    const commit = vi.fn();

    const preview = createDragPreview({
      selectedElements,
      dragging: {
        id: "users",
        type: ObjectType.TABLE,
        grabOffset: { x: 8, y: 12 },
      },
      pointerDiagram: { x: 151, y: 183 },
      snapToGrid: (coords) => ({
        x: Math.round(coords.x / 10) * 10,
        y: Math.round(coords.y / 10) * 10,
      }),
      commit,
    });

    expect(commit).not.toHaveBeenCalled();
    expect(preview).toEqual([
      {
        ...selectedElements[0],
        currentCoords: { x: 140, y: 170 },
      },
      {
        ...selectedElements[1],
        currentCoords: { x: 60, y: 90 },
      },
      {
        ...selectedElements[2],
        currentCoords: { x: 340, y: 390 },
      },
    ]);
  });

  it("applies preview coordinates to rendered elements only", () => {
    const renderedTables = applyDragPreviewToElements(
      [{ id: "users", x: 100, y: 120, name: "users" }],
      [{ id: "users", type: ObjectType.TABLE, currentCoords: { x: 140, y: 170 } }],
      ObjectType.TABLE,
    );

    expect(renderedTables).toEqual([
      { id: "users", x: 140, y: 170, name: "users" },
    ]);
  });

  it("commits the final preview once per moved element", () => {
    const updateTable = vi.fn();
    const updateArea = vi.fn();
    const updateNote = vi.fn();

    commitDragPreview({
      previewElements: [
        {
          id: "users",
          type: ObjectType.TABLE,
          currentCoords: { x: 140, y: 170 },
        },
        {
          id: 1,
          type: ObjectType.AREA,
          currentCoords: { x: 60, y: 90 },
        },
        {
          id: 2,
          type: ObjectType.NOTE,
          currentCoords: { x: 340, y: 390 },
        },
      ],
      updateTable,
      updateArea,
      updateNote,
    });

    expect(updateTable).toHaveBeenCalledTimes(1);
    expect(updateTable).toHaveBeenCalledWith("users", { x: 140, y: 170 });
    expect(updateArea).toHaveBeenCalledTimes(1);
    expect(updateArea).toHaveBeenCalledWith(1, { x: 60, y: 90 });
    expect(updateNote).toHaveBeenCalledTimes(1);
    expect(updateNote).toHaveBeenCalledWith(2, { x: 340, y: 390 });
  });

  it("builds undo and redo payload from the final preview", () => {
    const undoElements = buildDragUndoElements([
      {
        id: "users",
        type: ObjectType.TABLE,
        initialCoords: { x: 100, y: 120 },
        currentCoords: { x: 140, y: 170 },
      },
    ]);

    expect(undoElements).toEqual([
      {
        id: "users",
        type: ObjectType.TABLE,
        undo: { x: 100, y: 120 },
        redo: { x: 140, y: 170 },
      },
    ]);
  });
});
