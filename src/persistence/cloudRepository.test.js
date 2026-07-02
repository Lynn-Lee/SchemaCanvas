import { describe, expect, it, vi } from "vitest";

import {
  CLOUD_REPOSITORY_METHODS,
  CLOUD_UNAVAILABLE_REASON,
  createNoBackendCloudRepository,
} from "./cloudRepository";

describe("createNoBackendCloudRepository", () => {
  it("exposes the full cloud repository interface", () => {
    const repository = createNoBackendCloudRepository();

    expect(Object.keys(repository).sort()).toEqual(
      [...CLOUD_REPOSITORY_METHODS].sort(),
    );
    for (const method of CLOUD_REPOSITORY_METHODS) {
      expect(repository[method]).toEqual(expect.any(Function));
    }
  });

  it("returns unavailable results for session, list, save, and permissions operations", async () => {
    const repository = createNoBackendCloudRepository();
    const diagram = { diagramId: "local-1", name: "Local diagram" };

    await expect(repository.getSession()).resolves.toMatchObject({
      ok: false,
      reason: CLOUD_UNAVAILABLE_REASON,
      operation: "getSession",
    });
    await expect(repository.listCloudDiagrams()).resolves.toMatchObject({
      ok: false,
      reason: CLOUD_UNAVAILABLE_REASON,
      operation: "listCloudDiagrams",
    });
    await expect(repository.saveCloudDiagram(diagram)).resolves.toMatchObject({
      ok: false,
      reason: CLOUD_UNAVAILABLE_REASON,
      operation: "saveCloudDiagram",
    });
    await expect(repository.getPermissions("cloud-1")).resolves.toMatchObject({
      ok: false,
      reason: CLOUD_UNAVAILABLE_REASON,
      operation: "getPermissions",
    });
  });

  it("does not call network or token storage while reporting cloud unavailable", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("network should not be called"));
    const storageSpy = vi.spyOn(Storage.prototype, "getItem");
    const repository = createNoBackendCloudRepository();

    await repository.login({ email: "user@example.com" });
    await repository.logout();
    await repository.getCloudDiagram("cloud-1");
    await repository.deleteCloudDiagram("cloud-1");
    await repository.shareCloudDiagram("cloud-1");
    await repository.listTeams();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    storageSpy.mockRestore();
  });
});
