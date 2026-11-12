use axum::{
    extract::{Path, Query, State},
    response::Response,
    Extension, Json,
};
use sdkwork_documents_contract::{
    CatalogApiOperationQuery, CatalogApiSurfaceQuery, CatalogSdkQuery,
    DocumentCategoryCreateRequest, DocumentCategoryUpdateRequest, DocumentCreateRequest,
    DocumentDriveBindingRequest, DocumentIdentityUpdateRequest, DocumentTaxonomyUpdateRequest,
    DocumentUpdateRequest,
};
use serde::Deserialize;

const DEFAULT_PUBLIC_TENANT_ID: i64 = 100001;
const DEFAULT_PUBLIC_LOCALE: &str = "zh-CN";

#[derive(Debug, Deserialize, Default)]
pub(crate) struct PublicDocumentQuery {
    #[serde(default)]
    locale: Option<String>,
}

fn public_tenant_id() -> i64 {
    std::env::var("SDKWORK_DOCUMENTS_PUBLIC_TENANT_ID")
        .ok()
        .and_then(|value| value.trim().parse::<i64>().ok())
        .unwrap_or(DEFAULT_PUBLIC_TENANT_ID)
}

fn public_locale(query: &PublicDocumentQuery) -> String {
    query
        .locale
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(DEFAULT_PUBLIC_LOCALE)
        .to_owned()
}

use crate::{
    auth,
    ports::DocumentsAppRequestContext,
    response::{created_json, no_content, ok_json, ApiProblem},
    routes::AppState,
};

pub(crate) async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "service": "sdkwork-documents-app-api" }))
}

pub(crate) async fn list_documents(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(state.api.list_documents(context).await))
}

pub(crate) async fn create_document(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Json(request): Json<DocumentCreateRequest>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(created_json(
        state.api.create_document(context, request).await,
    ))
}

pub(crate) async fn retrieve_document(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(document_id): Path<String>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state.api.retrieve_document(context, document_id).await,
    ))
}

pub(crate) async fn update_document(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(document_id): Path<String>,
    Json(request): Json<DocumentUpdateRequest>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .update_document(context, document_id, request)
            .await,
    ))
}

pub(crate) async fn bind_document_drive(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(document_id): Path<String>,
    Json(request): Json<DocumentDriveBindingRequest>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .bind_document_drive(context, document_id, request)
            .await,
    ))
}

pub(crate) async fn list_document_overview(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(state.api.list_document_overview(context).await))
}

pub(crate) async fn list_document_revisions(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(document_id): Path<String>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .list_document_revisions(context, document_id)
            .await,
    ))
}

pub(crate) async fn get_revision_content(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path((document_id, revision_id)): Path<(String, String)>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .get_revision_content(context, document_id, revision_id)
            .await,
    ))
}

pub(crate) async fn restore_document_revision(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path((document_id, revision_id)): Path<(String, String)>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .restore_document_revision(context, document_id, revision_id)
            .await,
    ))
}

pub(crate) async fn get_document_identity(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(document_id): Path<String>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state.api.get_document_identity(context, document_id).await,
    ))
}

pub(crate) async fn update_document_identity(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(document_id): Path<String>,
    Json(request): Json<DocumentIdentityUpdateRequest>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .update_document_identity(context, document_id, request)
            .await,
    ))
}

pub(crate) async fn get_document_taxonomy(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(document_id): Path<String>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state.api.get_document_taxonomy(context, document_id).await,
    ))
}

pub(crate) async fn update_document_taxonomy(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(document_id): Path<String>,
    Json(request): Json<DocumentTaxonomyUpdateRequest>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .update_document_taxonomy(context, document_id, request)
            .await,
    ))
}

pub(crate) async fn list_document_categories(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(state.api.list_document_categories(context).await))
}

pub(crate) async fn create_document_category(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Json(request): Json<DocumentCategoryCreateRequest>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(created_json(
        state.api.create_document_category(context, request).await,
    ))
}

pub(crate) async fn update_document_category(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(category_id): Path<String>,
    Json(request): Json<DocumentCategoryUpdateRequest>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .update_document_category(context, category_id, request)
            .await,
    ))
}

pub(crate) async fn delete_document_category(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(category_id): Path<String>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(no_content(
        state
            .api
            .delete_document_category(context, category_id)
            .await,
    ))
}

pub(crate) async fn list_document_tags(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(state.api.list_document_tags(context).await))
}

pub(crate) async fn delete_document(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(document_id): Path<String>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(no_content(
        state.api.delete_document(context, document_id).await,
    ))
}

pub(crate) async fn developer_catalog_overview(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(state.api.developer_catalog_overview(context).await))
}

pub(crate) async fn list_developer_catalog_categories(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state.api.list_developer_catalog_categories(context).await,
    ))
}

pub(crate) async fn list_developer_catalog_languages(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state.api.list_developer_catalog_languages(context).await,
    ))
}

pub(crate) async fn list_developer_catalog_apis(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Query(query): Query<CatalogApiSurfaceQuery>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state.api.list_developer_catalog_apis(context, query).await,
    ))
}

pub(crate) async fn retrieve_developer_catalog_api(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(surface_id): Path<String>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .retrieve_developer_catalog_api(context, surface_id)
            .await,
    ))
}

pub(crate) async fn retrieve_developer_catalog_api_schema(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(surface_id): Path<String>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .retrieve_developer_catalog_api_schema(context, surface_id)
            .await,
    ))
}

pub(crate) async fn list_developer_catalog_api_operations(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(surface_id): Path<String>,
    Query(query): Query<CatalogApiOperationQuery>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .list_developer_catalog_api_operations(context, surface_id, query)
            .await,
    ))
}

pub(crate) async fn list_developer_catalog_sdks(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Query(query): Query<CatalogSdkQuery>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state.api.list_developer_catalog_sdks(context, query).await,
    ))
}

pub(crate) async fn retrieve_developer_catalog_sdk(
    State(state): State<AppState>,
    context: Option<Extension<DocumentsAppRequestContext>>,
    Path(sdk_id): Path<String>,
) -> Result<Response, ApiProblem> {
    let context = auth::require_app_context(context)?;
    Ok(ok_json(
        state
            .api
            .retrieve_developer_catalog_sdk(context, sdk_id)
            .await,
    ))
}

/// Public delivery: no IAM session is required. The deployment resolves the
/// tenant from configuration so the platform domain can render published
/// documents before a visitor signs in.
pub(crate) async fn list_published_documents(
    State(state): State<AppState>,
    Query(query): Query<PublicDocumentQuery>,
) -> Result<Response, ApiProblem> {
    let locale = public_locale(&query);
    Ok(ok_json(
        state
            .api
            .list_published_documents(public_tenant_id(), &locale)
            .await,
    ))
}

pub(crate) async fn retrieve_published_document(
    State(state): State<AppState>,
    Path(document_ref): Path<String>,
    Query(query): Query<PublicDocumentQuery>,
) -> Result<Response, ApiProblem> {
    let locale = public_locale(&query);
    Ok(ok_json(
        state
            .api
            .retrieve_published_document(public_tenant_id(), &document_ref, &locale)
            .await,
    ))
}
