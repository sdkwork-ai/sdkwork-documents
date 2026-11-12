pub const PREFIX: &str = "/app/v3/api";
pub const HEALTHZ: &str = "/healthz";
pub const DOCUMENTS: &str = "/app/v3/api/documents";
pub const DOCUMENT: &str = "/app/v3/api/documents/{document_id}";
pub const DOCUMENT_DRIVE_BINDING: &str = "/app/v3/api/documents/{document_id}/drive_binding";
pub const DOCUMENT_REVISIONS: &str = "/app/v3/api/documents/{document_id}/revisions";
pub const DOCUMENT_REVISION_CONTENT: &str =
    "/app/v3/api/documents/{document_id}/revisions/{revision_id}/content";
pub const DOCUMENT_REVISION_RESTORE: &str =
    "/app/v3/api/documents/{document_id}/revisions/{revision_id}/restore";
pub const DOCUMENT_IDENTITY: &str = "/app/v3/api/documents/{document_id}/identity";
pub const PUBLIC_DOCUMENTS: &str = "/app/v3/api/documents/public";
pub const PUBLIC_DOCUMENT: &str = "/app/v3/api/documents/public/{document_ref}";

pub const DEVELOPER_CATALOG_OVERVIEW: &str = "/app/v3/api/developer_catalog/overview";
pub const DEVELOPER_CATALOG_CATEGORIES: &str = "/app/v3/api/developer_catalog/categories";
pub const DEVELOPER_CATALOG_LANGUAGES: &str = "/app/v3/api/developer_catalog/languages";
pub const DEVELOPER_CATALOG_APIS: &str = "/app/v3/api/developer_catalog/apis";
pub const DEVELOPER_CATALOG_API: &str = "/app/v3/api/developer_catalog/apis/{surface_id}";
pub const DEVELOPER_CATALOG_API_SCHEMA: &str =
    "/app/v3/api/developer_catalog/apis/{surface_id}/schema";
pub const DEVELOPER_CATALOG_API_OPERATIONS: &str =
    "/app/v3/api/developer_catalog/apis/{surface_id}/operations";
pub const DEVELOPER_CATALOG_SDKS: &str = "/app/v3/api/developer_catalog/sdks";
pub const DEVELOPER_CATALOG_SDK: &str = "/app/v3/api/developer_catalog/sdks/{sdk_id}";
