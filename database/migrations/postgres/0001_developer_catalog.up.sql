-- sdkwork:migration
-- id: 0001_developer_catalog
-- engine: postgres
-- module: sdkwork-documents
-- purpose: Add the platform-wide developer catalog (API market and SDK market):
--   module roster, API surfaces, stored OpenAPI documents, normalized operations,
--   shared taxonomy, multi-language SDK families/releases, and import bookkeeping.
-- reversible: false
-- rollback: forward-fix (additive tables; drop them to roll back, no existing table is altered)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 60s

-- ---------------------------------------------------------------------------
-- Developer catalog: the platform-wide API market and SDK market.
--
-- Every sdkwork-space module publishes one or more HTTP API surfaces
-- (open-api, app-api, backend-api, internal-api, gateway-api, ...) and one or
-- more generated SDK families in several languages. The catalog stores the
-- published roster, the complete OpenAPI document, normalized operations, a
-- shared taxonomy, and the multi-language SDK package matrix so the API market
-- and SDK market render from the database instead of static gateway documents.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documents_catalog_category (
  id UUID PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  category_code TEXT NOT NULL,
  parent_code TEXT,
  category_kind TEXT NOT NULL DEFAULT 'domain',
  name TEXT NOT NULL,
  name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  category_level INTEGER NOT NULL DEFAULT 1,
  category_path TEXT NOT NULL DEFAULT '',
  category_status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, category_kind, category_code)
);
CREATE INDEX IF NOT EXISTS idx_documents_catalog_category_kind
  ON documents_catalog_category (tenant_id, category_kind, category_status, sort_order);

CREATE TABLE IF NOT EXISTS documents_catalog_module (
  id UUID PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  category_code TEXT,
  domain_code TEXT,
  capability_code TEXT,
  official_url TEXT,
  icon_url TEXT,
  repository_path TEXT,
  owner_team TEXT,
  module_status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, module_code)
);
CREATE INDEX IF NOT EXISTS idx_documents_catalog_module_category
  ON documents_catalog_module (tenant_id, category_code, module_status, sort_order);

CREATE TABLE IF NOT EXISTS documents_api_surface (
  id UUID PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  module_id UUID NOT NULL REFERENCES documents_catalog_module (id) ON DELETE CASCADE,
  surface_code TEXT NOT NULL,
  surface_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  api_version TEXT NOT NULL DEFAULT '0.1.0',
  api_authority TEXT NOT NULL,
  api_prefix TEXT,
  protocol_code TEXT NOT NULL DEFAULT 'http-openapi',
  spec_format TEXT NOT NULL DEFAULT 'json',
  operation_count INTEGER NOT NULL DEFAULT 0,
  tag_count INTEGER NOT NULL DEFAULT 0,
  server_count INTEGER NOT NULL DEFAULT 0,
  auth_modes JSONB NOT NULL DEFAULT '[]'::jsonb,
  servers JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_code TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  publish_status TEXT NOT NULL DEFAULT 'published',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  deprecated BOOLEAN NOT NULL DEFAULT FALSE,
  source_path TEXT,
  schema_checksum TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, api_authority)
);
CREATE INDEX IF NOT EXISTS idx_documents_api_surface_module
  ON documents_api_surface (tenant_id, module_id, publish_status, surface_code);
CREATE INDEX IF NOT EXISTS idx_documents_api_surface_category
  ON documents_api_surface (tenant_id, category_code, publish_status, featured);

CREATE TABLE IF NOT EXISTS documents_api_schema (
  id UUID PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  surface_id UUID NOT NULL REFERENCES documents_api_surface (id) ON DELETE CASCADE,
  schema_version TEXT NOT NULL,
  spec JSONB NOT NULL,
  schema_checksum TEXT NOT NULL DEFAULT '',
  source_path TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, surface_id, schema_version)
);
CREATE INDEX IF NOT EXISTS idx_documents_api_schema_surface
  ON documents_api_schema (tenant_id, surface_id);

CREATE TABLE IF NOT EXISTS documents_api_operation (
  id UUID PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  surface_id UUID NOT NULL REFERENCES documents_api_surface (id) ON DELETE CASCADE,
  operation_key TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  deprecated BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, surface_id, operation_key)
);
CREATE INDEX IF NOT EXISTS idx_documents_api_operation_surface
  ON documents_api_operation (tenant_id, surface_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_documents_api_operation_method
  ON documents_api_operation (tenant_id, method);

CREATE TABLE IF NOT EXISTS documents_api_surface_category (
  tenant_id BIGINT NOT NULL,
  surface_id UUID NOT NULL REFERENCES documents_api_surface (id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, surface_id, category_code)
);
CREATE INDEX IF NOT EXISTS idx_documents_api_surface_category_code
  ON documents_api_surface_category (tenant_id, category_code, is_primary);

CREATE TABLE IF NOT EXISTS documents_sdk_language (
  language_code TEXT PRIMARY KEY,
  language_name TEXT NOT NULL,
  language_family TEXT NOT NULL DEFAULT 'server',
  icon TEXT,
  file_extension TEXT,
  official_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  language_status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS documents_sdk_family (
  id UUID PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  module_id UUID REFERENCES documents_catalog_module (id) ON DELETE SET NULL,
  sdk_code TEXT NOT NULL,
  sdk_name TEXT NOT NULL,
  sdk_family TEXT NOT NULL,
  sdk_type TEXT NOT NULL DEFAULT 'custom',
  surface_code TEXT,
  package_name TEXT,
  transport_package_name TEXT,
  api_authority TEXT,
  api_prefix TEXT,
  description TEXT,
  sdk_version TEXT NOT NULL DEFAULT '0.1.0',
  license_code TEXT NOT NULL DEFAULT 'MIT',
  repository_url TEXT,
  docs_url TEXT,
  support_level TEXT NOT NULL DEFAULT 'standard',
  pricing_tier TEXT NOT NULL DEFAULT 'free',
  visibility TEXT NOT NULL DEFAULT 'public',
  publish_status TEXT NOT NULL DEFAULT 'published',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  deprecated BOOLEAN NOT NULL DEFAULT FALSE,
  download_count BIGINT NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  category_code TEXT,
  source_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, sdk_code)
);
CREATE INDEX IF NOT EXISTS idx_documents_sdk_family_module
  ON documents_sdk_family (tenant_id, module_id, publish_status, sdk_type);
CREATE INDEX IF NOT EXISTS idx_documents_sdk_family_category
  ON documents_sdk_family (tenant_id, category_code, publish_status, featured);

CREATE TABLE IF NOT EXISTS documents_sdk_release (
  id UUID PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  sdk_family_id UUID NOT NULL REFERENCES documents_sdk_family (id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  package_name TEXT NOT NULL,
  sdk_version TEXT NOT NULL,
  install_command TEXT,
  install_docs_url TEXT,
  download_url TEXT,
  archive_name TEXT,
  checksum TEXT,
  size_bytes BIGINT,
  generation_state TEXT NOT NULL DEFAULT 'declared',
  release_state TEXT NOT NULL DEFAULT 'not_published',
  is_latest BOOLEAN NOT NULL DEFAULT FALSE,
  download_count BIGINT NOT NULL DEFAULT 0,
  released_at TIMESTAMPTZ,
  changelog TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, sdk_family_id, language_code, sdk_version)
);
CREATE INDEX IF NOT EXISTS idx_documents_sdk_release_family
  ON documents_sdk_release (tenant_id, sdk_family_id, is_latest, language_code);
CREATE INDEX IF NOT EXISTS idx_documents_sdk_release_language
  ON documents_sdk_release (tenant_id, language_code, release_state);
CREATE INDEX IF NOT EXISTS idx_documents_sdk_release_language_family
  ON documents_sdk_release (tenant_id, language_code, sdk_family_id);

CREATE TABLE IF NOT EXISTS documents_sdk_category (
  tenant_id BIGINT NOT NULL,
  sdk_family_id UUID NOT NULL REFERENCES documents_sdk_family (id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, sdk_family_id, category_code)
);
CREATE INDEX IF NOT EXISTS idx_documents_sdk_category_code
  ON documents_sdk_category (tenant_id, category_code, is_primary);

CREATE TABLE IF NOT EXISTS documents_catalog_sync (
  id UUID PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  source_code TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'succeeded',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  module_count INTEGER NOT NULL DEFAULT 0,
  api_surface_count INTEGER NOT NULL DEFAULT 0,
  api_operation_count INTEGER NOT NULL DEFAULT 0,
  sdk_family_count INTEGER NOT NULL DEFAULT 0,
  sdk_release_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, source_code)
);
