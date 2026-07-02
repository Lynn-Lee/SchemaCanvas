import { createContext, useContext } from "react";

const ExtensionsContext = createContext({});

const CLOUD_ENABLED_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);

function isConfiguredUrl(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isEnabledValue(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return CLOUD_ENABLED_VALUES.has(value.trim().toLowerCase());
  }
  return false;
}

export function getCloudCapability(extensions = {}) {
  const capability = extensions?.cloudCapability ?? {};
  const apiUrl =
    capability.apiUrl ?? capability.backendUrl ?? capability.baseUrl ?? "";
  const enabled = isEnabledValue(capability.enabled) || isConfiguredUrl(apiUrl);

  return {
    enabled,
    reason: enabled ? null : "unavailable",
    apiUrl: isConfiguredUrl(apiUrl) ? apiUrl.trim() : null,
  };
}

export function useExtensions() {
  return useContext(ExtensionsContext);
}

export function Slot({ name }) {
  const extensions = useExtensions();
  return extensions[name] ?? null;
}

export default ExtensionsContext;
