import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("email api", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    axios.post.mockReset();
  });

  it("returns a structured error without a network request when backend is not configured", async () => {
    vi.stubEnv("VITE_BACKEND_URL", "");

    const { send, EMAIL_BACKEND_NOT_CONFIGURED } = await import("./email");

    const result = await send("Subject", "<p>message</p>", []);

    expect(result).toEqual({
      ok: false,
      reason: EMAIL_BACKEND_NOT_CONFIGURED,
      message: "Email backend is not configured.",
    });
    expect(axios.post).not.toHaveBeenCalled();
  });
});
