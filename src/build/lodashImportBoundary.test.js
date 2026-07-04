import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

describe("lodash import boundary", () => {
  test("keeps Versions from importing the full lodash bundle", async () => {
    const source = await readFile(
      path.join(
        repoRoot,
        "src/components/EditorHeader/SideSheet/Versions.jsx",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/import\s+_\s+from\s+["']lodash["']/);
    expect(source).toMatch(/import\s+isEqual\s+from\s+["']lodash\/isEqual["']/);
  });
});
