//! Live publish -> Drive -> revision -> public read against PostgreSQL.
//!
//! Set `SDKWORK_DOCUMENTS_TEST_DSN` to run it. Without the variable the test is
//! a no-op so the default suite stays hermetic.

use std::sync::Arc;

use sdkwork_content_documents_repository_sqlx::{
    connect_postgres_and_install_schema, DocumentsSqlxRepository,
};
use sdkwork_content_documents_service::DocumentsService;
use sdkwork_documents_contract::{
    DocumentCreateRequest, DocumentIdentityUpdateRequest, DocumentUpdateRequest, DocumentsAppApi,
    DocumentsAppRequestContext,
};
use sdkwork_documents_drive::{connect_documents_drive_pool, DocumentsDriveContentAdapter};

#[tokio::test]
async fn publishes_to_drive_and_records_a_revision() {
    let Ok(database_url) = std::env::var("SDKWORK_DOCUMENTS_TEST_DSN") else {
        eprintln!("SDKWORK_DOCUMENTS_TEST_DSN not set; skipping live publish test");
        return;
    };
    let documents_pool = connect_postgres_and_install_schema(&database_url)
        .await
        .expect("install documents schema");
    let repository = Arc::new(DocumentsSqlxRepository::new(documents_pool));
    let drive_pool = connect_documents_drive_pool(&database_url)
        .await
        .expect("connect Drive pool");
    let revision_pool = drive_pool.clone();
    let service = DocumentsService::new(repository).with_drive_content(Arc::new(
        DocumentsDriveContentAdapter::new(drive_pool, "sdkwork-documents-test"),
    ));

    let context = DocumentsAppRequestContext {
        tenant_id: 100_001,
        user_id: 10,
        locale: "zh-CN".to_owned(),
    };
    let suffix = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("clock")
        .as_millis();
    let created = service
        .create_document(
            context.clone(),
            DocumentCreateRequest {
                title: format!("Live Drive Publish {suffix}"),
                body: "<p>version one</p>".to_owned(),
            },
        )
        .await
        .expect("create document");

    service
        .update_document(
            context.clone(),
            created.id.clone(),
            DocumentUpdateRequest {
                title: None,
                body: Some("<p>version two</p>".to_owned()),
                status: Some("published".to_owned()),
            },
        )
        .await
        .expect("publish document to Drive");

    let revisions = service
        .list_document_revisions(context.clone(), created.id.clone())
        .await
        .expect("list revisions");
    assert_eq!(revisions.items.len(), 1);
    assert_eq!(revisions.items[0].content_version, 1);
    assert!(!revisions.items[0].drive_node_id.is_empty());
    assert!(!revisions.items[0].content_checksum_sha256.is_empty());
    let first_revision = revisions.items[0].clone();

    let content = service
        .get_revision_content(
            context.clone(),
            created.id.clone(),
            first_revision.id.clone(),
        )
        .await
        .expect("read revision content");
    assert_eq!(content.body, "<p>version two</p>");

    service
        .update_document(
            context.clone(),
            created.id.clone(),
            DocumentUpdateRequest {
                title: None,
                body: Some("<p>version three</p>".to_owned()),
                status: Some("published".to_owned()),
            },
        )
        .await
        .expect("publish second version");

    service
        .restore_document_revision(
            context.clone(),
            created.id.clone(),
            first_revision.id.clone(),
        )
        .await
        .expect("restore first revision");
    let restored = service
        .retrieve_published_document(100_001, &created.id, "zh-CN")
        .await
        .expect("read restored document");
    assert_eq!(restored.body, "<p>version two</p>");
    let revisions = service
        .list_document_revisions(context.clone(), created.id.clone())
        .await
        .expect("list revisions after restore");
    assert_eq!(revisions.items.len(), 3, "restore appends a new version");

    let identity = service
        .update_document_identity(
            context.clone(),
            created.id.clone(),
            DocumentIdentityUpdateRequest {
                locale: Some("en-US".to_owned()),
                slug: Some("live-drive-restored".to_owned()),
            },
        )
        .await
        .expect("update public identity");
    assert_eq!(identity.locale, "en-US");
    assert_eq!(identity.slug, "live-drive-restored");
    let identity = service
        .get_document_identity(context.clone(), created.id.clone())
        .await
        .expect("read public identity");
    assert_eq!(identity.slug, "live-drive-restored");

    let published = service
        .retrieve_published_document(100_001, &created.id, "zh-CN")
        .await
        .expect("read published document");
    assert_eq!(published.body, "<p>version two</p>");
    assert_eq!(published.content_source, "drive");

    service
        .update_document(
            context.clone(),
            created.id.clone(),
            DocumentUpdateRequest {
                title: None,
                body: None,
                status: Some("archived".to_owned()),
            },
        )
        .await
        .expect("unpublish document");
    assert!(
        service
            .retrieve_published_document(100_001, &created.id, "zh-CN")
            .await
            .is_err(),
        "archived documents must disappear from public delivery"
    );

    service
        .delete_document(context.clone(), created.id.clone())
        .await
        .expect("delete document");
    assert!(
        service
            .retrieve_document(context.clone(), created.id.clone())
            .await
            .is_err(),
        "deleted documents must not be retrievable"
    );
    let revisions = service
        .list_document_revisions(context, created.id)
        .await
        .expect("list revisions after delete");
    assert!(revisions.items.is_empty(), "delete must cascade revisions");

    let node_status: String = sqlx::query_scalar(
        "SELECT lifecycle_status FROM dr_drive_node WHERE tenant_id = $1 AND id = $2",
    )
    .bind("100001")
    .bind(&first_revision.drive_node_id)
    .fetch_one(&revision_pool)
    .await
    .expect("read drive node lifecycle");
    assert_eq!(node_status, "deleted", "delete must retire the Drive node");
}
