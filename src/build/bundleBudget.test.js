import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

import { afterEach, describe, expect, test } from 'vitest';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'scripts/check-bundle-budget.mjs');

const tempDirs = [];

async function createTempProject() {
  const dir = await mkdtemp(path.join(tmpdir(), 'schemacanvas-bundle-budget-'));
  tempDirs.push(dir);
  return dir;
}

async function writeAsset(projectDir, fileName, sizeBytes) {
  const assetsDir = path.join(projectDir, 'dist/assets');
  await mkdir(assetsDir, { recursive: true });
  await writeFile(path.join(assetsDir, fileName), 'x'.repeat(sizeBytes));
}

function runBundleCheck(cwd, env = {}) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
  });
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('bundle budget check', () => {
  test('fails clearly before a production build exists', async () => {
    const projectDir = await createTempProject();

    const result = runBundleCheck(projectDir);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('dist/assets');
    expect(result.stderr).toContain('npm run build');
  });

  test('fails when the largest JavaScript chunk exceeds the configured budget', async () => {
    const projectDir = await createTempProject();
    await writeAsset(projectDir, 'index-oversized.js', 12 * 1024);

    const result = runBundleCheck(projectDir, {
      SCHEMACANVAS_BUNDLE_MAX_JS_KB: '10',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('index-oversized.js');
    expect(result.stderr).toContain('exceeds');
  });

  test('prints the largest assets when the build is within budget', async () => {
    const projectDir = await createTempProject();
    await writeAsset(projectDir, 'index-small.js', 8 * 1024);
    await writeAsset(projectDir, 'style.css', 2 * 1024);

    const result = runBundleCheck(projectDir, {
      SCHEMACANVAS_BUNDLE_MAX_JS_KB: '10',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('index-small.js');
    expect(result.stdout).toContain('style.css');
    expect(result.stdout).toContain('largest JS chunk');
  });
});
