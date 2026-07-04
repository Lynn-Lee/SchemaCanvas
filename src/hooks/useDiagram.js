import { DiagramContext } from "../context/DiagramContext";
import useRequiredContext from "./useRequiredContext";

export default function useDiagram() {
  return useRequiredContext(
    DiagramContext,
    "useDiagram",
    "DiagramContextProvider",
  );
}
