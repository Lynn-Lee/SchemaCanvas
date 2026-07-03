import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

describe("build workflow quality gates", () => {
  test("runs test, audit, and bundle checks in CI", async () => {
    const source = await readFile(
      path.join(repoRoot, ".github/workflows/build.yml"),
      "utf8",
    );

    expect(source).toContain("npm run test");
    expect(source).toContain("npm audit --audit-level=high");
    expect(source).toContain("npm run bundle:check");
  });
});
