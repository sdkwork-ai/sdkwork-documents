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

/// Consolidated module baseline. The accumulated post-GA deltas
/// (`database/migrations/postgres/0003`..`0006`) were folded into this
/// snapshot by reset-database-initialization-state.mjs, so bootstrapping the
/// legacy crate migrations and then replaying this baseline converges on the
/// same end state the gateway lifecycle provisions.
pub const POSTGRES_DOCUMENTS_MODULE_BASELINE: &str =
    include_str!("../../../database/ddl/baseline/postgres/0001_documents_baseline.sql");

pub const POSTGRES_MIGRATIONS: &[&str] = &[
    POSTGRES_CORE_MIGRATION,
    POSTGRES_REVISION_AUDIT_MIGRATION,
    POSTGRES_DEVELOPER_CATALOG_MIGRATION,
    POSTGRES_DEVELOPER_CATALOG_I18N_MIGRATION,
    POSTGRES_DOCUMENTS_MODULE_BASELINE,
];
