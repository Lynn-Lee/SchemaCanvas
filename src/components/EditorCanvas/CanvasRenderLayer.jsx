import { memo, useCallback } from "react";
import { ObjectType } from "../../data/constants";
import Area from "./Area";
import Note from "./Note";
import Relationship from "./Relationship";
import Table from "./Table";

function CanvasAreaLayerComponent({
  area,
  setAreaResize,
  setAreaInitDimensions,
  onElementPointerDown,
}) {
  const handlePointerDown = useCallback(() => {
    onElementPointerDown(area, ObjectType.AREA);
  }, [area, onElementPointerDown]);

  return (
    <Area
      data={area}
      setResize={setAreaResize}
      setInitDimensions={setAreaInitDimensions}
      onPointerDown={handlePointerDown}
    />
  );
}

function CanvasRelationshipLayerComponent({ relationship, tableOverrides }) {
  return <Relationship data={relationship} tableOverrides={tableOverrides} />;
}

function CanvasTableLayerComponent({
  table,
  setHoveredTable,
  handleGripField,
  setLinkingLine,
  onElementPointerDown,
}) {
  const handlePointerDown = useCallback(() => {
    onElementPointerDown(table, ObjectType.TABLE);
  }, [table, onElementPointerDown]);

  return (
    <Table
      tableData={table}
      setHoveredTable={setHoveredTable}
      handleGripField={handleGripField}
      setLinkingLine={setLinkingLine}
      onPointerDown={handlePointerDown}
    />
  );
}

function CanvasNoteLayerComponent({ note, onElementPointerDown }) {
  const handlePointerDown = useCallback(() => {
    onElementPointerDown(note, ObjectType.NOTE);
  }, [note, onElementPointerDown]);

  return <Note data={note} onPointerDown={handlePointerDown} />;
}

export const CanvasAreaLayer = memo(CanvasAreaLayerComponent);
export const CanvasRelationshipLayer = memo(CanvasRelationshipLayerComponent);
export const CanvasTableLayer = memo(CanvasTableLayerComponent);
export const CanvasNoteLayer = memo(CanvasNoteLayerComponent);
