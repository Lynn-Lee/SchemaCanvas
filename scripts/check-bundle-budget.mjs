#!/usr/bin/env node

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_MAX_JS_KB = 17000;
const DEFAULT_MAX_CSS_KB = 450;
const DEFAULT_MAX_TOTAL_KB = 18000;

const rootDir = process.cwd();
const assetsDir = path.join(rootDir, 'dist', 'assets');

function parseBudget(name, fallback) {
  const rawValue = process.env[name];
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number of kilobytes.`);
  }

  return value;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function sortBySizeDesc(a, b) {
  return b.bytes - a.bytes;
}

async function readAssets() {
  let entries;
  try {
    entries = await readdir(assetsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Build assets not found at dist/assets. Run npm run build before npm run bundle:check.`);
    }
    throw error;
  }

  const assets = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name);
    if (ext !== '.js' && ext !== '.css') continue;

    const filePath = path.join(assetsDir, entry.name);
    const fileStat = await stat(filePath);
    assets.push({
      name: entry.name,
      type: ext.slice(1),
      bytes: fileStat.size,
    });
  }

  if (assets.length === 0) {
    throw new Error(`No JavaScript or CSS assets found at dist/assets. Run npm run build again.`);
  }

  return assets.sort(sortBySizeDesc);
}

function findLargest(assets, type) {
  return assets.filter((asset) => asset.type === type).sort(sortBySizeDesc)[0] ?? null;
}

function assertBudget({ largestJs, largestCss, totalBytes, maxJsKb, maxCssKb, maxTotalKb }) {
  const failures = [];

  if (largestJs && largestJs.bytes / 1024 > maxJsKb) {
    failures.push(`${largestJs.name} exceeds JavaScript budget: ${formatKb(largestJs.bytes)} > ${maxJsKb.toFixed(2)} KB`);
  }

  if (largestCss && largestCss.bytes / 1024 > maxCssKb) {
    failures.push(`${largestCss.name} exceeds CSS budget: ${formatKb(largestCss.bytes)} > ${maxCssKb.toFixed(2)} KB`);
  }

  if (totalBytes / 1024 > maxTotalKb) {
    failures.push(`Total JS/CSS assets exceed budget: ${formatKb(totalBytes)} > ${maxTotalKb.toFixed(2)} KB`);
  }

  return failures;
}

try {
  const maxJsKb = parseBudget('SCHEMACANVAS_BUNDLE_MAX_JS_KB', DEFAULT_MAX_JS_KB);
  const maxCssKb = parseBudget('SCHEMACANVAS_BUNDLE_MAX_CSS_KB', DEFAULT_MAX_CSS_KB);
  const maxTotalKb = parseBudget('SCHEMACANVAS_BUNDLE_MAX_TOTAL_KB', DEFAULT_MAX_TOTAL_KB);
  const assets = await readAssets();
  const largestJs = findLargest(assets, 'js');
  const largestCss = findLargest(assets, 'css');
  const totalBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
  const failures = assertBudget({ largestJs, largestCss, totalBytes, maxJsKb, maxCssKb, maxTotalKb });

  console.log('SchemaCanvas bundle budget summary');
  console.log(`largest JS chunk: ${largestJs ? `${largestJs.name} (${formatKb(largestJs.bytes)})` : 'none'}`);
  console.log(`largest CSS asset: ${largestCss ? `${largestCss.name} (${formatKb(largestCss.bytes)})` : 'none'}`);
  console.log(`total JS/CSS assets: ${formatKb(totalBytes)}`);
  console.log(`budgets: JS <= ${maxJsKb.toFixed(2)} KB, CSS <= ${maxCssKb.toFixed(2)} KB, total <= ${maxTotalKb.toFixed(2)} KB`);
  console.log('largest assets:');
  for (const asset of assets.slice(0, 8)) {
    console.log(`- ${asset.name}: ${formatKb(asset.bytes)}`);
  }

  if (failures.length > 0) {
    console.error(`\nBundle budget check failed:`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
