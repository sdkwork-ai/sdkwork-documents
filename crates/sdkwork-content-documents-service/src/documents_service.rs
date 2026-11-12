use std::sync::Arc;

use async_trait::async_trait;
use sdkwork_documents_contract::{
    CatalogApiOperationPage, CatalogApiOperationQuery, CatalogApiSchema, CatalogApiSurfaceDetail,
    CatalogApiSurfacePage, CatalogApiSurfaceQuery, CatalogCategoryList, CatalogLanguageList,
    CatalogSdkFamilyDetail, CatalogSdkFamilyPage, CatalogSdkQuery, DeveloperCatalogOverview,
    Document, DocumentCapabilities, DocumentCreateRequest, DocumentDriveBindingRequest,
    DocumentIdentity, DocumentIdentityUpdateRequest, DocumentList, DocumentRevision,
    DocumentRevisionContent, DocumentRevisionList, DocumentUpdateRequest, DocumentsAppApi,
    DocumentsAppRequestContext, DocumentsBackendApi, DocumentsBackendRequestContext,
    DocumentsOpenApi, DocumentsOpenApiRequestContext, DocumentsRepository, DocumentsServiceError,
    DocumentsServiceResult, PublishedDocument, PublishedDocumentList,
};
use sdkwork_utils_rust::{is_blank, trim, uuid};

const SERVICE_VERSION: &str = "0.1.0";

pub struct DocumentsService {
    repository: Arc<dyn DocumentsRepository>,
    drive_content: Option<Arc<sdkwork_documents_drive::DocumentsDriveContentAdapter>>,
}

impl DocumentsService {
    pub fn new(repository: Arc<dyn DocumentsRepository>) -> Self {
        Self {
            repository,
            drive_content: None,
        }
    }

    /// Attaches the in-process Drive content adapter. Published documents whose
    /// `content_source` is `drive` are then read from Drive instead of the
    /// database copy.
    pub fn with_drive_content(
        mut self,
        drive_content: Arc<sdkwork_documents_drive::DocumentsDriveContentAdapter>,
    ) -> Self {
        self.drive_content = Some(drive_content);
        self
    }

    /// Writes the published body to Drive and records the immutable revision.
    ///
    /// Publishing fails when the in-process Drive adapter is not configured, so
    /// a document can never be reported as published while its body only exists
    /// in the documents database.
    async fn sync_published_body_to_drive(
        &self,
        tenant_id: i64,
        document_id: &str,
        locale: &str,
    ) -> DocumentsServiceResult<()> {
        let drive = self.drive_content.as_ref().ok_or_else(|| {
            DocumentsServiceError::Internal(
                "Drive content storage is not configured; refusing to publish".to_owned(),
            )
        })?;
        let published = self
            .repository
            .find_published_document(tenant_id, document_id, locale)
            .await?
            .ok_or_else(|| DocumentsServiceError::NotFound(document_id.to_owned()))?;
        let slug = if published.slug.is_empty() {
            document_id.to_owned()
        } else {
            published.slug.clone()
        };
        let reference = drive
            .write_document_body(
                &tenant_id.to_string(),
                "sdkwork-cloudrouter",
                document_id,
                &published.locale,
                &slug,
                &published.body,
            )
            .await
            .map_err(|error| {
                DocumentsServiceError::Internal(format!("Drive document write failed: {error}"))
            })?;
        self.repository
            .set_drive_binding(
                tenant_id,
                document_id,
                Some(&reference.space_id),
                Some(&reference.node_id),
            )
            .await?;
        self.repository
            .insert_revision(
                tenant_id,
                DocumentRevision {
                    id: uuid(),
                    document_id: document_id.to_owned(),
                    locale: published.locale,
                    slug,
                    drive_space_id: reference.space_id,
                    drive_node_id: reference.node_id,
                    content_checksum_sha256: reference.content_checksum_sha256_hex,
                    content_version: 0,
                    created_at: String::new(),
                },
            )
            .await?;
        Ok(())
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

    /// Derives the public slug from an ASCII title. Titles without ASCII word
    /// characters (for example a purely Chinese title) return `None`; the
    /// caller then uses the document id, which `/docs/{slug-or-id}` already
    /// supports.
    fn derive_document_slug(title: &str) -> Option<String> {
        let mut slug = String::new();
        let mut pending_dash = false;
        for character in title.chars() {
            if character.is_ascii_alphanumeric() {
                if pending_dash && !slug.is_empty() {
                    slug.push('-');
                }
                pending_dash = false;
                slug.push(character.to_ascii_lowercase());
            } else {
                pending_dash = true;
            }
        }
        let slug = slug.trim_matches('-').to_owned();
        if slug.is_empty() {
            None
        } else {
            Some(slug.chars().take(96).collect())
        }
    }

    /// Collapses the request locale onto an authored document locale so a new
    /// document is filed under the language it was authored in.
    fn normalize_document_locale(locale: &str) -> String {
        let normalized = locale.trim().to_ascii_lowercase();
        if normalized.starts_with("zh") {
            "zh-CN".to_owned()
        } else if normalized.starts_with("en") {
            "en-US".to_owned()
        } else {
            "zh-CN".to_owned()
        }
    }

    fn validate_public_slug(raw: &str) -> DocumentsServiceResult<String> {
        let slug = raw.trim().to_ascii_lowercase();
        if slug.is_empty()
            || slug.len() > 96
            || !slug
                .chars()
                .all(|value| value.is_ascii_alphanumeric() || value == '-')
        {
            return Err(DocumentsServiceError::Validation(
                "slug must be 1-96 lowercase letters, digits, or hyphens".to_owned(),
            ));
        }
        Ok(slug)
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
        let id = Self::new_document_id();
        let slug = Self::derive_document_slug(&request.title).unwrap_or_else(|| id.clone());
        let locale = Self::normalize_document_locale(&ctx.locale);
        let document = Document {
            id,
            title: request.title,
            body: request.body,
            status: "draft".to_owned(),
        };
        self.repository
            .insert_with_public_identity(ctx.tenant_id, document, &locale, &slug)
            .await
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
        let updated = self
            .repository
            .update(ctx.tenant_id, &document_id, request)
            .await?;
        if updated.status == "published" {
            self.sync_published_body_to_drive(ctx.tenant_id, &updated.id, &ctx.locale)
                .await?;
        }
        Ok(updated)
    }

    async fn bind_document_drive(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
        request: DocumentDriveBindingRequest,
    ) -> DocumentsServiceResult<Document> {
        let space_id = request
            .drive_space_id
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty());
        let node_id = request
            .drive_node_id
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty());
        if node_id.is_some() && space_id.is_none() {
            return Err(DocumentsServiceError::Validation(
                "driveSpaceId is required when driveNodeId is set".to_owned(),
            ));
        }
        self.repository
            .set_drive_binding(ctx.tenant_id, &document_id, space_id, node_id)
            .await
    }

    async fn delete_document(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<()> {
        let mut bindings: Vec<(String, String)> = Vec::new();
        if let Some(binding) = self
            .repository
            .find_drive_binding(ctx.tenant_id, &document_id)
            .await?
        {
            bindings.push(binding);
        }
        for revision in self
            .repository
            .list_revisions(ctx.tenant_id, &document_id)
            .await?
        {
            if !revision.drive_space_id.is_empty() && !revision.drive_node_id.is_empty() {
                bindings.push((revision.drive_space_id, revision.drive_node_id));
            }
        }
        bindings.sort();
        bindings.dedup();
        if !bindings.is_empty() {
            let drive = self.drive_content.as_ref().ok_or_else(|| {
                DocumentsServiceError::Internal(
                    "Drive content storage is not configured; refusing to delete a Drive-backed document"
                        .to_owned(),
                )
            })?;
            let tenant = ctx.tenant_id.to_string();
            for (space_id, node_id) in bindings {
                drive
                    .delete_document_body(&tenant, &space_id, &node_id)
                    .await
                    .map_err(|error| {
                        DocumentsServiceError::Internal(format!(
                            "Drive document delete failed: {error}"
                        ))
                    })?;
            }
        }
        self.repository.delete(ctx.tenant_id, &document_id).await
    }

    async fn list_document_revisions(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<DocumentRevisionList> {
        let items = self
            .repository
            .list_revisions(ctx.tenant_id, &document_id)
            .await?;
        Ok(DocumentRevisionList { items })
    }

    async fn get_document_identity(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<DocumentIdentity> {
        let (locale, slug) = self
            .repository
            .find_public_identity(ctx.tenant_id, &document_id)
            .await?
            .ok_or_else(|| DocumentsServiceError::NotFound(document_id.clone()))?;
        Ok(DocumentIdentity { locale, slug })
    }

    async fn update_document_identity(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
        request: DocumentIdentityUpdateRequest,
    ) -> DocumentsServiceResult<DocumentIdentity> {
        let existing = self
            .repository
            .find_by_id(ctx.tenant_id, &document_id)
            .await?
            .ok_or_else(|| DocumentsServiceError::NotFound(document_id.clone()))?;
        let (current_locale, current_slug) = self
            .repository
            .find_public_identity(ctx.tenant_id, &document_id)
            .await?
            .unwrap_or_else(|| (String::new(), String::new()));

        let locale = request
            .locale
            .map(|value| Self::normalize_document_locale(&value))
            .unwrap_or(current_locale);
        let slug =
            match request.slug {
                Some(value) if !value.trim().is_empty() => Self::validate_public_slug(&value)?,
                Some(_) => Self::derive_document_slug(&existing.title)
                    .unwrap_or_else(|| document_id.clone()),
                None if current_slug.is_empty() => Self::derive_document_slug(&existing.title)
                    .unwrap_or_else(|| document_id.clone()),
                None => current_slug,
            };
        self.repository
            .set_public_identity(ctx.tenant_id, &document_id, &locale, &slug)
            .await?;
        Ok(DocumentIdentity { locale, slug })
    }

    async fn get_revision_content(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
        revision_id: String,
    ) -> DocumentsServiceResult<DocumentRevisionContent> {
        let revision = self
            .repository
            .find_revision(ctx.tenant_id, &document_id, &revision_id)
            .await?
            .ok_or_else(|| DocumentsServiceError::NotFound(revision_id.clone()))?;
        let drive = self.drive_content.as_ref().ok_or_else(|| {
            DocumentsServiceError::Internal(
                "Drive content storage is not configured; revision content is unavailable"
                    .to_owned(),
            )
        })?;
        if revision.drive_node_id.is_empty() {
            return Err(DocumentsServiceError::Validation(
                "revision has no Drive node".to_owned(),
            ));
        }
        let content = drive
            .read_document_body(&ctx.tenant_id.to_string(), &revision.drive_node_id)
            .await
            .map_err(|error| {
                DocumentsServiceError::Internal(format!("Drive revision read failed: {error}"))
            })?;
        Ok(DocumentRevisionContent {
            revision,
            body: content.body,
        })
    }

    async fn restore_document_revision(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
        revision_id: String,
    ) -> DocumentsServiceResult<Document> {
        let content = self
            .get_revision_content(ctx.clone(), document_id.clone(), revision_id)
            .await?;
        DocumentsAppApi::update_document(
            self,
            ctx,
            document_id,
            DocumentUpdateRequest {
                title: None,
                body: Some(content.body),
                status: None,
            },
        )
        .await
    }

    async fn list_published_documents(
        &self,
        tenant_id: i64,
        locale: &str,
    ) -> DocumentsServiceResult<PublishedDocumentList> {
        self.repository
            .list_published_documents(tenant_id, locale)
            .await
    }

    async fn retrieve_published_document(
        &self,
        tenant_id: i64,
        document_ref: &str,
        locale: &str,
    ) -> DocumentsServiceResult<PublishedDocument> {
        if is_blank(Some(document_ref)) {
            return Err(DocumentsServiceError::Validation(
                "document reference is required".to_owned(),
            ));
        }
        let mut published = self
            .repository
            .find_published_document(tenant_id, document_ref, locale)
            .await?
            .ok_or_else(|| DocumentsServiceError::NotFound(document_ref.to_owned()))?;
        if published.content_source == "drive" && !published.node_id.is_empty() {
            if let Some(drive) = self.drive_content.as_ref() {
                let tenant = tenant_id.to_string();
                if let Ok(content) = drive.read_document_body(&tenant, &published.node_id).await {
                    published.body = content.body;
                }
            }
        }
        Ok(published)
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

    #[test]
    fn derives_ascii_public_slug_and_falls_back_for_cjk_titles() {
        assert_eq!(
            DocumentsService::derive_document_slug("Privacy Policy v2"),
            Some("privacy-policy-v2".to_owned())
        );
        assert_eq!(
            DocumentsService::derive_document_slug("  Terms & Conditions  "),
            Some("terms-conditions".to_owned())
        );
        assert_eq!(DocumentsService::derive_document_slug("隐私政策"), None);
    }

    #[test]
    fn normalizes_document_locale_for_public_delivery() {
        assert_eq!(
            DocumentsService::normalize_document_locale("zh-CN"),
            "zh-CN"
        );
        assert_eq!(
            DocumentsService::normalize_document_locale("en-GB"),
            "en-US"
        );
        assert_eq!(
            DocumentsService::normalize_document_locale("de-DE"),
            "zh-CN"
        );
    }

    #[tokio::test]
    async fn rejects_drive_node_without_space() {
        let service = DocumentsService::new(Arc::new(InMemoryRepository {
            items: std::sync::Mutex::new(Vec::new()),
        }));
        let result = DocumentsAppApi::bind_document_drive(
            &service,
            DocumentsAppRequestContext {
                tenant_id: 100_001,
                user_id: 1,
                locale: "zh-CN".to_owned(),
            },
            "550e8400-e29b-41d4-a716-446655440000".to_owned(),
            DocumentDriveBindingRequest {
                drive_space_id: None,
                drive_node_id: Some("node-1".to_owned()),
            },
        )
        .await;
        assert!(matches!(result, Err(DocumentsServiceError::Validation(_))));
    }
}
