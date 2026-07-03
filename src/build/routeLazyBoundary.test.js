import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

describe("route lazy loading boundary", () => {
  test("keeps route pages out of App static imports", async () => {
    const source = await readFile(path.join(repoRoot, "src/App.jsx"), "utf8");

    expect(source).toMatch(/lazy\(\(\)\s*=>\s*import\("/);
    expect(source).toContain("<Suspense");
    expect(source).not.toMatch(/import\s+\w+\s+from\s+["']\.\/pages\//);
  });
});
