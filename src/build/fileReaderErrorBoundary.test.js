import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

async function readSource(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), "utf8");
}

describe("FileReader error handling boundary", () => {
  test.each([
    "src/components/EditorHeader/Modal/ImportDiagram.jsx",
    "src/components/EditorHeader/Modal/ImportSource.jsx",
    "src/pages/BugReport.jsx",
  ])("%s handles read errors", async (relativePath) => {
    const source = await readSource(relativePath);

    expect(source).toContain("new FileReader()");
    expect(source).toContain("reader.onerror");
  });

  test("import upload paths surface read failures as import errors", async () => {
    const importDiagramSource = await readSource(
      "src/components/EditorHeader/Modal/ImportDiagram.jsx",
    );
    const importSourceSource = await readSource(
      "src/components/EditorHeader/Modal/ImportSource.jsx",
    );

    expect(importDiagramSource).toContain("setImportData(null)");
    expect(importDiagramSource).toContain("Failed to read the selected file.");
    expect(importSourceSource).toContain("Failed to read the selected file.");
  });

  test("bug report attachments notify users when a file cannot be read", async () => {
    const source = await readSource("src/pages/BugReport.jsx");

    expect(source).toContain("Toast.error(t(\"bug_report_attachment_error\"))");
  });
});
