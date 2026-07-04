import { createContext, useMemo, useState } from "react";

export const UndoRedoContext = createContext({
  undoStack: [],
  setUndoStack: () => {},
  redoStack: [],
  setRedoStack: () => {},
});

export default function UndoRedoContextProvider({ children }) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const contextValue = useMemo(
    () => ({ undoStack, redoStack, setUndoStack, setRedoStack }),
    [undoStack, redoStack],
  );

  return (
    <UndoRedoContext.Provider value={contextValue}>
      {children}
    </UndoRedoContext.Provider>
  );
}
