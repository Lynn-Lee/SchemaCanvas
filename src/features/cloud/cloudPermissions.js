export const CLOUD_PERMISSIONS = Object.freeze({
  OWNER: "owner",
  EDITOR: "editor",
  VIEWER: "viewer",
});

const EDITABLE_PERMISSIONS = new Set([
  CLOUD_PERMISSIONS.OWNER,
  CLOUD_PERMISSIONS.EDITOR,
]);

export function canEditCloudDiagram(permission) {
  return EDITABLE_PERMISSIONS.has(permission);
}

export function getCloudPermissionState(permission) {
  const normalizedPermission = Object.values(CLOUD_PERMISSIONS).includes(
    permission,
  )
    ? permission
    : CLOUD_PERMISSIONS.VIEWER;
  const canEdit = canEditCloudDiagram(normalizedPermission);

  return {
    permission: normalizedPermission,
    canEdit,
    readOnly: !canEdit,
    canExport: true,
    reason: canEdit ? null : normalizedPermission,
  };
}
