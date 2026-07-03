import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

describe("DBML parser lazy loading boundary", () => {
  test("keeps @dbml/core out of the DBML import module until DBML import runs", async () => {
    const source = await readFile(
      path.join(repoRoot, "src/utils/importFrom/dbml.js"),
      "utf8",
    );

    expect(source).not.toMatch(/import\s+[^;]*@dbml\/core/);
  });
});
