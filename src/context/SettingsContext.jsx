import { createContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  defaultSettings,
  readSettings,
  writeSettings,
} from "../persistence/settingsRepository";

export const SettingsContext = createContext({
  settings: defaultSettings,
  setSettings: () => {},
});

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

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
