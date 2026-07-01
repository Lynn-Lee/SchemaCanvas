import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");

function readRepoFile(path) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("docker static hosting security", () => {
  it("serves the app with explicit low-risk nginx security headers", () => {
    const dockerfile = readRepoFile("Dockerfile");
    const nginxConfig = readRepoFile("nginx.conf");

    expect(dockerfile).toContain("COPY nginx.conf");
    expect(dockerfile).not.toContain("RUN echo 'server");
    expect(nginxConfig).toContain("add_header X-Content-Type-Options nosniff always;");
    expect(nginxConfig).toContain(
      "add_header Referrer-Policy strict-origin-when-cross-origin always;"
    );
    expect(nginxConfig).toContain(
      'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;'
    );
  });

  it("does not load external stylesheets without integrity metadata", () => {
    const index = readRepoFile("index.html");
    const externalStylesheets = [
      ...index.matchAll(
        /<link\s+[^>]*rel="stylesheet"[^>]*href="https:\/\/[^"]+"[^>]*>/g
      ),
    ].map(([tag]) => tag);

    expect(externalStylesheets.length).toBeGreaterThan(0);

    for (const tag of externalStylesheets) {
      expect(tag).toContain("integrity=");
      expect(tag).toContain('crossorigin="anonymous"');
    }
  });
});
