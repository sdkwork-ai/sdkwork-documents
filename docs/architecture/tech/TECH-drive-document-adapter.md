# Drive Document Content Adapter

- Status: implemented (P1)
- Owners: sdkwork-documents, sdkwork-drive
- Related: `ADR-20261112-drive-backed-document-center.md`, `DRIVE_SPEC.md` §9.2

Documents stores document bodies in Drive through the Drive Rust crates, in the same
process. No Drive HTTP API, service token, or presigned URL is involved.

## Crates

`sdkwork-documents-drive` depends on:

```rust
sdkwork_drive_workspace_service   // spaces, nodes, uploader service/store
sdkwork_drive_object_runtime      // provider resolution and object store
sdkwork_drive_config              // Drive database configuration
sdkwork_drive_storage_contract    // object store contract
```

## Bootstrap

`connect_documents_drive_pool(database_url)`:

1. normalizes the documents PostgreSQL URL,
2. installs the Drive schema through the Drive lifecycle,
3. seeds the `documents-local` `local_filesystem` provider for the `documents`
   bucket (standalone/local), or reuses the active provider,
4. returns the dedicated Drive pool.

`DocumentsRuntime` calls it on startup. If the Drive pool cannot be opened, the
documents service still starts and Drive reads/writes are skipped; database
content remains the fallback.

## Space and layout

- One `DriveSpaceType::Documents` space per tenant, id `documents-<tenant>`,
  display name `Documents`.
- One folder per locale (`zh-CN`, `en-US`, ...).
- File name `<slug>.html`; the Drive node id is persisted on the document row in
  `drive_node_id` together with `drive_space_id` and `content_source = 'drive'`.

## Write path

On publish (`PATCH /documents/{id}` with `status = published`):

1. the document is updated in the documents database,
2. the published row is re-read to obtain slug/locale,
3. `DocumentsDriveContentAdapter::write_document_body` ensures the space and
   locale folder, then calls `DriveUploaderService::upload_bytes` with
   `UploaderTarget::Space` and `UploaderRetention::LongTerm`,
4. the returned `space_id` / `node_id` are written to the document row.

A Drive failure fails the publish request; the document stays in its previous
status and the database copy remains readable. The next publish retries the
Drive write.

## Version records

Every successful publish inserts an immutable `documents_document_revision` row
with the Drive space/node, locale, slug, content checksum, and a monotonically
increasing `content_version`. The admin editor lists these versions through
`GET /app/v3/api/documents/{id}/revisions` (`revision.list`).

## Read path

Public delivery (`GET /app/v3/api/documents/public/{ref}`):

1. documents resolves the published row by id → locale slug → `zh-CN`,
2. when `content_source = 'drive'`, the adapter resolves the latest active
   storage object for `drive_node_id`, streams it through the Drive object
   store, and replaces the response body,
3. if Drive is unavailable, the database body is served.

## Configuration

- `SDKWORK_DOCUMENTS_DATABASE_URL` (fallback `SDKWORK_DATABASE_URL`) — same
  database used by documents; the Drive schema is installed there.
- No Drive HTTP endpoint, API key, or share link is required.

## Tests

- `cargo test -p sdkwork-documents-drive` (path/slug and space-id helpers).
- `cargo test -p sdkwork-content-documents-service` (Drive binding validation,
  slug/locale derivation).
- `cargo test -p sdkwork-routes-documents-app-api` (anonymous public delivery).
