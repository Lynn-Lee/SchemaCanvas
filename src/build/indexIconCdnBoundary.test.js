import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");

function readRepoFile(path) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("index icon CDN boundary", () => {
  it("loads only one external icon stylesheet", () => {
    const index = readRepoFile("index.html");
    const externalIconStylesheets = [
      ...index.matchAll(
        /<link\s+[^>]*rel="stylesheet"[^>]*href="https:\/\/[^"]*(?:bootstrap-icons|font-awesome)[^"]*"[^>]*>/g
      ),
    ].map(([tag]) => tag);

    expect(externalIconStylesheets).toHaveLength(1);
    expect(externalIconStylesheets[0]).toContain("bootstrap-icons");
    expect(index).not.toContain("font-awesome");
    expect(index).not.toContain("all.min.css");
  });
});
