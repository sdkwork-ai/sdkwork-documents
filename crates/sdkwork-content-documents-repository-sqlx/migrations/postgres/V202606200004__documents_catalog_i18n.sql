-- Developer-catalog localization columns.
--
-- Every user-visible catalog label keeps its canonical English value in the
-- existing column and stores locale overrides as a JSON object keyed by BCP 47
-- tag (for example {"zh-CN":"应用 API"}). Readers fall back to the canonical
-- column, so existing rows and clients remain compatible.

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
