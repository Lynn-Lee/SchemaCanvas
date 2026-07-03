import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

describe("i18n lazy loading boundary", () => {
  test("keeps locale resources out of i18n static imports", async () => {
    const source = await readFile(
      path.join(repoRoot, "src/i18n/i18n.js"),
      "utf8",
    );

    expect(source).not.toMatch(/^import\s+[^;]*["']\.\/locales\//m);
    expect(source).toMatch(/import\(["']\.\/locales\//);
  });
});
