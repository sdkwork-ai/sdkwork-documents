-- sdkwork:migration
-- id: 0002_developer_catalog_i18n
-- engine: postgres
-- module: sdkwork-documents
-- purpose: Add locale overrides for developer-catalog labels so the API market
--   and SDK market return localized category, module, API, operation, language,
--   and SDK text while retaining the canonical English columns.
-- reversible: false
-- rollback: forward-fix (additive columns; drop them to roll back)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

ALTER TABLE documents_catalog_category
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE documents_catalog_module
  ADD COLUMN IF NOT EXISTS name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE documents_api_surface
  ADD COLUMN IF NOT EXISTS surface_name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE documents_api_operation
  ADD COLUMN IF NOT EXISTS summary_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE documents_sdk_language
  ADD COLUMN IF NOT EXISTS language_name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE documents_sdk_family
  ADD COLUMN IF NOT EXISTS sdk_name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
