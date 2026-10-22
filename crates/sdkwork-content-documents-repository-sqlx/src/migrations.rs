pub const POSTGRES_CORE_MIGRATION: &str =
    include_str!("../migrations/postgres/V202606200001__documents_core.sql");

pub const POSTGRES_REVISION_AUDIT_MIGRATION: &str =
    include_str!("../migrations/postgres/V202606200002__documents_revision_audit.sql");

/// Platform-wide developer catalog tables (API market and SDK market).
pub const POSTGRES_DEVELOPER_CATALOG_MIGRATION: &str =
    include_str!("../migrations/postgres/V202606200003__documents_developer_catalog.sql");

pub const POSTGRES_MIGRATIONS: &[&str] = &[
    POSTGRES_CORE_MIGRATION,
    POSTGRES_REVISION_AUDIT_MIGRATION,
    POSTGRES_DEVELOPER_CATALOG_MIGRATION,
];
