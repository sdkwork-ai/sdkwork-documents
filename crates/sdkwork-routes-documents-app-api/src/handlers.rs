use axum::{
    extract::{Path, Query, State},
    response::Response,
    Extension, Json,
};
use sdkwork_documents_contract::{
    CatalogApiOperationQuery, CatalogApiSurfaceQuery, CatalogSdkQuery, DocumentCreateRequest,
    DocumentUpdateRequest,
};

use crate::{
    auth,
    ports::DocumentsAppRequestContext,
    response::{created_json, ok_json, ApiProblem},
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
