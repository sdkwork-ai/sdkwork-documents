use sqlx::PgPool;

use sdkwork_drive_object_runtime::{DriveObjectStoreRuntime, ProviderAccessIntent};
use sdkwork_drive_storage_contract::{DriveByteRange, DriveObjectLocator, ReadObjectRangeRequest};
use sdkwork_drive_workspace_service::application::space_service::{
    CreateSpaceCommand, GetSpaceCommand, SqlDriveSpaceService,
};
use sdkwork_drive_workspace_service::application::storage_provider_service::ensure_space_storage_provider_binding;
use sdkwork_drive_workspace_service::application::workspace_service::{
    EnsureDriveWorkspaceNode, EnsureDriveWorkspaceNodesCommand, ResolveDriveWorkspacePathCommand,
    SqlDriveWorkspaceService,
};
use sdkwork_drive_workspace_service::domain::space::DriveSpaceType;
use sdkwork_drive_workspace_service::infrastructure::sql::uploader_store::SqlUploaderStore;
use sdkwork_drive_workspace_service::uploader::{
    DriveUploaderService, PrepareUploaderUploadCommand, UploadBytesCommand, UploaderActor,
    UploaderRetention, UploaderTarget,
};
use sdkwork_drive_workspace_service::DriveServiceError;
use sdkwork_utils_rust::{sha256_hash, uuid};

use crate::bootstrap::{DOCUMENTS_DRIVE_BUCKET, DOCUMENTS_DRIVE_PROVIDER_ID};
use crate::DOCUMENTS_DRIVE_SPACE_DISPLAY_NAME;

const MAX_DOCUMENT_BODY_BYTES: u64 = 4 * 1024 * 1024;
const DOCUMENTS_APP_ID: &str = "sdkwork-documents";

#[derive(Debug, thiserror::Error)]
pub enum DocumentsDriveError {
    #[error("configuration error: {0}")]
    Configuration(String),
    #[error("validation error: {0}")]
    Validation(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("drive error: {0}")]
    Drive(String),
    #[error("internal error: {0}")]
    Internal(String),
}

fn map_drive_error(error: DriveServiceError) -> DocumentsDriveError {
    match error {
        DriveServiceError::Validation(message) => DocumentsDriveError::Validation(message),
        DriveServiceError::NotFound(message) => DocumentsDriveError::NotFound(message),
        DriveServiceError::PermissionDenied(message) => DocumentsDriveError::Validation(message),
        DriveServiceError::Conflict(message) => DocumentsDriveError::Validation(message),
        DriveServiceError::Internal(message) => DocumentsDriveError::Internal(message),
    }
}

fn epoch_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or(1)
}

fn safe_slug(value: &str) -> String {
    let mut slug = String::with_capacity(value.len());
    let mut pending_dash = false;
    for character in value.chars() {
        if character.is_ascii_alphanumeric() || character == '_' {
            if pending_dash && !slug.is_empty() {
                slug.push('-');
            }
            pending_dash = false;
            slug.push(character.to_ascii_lowercase());
        } else {
            pending_dash = true;
        }
    }
    if slug.is_empty() {
        "document".to_owned()
    } else {
        slug.chars().take(96).collect()
    }
}

/// One Drive node that holds a localized document body.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DocumentsDriveRef {
    pub space_id: String,
    pub node_id: String,
    pub content_version: i64,
    pub content_checksum_sha256_hex: String,
}

/// Read result with the Drive identity that served the body.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DocumentsDriveContent {
    pub node_id: String,
    pub content_type: String,
    pub body: String,
}

/// In-process Drive access for document bodies.
///
/// The adapter owns a Drive pool on the documents database. It creates the
/// dedicated `documents` space on first write, keeps one folder per locale,
/// uploads `<slug>.html` through the Drive uploader service, and reads the
/// latest active object for a node.
#[derive(Clone)]
pub struct DocumentsDriveContentAdapter {
    pool: PgPool,
    operator_id: String,
}

impl DocumentsDriveContentAdapter {
    pub fn new(pool: PgPool, operator_id: impl Into<String>) -> Self {
        Self {
            pool,
            operator_id: operator_id.into(),
        }
    }

    fn space_id_for(tenant_id: &str) -> String {
        let tenant: String = tenant_id
            .chars()
            .map(|character| {
                if character.is_ascii_alphanumeric() || character == '-' || character == '_' {
                    character
                } else {
                    '-'
                }
            })
            .collect();
        format!("documents-{tenant}")
    }

    async fn ensure_space(
        &self,
        tenant_id: &str,
        _app_key: &str,
    ) -> Result<String, DocumentsDriveError> {
        let space_id = Self::space_id_for(tenant_id);
        let service = SqlDriveSpaceService::new(self.pool.clone());
        match service
            .get_space(GetSpaceCommand {
                tenant_id: tenant_id.to_owned(),
                space_id: space_id.clone(),
            })
            .await
        {
            Ok(_) => Ok(space_id),
            Err(DriveServiceError::NotFound(_)) => {
                service
                    .create_space(CreateSpaceCommand {
                        id: space_id.clone(),
                        tenant_id: tenant_id.to_owned(),
                        owner_subject_type: "app".to_owned(),
                        owner_subject_id: format!("app:{DOCUMENTS_APP_ID}:system"),
                        display_name: DOCUMENTS_DRIVE_SPACE_DISPLAY_NAME.to_owned(),
                        space_type: DriveSpaceType::Documents,
                        presentation_icon: None,
                        presentation_color: None,
                        description: Some("SDKWork documents content".to_owned()),
                        operator_id: self.operator_id.clone(),
                    })
                    .await
                    .map_err(map_drive_error)?;
                Ok(space_id)
            }
            Err(error) => Err(map_drive_error(error)),
        }
    }

    async fn ensure_locale_folder(
        &self,
        tenant_id: &str,
        space_id: &str,
        locale: &str,
    ) -> Result<String, DocumentsDriveError> {
        let workspace = SqlDriveWorkspaceService::new(self.pool.clone());
        workspace
            .ensure_nodes(EnsureDriveWorkspaceNodesCommand {
                tenant_id: tenant_id.to_owned(),
                space_id: space_id.to_owned(),
                operator_id: self.operator_id.clone(),
                nodes: vec![EnsureDriveWorkspaceNode::folder(locale.to_owned())],
            })
            .await
            .map_err(map_drive_error)?;
        let node = workspace
            .resolve_path(ResolveDriveWorkspacePathCommand {
                tenant_id: tenant_id.to_owned(),
                space_id: space_id.to_owned(),
                logical_path: locale.to_owned(),
            })
            .await
            .map_err(map_drive_error)?
            .ok_or_else(|| {
                DocumentsDriveError::Internal(format!(
                    "drive locale folder was not created: {locale}"
                ))
            })?;
        Ok(node.id)
    }

    /// Writes one localized rich-text body and returns the Drive identity to
    /// persist on the documents row.
    pub async fn write_document_body(
        &self,
        tenant_id: &str,
        app_key: &str,
        document_id: &str,
        locale: &str,
        slug: &str,
        body: &str,
    ) -> Result<DocumentsDriveRef, DocumentsDriveError> {
        let _ = app_key;
        if tenant_id.trim().is_empty() {
            return Err(DocumentsDriveError::Validation(
                "tenant_id is required".to_owned(),
            ));
        }
        let body_bytes = body.as_bytes();
        if body_bytes.is_empty() {
            return Err(DocumentsDriveError::Validation(
                "document body is required".to_owned(),
            ));
        }
        if body_bytes.len() as u64 > MAX_DOCUMENT_BODY_BYTES {
            return Err(DocumentsDriveError::Validation(format!(
                "document body exceeds {MAX_DOCUMENT_BODY_BYTES} bytes"
            )));
        }

        let space_id = self.ensure_space(tenant_id, app_key).await?;
        ensure_space_storage_provider_binding(
            &self.pool,
            tenant_id,
            &space_id,
            DOCUMENTS_DRIVE_PROVIDER_ID,
            &format!("documents/{tenant_id}"),
            &self.operator_id,
        )
        .await
        .map_err(map_drive_error)?;
        let folder_id = self
            .ensure_locale_folder(tenant_id, &space_id, locale)
            .await?;
        let object_store = DriveObjectStoreRuntime::new(self.pool.clone())
            .resolve(DOCUMENTS_DRIVE_PROVIDER_ID, ProviderAccessIntent::Write)
            .await
            .map_err(|error| DocumentsDriveError::Drive(error.to_string()))?;

        let now = epoch_ms();
        let content_length = body_bytes.len() as i64;
        let checksum = sha256_hash(body_bytes);
        let uploader = DriveUploaderService::new(SqlUploaderStore::new(self.pool.clone()));
        let uploaded = uploader
            .upload_bytes(
                object_store.as_ref(),
                UploadBytesCommand {
                    prepare: PrepareUploaderUploadCommand {
                        id: format!("documents-{}", uuid()),
                        task_id: format!("documents-{document_id}-{locale}-{now}"),
                        tenant_id: tenant_id.to_owned(),
                        organization_id: None,
                        actor: UploaderActor::System {
                            operator_id: self.operator_id.clone(),
                        },
                        app_id: DOCUMENTS_APP_ID.to_owned(),
                        app_resource_type: "document".to_owned(),
                        app_resource_id: document_id.to_owned(),
                        scene: Some("document-content".to_owned()),
                        source: Some("documents".to_owned()),
                        upload_profile_code: "document".to_owned(),
                        file_fingerprint: checksum.clone(),
                        original_file_name: format!("{}.html", safe_slug(slug)),
                        content_type: "text/html".to_owned(),
                        content_length,
                        chunk_size_bytes: content_length.max(1),
                        target: UploaderTarget::Space {
                            space_id: space_id.clone(),
                            parent_node_id: Some(folder_id),
                            share_token: None,
                        },
                        retention: UploaderRetention::LongTerm,
                        operator_id: self.operator_id.clone(),
                        now_epoch_ms: now,
                    },
                    body: body_bytes.to_vec(),
                    uploaded_at_epoch_ms: now,
                },
            )
            .await
            .map_err(map_drive_error)?;

        Ok(DocumentsDriveRef {
            space_id,
            node_id: uploaded.node_id,
            content_version: 1,
            content_checksum_sha256_hex: checksum,
        })
    }

    /// Reads the latest active Drive object for one document node.
    pub async fn read_document_body(
        &self,
        tenant_id: &str,
        node_id: &str,
    ) -> Result<DocumentsDriveContent, DocumentsDriveError> {
        if node_id.trim().is_empty() {
            return Err(DocumentsDriveError::Validation(
                "drive node id is required".to_owned(),
            ));
        }
        let workspace = SqlDriveWorkspaceService::new(self.pool.clone());
        let object = workspace
            .find_latest_active_storage_object_by_node(tenant_id, node_id)
            .await
            .map_err(map_drive_error)?
            .ok_or_else(|| DocumentsDriveError::NotFound(node_id.to_owned()))?;
        if object.storage_provider_id != DOCUMENTS_DRIVE_PROVIDER_ID {
            return Err(DocumentsDriveError::Validation(format!(
                "document node {} is stored on unsupported provider {}",
                node_id, object.storage_provider_id
            )));
        }
        if object.bucket != DOCUMENTS_DRIVE_BUCKET {
            return Err(DocumentsDriveError::Validation(format!(
                "document node {} is stored in unexpected bucket",
                node_id
            )));
        }
        if object.content_length < 0 || object.content_length as u64 > MAX_DOCUMENT_BODY_BYTES {
            return Err(DocumentsDriveError::Validation(format!(
                "document body size {} is outside the supported range",
                object.content_length
            )));
        }

        let object_store = DriveObjectStoreRuntime::new(self.pool.clone())
            .resolve(&object.storage_provider_id, ProviderAccessIntent::Read)
            .await
            .map_err(|error| DocumentsDriveError::Drive(error.to_string()))?;
        let mut bytes = Vec::with_capacity(object.content_length as usize);
        if object.content_length > 0 {
            let (_, mut stream) = object_store
                .read_object_range(ReadObjectRangeRequest {
                    locator: DriveObjectLocator {
                        bucket: object.bucket,
                        object_key: object.object_key,
                    },
                    range: DriveByteRange {
                        start_inclusive: 0,
                        end_inclusive: (object.content_length as u64).saturating_sub(1),
                    },
                })
                .await
                .map_err(|error| DocumentsDriveError::Drive(error.to_string()))?;
            while let Some(chunk) = stream
                .next_chunk()
                .await
                .map_err(|error| DocumentsDriveError::Drive(error.to_string()))?
            {
                bytes.extend_from_slice(&chunk);
            }
        }
        let body = String::from_utf8(bytes).map_err(|_| {
            DocumentsDriveError::Validation("document body is not UTF-8".to_owned())
        })?;
        Ok(DocumentsDriveContent {
            node_id: node_id.to_owned(),
            content_type: object.content_type,
            body,
        })
    }
    /// Soft-deletes the Drive node and its object versions.
    pub async fn delete_document_body(
        &self,
        tenant_id: &str,
        space_id: &str,
        node_id: &str,
    ) -> Result<(), DocumentsDriveError> {
        SqlDriveWorkspaceService::new(self.pool.clone())
            .soft_delete_node(tenant_id, space_id, node_id, &self.operator_id)
            .await
            .map_err(map_drive_error)
    }
}

#[cfg(test)]
mod tests {
    use super::{safe_slug, DocumentsDriveContentAdapter};

    #[test]
    fn derives_safe_html_file_names() {
        assert_eq!(safe_slug("Privacy Policy"), "privacy-policy");
        assert_eq!(safe_slug("  terms & conditions  "), "terms-conditions");
        assert_eq!(safe_slug("???"), "document");
    }

    #[test]
    fn scopes_the_documents_space_by_tenant() {
        assert_eq!(
            DocumentsDriveContentAdapter::space_id_for("100001"),
            "documents-100001"
        );
        assert_eq!(
            DocumentsDriveContentAdapter::space_id_for("tenant/one"),
            "documents-tenant-one"
        );
    }
}
