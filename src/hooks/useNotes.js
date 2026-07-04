import { NotesContext } from "../context/NotesContext";
import useRequiredContext from "./useRequiredContext";

export default function useNotes() {
  return useRequiredContext(NotesContext, "useNotes", "NotesContextProvider");
}
