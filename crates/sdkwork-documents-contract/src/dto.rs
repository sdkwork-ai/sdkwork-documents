use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentCapabilities {
    pub version: String,
    pub supported_formats: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub status: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentCreateRequest {
    pub title: String,
    #[serde(default)]
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DocumentUpdateRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub body: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentList {
    pub items: Vec<Document>,
}

// ---------------------------------------------------------------------------
// Developer catalog (API market / SDK market)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogCategory {
    pub code: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub sort_order: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_code: Option<String>,
    pub api_count: i64,
    pub sdk_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogCategoryList {
    pub items: Vec<CatalogCategory>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogLanguage {
    pub code: String,
    pub name: String,
    pub family: String,
    pub icon: String,
    pub file_extension: String,
    pub official_url: String,
    pub sort_order: i64,
    pub release_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogLanguageList {
    pub items: Vec<CatalogLanguage>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CatalogCounts {
    pub modules: i64,
    pub api_surfaces: i64,
    pub api_operations: i64,
    pub sdk_families: i64,
    pub sdk_releases: i64,
    pub languages: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CatalogFacet {
    pub code: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeveloperCatalogOverview {
    pub counts: CatalogCounts,
    pub categories: Vec<CatalogCategory>,
    pub surface_facets: Vec<CatalogFacet>,
    pub sdk_type_facets: Vec<CatalogFacet>,
    pub language_facets: Vec<CatalogFacet>,
    pub featured_api_surface_ids: Vec<String>,
    pub featured_sdk_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogApiSurface {
    pub id: String,
    pub module_code: String,
    pub module_name: String,
    pub surface_code: String,
    pub surface_name: String,
    pub title: String,
    pub description: String,
    pub api_version: String,
    pub api_authority: String,
    pub api_prefix: String,
    pub category_code: String,
    pub categories: Vec<String>,
    pub operation_count: i64,
    pub tag_count: i64,
    pub auth_modes: Vec<String>,
    pub tags: Vec<String>,
    pub featured: bool,
    pub deprecated: bool,
    pub schema_available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogApiSurfacePage {
    pub items: Vec<CatalogApiSurface>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogApiSurfaceDetail {
    pub surface: CatalogApiSurface,
    pub servers: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema_checksum: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogApiOperation {
    pub operation_key: String,
    pub method: String,
    pub path: String,
    pub summary: String,
    pub description: String,
    pub tags: Vec<String>,
    pub deprecated: bool,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogApiOperationPage {
    pub items: Vec<CatalogApiOperation>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogApiSchema {
    pub surface_id: String,
    pub api_authority: String,
    pub schema_version: String,
    pub schema_checksum: String,
    pub spec: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogSdkRelease {
    pub language_code: String,
    pub language_name: String,
    pub family: String,
    pub package_name: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub install_command: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub download_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub archive_name: Option<String>,
    pub generation_state: String,
    pub release_state: String,
    pub is_latest: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub released_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogSdkFamily {
    pub id: String,
    pub module_code: String,
    pub module_name: String,
    pub sdk_code: String,
    pub sdk_name: String,
    pub sdk_type: String,
    pub surface_code: String,
    pub package_name: String,
    pub description: String,
    pub sdk_version: String,
    pub category_code: String,
    pub categories: Vec<String>,
    pub languages: Vec<String>,
    pub release_count: i64,
    pub featured: bool,
    pub deprecated: bool,
    pub download_count: i64,
    pub rating: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogSdkFamilyPage {
    pub items: Vec<CatalogSdkFamily>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogSdkFamilyDetail {
    pub sdk: CatalogSdkFamily,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repository_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub docs_url: Option<String>,
    pub license_code: String,
    pub support_level: String,
    pub pricing_tier: String,
    pub releases: Vec<CatalogSdkRelease>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CatalogApiSurfaceQuery {
    #[serde(default)]
    pub q: Option<String>,
    #[serde(default)]
    pub category_code: Option<String>,
    #[serde(default)]
    pub module_code: Option<String>,
    #[serde(default)]
    pub surface_code: Option<String>,
    #[serde(default)]
    pub page: Option<i64>,
    #[serde(default)]
    pub page_size: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CatalogSdkQuery {
    #[serde(default)]
    pub q: Option<String>,
    #[serde(default)]
    pub category_code: Option<String>,
    #[serde(default)]
    pub module_code: Option<String>,
    #[serde(default)]
    pub language_code: Option<String>,
    #[serde(default)]
    pub sdk_type: Option<String>,
    #[serde(default)]
    pub page: Option<i64>,
    #[serde(default)]
    pub page_size: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CatalogApiOperationQuery {
    #[serde(default)]
    pub q: Option<String>,
    #[serde(default)]
    pub page: Option<i64>,
    #[serde(default)]
    pub page_size: Option<i64>,
}
