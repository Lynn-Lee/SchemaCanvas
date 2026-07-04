import { CanvasContext } from "../context/CanvasContext";
import useRequiredContext from "./useRequiredContext";

export default function useCanvas() {
  return useRequiredContext(CanvasContext, "useCanvas", "CanvasContextProvider");
}
