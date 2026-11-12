//! Live Drive round-trip against a documents PostgreSQL database.
//!
//! Set `SDKWORK_DOCUMENTS_TEST_DSN` to run it, for example:
//! `postgres://sdkwork_ai_dev:sdkworkdev123@127.0.0.1:5432/sdkwork_ai_dev`.
//! Without the variable the test is a no-op so unit runs stay hermetic.

use sdkwork_documents_drive::{connect_documents_drive_pool, DocumentsDriveContentAdapter};

#[tokio::test]
async fn writes_and_reads_a_document_body_through_drive() {
    let Ok(database_url) = std::env::var("SDKWORK_DOCUMENTS_TEST_DSN") else {
        eprintln!("SDKWORK_DOCUMENTS_TEST_DSN not set; skipping live Drive test");
        return;
    };
    let pool = connect_documents_drive_pool(&database_url)
        .await
        .expect("connect Drive pool");

    let adapter = DocumentsDriveContentAdapter::new(pool.clone(), "sdkwork-documents-test");
    let document_id = format!(
        "doc-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("clock")
            .as_millis()
    );
    let body = "<p>Drive integration body</p>";

    let reference = adapter
        .write_document_body(
            "100001",
            "sdkwork-cloudrouter",
            &document_id,
            "zh-CN",
            "privacy-policy",
            body,
        )
        .await
        .expect("write document body to Drive");
    assert!(!reference.space_id.is_empty());
    assert!(!reference.node_id.is_empty());

    let content = adapter
        .read_document_body("100001", &reference.node_id)
        .await
        .expect("read document body from Drive");
    assert_eq!(content.body, body);
    assert_eq!(content.content_type, "text/html");
}
