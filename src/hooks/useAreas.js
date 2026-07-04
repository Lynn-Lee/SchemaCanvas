import { AreasContext } from "../context/AreasContext";
import useRequiredContext from "./useRequiredContext";

export default function useAreas() {
  return useRequiredContext(AreasContext, "useAreas", "AreasContextProvider");
}
