import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

describe("SQL parser lazy loading boundary", () => {
  test("keeps SQL parser packages out of import service entry until SQL import runs", async () => {
    const source = await readFile(
      path.join(repoRoot, "src/features/import/importSqlService.js"),
      "utf8",
    );

    expect(source).not.toMatch(
      /import\s+[^;]*(node-sql-parser|oracle-sql-parser)/,
    );
  });
});
