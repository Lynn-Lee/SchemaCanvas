import { TypesContext } from "../context/TypesContext";
import useRequiredContext from "./useRequiredContext";

export default function useTypes() {
  return useRequiredContext(TypesContext, "useTypes", "TypesContextProvider");
}
