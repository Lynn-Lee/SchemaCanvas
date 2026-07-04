import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

describe("editor collab provider boundary", () => {
  test("wraps editor context tree with CollabContextProvider", async () => {
    const source = await readFile(
      path.join(repoRoot, "src/pages/Editor.jsx"),
      "utf8",
    );

    expect(source).toContain(
      'import CollabContextProvider from "../context/CollabContext"',
    );
    expect(source).toContain("<CollabContextProvider>");
    expect(source.indexOf("<CollabContextProvider>")).toBeLessThan(
      source.indexOf("<AreasContextProvider>"),
    );
    expect(source.indexOf("</CollabContextProvider>")).toBeGreaterThan(
      source.indexOf("</SaveStateContextProvider>"),
    );
  });
});
