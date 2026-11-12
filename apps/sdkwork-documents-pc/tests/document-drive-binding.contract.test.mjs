#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const documentsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const migrationPath = path.join(
  documentsRoot,
  'database/migrations/postgres/0004_document_drive_binding.up.sql',
);

test('document rows carry the per-locale Drive binding contract', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  for (const column of [
    'drive_space_id',
    'drive_node_id',
    'drive_content_version',
    'content_source',
  ]) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS ${column}`), `missing ${column}`);
  }

  assert.match(sql, /DEFAULT 'database'/, 'existing rows must keep the database source during migration');
  assert.match(
    sql,
    /idx_documents_document_drive_binding/,
    'Drive binding lookups need a tenant-scoped index',
  );
  assert.match(
    sql,
    /idx_documents_document_locale_slug[\s\S]*WHERE status = 'published'/,
    'published locale/slug resolution needs a partial index',
  );
});

test('Drive document layout keeps one node per locale and slug', () => {
  const adr = fs.readFileSync(
    path.join(
      documentsRoot,
      'docs/architecture/decisions/ADR-20261112-drive-backed-document-center.md',
    ),
    'utf8',
  );

  assert.match(adr, /<space>\/\s*\n\s*<locale>\//);
  assert.match(adr, /<slug>\.html/);
  assert.match(adr, /Every locale is an independent Drive file node/);
});

test('boot seed upserts never clear an existing Drive binding', () => {
  for (const seed of ['200_platform_policies.sql', '210_industry_standards.sql']) {
    const sql = fs.readFileSync(
      path.join(documentsRoot, 'database/seeds/common', seed),
      'utf8',
    );
    assert.doesNotMatch(
      sql,
      /drive_space_id\s*=\s*EXCLUDED\.drive_space_id/,
      `${seed} must not overwrite drive_space_id on re-seed`,
    );
    assert.doesNotMatch(
      sql,
      /drive_node_id\s*=\s*EXCLUDED\.drive_node_id/,
      `${seed} must not overwrite drive_node_id on re-seed`,
    );
  }
});

test('publishes record immutable Drive revisions', () => {
  const sql = fs.readFileSync(
    path.join(
      documentsRoot,
      'database/migrations/postgres/0005_document_revisions.up.sql',
    ),
    'utf8',
  );
  assert.match(sql, /CREATE TABLE IF NOT EXISTS documents_document_revision/);
  for (const column of [
    'drive_space_id',
    'drive_node_id',
    'content_checksum_sha256',
    'content_version',
  ]) {
    assert.match(sql, new RegExp(column), `revision table must record ${column}`);
  }
  assert.match(
    sql,
    /ON DELETE CASCADE/,
    'deleting a document must delete its revision history',
  );
});

