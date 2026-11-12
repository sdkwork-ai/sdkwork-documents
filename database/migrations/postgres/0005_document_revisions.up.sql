-- sdkwork:migration
-- id: 0005_document_revisions
-- engine: postgres
-- module: sdkwork-documents
-- purpose: Record one immutable Drive revision per document publish so operators can
--   list version history (Drive node, checksum, version) without mutating content.
-- reversible: false
-- rollback: forward-fix (additive table and indexes, drop them to roll back)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

-- Drive-backed document revisions.
--
-- Each publish writes a new immutable body file to Drive and records the Drive
-- identity here. The document row keeps the current revision for delivery, this
-- table keeps the history so an operator can inspect or restore an earlier
-- version without mutating Drive content in place.

CREATE TABLE IF NOT EXISTS documents_document_revision (
    id UUID PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    document_id UUID NOT NULL REFERENCES documents_document (id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    slug TEXT,
    drive_space_id TEXT,
    drive_node_id TEXT,
    content_checksum_sha256 TEXT,
    content_version BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_document_revision_document
    ON documents_document_revision (tenant_id, document_id, content_version DESC);

CREATE INDEX IF NOT EXISTS idx_documents_document_revision_drive_node
    ON documents_document_revision (drive_node_id)
    WHERE drive_node_id IS NOT NULL;
