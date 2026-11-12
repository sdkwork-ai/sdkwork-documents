use sqlx::PgPool;

use sdkwork_database_config::workspace_database::normalize_workspace_postgres_url;
use sdkwork_drive_config::DatabaseConfig as DriveDatabaseConfig;
use sdkwork_drive_workspace_service::infrastructure::sql::connect_postgres_database_and_install_schema;
use sdkwork_drive_workspace_service::infrastructure::sql::storage_provider_store::SqlStorageProviderStore;
use sdkwork_drive_workspace_service::ports::storage_provider_store::{
    DriveStorageProviderStore, NewDriveStorageProvider, UpdateDriveStorageProvider,
};

use crate::DocumentsDriveError;

pub const DOCUMENTS_DRIVE_PROVIDER_ID: &str = "documents-local";
pub const DOCUMENTS_DRIVE_BUCKET: &str = "documents";
const DOCUMENTS_DRIVE_POOL_MAX_CONNECTIONS: u32 = 5;
const DOCUMENTS_DRIVE_PROVIDER_TENANT_ID: &str = "100001";

/// Opens the Drive pool used by the documents module.
///
/// The pool points at the same PostgreSQL database as the documents pool but
/// installs the Drive schema and seeds the local storage provider, so documents
/// can create spaces, nodes, and objects without a separate Drive service.
pub async fn connect_documents_drive_pool(
    database_url: &str,
) -> Result<PgPool, DocumentsDriveError> {
    let normalized = normalize_workspace_postgres_url(database_url.trim())
        .map_err(|error| DocumentsDriveError::Configuration(format!("{error:?}")))?;
    let config = DriveDatabaseConfig::from_url_with_max_connections(
        normalized.as_str(),
        DOCUMENTS_DRIVE_POOL_MAX_CONNECTIONS,
    )
    .map_err(|error| DocumentsDriveError::Configuration(error.to_string()))?;
    let pool = connect_postgres_database_and_install_schema(&config)
        .await
        .map_err(|error| DocumentsDriveError::Configuration(format!("{error:?}")))?;
    seed_local_storage_provider(&pool).await?;
    Ok(pool)
}

pub async fn connect_documents_drive_pool_from_env() -> Result<PgPool, DocumentsDriveError> {
    let _ = dotenvy::dotenv();
    let database_url = std::env::var("SDKWORK_DOCUMENTS_DATABASE_URL")
        .or_else(|_| std::env::var("SDKWORK_DATABASE_URL"))
        .map_err(|_| {
            DocumentsDriveError::Configuration(
                "SDKWORK_DOCUMENTS_DATABASE_URL or SDKWORK_DATABASE_URL is required".to_owned(),
            )
        })?;
    connect_documents_drive_pool(&database_url).await
}

pub async fn documents_drive_health_check(pool: &PgPool) -> Result<(), DocumentsDriveError> {
    sqlx::query_scalar::<_, i64>("SELECT 1::bigint")
        .fetch_one(pool)
        .await
        .map(|_| ())
        .map_err(|error| DocumentsDriveError::Configuration(error.to_string()))
}

async fn seed_local_storage_provider(pool: &PgPool) -> Result<(), DocumentsDriveError> {
    let store = SqlStorageProviderStore::new(pool.clone());
    let endpoint_url = local_storage_endpoint()?;
    if let Some(existing) = store
        .find_storage_provider(DOCUMENTS_DRIVE_PROVIDER_ID)
        .await
        .map_err(|error| DocumentsDriveError::Configuration(format!("{error:?}")))?
    {
        if existing.endpoint_url != endpoint_url {
            store
                .update_storage_provider(
                    DOCUMENTS_DRIVE_PROVIDER_ID,
                    &UpdateDriveStorageProvider {
                        name: existing.name,
                        endpoint_url,
                        region: existing.region,
                        bucket: existing.bucket,
                        path_style: existing.path_style,
                        strict_tls: existing.strict_tls,
                        credential_ref: existing.credential_ref,
                        provider_account_id: existing.provider_account_id,
                        server_side_encryption_mode: existing.server_side_encryption_mode,
                        default_storage_class: existing.default_storage_class,
                        status: existing.status,
                        updated_by: "system".to_owned(),
                    },
                )
                .await
                .map_err(|error| DocumentsDriveError::Configuration(format!("{error:?}")))?;
        }
        return Ok(());
    }

    store
        .insert_storage_provider(&NewDriveStorageProvider {
            id: DOCUMENTS_DRIVE_PROVIDER_ID.to_owned(),
            tenant_id: DOCUMENTS_DRIVE_PROVIDER_TENANT_ID.to_owned(),
            provider_kind: "local_filesystem".to_owned(),
            name: "Documents local storage".to_owned(),
            endpoint_url,
            region: Some("local".to_owned()),
            bucket: DOCUMENTS_DRIVE_BUCKET.to_owned(),
            path_style: true,
            strict_tls: true,
            credential_ref: Some("plain:local:local".to_owned()),
            provider_account_id: None,
            server_side_encryption_mode: None,
            default_storage_class: None,
            status: "active".to_owned(),
            created_by: "system".to_owned(),
            updated_by: "system".to_owned(),
        })
        .await
        .map_err(|error| DocumentsDriveError::Configuration(format!("{error:?}")))?;
    Ok(())
}

fn local_storage_endpoint() -> Result<String, DocumentsDriveError> {
    let root = match std::env::var("SDKWORK_DOCUMENTS_DRIVE_LOCAL_ROOT") {
        Ok(value) if !value.trim().is_empty() => std::path::PathBuf::from(value.trim()),
        _ => std::env::temp_dir().join("sdkwork-documents-drive"),
    };
    std::fs::create_dir_all(&root).map_err(|error| {
        DocumentsDriveError::Configuration(format!(
            "create documents Drive root {} failed: {error}",
            root.display()
        ))
    })?;
    let normalized = root.to_string_lossy().replace('\\', "/");
    #[cfg(windows)]
    {
        Ok(format!("file:///{normalized}"))
    }
    #[cfg(not(windows))]
    {
        Ok(format!("file://{normalized}"))
    }
}
