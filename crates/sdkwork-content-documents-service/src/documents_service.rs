use std::sync::Arc;

use async_trait::async_trait;
use sdkwork_documents_contract::{
    CatalogApiOperationPage, CatalogApiOperationQuery, CatalogApiSchema, CatalogApiSurfaceDetail,
    CatalogApiSurfacePage, CatalogApiSurfaceQuery, CatalogCategoryList, CatalogLanguageList,
    CatalogSdkFamilyDetail, CatalogSdkFamilyPage, CatalogSdkQuery, DeveloperCatalogOverview,
    Document, DocumentCapabilities, DocumentCreateRequest, DocumentList, DocumentUpdateRequest,
    DocumentsAppApi, DocumentsAppRequestContext, DocumentsBackendApi,
    DocumentsBackendRequestContext, DocumentsOpenApi, DocumentsOpenApiRequestContext,
    DocumentsRepository, DocumentsServiceError, DocumentsServiceResult,
};
use sdkwork_utils_rust::{is_blank, trim, uuid};

const SERVICE_VERSION: &str = "0.1.0";

pub struct DocumentsService {
    repository: Arc<dyn DocumentsRepository>,
}

impl DocumentsService {
    pub fn new(repository: Arc<dyn DocumentsRepository>) -> Self {
        Self { repository }
    }

    fn validate_create(request: &DocumentCreateRequest) -> DocumentsServiceResult<()> {
        if is_blank(Some(&request.title)) {
            return Err(DocumentsServiceError::Validation(
                "title is required".to_owned(),
            ));
        }
        Ok(())
    }

    fn new_document_id() -> String {
        uuid()
    }
}

#[async_trait]
impl DocumentsOpenApi for DocumentsService {
    async fn retrieve_capabilities(
        &self,
        _ctx: DocumentsOpenApiRequestContext,
    ) -> DocumentsServiceResult<DocumentCapabilities> {
        Ok(DocumentCapabilities {
            version: SERVICE_VERSION.to_owned(),
            supported_formats: vec!["markdown".to_owned(), "plain".to_owned()],
        })
    }

    async fn list_documents(
        &self,
        ctx: DocumentsOpenApiRequestContext,
    ) -> DocumentsServiceResult<DocumentList> {
        let items = self.repository.list_by_tenant(ctx.tenant_id).await?;
        Ok(DocumentList { items })
    }

    async fn retrieve_document(
        &self,
        ctx: DocumentsOpenApiRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<Document> {
        self.repository
            .find_by_id(ctx.tenant_id, &document_id)
            .await?
            .ok_or(DocumentsServiceError::NotFound(document_id))
    }
}

#[async_trait]
impl DocumentsAppApi for DocumentsService {
    async fn list_documents(
        &self,
        ctx: DocumentsAppRequestContext,
    ) -> DocumentsServiceResult<DocumentList> {
        let items = self.repository.list_by_tenant(ctx.tenant_id).await?;
        Ok(DocumentList { items })
    }

    async fn create_document(
        &self,
        ctx: DocumentsAppRequestContext,
        request: DocumentCreateRequest,
    ) -> DocumentsServiceResult<Document> {
        Self::validate_create(&request)?;
        let document = Document {
            id: Self::new_document_id(),
            title: request.title,
            body: request.body,
            status: "draft".to_owned(),
        };
        self.repository.insert(ctx.tenant_id, document).await
    }

    async fn retrieve_document(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<Document> {
        self.repository
            .find_by_id(ctx.tenant_id, &document_id)
            .await?
            .ok_or(DocumentsServiceError::NotFound(document_id))
    }

    async fn update_document(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
        request: DocumentUpdateRequest,
    ) -> DocumentsServiceResult<Document> {
        if let Some(title) = request.title.as_deref() {
            if is_blank(Some(title)) {
                return Err(DocumentsServiceError::Validation(
                    "title is required".to_owned(),
                ));
            }
        }
        self.repository
            .update(ctx.tenant_id, &document_id, request)
            .await
    }

    async fn developer_catalog_overview(
        &self,
        ctx: DocumentsAppRequestContext,
    ) -> DocumentsServiceResult<DeveloperCatalogOverview> {
        self.repository
            .developer_catalog_overview(ctx.tenant_id, ctx.locale.as_str())
            .await
    }

    async fn list_developer_catalog_categories(
        &self,
        ctx: DocumentsAppRequestContext,
    ) -> DocumentsServiceResult<CatalogCategoryList> {
        self.repository
            .developer_catalog_categories(ctx.tenant_id, ctx.locale.as_str())
            .await
    }

    async fn list_developer_catalog_languages(
        &self,
        ctx: DocumentsAppRequestContext,
    ) -> DocumentsServiceResult<CatalogLanguageList> {
        self.repository
            .developer_catalog_languages(ctx.tenant_id, ctx.locale.as_str())
            .await
    }

    async fn list_developer_catalog_apis(
        &self,
        ctx: DocumentsAppRequestContext,
        query: CatalogApiSurfaceQuery,
    ) -> DocumentsServiceResult<CatalogApiSurfacePage> {
        self.repository
            .developer_catalog_api_surfaces(
                ctx.tenant_id,
                ctx.locale.as_str(),
                normalize_api_query(query),
            )
            .await
    }

    async fn retrieve_developer_catalog_api(
        &self,
        ctx: DocumentsAppRequestContext,
        surface_id: String,
    ) -> DocumentsServiceResult<CatalogApiSurfaceDetail> {
        self.repository
            .developer_catalog_api_surface(ctx.tenant_id, ctx.locale.as_str(), &surface_id)
            .await?
            .ok_or(DocumentsServiceError::NotFound(surface_id))
    }

    async fn retrieve_developer_catalog_api_schema(
        &self,
        ctx: DocumentsAppRequestContext,
        surface_id: String,
    ) -> DocumentsServiceResult<CatalogApiSchema> {
        self.repository
            .developer_catalog_api_schema(ctx.tenant_id, &surface_id)
            .await?
            .ok_or(DocumentsServiceError::NotFound(surface_id))
    }

    async fn list_developer_catalog_api_operations(
        &self,
        ctx: DocumentsAppRequestContext,
        surface_id: String,
        query: CatalogApiOperationQuery,
    ) -> DocumentsServiceResult<CatalogApiOperationPage> {
        self.repository
            .developer_catalog_api_operations(
                ctx.tenant_id,
                ctx.locale.as_str(),
                &surface_id,
                normalize_operation_query(query),
            )
            .await
    }

    async fn list_developer_catalog_sdks(
        &self,
        ctx: DocumentsAppRequestContext,
        query: CatalogSdkQuery,
    ) -> DocumentsServiceResult<CatalogSdkFamilyPage> {
        self.repository
            .developer_catalog_sdks(
                ctx.tenant_id,
                ctx.locale.as_str(),
                normalize_sdk_query(query),
            )
            .await
    }

    async fn retrieve_developer_catalog_sdk(
        &self,
        ctx: DocumentsAppRequestContext,
        sdk_id: String,
    ) -> DocumentsServiceResult<CatalogSdkFamilyDetail> {
        self.repository
            .developer_catalog_sdk(ctx.tenant_id, ctx.locale.as_str(), &sdk_id)
            .await?
            .ok_or(DocumentsServiceError::NotFound(sdk_id))
    }
}

fn normalize_page(page: Option<i64>, page_size: Option<i64>) -> (i64, i64) {
    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(24).clamp(1, 100);
    (page, page_size)
}

fn normalize_api_query(mut query: CatalogApiSurfaceQuery) -> CatalogApiSurfaceQuery {
    let (page, page_size) = normalize_page(query.page, query.page_size);
    query.page = Some(page);
    query.page_size = Some(page_size);
    query.q = query
        .q
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty());
    query
}

fn normalize_sdk_query(mut query: CatalogSdkQuery) -> CatalogSdkQuery {
    let (page, page_size) = normalize_page(query.page, query.page_size);
    query.page = Some(page);
    query.page_size = Some(page_size);
    query.q = query
        .q
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty());
    query
}

fn normalize_operation_query(mut query: CatalogApiOperationQuery) -> CatalogApiOperationQuery {
    let (page, page_size) = normalize_page(query.page, query.page_size);
    query.page = Some(page);
    query.page_size = Some(page_size);
    query.q = query
        .q
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty());
    query
}

#[async_trait]
impl DocumentsBackendApi for DocumentsService {
    async fn list_documents(
        &self,
        ctx: DocumentsBackendRequestContext,
    ) -> DocumentsServiceResult<DocumentList> {
        let items = self.repository.list_by_tenant(ctx.tenant_id).await?;
        Ok(DocumentList { items })
    }

    async fn create_document(
        &self,
        ctx: DocumentsBackendRequestContext,
        request: DocumentCreateRequest,
    ) -> DocumentsServiceResult<Document> {
        Self::validate_create(&request)?;
        let document = Document {
            id: Self::new_document_id(),
            title: request.title,
            body: request.body,
            status: "draft".to_owned(),
        };
        self.repository.insert(ctx.tenant_id, document).await
    }

    async fn retrieve_document(
        &self,
        ctx: DocumentsBackendRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<Document> {
        self.repository
            .find_by_id(ctx.tenant_id, &document_id)
            .await?
            .ok_or(DocumentsServiceError::NotFound(document_id))
    }

    async fn update_document(
        &self,
        ctx: DocumentsBackendRequestContext,
        document_id: String,
        request: DocumentUpdateRequest,
    ) -> DocumentsServiceResult<Document> {
        if let Some(title) = request.title.as_deref() {
            if is_blank(Some(title)) {
                return Err(DocumentsServiceError::Validation(
                    "title is required".to_owned(),
                ));
            }
        }
        let mut normalized = request;
        if let Some(status) = normalized.status.as_deref() {
            let trimmed = trim(status);
            normalized.status = if trimmed.is_empty() {
                None
            } else {
                Some(trimmed)
            };
        }
        self.repository
            .update(ctx.tenant_id, &document_id, normalized)
            .await
    }

    async fn delete_document(
        &self,
        ctx: DocumentsBackendRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<()> {
        self.repository.delete(ctx.tenant_id, &document_id).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct InMemoryRepository {
        items: std::sync::Mutex<Vec<(i64, Document)>>,
    }

    #[async_trait]
    impl DocumentsRepository for InMemoryRepository {
        async fn list_by_tenant(&self, tenant_id: i64) -> DocumentsServiceResult<Vec<Document>> {
            Ok(self
                .items
                .lock()
                .unwrap()
                .iter()
                .filter(|(tenant, _)| *tenant == tenant_id)
                .map(|(_, doc)| doc.clone())
                .collect())
        }

        async fn find_by_id(
            &self,
            tenant_id: i64,
            document_id: &str,
        ) -> DocumentsServiceResult<Option<Document>> {
            Ok(self
                .items
                .lock()
                .unwrap()
                .iter()
                .find(|(tenant, doc)| *tenant == tenant_id && doc.id == document_id)
                .map(|(_, doc)| doc.clone()))
        }

        async fn insert(
            &self,
            tenant_id: i64,
            document: Document,
        ) -> DocumentsServiceResult<Document> {
            self.items
                .lock()
                .unwrap()
                .push((tenant_id, document.clone()));
            Ok(document)
        }

        async fn update(
            &self,
            tenant_id: i64,
            document_id: &str,
            request: DocumentUpdateRequest,
        ) -> DocumentsServiceResult<Document> {
            let mut guard = self.items.lock().unwrap();
            let entry = guard
                .iter_mut()
                .find(|(tenant, doc)| *tenant == tenant_id && doc.id == document_id)
                .ok_or_else(|| DocumentsServiceError::NotFound(document_id.to_owned()))?;
            if let Some(title) = request.title {
                entry.1.title = title;
            }
            if let Some(body) = request.body {
                entry.1.body = body;
            }
            if let Some(status) = request.status {
                entry.1.status = status;
            }
            Ok(entry.1.clone())
        }

        async fn delete(&self, tenant_id: i64, document_id: &str) -> DocumentsServiceResult<()> {
            let mut guard = self.items.lock().unwrap();
            let len = guard.len();
            guard.retain(|(tenant, doc)| !(*tenant == tenant_id && doc.id == document_id));
            if guard.len() == len {
                return Err(DocumentsServiceError::NotFound(document_id.to_owned()));
            }
            Ok(())
        }
    }

    use sdkwork_documents_contract::DocumentsAppApi;

    #[tokio::test]
    async fn create_document_uses_utils_id_and_validation() {
        let service = DocumentsService::new(Arc::new(InMemoryRepository {
            items: std::sync::Mutex::new(Vec::new()),
        }));
        let created = DocumentsAppApi::create_document(
            &service,
            DocumentsAppRequestContext {
                tenant_id: 100_001,
                user_id: 1,
                locale: "en-US".to_owned(),
            },
            DocumentCreateRequest {
                title: "Hello".to_owned(),
                body: String::new(),
            },
        )
        .await
        .expect("create");
        assert!(!created.id.is_empty());
    }
}
