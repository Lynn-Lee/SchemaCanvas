import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

async function readSource(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

describe("development-only console diagnostics boundary", () => {
  test("guards Workspace diagnostics from production output", async () => {
    const source = await readSource("src/components/Workspace.jsx");

    expect(source).toMatch(
      /if \(import\.meta\.env\.DEV\) {\s+console\.warn\("cloud autosave failed:", err\);\s+}/,
    );
    expect(source).toMatch(
      /if \(import\.meta\.env\.DEV\) {\s+console\.log\(e\);\s+}/,
    );
  });

  test("guards Share modal diagnostics from production output", async () => {
    const source = await readSource(
      "src/components/EditorHeader/Modal/Share.jsx",
    );

    expect(source).toMatch(
      /if \(import\.meta\.env\.DEV\) {\s+console\.error\(e\);\s+}/,
    );
  });

  test("keeps seed initialization diagnostics development-only", async () => {
    const source = await readSource("src/data/dbMigration.js");

    expect(source).toContain("if (env.DEV || env.dev)");
    expect(source).toContain("console.error(error)");
  });
});
