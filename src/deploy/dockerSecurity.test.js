import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");

function readRepoFile(path) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function parseVercelConfig() {
  return JSON.parse(readRepoFile("vercel.json"));
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
    expect(nginxConfig).toContain(
      "add_header Content-Security-Policy-Report-Only"
    );
    expect(nginxConfig).toContain(
      "add_header Strict-Transport-Security"
    );
    expect(nginxConfig).toContain("add_header X-Frame-Options DENY always;");
    expect(nginxConfig).toContain("frame-ancestors 'none'");
    expect(nginxConfig).toContain("script-src 'self' 'unsafe-eval'");
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

  it("configures matching Vercel security headers for all routes", () => {
    const vercelConfig = parseVercelConfig();
    const routeHeaders = vercelConfig.headers?.find(
      (entry) => entry.source === "/(.*)"
    )?.headers;

    expect(routeHeaders).toEqual(
      expect.arrayContaining([
        {
          key: "Content-Security-Policy-Report-Only",
          value: expect.stringContaining("frame-ancestors 'none'"),
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
      ])
    );
  });
});
