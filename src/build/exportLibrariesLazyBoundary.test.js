import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

const exportEntryFiles = [
  "src/features/export/exportDiagramService.js",
  "src/components/EditorHeader/ControlPanel.jsx",
];

describe("Image and PDF export lazy loading boundary", () => {
  test("keeps image and PDF export libraries out of editor entry modules until export runs", async () => {
    const sourceFiles = await Promise.all(
      exportEntryFiles.map(async (filePath) => ({
        filePath,
        source: await readFile(path.join(repoRoot, filePath), "utf8"),
      })),
    );

    for (const { filePath, source } of sourceFiles) {
      expect(
        source,
        `${filePath} must not statically import image/PDF export libraries`,
      ).not.toMatch(/import\s+[^;]*(html-to-image|jspdf)/);
    }
  });
});
