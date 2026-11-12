use std::sync::Arc;

use axum::{routing::get, Router};

use crate::{handlers, paths, ports::DocumentsAppApi};

#[derive(Clone)]
pub(crate) struct AppState {
    pub(crate) api: Arc<dyn DocumentsAppApi>,
}

pub fn build_router_with_app_api<A>(api: A) -> Router
where
    A: DocumentsAppApi + 'static,
{
    build_router_with_shared_app_api(Arc::new(api))
}

pub fn build_router_with_shared_app_api(api: Arc<dyn DocumentsAppApi>) -> Router {
    build_business_router_with_shared_app_api(api).route(paths::HEALTHZ, get(handlers::health))
}

pub fn build_business_router_with_shared_app_api(api: Arc<dyn DocumentsAppApi>) -> Router {
    let documents_router = Router::new()
        .route(
            paths::DOCUMENTS,
            get(handlers::list_documents).post(handlers::create_document),
        )
        .route(
            paths::DOCUMENT,
            get(handlers::retrieve_document)
                .patch(handlers::update_document)
                .delete(handlers::delete_document),
        )
        .route(
            paths::DOCUMENT_DRIVE_BINDING,
            axum::routing::patch(handlers::bind_document_drive),
        )
        .route(
            paths::DOCUMENT_REVISIONS,
            get(handlers::list_document_revisions),
        )
        .route(
            paths::DOCUMENT_REVISION_CONTENT,
            get(handlers::get_revision_content),
        )
        .route(
            paths::DOCUMENT_REVISION_RESTORE,
            axum::routing::post(handlers::restore_document_revision),
        )
        .route(
            paths::DOCUMENT_IDENTITY,
            get(handlers::get_document_identity).patch(handlers::update_document_identity),
        )
        .route(
            paths::PUBLIC_DOCUMENTS,
            get(handlers::list_published_documents),
        )
        .route(
            paths::PUBLIC_DOCUMENT,
            get(handlers::retrieve_published_document),
        )
        .route(
            paths::DEVELOPER_CATALOG_OVERVIEW,
            get(handlers::developer_catalog_overview),
        )
        .route(
            paths::DEVELOPER_CATALOG_CATEGORIES,
            get(handlers::list_developer_catalog_categories),
        )
        .route(
            paths::DEVELOPER_CATALOG_LANGUAGES,
            get(handlers::list_developer_catalog_languages),
        )
        .route(
            paths::DEVELOPER_CATALOG_APIS,
            get(handlers::list_developer_catalog_apis),
        )
        .route(
            paths::DEVELOPER_CATALOG_API,
            get(handlers::retrieve_developer_catalog_api),
        )
        .route(
            paths::DEVELOPER_CATALOG_API_SCHEMA,
            get(handlers::retrieve_developer_catalog_api_schema),
        )
        .route(
            paths::DEVELOPER_CATALOG_API_OPERATIONS,
            get(handlers::list_developer_catalog_api_operations),
        )
        .route(
            paths::DEVELOPER_CATALOG_SDKS,
            get(handlers::list_developer_catalog_sdks),
        )
        .route(
            paths::DEVELOPER_CATALOG_SDK,
            get(handlers::retrieve_developer_catalog_sdk),
        )
        .with_state(AppState { api });

    documents_router.merge(sdkwork_content_documents_sdk_reference::app_sdk_reference_router())
}
