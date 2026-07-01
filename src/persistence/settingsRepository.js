import { tableWidth } from "../data/constants";
import { queryConfig } from "../utils/queryConfig";

const SETTINGS_STORAGE_KEY = "settings";

export const defaultSettings = {
  strictMode: false,
  showFieldSummary: true,
  showGrid: true,
  snapToGrid: false,
  showDataTypes: true,
  mode: "light",
  autosave: true,
  showCardinality: true,
  showRelationshipLabels: true,
  tableWidth: tableWidth,
  showDebugCoordinates: false,
  showComments: false,
};

function mergeSettings(savedSettings) {
  if (!savedSettings || typeof savedSettings !== "object" || Array.isArray(savedSettings)) {
    return defaultSettings;
  }

  return {
    ...defaultSettings,
    ...savedSettings,
  };
}

function applySearchParams(settings, searchParams) {
  const theme = searchParams?.get(queryConfig.theme.key);
  if (queryConfig.theme.isValid(theme)) {
    return { ...settings, mode: theme };
  }

  return settings;
}

export function readSettings(searchParams) {
  const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
  let settings = defaultSettings;
  let recovered = false;

  if (savedSettings) {
    try {
      settings = mergeSettings(JSON.parse(savedSettings));
    } catch (error) {
      recovered = true;
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      console.warn("Recovered corrupt settings from localStorage", error);
    }
  }

  return {
    settings: applySearchParams(settings, searchParams),
    recovered,
  };
}

export function writeSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Failed to persist settings", error);
  }
}
