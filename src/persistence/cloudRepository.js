import i18n from "../i18n/i18n";

export const CLOUD_UNAVAILABLE_REASON = "unavailable";

export const CLOUD_REPOSITORY_METHODS = Object.freeze([
  "getSession",
  "login",
  "logout",
  "listCloudDiagrams",
  "getCloudDiagram",
  "saveCloudDiagram",
  "deleteCloudDiagram",
  "shareCloudDiagram",
  "listTeams",
  "getPermissions",
]);

function createUnavailableResult(operation) {
  return {
    ok: false,
    reason: CLOUD_UNAVAILABLE_REASON,
    operation,
    message: i18n.t("cloud_features_not_configured"),
  };
}

export function createNoBackendCloudRepository() {
  return Object.fromEntries(
    CLOUD_REPOSITORY_METHODS.map((operation) => [
      operation,
      async () => createUnavailableResult(operation),
    ]),
  );
}

export const noBackendCloudRepository = createNoBackendCloudRepository();
