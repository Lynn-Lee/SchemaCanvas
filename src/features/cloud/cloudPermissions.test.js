import { describe, expect, it } from "vitest";

import {
  CLOUD_PERMISSIONS,
  canEditCloudDiagram,
  getCloudPermissionState,
} from "./cloudPermissions";

describe("cloudPermissions", () => {
  it("allows owner and editor to edit cloud diagrams", () => {
    expect(canEditCloudDiagram(CLOUD_PERMISSIONS.OWNER)).toBe(true);
    expect(canEditCloudDiagram(CLOUD_PERMISSIONS.EDITOR)).toBe(true);
  });

  it("maps viewer and unknown permissions to read-only editor access", () => {
    expect(canEditCloudDiagram(CLOUD_PERMISSIONS.VIEWER)).toBe(false);
    expect(canEditCloudDiagram("auditor")).toBe(false);
    expect(canEditCloudDiagram(undefined)).toBe(false);
  });

  it("returns a stable permission state for viewer mode", () => {
    expect(getCloudPermissionState(CLOUD_PERMISSIONS.VIEWER)).toEqual({
      permission: CLOUD_PERMISSIONS.VIEWER,
      canEdit: false,
      readOnly: true,
      canExport: true,
      reason: "viewer",
    });
  });
});
