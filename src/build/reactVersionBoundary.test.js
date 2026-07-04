import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");

function readJson(path) {
  return JSON.parse(readFileSync(resolve(repoRoot, path), "utf8"));
}

describe("React dependency boundary", () => {
  it("declares and locks React 18.3.1", () => {
    const pkg = readJson("package.json");
    const lock = readJson("package-lock.json");

    expect(pkg.dependencies.react).toBe("^18.3.1");
    expect(pkg.dependencies["react-dom"]).toBe("^18.3.1");
    expect(lock.packages[""].dependencies.react).toBe("^18.3.1");
    expect(lock.packages[""].dependencies["react-dom"]).toBe("^18.3.1");
    expect(lock.packages["node_modules/react"].version).toBe("18.3.1");
    expect(lock.packages["node_modules/react-dom"].version).toBe("18.3.1");
  });
});
