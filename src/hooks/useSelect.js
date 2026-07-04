import { SelectContext } from "../context/SelectContext";
import useRequiredContext from "./useRequiredContext";

export default function useSelect() {
  return useRequiredContext(SelectContext, "useSelect", "SelectContextProvider");
}
