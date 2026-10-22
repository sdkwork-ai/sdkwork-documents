pub const PACKAGE_NAME: &str = "sdkwork-routes-documents-app-api";
pub const SURFACE: &str = "app-api";
pub const OWNER: &str = "sdkwork-documents";
pub const DOMAIN: &str = "content";
pub const CAPABILITY: &str = "documents";
pub const API_AUTHORITY: &str = "sdkwork-documents-app-api";
pub const SDK_FAMILY: &str = "sdkwork-documents-app-sdk";
pub const PREFIX: &str = "/app/v3/api";
pub const AUTH_MODE: &str = "dual-token";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RouteManifestEntry {
    pub method: &'static str,
    pub path: &'static str,
    pub operation_id: &'static str,
    pub auth_mode: &'static str,
}

pub const ROUTES: &[RouteManifestEntry] = &[
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/documents",
        operation_id: "documents.list",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "POST",
        path: "/app/v3/api/documents",
        operation_id: "documents.create",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/documents/{documentId}",
        operation_id: "documents.retrieve",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "PATCH",
        path: "/app/v3/api/documents/{documentId}",
        operation_id: "documents.update",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/developer_catalog/overview",
        operation_id: "developerCatalog.overviewRetrieve",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/developer_catalog/categories",
        operation_id: "developerCatalog.categoriesList",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/developer_catalog/languages",
        operation_id: "developerCatalog.languagesList",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/developer_catalog/apis",
        operation_id: "developerCatalog.apisList",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/developer_catalog/apis/{surfaceId}",
        operation_id: "developerCatalog.apiRetrieve",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/developer_catalog/apis/{surfaceId}/schema",
        operation_id: "developerCatalog.apiSchemaRetrieve",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/developer_catalog/apis/{surfaceId}/operations",
        operation_id: "developerCatalog.apiOperationsList",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/developer_catalog/sdks",
        operation_id: "developerCatalog.sdksList",
        auth_mode: AUTH_MODE,
    },
    RouteManifestEntry {
        method: "GET",
        path: "/app/v3/api/developer_catalog/sdks/{sdkId}",
        operation_id: "developerCatalog.sdkRetrieve",
        auth_mode: AUTH_MODE,
    },
];
