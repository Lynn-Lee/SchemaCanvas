import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

describe("Landing page endorsement boundary", () => {
  test("does not include third-party endorsement widgets or react-tweet loading code", async () => {
    const source = await readFile(
      path.join(repoRoot, "src/pages/LandingPage.jsx"),
      "utf8",
    );

    expect(source).not.toContain("react-tweet");
    expect(source).not.toContain("landing-social");
    expect(source).not.toContain("LandingTweets");
  });
});
