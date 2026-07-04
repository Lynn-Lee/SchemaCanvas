import { createContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  readSettings,
  writeSettings,
} from "../persistence/settingsRepository";

export const SettingsContext = createContext(null);

export default function SettingsContextProvider({ children }) {
  const [searchParams] = useSearchParams();

  const [settings, setSettings] = useState(() => {
    return readSettings(searchParams).settings;
  });

  useEffect(() => {
    document.body.setAttribute("theme-mode", settings.mode);
  }, [settings.mode]);

  useEffect(() => {
    writeSettings(settings);
  }, [settings]);
  const contextValue = useMemo(
    () => ({ settings, setSettings }),
    [settings],
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}
