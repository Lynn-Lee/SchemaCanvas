import { SaveStateContext } from "../context/SaveStateContext";
import useRequiredContext from "./useRequiredContext";

export default function useSaveState() {
  return useRequiredContext(
    SaveStateContext,
    "useSaveState",
    "SaveStateContextProvider",
  );
}
