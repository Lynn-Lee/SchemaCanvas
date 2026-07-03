import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe("gist sharing api configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    axios.delete.mockReset();
    axios.get.mockReset();
    axios.patch.mockReset();
    axios.post.mockReset();
  });

  it("returns a structured error without a network request when the sharing backend is not configured", async () => {
    vi.stubEnv("VITE_BACKEND_URL", "");

    const { create, SHARE_BACKEND_NOT_CONFIGURED } = await import("./gists");

    const result = await create("share.json", "{}");

    expect(result).toEqual({
      ok: false,
      reason: SHARE_BACKEND_NOT_CONFIGURED,
      message: "Sharing backend is not configured.",
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("returns a structured error when creating a gist fails at the network layer", async () => {
    vi.stubEnv("VITE_BACKEND_URL", "https://share.example.test");
    axios.post.mockRejectedValue(new Error("socket closed"));

    const { create, SHARE_BACKEND_REQUEST_FAILED } = await import("./gists");

    const result = await create("share.json", "{}");

    expect(result).toEqual({
      ok: false,
      reason: SHARE_BACKEND_REQUEST_FAILED,
      message: "socket closed",
    });
  });

  it("returns a structured error when create gist response is missing the gist id", async () => {
    vi.stubEnv("VITE_BACKEND_URL", "https://share.example.test");
    axios.post.mockResolvedValue({ data: { data: {} } });

    const { create, SHARE_BACKEND_INVALID_RESPONSE } = await import("./gists");

    const result = await create("share.json", "{}");

    expect(result).toEqual({
      ok: false,
      reason: SHARE_BACKEND_INVALID_RESPONSE,
      message: "Sharing backend returned an invalid response.",
    });
  });
});
