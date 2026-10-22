#!/usr/bin/env node
/**
 * Run the developer catalog seed tools with a cross-platform Python lookup.
 *
 * Usage:
 *   node tools/catalog-cli.mjs generate
 *   node tools/catalog-cli.mjs check
 *   node tools/catalog-cli.mjs coverage
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, '..');
const command = process.argv[2];
const scripts = {
  generate: { file: 'database/seeds/catalog/generate_catalog_seed.py', args: [] },
  check: { file: 'database/seeds/catalog/generate_catalog_seed.py', args: ['--check'] },
  coverage: { file: 'database/seeds/catalog/verify_catalog_coverage.py', args: [] },
  sql: { file: 'database/seeds/catalog/verify_catalog_seed_sql.py', args: [] },
};
const selected = scripts[command];
if (!selected) {
  console.error('Usage: node tools/catalog-cli.mjs <generate|check|coverage|sql>');
  process.exit(2);
}

const pythonCandidates = process.platform === 'win32'
  ? [process.env.PYTHON, 'python', 'py'].filter(Boolean)
  : [process.env.PYTHON, 'python3', 'python'].filter(Boolean);

let lastError;
for (const python of pythonCandidates) {
  const result = spawnSync(
    python,
    [path.join(workspaceRoot, selected.file), ...selected.args],
    { cwd: workspaceRoot, stdio: 'inherit' },
  );
  if (result.error && result.error.code === 'ENOENT') {
    lastError = result.error;
    continue;
  }
  if (result.error) {
    console.error(`[catalog] failed to run ${python}: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

console.error(`[catalog] no Python interpreter found (${lastError?.message ?? 'unknown error'})`);
process.exit(1);
