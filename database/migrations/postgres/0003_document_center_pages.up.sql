-- sdkwork:migration
-- id: 0003_document_center_pages
-- engine: postgres
-- module: sdkwork-documents
-- purpose: Give the seeded and managed platform documents a stable public identity
--   (application scope, slug, locale, summary, category, ordering, publish time)
--   so /docs/{slug-or-id} can resolve them after installation without a release.
-- reversible: false
-- rollback: forward-fix (additive columns and one index, drop them to roll back)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

ALTER TABLE documents_document
  ADD COLUMN IF NOT EXISTS app_key TEXT NOT NULL DEFAULT 'sdkwork-cloudrouter',
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'zh-CN',
  ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'policy',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_document_public_slug
  ON documents_document (tenant_id, app_key, locale, slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_document_published
  ON documents_document (tenant_id, app_key, locale, status, sort_order);
