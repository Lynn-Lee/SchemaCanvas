import { Validator } from "jsonschema";
import { areaSchema, noteSchema, tableSchema } from "../../data/schemas";

export const PASTED_OBJECT_TYPE = {
  TABLE: "table",
  AREA: "area",
  NOTE: "note",
};

export const resolvePastedDiagramObject = (obj) => {
  const v = new Validator();
  if (v.validate(obj, tableSchema).valid) {
    return { type: PASTED_OBJECT_TYPE.TABLE, object: obj };
  }
  if (v.validate(obj, areaSchema).valid) {
    return { type: PASTED_OBJECT_TYPE.AREA, object: obj };
  }
  if (v.validate(obj, noteSchema).valid) {
    return { type: PASTED_OBJECT_TYPE.NOTE, object: obj };
  }
  return null;
};
