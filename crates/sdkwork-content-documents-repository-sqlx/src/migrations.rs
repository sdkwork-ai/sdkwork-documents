pub const POSTGRES_CORE_MIGRATION: &str =
    include_str!("../migrations/postgres/V202606200001__documents_core.sql");

pub const POSTGRES_REVISION_AUDIT_MIGRATION: &str =
    include_str!("../migrations/postgres/V202606200002__documents_revision_audit.sql");

/// Platform-wide developer catalog tables (API market and SDK market).
pub const POSTGRES_DEVELOPER_CATALOG_MIGRATION: &str =
    include_str!("../migrations/postgres/V202606200003__documents_developer_catalog.sql");

/// Locale overrides for the developer catalog's user-visible labels.
pub const POSTGRES_DEVELOPER_CATALOG_I18N_MIGRATION: &str =
    include_str!("../migrations/postgres/V202606200004__documents_catalog_i18n.sql");

/// Public page identity (slug/locale/status metadata) for the document center.
pub const POSTGRES_DOCUMENT_CENTER_PAGES_MIGRATION: &str =
    include_str!("../../../database/migrations/postgres/0003_document_center_pages.up.sql");

/// Drive binding columns for each localized document row.
pub const POSTGRES_DOCUMENT_DRIVE_BINDING_MIGRATION: &str =
    include_str!("../../../database/migrations/postgres/0004_document_drive_binding.up.sql");

/// Immutable revision ledger for published Drive bodies.
pub const POSTGRES_DOCUMENT_REVISIONS_MIGRATION: &str =
    include_str!("../../../database/migrations/postgres/0005_document_revisions.up.sql");

/// Normalized categories and reusable tags for the document center.
pub const POSTGRES_DOCUMENT_TAXONOMY_MIGRATION: &str =
    include_str!("../../../database/migrations/postgres/0006_document_categories_and_tags.up.sql");

pub const POSTGRES_MIGRATIONS: &[&str] = &[
    POSTGRES_CORE_MIGRATION,
    POSTGRES_REVISION_AUDIT_MIGRATION,
    POSTGRES_DEVELOPER_CATALOG_MIGRATION,
    POSTGRES_DEVELOPER_CATALOG_I18N_MIGRATION,
    POSTGRES_DOCUMENT_CENTER_PAGES_MIGRATION,
    POSTGRES_DOCUMENT_DRIVE_BINDING_MIGRATION,
    POSTGRES_DOCUMENT_REVISIONS_MIGRATION,
    POSTGRES_DOCUMENT_TAXONOMY_MIGRATION,
];
