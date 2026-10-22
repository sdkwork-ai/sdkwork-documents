use async_trait::async_trait;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_documents_contract::{
    CatalogApiOperation, CatalogApiOperationPage, CatalogApiOperationQuery, CatalogApiSchema,
    CatalogApiSurface, CatalogApiSurfaceDetail, CatalogApiSurfacePage, CatalogApiSurfaceQuery,
    CatalogCategory, CatalogCategoryList, CatalogCounts, CatalogFacet, CatalogLanguage,
    CatalogLanguageList, CatalogSdkFamily, CatalogSdkFamilyDetail, CatalogSdkFamilyPage,
    CatalogSdkQuery, CatalogSdkRelease, DeveloperCatalogOverview, Document, DocumentUpdateRequest,
    DocumentsRepository, DocumentsServiceError, DocumentsServiceResult,
};
use sdkwork_utils_rust::{is_uuid, trim};

pub struct DocumentsSqlxRepository {
    pool: DatabasePool,
}

impl DocumentsSqlxRepository {
    pub fn new(pool: DatabasePool) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(error: impl std::fmt::Display) -> DocumentsServiceError {
        DocumentsServiceError::Internal(error.to_string())
    }

    fn parse_document_id(document_id: &str) -> DocumentsServiceResult<uuid::Uuid> {
        if !is_uuid(document_id) {
            return Err(DocumentsServiceError::Validation(format!(
                "invalid document id: {document_id}"
            )));
        }
        uuid::Uuid::parse_str(trim(document_id).as_str())
            .map_err(|error| DocumentsServiceError::Validation(error.to_string()))
    }

    fn postgres(&self) -> DocumentsServiceResult<&sqlx::PgPool> {
        self.pool.as_postgres().ok_or_else(|| {
            DocumentsServiceError::Internal(
                "documents repository requires a PostgreSQL pool (DATABASE_SPEC: authoritative-server persistence is PostgreSQL only)".to_owned(),
            )
        })
    }
}

#[async_trait]
impl DocumentsRepository for DocumentsSqlxRepository {
    async fn list_by_tenant(&self, tenant_id: i64) -> DocumentsServiceResult<Vec<Document>> {
        if let Some(pg) = self.pool.as_postgres() {
            let rows = sqlx::query_as::<_, PostgresDocumentRow>(
                "SELECT id, title, body, status FROM documents_document WHERE tenant_id = $1 ORDER BY updated_at DESC",
            )
            .bind(tenant_id)
            .fetch_all(pg)
            .await
            .map_err(Self::map_sqlx_error)?;
            return Ok(rows
                .into_iter()
                .map(PostgresDocumentRow::into_document)
                .collect());
        }

        Err(DocumentsServiceError::Internal(
            "documents repository requires a PostgreSQL pool (DATABASE_SPEC: authoritative-server persistence is PostgreSQL only)".into(),
        ))
    }

    async fn find_by_id(
        &self,
        tenant_id: i64,
        document_id: &str,
    ) -> DocumentsServiceResult<Option<Document>> {
        if let Some(pg) = self.pool.as_postgres() {
            let id = Self::parse_document_id(document_id)?;
            let row = sqlx::query_as::<_, PostgresDocumentRow>(
                "SELECT id, title, body, status FROM documents_document WHERE tenant_id = $1 AND id = $2",
            )
            .bind(tenant_id)
            .bind(id)
            .fetch_optional(pg)
            .await
            .map_err(Self::map_sqlx_error)?;
            return Ok(row.map(PostgresDocumentRow::into_document));
        }

        Err(DocumentsServiceError::Internal(
            "documents repository requires a PostgreSQL pool (DATABASE_SPEC: authoritative-server persistence is PostgreSQL only)".into(),
        ))
    }

    async fn insert(&self, tenant_id: i64, document: Document) -> DocumentsServiceResult<Document> {
        if let Some(pg) = self.pool.as_postgres() {
            let id = Self::parse_document_id(&document.id)?;
            sqlx::query(
                "INSERT INTO documents_document (id, tenant_id, title, body, status) VALUES ($1, $2, $3, $4, $5)",
            )
            .bind(id)
            .bind(tenant_id)
            .bind(&document.title)
            .bind(&document.body)
            .bind(&document.status)
            .execute(pg)
            .await
            .map_err(Self::map_sqlx_error)?;
            return Ok(document);
        }

        Err(DocumentsServiceError::Internal(
            "documents repository requires a PostgreSQL pool (DATABASE_SPEC: authoritative-server persistence is PostgreSQL only)".into(),
        ))
    }

    async fn update(
        &self,
        tenant_id: i64,
        document_id: &str,
        request: DocumentUpdateRequest,
    ) -> DocumentsServiceResult<Document> {
        let existing = self
            .find_by_id(tenant_id, document_id)
            .await?
            .ok_or_else(|| DocumentsServiceError::NotFound(document_id.to_owned()))?;
        let updated = Document {
            title: request.title.unwrap_or(existing.title),
            body: request.body.unwrap_or(existing.body),
            status: request.status.unwrap_or(existing.status),
            ..existing
        };

        if let Some(pg) = self.pool.as_postgres() {
            let id = Self::parse_document_id(&updated.id)?;
            sqlx::query(
                "UPDATE documents_document SET title = $1, body = $2, status = $3, updated_at = NOW() WHERE tenant_id = $4 AND id = $5",
            )
            .bind(&updated.title)
            .bind(&updated.body)
            .bind(&updated.status)
            .bind(tenant_id)
            .bind(id)
            .execute(pg)
            .await
            .map_err(Self::map_sqlx_error)?;
            return Ok(updated);
        }

        Err(DocumentsServiceError::Internal(
            "documents repository requires a PostgreSQL pool (DATABASE_SPEC: authoritative-server persistence is PostgreSQL only)".into(),
        ))
    }

    async fn delete(&self, tenant_id: i64, document_id: &str) -> DocumentsServiceResult<()> {
        if let Some(pg) = self.pool.as_postgres() {
            let id = Self::parse_document_id(document_id)?;
            let result =
                sqlx::query("DELETE FROM documents_document WHERE tenant_id = $1 AND id = $2")
                    .bind(tenant_id)
                    .bind(id)
                    .execute(pg)
                    .await
                    .map_err(Self::map_sqlx_error)?;
            if result.rows_affected() == 0 {
                return Err(DocumentsServiceError::NotFound(document_id.to_owned()));
            }
            return Ok(());
        }

        Err(DocumentsServiceError::Internal(
            "documents repository requires a PostgreSQL pool (DATABASE_SPEC: authoritative-server persistence is PostgreSQL only)".into(),
        ))
    }

    async fn developer_catalog_overview(
        &self,
        tenant_id: i64,
    ) -> DocumentsServiceResult<DeveloperCatalogOverview> {
        let pg = self.postgres()?;
        let counts = sqlx::query_as::<_, CatalogCountsRow>(
            r#"
            SELECT
              (SELECT COUNT(*) FROM documents_catalog_module
                WHERE tenant_id = $1 AND module_status = 'active') AS modules,
              (SELECT COUNT(*) FROM documents_api_surface
                WHERE tenant_id = $1 AND publish_status = 'published') AS api_surfaces,
              (SELECT COALESCE(SUM(operation_count), 0) FROM documents_api_surface
                WHERE tenant_id = $1 AND publish_status = 'published') AS api_operations,
              (SELECT COUNT(*) FROM documents_sdk_family
                WHERE tenant_id = $1 AND publish_status = 'published') AS sdk_families,
              (SELECT COUNT(*) FROM documents_sdk_release
                WHERE tenant_id = $1) AS sdk_releases,
              (SELECT COUNT(*) FROM documents_sdk_language
                WHERE language_status = 'active') AS languages
            "#,
        )
        .bind(tenant_id)
        .fetch_one(pg)
        .await
        .map_err(Self::map_sqlx_error)?;

        let categories = self.developer_catalog_categories(tenant_id).await?;
        let surface_facets = sqlx::query_as::<_, CatalogFacetRow>(
            r#"
            SELECT surface_code AS code, COUNT(*) AS count
            FROM documents_api_surface
            WHERE tenant_id = $1 AND publish_status = 'published'
            GROUP BY surface_code
            ORDER BY count DESC, code ASC
            "#,
        )
        .bind(tenant_id)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?
        .into_iter()
        .map(CatalogFacetRow::into_facet)
        .collect();

        let sdk_type_facets = sqlx::query_as::<_, CatalogFacetRow>(
            r#"
            SELECT sdk_type AS code, COUNT(*) AS count
            FROM documents_sdk_family
            WHERE tenant_id = $1 AND publish_status = 'published'
            GROUP BY sdk_type
            ORDER BY count DESC, code ASC
            "#,
        )
        .bind(tenant_id)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?
        .into_iter()
        .map(CatalogFacetRow::into_facet)
        .collect();

        let language_facets = sqlx::query_as::<_, CatalogFacetRow>(
            r#"
            SELECT r.language_code AS code, COUNT(*) AS count
            FROM documents_sdk_release r
            JOIN documents_sdk_language l ON l.language_code = r.language_code
            WHERE r.tenant_id = $1
            GROUP BY r.language_code, l.sort_order
            ORDER BY l.sort_order ASC
            "#,
        )
        .bind(tenant_id)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?
        .into_iter()
        .map(CatalogFacetRow::into_facet)
        .collect();

        let featured_api_surface_ids = sqlx::query_scalar::<_, String>(
            r#"
            SELECT id::text FROM documents_api_surface
            WHERE tenant_id = $1 AND publish_status = 'published' AND featured = TRUE
            ORDER BY operation_count DESC, api_authority ASC
            LIMIT 8
            "#,
        )
        .bind(tenant_id)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?;

        let featured_sdk_ids = sqlx::query_scalar::<_, String>(
            r#"
            SELECT id::text FROM documents_sdk_family
            WHERE tenant_id = $1 AND publish_status = 'published' AND featured = TRUE
            ORDER BY download_count DESC, sdk_code ASC
            LIMIT 8
            "#,
        )
        .bind(tenant_id)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(DeveloperCatalogOverview {
            counts: counts.into_counts(),
            categories: categories.items,
            surface_facets,
            sdk_type_facets,
            language_facets,
            featured_api_surface_ids,
            featured_sdk_ids,
        })
    }

    async fn developer_catalog_categories(
        &self,
        tenant_id: i64,
    ) -> DocumentsServiceResult<CatalogCategoryList> {
        let pg = self.postgres()?;
        let rows = sqlx::query_as::<_, CatalogCategoryRow>(
            r#"
            SELECT c.category_code, c.name,
                   COALESCE(c.description, '') AS description,
                   COALESCE(c.icon, '') AS icon,
                   c.sort_order, c.parent_code,
                   (SELECT COUNT(*) FROM documents_api_surface_category sc
                     JOIN documents_api_surface s
                       ON s.id = sc.surface_id AND s.tenant_id = sc.tenant_id
                     WHERE sc.tenant_id = c.tenant_id AND sc.category_code = c.category_code
                       AND s.publish_status = 'published') AS api_count,
                   (SELECT COUNT(*) FROM documents_sdk_category sc
                     JOIN documents_sdk_family f
                       ON f.id = sc.sdk_family_id AND f.tenant_id = sc.tenant_id
                     WHERE sc.tenant_id = c.tenant_id AND sc.category_code = c.category_code
                       AND f.publish_status = 'published') AS sdk_count
            FROM documents_catalog_category c
            WHERE c.tenant_id = $1 AND c.category_status = 'active'
            ORDER BY c.sort_order ASC, c.category_code ASC
            "#,
        )
        .bind(tenant_id)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        Ok(CatalogCategoryList {
            items: rows
                .into_iter()
                .map(CatalogCategoryRow::into_category)
                .collect(),
        })
    }

    async fn developer_catalog_languages(
        &self,
        tenant_id: i64,
    ) -> DocumentsServiceResult<CatalogLanguageList> {
        let pg = self.postgres()?;
        let rows = sqlx::query_as::<_, CatalogLanguageRow>(
            r#"
            SELECT l.language_code AS code, l.language_name AS name, l.language_family AS family,
                   COALESCE(l.icon, '') AS icon, COALESCE(l.file_extension, '') AS file_extension,
                   COALESCE(l.official_url, '') AS official_url, l.sort_order,
                   (SELECT COUNT(*) FROM documents_sdk_release r
                     WHERE r.tenant_id = $1 AND r.language_code = l.language_code) AS release_count
            FROM documents_sdk_language l
            WHERE l.language_status = 'active'
            ORDER BY l.sort_order ASC, l.language_code ASC
            "#,
        )
        .bind(tenant_id)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        Ok(CatalogLanguageList {
            items: rows
                .into_iter()
                .map(CatalogLanguageRow::into_language)
                .collect(),
        })
    }

    async fn developer_catalog_api_surfaces(
        &self,
        tenant_id: i64,
        query: CatalogApiSurfaceQuery,
    ) -> DocumentsServiceResult<CatalogApiSurfacePage> {
        let pg = self.postgres()?;
        let page = query.page.unwrap_or(1).max(1);
        let page_size = query.page_size.unwrap_or(24).clamp(1, 100);
        let offset = (page - 1) * page_size;
        let pattern = query.q.as_deref().map(like_pattern);
        let total = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM documents_api_surface s
            JOIN documents_catalog_module m ON m.id = s.module_id
            WHERE s.tenant_id = $1 AND s.publish_status = 'published' AND s.visibility = 'public'
              AND ($2::text IS NULL OR s.title ILIKE $2 ESCAPE '\' OR COALESCE(s.description, '') ILIKE $2 ESCAPE '\' OR m.module_name ILIKE $2 ESCAPE '\' OR s.api_authority ILIKE $2 ESCAPE '\')
              AND ($3::text IS NULL OR s.surface_code = $3)
              AND ($4::text IS NULL OR m.module_code = $4)
              AND ($5::text IS NULL OR s.category_code = $5 OR EXISTS (
                    SELECT 1 FROM documents_api_surface_category sc
                    WHERE sc.surface_id = s.id AND sc.category_code = $5))
            "#,
        )
        .bind(tenant_id)
        .bind(pattern.as_deref())
        .bind(query.surface_code.as_deref())
        .bind(query.module_code.as_deref())
        .bind(query.category_code.as_deref())
        .fetch_one(pg)
        .await
        .map_err(Self::map_sqlx_error)?;

        let rows = sqlx::query_as::<_, CatalogApiSurfaceRow>(
                r#"
                SELECT s.id::text AS id, m.module_code, m.module_name, s.surface_code, s.surface_name,
                       s.title, COALESCE(s.description, '') AS description, s.api_version,
                       s.api_authority, COALESCE(s.api_prefix, '') AS api_prefix,
                       COALESCE(s.category_code, '') AS category_code,
                       s.operation_count, s.tag_count,
                       COALESCE(s.auth_modes::text, '[]') AS auth_modes,
                       COALESCE((s.metadata->'tagNames')::text, '[]') AS tags,
                       s.featured, s.deprecated,
                       COALESCE((SELECT jsonb_agg(sc.category_code ORDER BY sc.sort_order)
                                 FROM documents_api_surface_category sc
                                 WHERE sc.surface_id = s.id), '[]')::text AS categories,
                       EXISTS (SELECT 1 FROM documents_api_schema sch WHERE sch.surface_id = s.id) AS schema_available
                FROM documents_api_surface s
                JOIN documents_catalog_module m ON m.id = s.module_id
                WHERE s.tenant_id = $1 AND s.publish_status = 'published' AND s.visibility = 'public'
                  AND ($2::text IS NULL OR s.title ILIKE $2 ESCAPE '\' OR COALESCE(s.description, '') ILIKE $2 ESCAPE '\' OR m.module_name ILIKE $2 ESCAPE '\' OR s.api_authority ILIKE $2 ESCAPE '\')
                  AND ($3::text IS NULL OR s.surface_code = $3)
                  AND ($4::text IS NULL OR m.module_code = $4)
                  AND ($5::text IS NULL OR s.category_code = $5 OR EXISTS (
                        SELECT 1 FROM documents_api_surface_category sc
                        WHERE sc.surface_id = s.id AND sc.category_code = $5))
                ORDER BY s.featured DESC, m.sort_order ASC, s.surface_code ASC, s.api_authority ASC
                LIMIT $6 OFFSET $7
                "#
        )
        .bind(tenant_id)
        .bind(pattern.as_deref())
        .bind(query.surface_code.as_deref())
        .bind(query.module_code.as_deref())
        .bind(query.category_code.as_deref())
        .bind(page_size)
        .bind(offset)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(CatalogApiSurfacePage {
            items: rows
                .into_iter()
                .map(CatalogApiSurfaceRow::into_surface)
                .collect(),
            total,
            page,
            page_size,
        })
    }

    async fn developer_catalog_api_surface(
        &self,
        tenant_id: i64,
        surface_id: &str,
    ) -> DocumentsServiceResult<Option<CatalogApiSurfaceDetail>> {
        let pg = self.postgres()?;
        let id = parse_uuid(surface_id)?;
        let row = sqlx::query_as::<_, CatalogApiSurfaceDetailRow>(
            r#"
            SELECT s.id::text AS id, m.module_code, m.module_name, s.surface_code, s.surface_name,
                   s.title, COALESCE(s.description, '') AS description, s.api_version,
                   s.api_authority, COALESCE(s.api_prefix, '') AS api_prefix,
                   COALESCE(s.category_code, '') AS category_code,
                   s.operation_count, s.tag_count,
                   COALESCE(s.auth_modes::text, '[]') AS auth_modes,
                   COALESCE((s.metadata->'tagNames')::text, '[]') AS tags,
                   s.featured, s.deprecated,
                   COALESCE((SELECT jsonb_agg(sc.category_code ORDER BY sc.sort_order)
                             FROM documents_api_surface_category sc
                             WHERE sc.surface_id = s.id), '[]')::text AS categories,
                   EXISTS (SELECT 1 FROM documents_api_schema sch WHERE sch.surface_id = s.id) AS schema_available,
                   COALESCE(s.servers::text, '[]') AS servers,
                   (SELECT sch.schema_version FROM documents_api_schema sch
                     WHERE sch.surface_id = s.id ORDER BY sch.imported_at DESC LIMIT 1) AS schema_version,
                   (SELECT sch.schema_checksum FROM documents_api_schema sch
                     WHERE sch.surface_id = s.id ORDER BY sch.imported_at DESC LIMIT 1) AS schema_checksum,
                   s.source_path
            FROM documents_api_surface s
            JOIN documents_catalog_module m ON m.id = s.module_id
            WHERE s.tenant_id = $1 AND s.id = $2 AND s.publish_status = 'published'
            "#,
        )
        .bind(tenant_id)
        .bind(id)
        .fetch_optional(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        Ok(row.map(CatalogApiSurfaceDetailRow::into_detail))
    }

    async fn developer_catalog_api_schema(
        &self,
        tenant_id: i64,
        surface_id: &str,
    ) -> DocumentsServiceResult<Option<CatalogApiSchema>> {
        let pg = self.postgres()?;
        let id = parse_uuid(surface_id)?;
        let row = sqlx::query_as::<_, CatalogApiSchemaRow>(
            r#"
            SELECT s.id::text AS surface_id, s.api_authority, sch.schema_version, sch.schema_checksum,
                   sch.spec::text AS spec
            FROM documents_api_schema sch
            JOIN documents_api_surface s ON s.id = sch.surface_id
            WHERE sch.tenant_id = $1 AND sch.surface_id = $2 AND s.publish_status = 'published'
            ORDER BY sch.imported_at DESC
            LIMIT 1
            "#,
        )
        .bind(tenant_id)
        .bind(id)
        .fetch_optional(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        row.map(CatalogApiSchemaRow::into_schema).transpose()
    }

    async fn developer_catalog_api_operations(
        &self,
        tenant_id: i64,
        surface_id: &str,
        query: CatalogApiOperationQuery,
    ) -> DocumentsServiceResult<CatalogApiOperationPage> {
        let pg = self.postgres()?;
        let id = parse_uuid(surface_id)?;
        let page = query.page.unwrap_or(1).max(1);
        let page_size = query.page_size.unwrap_or(50).clamp(1, 200);
        let offset = (page - 1) * page_size;
        let pattern = query.q.as_deref().map(like_pattern);
        let total = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM documents_api_operation
            WHERE tenant_id = $1 AND surface_id = $2
              AND ($3::text IS NULL OR summary ILIKE $3 ESCAPE '\' OR path ILIKE $3 ESCAPE '\' OR method ILIKE $3 ESCAPE '\')
            "#,
        )
        .bind(tenant_id)
        .bind(id)
        .bind(pattern.as_deref())
        .fetch_one(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        let rows = sqlx::query_as::<_, CatalogApiOperationRow>(
            r#"
            SELECT operation_key, method, path, COALESCE(summary, '') AS summary,
                   COALESCE(description, '') AS description,
                   COALESCE(tags::text, '[]') AS tags, deprecated, sort_order
            FROM documents_api_operation
            WHERE tenant_id = $1 AND surface_id = $2
              AND ($3::text IS NULL OR summary ILIKE $3 ESCAPE '\' OR path ILIKE $3 ESCAPE '\' OR method ILIKE $3 ESCAPE '\')
            ORDER BY sort_order ASC, operation_key ASC
            LIMIT $4 OFFSET $5
            "#,
        )
        .bind(tenant_id)
        .bind(id)
        .bind(pattern.as_deref())
        .bind(page_size)
        .bind(offset)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        Ok(CatalogApiOperationPage {
            items: rows
                .into_iter()
                .map(CatalogApiOperationRow::into_operation)
                .collect(),
            total,
            page,
            page_size,
        })
    }

    async fn developer_catalog_sdks(
        &self,
        tenant_id: i64,
        query: CatalogSdkQuery,
    ) -> DocumentsServiceResult<CatalogSdkFamilyPage> {
        let pg = self.postgres()?;
        let page = query.page.unwrap_or(1).max(1);
        let page_size = query.page_size.unwrap_or(24).clamp(1, 100);
        let offset = (page - 1) * page_size;
        let pattern = query.q.as_deref().map(like_pattern);
        let total = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM documents_sdk_family f
            LEFT JOIN documents_catalog_module m ON m.id = f.module_id
            WHERE f.tenant_id = $1 AND f.publish_status = 'published' AND f.visibility = 'public'
              AND ($2::text IS NULL OR f.sdk_name ILIKE $2 ESCAPE '\' OR f.sdk_code ILIKE $2 ESCAPE '\' OR COALESCE(f.description, '') ILIKE $2 ESCAPE '\' OR COALESCE(f.package_name, '') ILIKE $2 ESCAPE '\' OR COALESCE(m.module_name, '') ILIKE $2 ESCAPE '\')
              AND ($3::text IS NULL OR f.category_code = $3 OR EXISTS (
                    SELECT 1 FROM documents_sdk_category sc
                    WHERE sc.sdk_family_id = f.id AND sc.category_code = $3))
              AND ($4::text IS NULL OR m.module_code = $4)
              AND ($5::text IS NULL OR EXISTS (
                    SELECT 1 FROM documents_sdk_release r
                    WHERE r.sdk_family_id = f.id AND r.language_code = $5))
              AND ($6::text IS NULL OR f.sdk_type = $6)
            "#,
        )
        .bind(tenant_id)
        .bind(pattern.as_deref())
        .bind(query.category_code.as_deref())
        .bind(query.module_code.as_deref())
        .bind(query.language_code.as_deref())
        .bind(query.sdk_type.as_deref())
        .fetch_one(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        let rows = sqlx::query_as::<_, CatalogSdkFamilyRow>(
                r#"
                SELECT f.id::text AS id,
                       COALESCE(m.module_code, f.sdk_code) AS module_code,
                       COALESCE(m.module_name, f.sdk_name) AS module_name,
                       f.sdk_code, f.sdk_name, f.sdk_type, COALESCE(f.surface_code, '') AS surface_code,
                       COALESCE(f.package_name, '') AS package_name,
                       COALESCE(f.description, '') AS description, f.sdk_version,
                       COALESCE(f.category_code, '') AS category_code,
                       COALESCE((SELECT jsonb_agg(sc.category_code ORDER BY sc.sort_order)
                                 FROM documents_sdk_category sc
                                 WHERE sc.sdk_family_id = f.id), '[]')::text AS categories,
                       COALESCE((SELECT jsonb_agg(DISTINCT r.language_code)
                                 FROM documents_sdk_release r
                                 WHERE r.sdk_family_id = f.id), '[]')::text AS languages,
                       (SELECT COUNT(*) FROM documents_sdk_release r WHERE r.sdk_family_id = f.id) AS release_count,
                       f.featured, f.deprecated, f.download_count, f.rating::float8 AS rating,
                       COALESCE(f.repository_url, '') AS repository_url,
                       COALESCE(f.docs_url, '') AS docs_url,
                       f.license_code, f.support_level, f.pricing_tier
                FROM documents_sdk_family f
                LEFT JOIN documents_catalog_module m ON m.id = f.module_id
                WHERE f.tenant_id = $1 AND f.publish_status = 'published' AND f.visibility = 'public'
                  AND ($2::text IS NULL OR f.sdk_name ILIKE $2 ESCAPE '\' OR f.sdk_code ILIKE $2 ESCAPE '\' OR COALESCE(f.description, '') ILIKE $2 ESCAPE '\' OR COALESCE(f.package_name, '') ILIKE $2 ESCAPE '\' OR COALESCE(m.module_name, '') ILIKE $2 ESCAPE '\')
                  AND ($3::text IS NULL OR f.category_code = $3 OR EXISTS (
                        SELECT 1 FROM documents_sdk_category sc
                        WHERE sc.sdk_family_id = f.id AND sc.category_code = $3))
                  AND ($4::text IS NULL OR m.module_code = $4)
                  AND ($5::text IS NULL OR EXISTS (
                        SELECT 1 FROM documents_sdk_release r
                        WHERE r.sdk_family_id = f.id AND r.language_code = $5))
                  AND ($6::text IS NULL OR f.sdk_type = $6)
                ORDER BY f.featured DESC, f.download_count DESC, f.sdk_code ASC
                LIMIT $7 OFFSET $8
                "#
        )
        .bind(tenant_id)
        .bind(pattern.as_deref())
        .bind(query.category_code.as_deref())
        .bind(query.module_code.as_deref())
        .bind(query.language_code.as_deref())
        .bind(query.sdk_type.as_deref())
        .bind(page_size)
        .bind(offset)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        Ok(CatalogSdkFamilyPage {
            items: rows
                .into_iter()
                .map(CatalogSdkFamilyRow::into_sdk)
                .collect(),
            total,
            page,
            page_size,
        })
    }

    async fn developer_catalog_sdk(
        &self,
        tenant_id: i64,
        sdk_id: &str,
    ) -> DocumentsServiceResult<Option<CatalogSdkFamilyDetail>> {
        let pg = self.postgres()?;
        let id = parse_uuid(sdk_id)?;
        let row = sqlx::query_as::<_, CatalogSdkFamilyDetailRow>(
            r#"
            SELECT f.id::text AS id,
                   COALESCE(m.module_code, f.sdk_code) AS module_code,
                   COALESCE(m.module_name, f.sdk_name) AS module_name,
                   f.sdk_code, f.sdk_name, f.sdk_type, COALESCE(f.surface_code, '') AS surface_code,
                   COALESCE(f.package_name, '') AS package_name,
                   COALESCE(f.description, '') AS description, f.sdk_version,
                   COALESCE(f.category_code, '') AS category_code,
                   COALESCE((SELECT jsonb_agg(sc.category_code ORDER BY sc.sort_order)
                             FROM documents_sdk_category sc
                             WHERE sc.sdk_family_id = f.id), '[]')::text AS categories,
                   COALESCE((SELECT jsonb_agg(DISTINCT r.language_code)
                             FROM documents_sdk_release r
                             WHERE r.sdk_family_id = f.id), '[]')::text AS languages,
                   (SELECT COUNT(*) FROM documents_sdk_release r WHERE r.sdk_family_id = f.id) AS release_count,
                   f.featured, f.deprecated, f.download_count, f.rating::float8 AS rating,
                   COALESCE(f.repository_url, '') AS repository_url,
                   COALESCE(f.docs_url, '') AS docs_url,
                   f.license_code, f.support_level, f.pricing_tier
            FROM documents_sdk_family f
            LEFT JOIN documents_catalog_module m ON m.id = f.module_id
            WHERE f.tenant_id = $1 AND f.id = $2 AND f.publish_status = 'published'
            "#,
        )
        .bind(tenant_id)
        .bind(id)
        .fetch_optional(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        let Some(row) = row else {
            return Ok(None);
        };
        let releases = sqlx::query_as::<_, CatalogSdkReleaseRow>(
            r#"
            SELECT r.language_code, COALESCE(l.language_name, r.language_code) AS language_name,
                   COALESCE(l.language_family, 'server') AS family, r.package_name, r.sdk_version,
                   r.install_command, r.download_url, r.archive_name, r.generation_state,
                   r.release_state, r.is_latest, r.released_at::text AS released_at
            FROM documents_sdk_release r
            LEFT JOIN documents_sdk_language l ON l.language_code = r.language_code
            WHERE r.tenant_id = $1 AND r.sdk_family_id = $2
            ORDER BY l.sort_order ASC, r.language_code ASC, r.sdk_version DESC
            "#,
        )
        .bind(tenant_id)
        .bind(id)
        .fetch_all(pg)
        .await
        .map_err(Self::map_sqlx_error)?;
        Ok(Some(row.into_detail(releases)))
    }
}

#[derive(sqlx::FromRow)]
struct PostgresDocumentRow {
    id: uuid::Uuid,
    title: String,
    body: String,
    status: String,
}

impl PostgresDocumentRow {
    fn into_document(self) -> Document {
        Document {
            id: self.id.to_string(),
            title: self.title,
            body: self.body,
            status: self.status,
        }
    }
}

fn parse_uuid(value: &str) -> DocumentsServiceResult<uuid::Uuid> {
    uuid::Uuid::parse_str(trim(value).as_str())
        .map_err(|error| DocumentsServiceError::Validation(error.to_string()))
}

fn like_pattern(value: &str) -> String {
    let escaped = value
        .trim()
        .replace('\\', "\\\\")
        .replace('%', "\\%")
        .replace('_', "\\_");
    format!("%{escaped}%")
}

fn json_string_list(raw: &str) -> Vec<String> {
    serde_json::from_str::<Vec<String>>(raw).unwrap_or_default()
}

fn optional_text(value: String) -> Option<String> {
    if value.trim().is_empty() {
        None
    } else {
        Some(value)
    }
}

#[derive(sqlx::FromRow)]
struct CatalogCountsRow {
    modules: i64,
    api_surfaces: i64,
    api_operations: i64,
    sdk_families: i64,
    sdk_releases: i64,
    languages: i64,
}

impl CatalogCountsRow {
    fn into_counts(self) -> CatalogCounts {
        CatalogCounts {
            modules: self.modules,
            api_surfaces: self.api_surfaces,
            api_operations: self.api_operations,
            sdk_families: self.sdk_families,
            sdk_releases: self.sdk_releases,
            languages: self.languages,
        }
    }
}

#[derive(sqlx::FromRow)]
struct CatalogFacetRow {
    code: String,
    count: i64,
}

impl CatalogFacetRow {
    fn into_facet(self) -> CatalogFacet {
        CatalogFacet {
            code: self.code,
            count: self.count,
        }
    }
}

#[derive(sqlx::FromRow)]
struct CatalogCategoryRow {
    category_code: String,
    name: String,
    description: String,
    icon: String,
    sort_order: i32,
    parent_code: Option<String>,
    api_count: i64,
    sdk_count: i64,
}

impl CatalogCategoryRow {
    fn into_category(self) -> CatalogCategory {
        CatalogCategory {
            code: self.category_code,
            name: self.name,
            description: self.description,
            icon: self.icon,
            sort_order: i64::from(self.sort_order),
            parent_code: self.parent_code,
            api_count: self.api_count,
            sdk_count: self.sdk_count,
        }
    }
}

#[derive(sqlx::FromRow)]
struct CatalogLanguageRow {
    code: String,
    name: String,
    family: String,
    icon: String,
    file_extension: String,
    official_url: String,
    sort_order: i32,
    release_count: i64,
}

impl CatalogLanguageRow {
    fn into_language(self) -> CatalogLanguage {
        CatalogLanguage {
            code: self.code,
            name: self.name,
            family: self.family,
            icon: self.icon,
            file_extension: self.file_extension,
            official_url: self.official_url,
            sort_order: i64::from(self.sort_order),
            release_count: self.release_count,
        }
    }
}

#[derive(sqlx::FromRow)]
struct CatalogApiSurfaceRow {
    id: String,
    module_code: String,
    module_name: String,
    surface_code: String,
    surface_name: String,
    title: String,
    description: String,
    api_version: String,
    api_authority: String,
    api_prefix: String,
    category_code: String,
    operation_count: i32,
    tag_count: i32,
    auth_modes: String,
    tags: String,
    featured: bool,
    deprecated: bool,
    categories: String,
    schema_available: bool,
}

impl CatalogApiSurfaceRow {
    fn into_surface(self) -> CatalogApiSurface {
        CatalogApiSurface {
            id: self.id,
            module_code: self.module_code,
            module_name: self.module_name,
            surface_code: self.surface_code,
            surface_name: self.surface_name,
            title: self.title,
            description: self.description,
            api_version: self.api_version,
            api_authority: self.api_authority,
            api_prefix: self.api_prefix,
            category_code: self.category_code,
            categories: json_string_list(&self.categories),
            operation_count: i64::from(self.operation_count),
            tag_count: i64::from(self.tag_count),
            auth_modes: json_string_list(&self.auth_modes),
            tags: json_string_list(&self.tags),
            featured: self.featured,
            deprecated: self.deprecated,
            schema_available: self.schema_available,
        }
    }
}

#[derive(sqlx::FromRow)]
struct CatalogApiSurfaceDetailRow {
    id: String,
    module_code: String,
    module_name: String,
    surface_code: String,
    surface_name: String,
    title: String,
    description: String,
    api_version: String,
    api_authority: String,
    api_prefix: String,
    category_code: String,
    operation_count: i32,
    tag_count: i32,
    auth_modes: String,
    tags: String,
    featured: bool,
    deprecated: bool,
    categories: String,
    schema_available: bool,
    servers: String,
    schema_version: Option<String>,
    schema_checksum: Option<String>,
    source_path: Option<String>,
}

impl CatalogApiSurfaceDetailRow {
    fn into_detail(self) -> CatalogApiSurfaceDetail {
        let surface = CatalogApiSurface {
            id: self.id,
            module_code: self.module_code,
            module_name: self.module_name,
            surface_code: self.surface_code,
            surface_name: self.surface_name,
            title: self.title,
            description: self.description,
            api_version: self.api_version,
            api_authority: self.api_authority,
            api_prefix: self.api_prefix,
            category_code: self.category_code,
            categories: json_string_list(&self.categories),
            operation_count: i64::from(self.operation_count),
            tag_count: i64::from(self.tag_count),
            auth_modes: json_string_list(&self.auth_modes),
            tags: json_string_list(&self.tags),
            featured: self.featured,
            deprecated: self.deprecated,
            schema_available: self.schema_available,
        };
        CatalogApiSurfaceDetail {
            surface,
            servers: serde_json::from_str(&self.servers)
                .unwrap_or(serde_json::Value::Array(Vec::new())),
            schema_version: self.schema_version,
            schema_checksum: self.schema_checksum,
            source_path: self.source_path,
        }
    }
}

#[derive(sqlx::FromRow)]
struct CatalogApiSchemaRow {
    surface_id: String,
    api_authority: String,
    schema_version: String,
    schema_checksum: String,
    spec: String,
}

impl CatalogApiSchemaRow {
    fn into_schema(self) -> DocumentsServiceResult<CatalogApiSchema> {
        Ok(CatalogApiSchema {
            surface_id: self.surface_id,
            api_authority: self.api_authority,
            schema_version: self.schema_version,
            schema_checksum: self.schema_checksum,
            spec: serde_json::from_str(&self.spec)
                .map_err(|error| DocumentsServiceError::Internal(error.to_string()))?,
        })
    }
}

#[derive(sqlx::FromRow)]
struct CatalogApiOperationRow {
    operation_key: String,
    method: String,
    path: String,
    summary: String,
    description: String,
    tags: String,
    deprecated: bool,
    sort_order: i32,
}

impl CatalogApiOperationRow {
    fn into_operation(self) -> CatalogApiOperation {
        CatalogApiOperation {
            operation_key: self.operation_key,
            method: self.method,
            path: self.path,
            summary: self.summary,
            description: self.description,
            tags: json_string_list(&self.tags),
            deprecated: self.deprecated,
            sort_order: i64::from(self.sort_order),
        }
    }
}

#[derive(sqlx::FromRow)]
struct CatalogSdkFamilyRow {
    id: String,
    module_code: String,
    module_name: String,
    sdk_code: String,
    sdk_name: String,
    sdk_type: String,
    surface_code: String,
    package_name: String,
    description: String,
    sdk_version: String,
    category_code: String,
    categories: String,
    languages: String,
    release_count: i64,
    featured: bool,
    deprecated: bool,
    download_count: i64,
    rating: f64,
}

impl CatalogSdkFamilyRow {
    fn into_sdk(self) -> CatalogSdkFamily {
        CatalogSdkFamily {
            id: self.id,
            module_code: self.module_code,
            module_name: self.module_name,
            sdk_code: self.sdk_code,
            sdk_name: self.sdk_name,
            sdk_type: self.sdk_type,
            surface_code: self.surface_code,
            package_name: self.package_name,
            description: self.description,
            sdk_version: self.sdk_version,
            category_code: self.category_code,
            categories: json_string_list(&self.categories),
            languages: json_string_list(&self.languages),
            release_count: self.release_count,
            featured: self.featured,
            deprecated: self.deprecated,
            download_count: self.download_count,
            rating: self.rating,
        }
    }
}

#[derive(sqlx::FromRow)]
struct CatalogSdkFamilyDetailRow {
    id: String,
    module_code: String,
    module_name: String,
    sdk_code: String,
    sdk_name: String,
    sdk_type: String,
    surface_code: String,
    package_name: String,
    description: String,
    sdk_version: String,
    category_code: String,
    categories: String,
    languages: String,
    release_count: i64,
    featured: bool,
    deprecated: bool,
    download_count: i64,
    rating: f64,
    repository_url: String,
    docs_url: String,
    license_code: String,
    support_level: String,
    pricing_tier: String,
}

impl CatalogSdkFamilyDetailRow {
    fn into_detail(self, releases: Vec<CatalogSdkReleaseRow>) -> CatalogSdkFamilyDetail {
        let sdk = CatalogSdkFamily {
            id: self.id,
            module_code: self.module_code,
            module_name: self.module_name,
            sdk_code: self.sdk_code,
            sdk_name: self.sdk_name,
            sdk_type: self.sdk_type,
            surface_code: self.surface_code,
            package_name: self.package_name,
            description: self.description,
            sdk_version: self.sdk_version,
            category_code: self.category_code,
            categories: json_string_list(&self.categories),
            languages: json_string_list(&self.languages),
            release_count: self.release_count,
            featured: self.featured,
            deprecated: self.deprecated,
            download_count: self.download_count,
            rating: self.rating,
        };
        CatalogSdkFamilyDetail {
            sdk,
            repository_url: optional_text(self.repository_url),
            docs_url: optional_text(self.docs_url),
            license_code: self.license_code,
            support_level: self.support_level,
            pricing_tier: self.pricing_tier,
            releases: releases
                .into_iter()
                .map(CatalogSdkReleaseRow::into_release)
                .collect(),
        }
    }
}

#[derive(sqlx::FromRow)]
struct CatalogSdkReleaseRow {
    language_code: String,
    language_name: String,
    family: String,
    package_name: String,
    sdk_version: String,
    install_command: Option<String>,
    download_url: Option<String>,
    archive_name: Option<String>,
    generation_state: String,
    release_state: String,
    is_latest: bool,
    released_at: Option<String>,
}

impl CatalogSdkReleaseRow {
    fn into_release(self) -> CatalogSdkRelease {
        CatalogSdkRelease {
            language_code: self.language_code,
            language_name: self.language_name,
            family: self.family,
            package_name: self.package_name,
            version: self.sdk_version,
            install_command: self.install_command,
            download_url: self.download_url,
            archive_name: self.archive_name,
            generation_state: self.generation_state,
            release_state: self.release_state,
            is_latest: self.is_latest,
            released_at: self.released_at,
        }
    }
}
