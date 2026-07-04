import { LayoutContext } from "../context/LayoutContext";
import useRequiredContext from "./useRequiredContext";

export default function useLayout() {
  return useRequiredContext(
    LayoutContext,
    "useLayout",
    "LayoutContextProvider",
  );
}
