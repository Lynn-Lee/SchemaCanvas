import { EnumsContext } from "../context/EnumsContext";
import useRequiredContext from "./useRequiredContext";

export default function useEnums() {
  return useRequiredContext(EnumsContext, "useEnums", "EnumsContextProvider");
}
