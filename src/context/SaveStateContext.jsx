import { createContext, useMemo, useState } from "react";
import { State } from "../data/constants";

export const SaveStateContext = createContext(null);

export default function SaveStateContextProvider({ children }) {
  const [saveState, setSaveState] = useState(State.NONE);
  const contextValue = useMemo(
    () => ({ saveState, setSaveState }),
    [saveState],
  );

  return (
    <SaveStateContext.Provider value={contextValue}>
      {children}
    </SaveStateContext.Provider>
  );
}
