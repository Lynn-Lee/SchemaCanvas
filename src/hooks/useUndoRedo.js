import { UndoRedoContext } from "../context/UndoRedoContext";
import useRequiredContext from "./useRequiredContext";

export default function useUndoRedo() {
  return useRequiredContext(
    UndoRedoContext,
    "useUndoRedo",
    "UndoRedoContextProvider",
  );
}
