import { createContext, useMemo, useRef } from "react";

export const CollabContext = createContext(null);

export default function CollabContextProvider({ children }) {
  const isApplyingRemoteRef = useRef(false);
  const value = useMemo(
    () => ({
      emitDelta: () => {},
      emitAwareness: () => {},
      isApplyingRemoteRef,
    }),
    [],
  );
  return (
    <CollabContext.Provider value={value}>{children}</CollabContext.Provider>
  );
}
