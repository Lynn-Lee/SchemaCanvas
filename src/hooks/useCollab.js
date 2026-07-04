import { CollabContext } from "../context/CollabContext";
import useRequiredContext from "./useRequiredContext";

export default function useCollab() {
  return useRequiredContext(
    CollabContext,
    "useCollab",
    "CollabContextProvider",
  );
}
