-- sdkwork:migration
-- id: 0004_document_drive_binding
-- engine: postgres
-- module: sdkwork-documents
-- purpose: Bind each document (per locale) to its canonical Drive node so rich-text
--   content can be stored in Drive and delivered through documents. Existing rows keep
--   content_source='database' until the Drive sync runs, the columns are additive.
-- reversible: false
-- rollback: forward-fix (additive columns and one index, drop them to roll back)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

ALTER TABLE documents_document
  ADD COLUMN IF NOT EXISTS drive_space_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_node_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_content_version BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_source TEXT NOT NULL DEFAULT 'database';

CREATE INDEX IF NOT EXISTS idx_documents_document_drive_binding
  ON documents_document (tenant_id, drive_space_id, drive_node_id);

CREATE INDEX IF NOT EXISTS idx_documents_document_locale_slug
  ON documents_document (tenant_id, app_key, locale, slug)
  WHERE status = 'published';
