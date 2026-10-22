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

pub const POSTGRES_MIGRATIONS: &[&str] = &[
    POSTGRES_CORE_MIGRATION,
    POSTGRES_REVISION_AUDIT_MIGRATION,
    POSTGRES_DEVELOPER_CATALOG_MIGRATION,
    POSTGRES_DEVELOPER_CATALOG_I18N_MIGRATION,
];
