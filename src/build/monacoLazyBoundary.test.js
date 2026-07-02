import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { describe, expect, test } from 'vitest';

const repoRoot = process.cwd();

const editorEntryFiles = [
  'src/components/CodeEditor/index.jsx',
  'src/components/EditorHeader/SideSheet/Migration.jsx',
];

describe('Monaco lazy loading boundary', () => {
  test('keeps Monaco out of editor entry modules until a code editor is rendered', async () => {
    const sourceFiles = await Promise.all(
      editorEntryFiles.map(async (filePath) => ({
        filePath,
        source: await readFile(path.join(repoRoot, filePath), 'utf8'),
      })),
    );

    for (const { filePath, source } of sourceFiles) {
      expect(source, `${filePath} must not statically import Monaco`).not.toMatch(
        /import\s+[^;]*@monaco-editor\/react/,
      );
    }
  });
});
