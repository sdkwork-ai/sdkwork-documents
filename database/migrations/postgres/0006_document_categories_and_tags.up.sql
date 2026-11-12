-- sdkwork:migration
-- id: 0006_document_categories_and_tags
-- engine: postgres
-- module: sdkwork-documents
-- purpose: Normalize document categories and add reusable tags for the document center.
-- reversible: false
-- rollback: forward-fix (additive tables, drop them to roll back)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

CREATE TABLE IF NOT EXISTS documents_category (
    id UUID PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    app_key TEXT NOT NULL DEFAULT 'sdkwork-cloudrouter',
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    sort_order BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ux_documents_category_slug UNIQUE (tenant_id, app_key, slug)
);

CREATE TABLE IF NOT EXISTS documents_tag (
    id UUID PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    app_key TEXT NOT NULL DEFAULT 'sdkwork-cloudrouter',
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ux_documents_tag_slug UNIQUE (tenant_id, app_key, slug)
);

CREATE TABLE IF NOT EXISTS documents_document_tag (
    tenant_id BIGINT NOT NULL,
    document_id UUID NOT NULL REFERENCES documents_document (id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES documents_tag (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (document_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_documents_document_tag_tag
    ON documents_document_tag (tenant_id, tag_id);

INSERT INTO documents_category (id, tenant_id, app_key, slug, name, name_en, description, sort_order, status)
VALUES
    (gen_random_uuid(), 100001, 'sdkwork-cloudrouter', 'policy', '平台政策', 'Platform policies',
     '隐私、条款、Cookie 等平台级政策。', 10, 'active'),
    (gen_random_uuid(), 100001, 'sdkwork-cloudrouter', 'standard', '行业规范', 'Industry standards',
     'GDPR、PIPL、ISO 27001、SOC 2 等合规规范。', 20, 'active')
ON CONFLICT (tenant_id, app_key, slug) DO NOTHING;
