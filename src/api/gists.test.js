import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("gist sharing api configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    axios.post.mockReset();
  });

  it("does not call the network when the sharing backend is not configured", async () => {
    vi.stubEnv("VITE_BACKEND_URL", "");

    const { create } = await import("./gists");

    await expect(create("share.json", "{}")).rejects.toMatchObject({
      code: "SHARE_BACKEND_NOT_CONFIGURED",
    });
    expect(axios.post).not.toHaveBeenCalled();
  });
});
