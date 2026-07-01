import { DB } from "../data/constants";
import { createDiagram } from "./diagramModel";

export function normalizeDiagram(input = {}) {
  return createDiagram({
    ...input,
    database: input.database ?? DB.GENERIC,
    relationships: input.relationships ?? input.references ?? [],
    pan: input.pan ?? { x: 0, y: 0 },
    zoom: input.zoom ?? 1,
  });
}
