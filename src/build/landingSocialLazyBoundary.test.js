import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

describe("Landing social widget lazy loading boundary", () => {
  test("keeps react-tweet out of the landing page entry until social posts are visible", async () => {
    const source = await readFile(
      path.join(repoRoot, "src/pages/LandingPage.jsx"),
      "utf8",
    );

    expect(source).not.toMatch(/import\s+[^;]*react-tweet/);
  });
});
