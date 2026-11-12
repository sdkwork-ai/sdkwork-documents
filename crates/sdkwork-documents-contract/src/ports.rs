use async_trait::async_trait;
use thiserror::Error;

use crate::dto::{
    CatalogApiOperationPage, CatalogApiOperationQuery, CatalogApiSchema, CatalogApiSurfaceDetail,
    CatalogApiSurfacePage, CatalogApiSurfaceQuery, CatalogCategoryList, CatalogLanguageList,
    CatalogSdkFamilyDetail, CatalogSdkFamilyPage, CatalogSdkQuery, DeveloperCatalogOverview,
    Document, DocumentCapabilities, DocumentCreateRequest, DocumentDriveBindingRequest,
    DocumentIdentity, DocumentIdentityUpdateRequest, DocumentList, DocumentRevision,
    DocumentRevisionContent, DocumentRevisionList, DocumentUpdateRequest, PublishedDocument,
    PublishedDocumentList,
};

pub type DocumentsServiceResult<T> = Result<T, DocumentsServiceError>;

#[derive(Debug, Error)]
pub enum DocumentsServiceError {
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("internal error: {0}")]
    Internal(String),
}

#[derive(Debug, Clone)]
pub struct DocumentsOpenApiRequestContext {
    pub api_key_id: String,
    pub tenant_id: i64,
}

#[derive(Debug, Clone)]
pub struct DocumentsAppRequestContext {
    pub tenant_id: i64,
    pub user_id: i64,
    /// BCP 47 locale resolved by the web framework for catalog localization.
    pub locale: String,
}

#[derive(Debug, Clone)]
pub struct DocumentsBackendRequestContext {
    pub tenant_id: i64,
    pub operator_id: i64,
}

#[async_trait]
pub trait DocumentsOpenApi: Send + Sync {
    async fn retrieve_capabilities(
        &self,
        ctx: DocumentsOpenApiRequestContext,
    ) -> DocumentsServiceResult<DocumentCapabilities>;
    async fn list_documents(
        &self,
        ctx: DocumentsOpenApiRequestContext,
    ) -> DocumentsServiceResult<DocumentList>;
    async fn retrieve_document(
        &self,
        ctx: DocumentsOpenApiRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<Document>;
}

#[async_trait]
pub trait DocumentsAppApi: Send + Sync {
    async fn list_documents(
        &self,
        ctx: DocumentsAppRequestContext,
    ) -> DocumentsServiceResult<DocumentList>;
    async fn create_document(
        &self,
        ctx: DocumentsAppRequestContext,
        request: DocumentCreateRequest,
    ) -> DocumentsServiceResult<Document>;
    async fn retrieve_document(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<Document>;
    async fn update_document(
        &self,
        ctx: DocumentsAppRequestContext,
        document_id: String,
        request: DocumentUpdateRequest,
    ) -> DocumentsServiceResult<Document>;

    /// Binds (or clears) the Drive space/node that stores this document body.
    /// Implementations that do not manage Drive keep the default error.
    async fn bind_document_drive(
        &self,
        _ctx: DocumentsAppRequestContext,
        _document_id: String,
        _request: DocumentDriveBindingRequest,
    ) -> DocumentsServiceResult<Document> {
        Err(DocumentsServiceError::Internal(
            "Drive binding is not available on this surface".to_owned(),
        ))
    }

    async fn delete_document(
        &self,
        _ctx: DocumentsAppRequestContext,
        _document_id: String,
    ) -> DocumentsServiceResult<()> {
        Err(DocumentsServiceError::Internal(
            "document deletion is not available on this surface".to_owned(),
        ))
    }

    async fn list_document_revisions(
        &self,
        _ctx: DocumentsAppRequestContext,
        _document_id: String,
    ) -> DocumentsServiceResult<DocumentRevisionList> {
        Err(DocumentsServiceError::Internal(
            "document revisions are not available on this surface".to_owned(),
        ))
    }

    async fn get_document_identity(
        &self,
        _ctx: DocumentsAppRequestContext,
        _document_id: String,
    ) -> DocumentsServiceResult<DocumentIdentity> {
        Err(DocumentsServiceError::Internal(
            "document identity is not available on this surface".to_owned(),
        ))
    }

    async fn update_document_identity(
        &self,
        _ctx: DocumentsAppRequestContext,
        _document_id: String,
        _request: DocumentIdentityUpdateRequest,
    ) -> DocumentsServiceResult<DocumentIdentity> {
        Err(DocumentsServiceError::Internal(
            "document identity is not available on this surface".to_owned(),
        ))
    }

    async fn get_revision_content(
        &self,
        _ctx: DocumentsAppRequestContext,
        _document_id: String,
        _revision_id: String,
    ) -> DocumentsServiceResult<DocumentRevisionContent> {
        Err(DocumentsServiceError::Internal(
            "revision content is not available on this surface".to_owned(),
        ))
    }

    async fn restore_document_revision(
        &self,
        _ctx: DocumentsAppRequestContext,
        _document_id: String,
        _revision_id: String,
    ) -> DocumentsServiceResult<Document> {
        Err(DocumentsServiceError::Internal(
            "revision restore is not available on this surface".to_owned(),
        ))
    }

    /// Public, unauthenticated delivery of published documents. The tenant is
    /// resolved by the deployment (not from a client header) so a public page
    /// can render without an IAM session. Implementations that do not serve
    /// public delivery keep the default error.
    async fn list_published_documents(
        &self,
        _tenant_id: i64,
        _locale: &str,
    ) -> DocumentsServiceResult<PublishedDocumentList> {
        Err(DocumentsServiceError::Internal(
            "public document delivery is not available on this surface".to_owned(),
        ))
    }

    async fn retrieve_published_document(
        &self,
        _tenant_id: i64,
        _document_ref: &str,
        _locale: &str,
    ) -> DocumentsServiceResult<PublishedDocument> {
        Err(DocumentsServiceError::Internal(
            "public document delivery is not available on this surface".to_owned(),
        ))
    }

    // Developer catalog (API market / SDK market). The default implementations
    // keep lightweight test doubles compiling; the authoritative service
    // overrides every method.

    async fn developer_catalog_overview(
        &self,
        _ctx: DocumentsAppRequestContext,
    ) -> DocumentsServiceResult<DeveloperCatalogOverview> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available on this surface".to_owned(),
        ))
    }

    async fn list_developer_catalog_categories(
        &self,
        _ctx: DocumentsAppRequestContext,
    ) -> DocumentsServiceResult<CatalogCategoryList> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available on this surface".to_owned(),
        ))
    }

    async fn list_developer_catalog_languages(
        &self,
        _ctx: DocumentsAppRequestContext,
    ) -> DocumentsServiceResult<CatalogLanguageList> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available on this surface".to_owned(),
        ))
    }

    async fn list_developer_catalog_apis(
        &self,
        _ctx: DocumentsAppRequestContext,
        _query: CatalogApiSurfaceQuery,
    ) -> DocumentsServiceResult<CatalogApiSurfacePage> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available on this surface".to_owned(),
        ))
    }

    async fn retrieve_developer_catalog_api(
        &self,
        _ctx: DocumentsAppRequestContext,
        _surface_id: String,
    ) -> DocumentsServiceResult<CatalogApiSurfaceDetail> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available on this surface".to_owned(),
        ))
    }

    async fn retrieve_developer_catalog_api_schema(
        &self,
        _ctx: DocumentsAppRequestContext,
        _surface_id: String,
    ) -> DocumentsServiceResult<CatalogApiSchema> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available on this surface".to_owned(),
        ))
    }

    async fn list_developer_catalog_api_operations(
        &self,
        _ctx: DocumentsAppRequestContext,
        _surface_id: String,
        _query: CatalogApiOperationQuery,
    ) -> DocumentsServiceResult<CatalogApiOperationPage> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available on this surface".to_owned(),
        ))
    }

    async fn list_developer_catalog_sdks(
        &self,
        _ctx: DocumentsAppRequestContext,
        _query: CatalogSdkQuery,
    ) -> DocumentsServiceResult<CatalogSdkFamilyPage> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available on this surface".to_owned(),
        ))
    }

    async fn retrieve_developer_catalog_sdk(
        &self,
        _ctx: DocumentsAppRequestContext,
        _sdk_id: String,
    ) -> DocumentsServiceResult<CatalogSdkFamilyDetail> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available on this surface".to_owned(),
        ))
    }
}

#[async_trait]
pub trait DocumentsBackendApi: Send + Sync {
    async fn list_documents(
        &self,
        ctx: DocumentsBackendRequestContext,
    ) -> DocumentsServiceResult<DocumentList>;
    async fn create_document(
        &self,
        ctx: DocumentsBackendRequestContext,
        request: DocumentCreateRequest,
    ) -> DocumentsServiceResult<Document>;
    async fn retrieve_document(
        &self,
        ctx: DocumentsBackendRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<Document>;
    async fn update_document(
        &self,
        ctx: DocumentsBackendRequestContext,
        document_id: String,
        request: DocumentUpdateRequest,
    ) -> DocumentsServiceResult<Document>;
    async fn delete_document(
        &self,
        ctx: DocumentsBackendRequestContext,
        document_id: String,
    ) -> DocumentsServiceResult<()>;
}

#[async_trait]
pub trait DocumentsRepository: Send + Sync {
    async fn list_by_tenant(&self, tenant_id: i64) -> DocumentsServiceResult<Vec<Document>>;
    async fn find_by_id(
        &self,
        tenant_id: i64,
        document_id: &str,
    ) -> DocumentsServiceResult<Option<Document>>;
    async fn insert(&self, tenant_id: i64, document: Document) -> DocumentsServiceResult<Document>;

    /// Persists the Drive binding for one document row.
    async fn set_drive_binding(
        &self,
        _tenant_id: i64,
        _document_id: &str,
        _drive_space_id: Option<&str>,
        _drive_node_id: Option<&str>,
    ) -> DocumentsServiceResult<Document> {
        Err(DocumentsServiceError::Internal(
            "Drive binding is not available in this repository".to_owned(),
        ))
    }

    /// Appends one immutable published revision.
    async fn insert_revision(
        &self,
        _tenant_id: i64,
        _revision: DocumentRevision,
    ) -> DocumentsServiceResult<DocumentRevision> {
        Err(DocumentsServiceError::Internal(
            "document revisions are not available in this repository".to_owned(),
        ))
    }

    /// Lists revisions for one document, newest first.
    async fn list_revisions(
        &self,
        _tenant_id: i64,
        _document_id: &str,
    ) -> DocumentsServiceResult<Vec<DocumentRevision>> {
        Ok(Vec::new())
    }

    /// Returns the Drive space/node bound to a document, if any.
    async fn find_drive_binding(
        &self,
        _tenant_id: i64,
        _document_id: &str,
    ) -> DocumentsServiceResult<Option<(String, String)>> {
        Ok(None)
    }

    /// Returns the editable public identity of one document.
    async fn find_public_identity(
        &self,
        _tenant_id: i64,
        _document_id: &str,
    ) -> DocumentsServiceResult<Option<(String, String)>> {
        Ok(None)
    }

    /// Updates locale/slug for one document.
    async fn set_public_identity(
        &self,
        _tenant_id: i64,
        _document_id: &str,
        _locale: &str,
        _slug: &str,
    ) -> DocumentsServiceResult<()> {
        Err(DocumentsServiceError::Internal(
            "document identity is not available in this repository".to_owned(),
        ))
    }

    /// Finds one revision of a document.
    async fn find_revision(
        &self,
        _tenant_id: i64,
        _document_id: &str,
        _revision_id: &str,
    ) -> DocumentsServiceResult<Option<DocumentRevision>> {
        Ok(None)
    }

    /// Insert with the public identity used by `/docs/{slug-or-id}`. The default
    /// keeps lightweight test repositories compiling; the PostgreSQL repository
    /// writes the locale and slug columns.
    async fn insert_with_public_identity(
        &self,
        tenant_id: i64,
        document: Document,
        _locale: &str,
        _slug: &str,
    ) -> DocumentsServiceResult<Document> {
        self.insert(tenant_id, document).await
    }
    async fn update(
        &self,
        tenant_id: i64,
        document_id: &str,
        request: DocumentUpdateRequest,
    ) -> DocumentsServiceResult<Document>;
    async fn delete(&self, tenant_id: i64, document_id: &str) -> DocumentsServiceResult<()>;

    /// Published-document delivery reads. Default implementations keep the
    /// in-memory test repository compiling; the PostgreSQL repository owns the
    /// authoritative queries.
    async fn list_published_documents(
        &self,
        _tenant_id: i64,
        _locale: &str,
    ) -> DocumentsServiceResult<PublishedDocumentList> {
        Err(DocumentsServiceError::Internal(
            "public document delivery is not available in this repository".to_owned(),
        ))
    }

    async fn find_published_document(
        &self,
        _tenant_id: i64,
        _document_ref: &str,
        _locale: &str,
    ) -> DocumentsServiceResult<Option<PublishedDocument>> {
        Err(DocumentsServiceError::Internal(
            "public document delivery is not available in this repository".to_owned(),
        ))
    }

    // Developer catalog reads. Default implementations keep the in-memory test
    // repository compiling; the PostgreSQL repository owns the authoritative
    // queries.

    async fn developer_catalog_overview(
        &self,
        _tenant_id: i64,
        _locale: &str,
    ) -> DocumentsServiceResult<DeveloperCatalogOverview> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available in this repository".to_owned(),
        ))
    }

    async fn developer_catalog_categories(
        &self,
        _tenant_id: i64,
        _locale: &str,
    ) -> DocumentsServiceResult<CatalogCategoryList> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available in this repository".to_owned(),
        ))
    }

    async fn developer_catalog_languages(
        &self,
        _tenant_id: i64,
        _locale: &str,
    ) -> DocumentsServiceResult<CatalogLanguageList> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available in this repository".to_owned(),
        ))
    }

    async fn developer_catalog_api_surfaces(
        &self,
        _tenant_id: i64,
        _locale: &str,
        _query: CatalogApiSurfaceQuery,
    ) -> DocumentsServiceResult<CatalogApiSurfacePage> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available in this repository".to_owned(),
        ))
    }

    async fn developer_catalog_api_surface(
        &self,
        _tenant_id: i64,
        _locale: &str,
        _surface_id: &str,
    ) -> DocumentsServiceResult<Option<CatalogApiSurfaceDetail>> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available in this repository".to_owned(),
        ))
    }

    async fn developer_catalog_api_schema(
        &self,
        _tenant_id: i64,
        _surface_id: &str,
    ) -> DocumentsServiceResult<Option<CatalogApiSchema>> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available in this repository".to_owned(),
        ))
    }

    async fn developer_catalog_api_operations(
        &self,
        _tenant_id: i64,
        _locale: &str,
        _surface_id: &str,
        _query: CatalogApiOperationQuery,
    ) -> DocumentsServiceResult<CatalogApiOperationPage> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available in this repository".to_owned(),
        ))
    }

    async fn developer_catalog_sdks(
        &self,
        _tenant_id: i64,
        _locale: &str,
        _query: CatalogSdkQuery,
    ) -> DocumentsServiceResult<CatalogSdkFamilyPage> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available in this repository".to_owned(),
        ))
    }

    async fn developer_catalog_sdk(
        &self,
        _tenant_id: i64,
        _locale: &str,
        _sdk_id: &str,
    ) -> DocumentsServiceResult<Option<CatalogSdkFamilyDetail>> {
        Err(DocumentsServiceError::Internal(
            "developer catalog is not available in this repository".to_owned(),
        ))
    }
}
