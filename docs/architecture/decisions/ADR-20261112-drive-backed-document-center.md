# ADR-20261112: Drive-Backed Document Center

- Status: accepted
- Date: 2026-11-12
- Owners: sdkwork-documents, sdkwork-cloudrouter
- Related: `PRIVACY_SPEC.md`, `API_SPEC.md`, `DATABASE_SPEC.md`, `DRIVE_SPEC.md`, `MEDIA_RESOURCE_SPEC.md`, `FRONTEND_SPEC.md`, `I18N_SPEC.md`, `APP_COMPONENT_SPEC.md`

## 1. Context

Legal and product documents (privacy policy, terms of service, cookie policy, release notes,
help pages) must be maintainable without a frontend release. Content lives in SDKWork Drive,
is curated in a documents admin, and is published on the platform domain at a stable URL:

```text
https://platform.birdcoder.com/docs                 # published document index
https://platform.birdcoder.com/docs/privacy-policy  # slug
https://platform.birdcoder.com/docs/0f3c...         # document id
```

User decisions that shape this ADR:

1. The document center owns `/docs`; the existing developer documentation moves to `/dev-docs`.
2. Drive is the canonical store. Documents content lives in a dedicated Drive space for documents.
3. The admin edits rich text (Tiptap-style), like a CMS.

## 2. Decisions

### D1. Route ownership

- `sdkwork-cloudrouter-pc` owns the public `/docs` and `/docs/:documentRef` routes.
- Existing developer docs move to `/dev-docs` (and `/dev-docs/api-reference`, `/dev-docs/sdk-reference`,
  `/dev-docs/product-docs`); the old `/docs`-prefixed developer URLs redirect with `replace`.
- `documentRef` resolves in this order: exact document id, then slug for the active locale.
- `/docs` lists published documents for the active locale and hides drafts.

### D2. Dedicated Drive space

- Drive gains a dedicated space type `documents` in the `DriveSpace.spaceType` enum, so a documents
  space is distinguishable from personal, team, knowledge-base, and website spaces.
- The documents service provisions exactly one space per tenant plus application key, named
  `<App Name> 文档中心`, and records its id in `documents_space_binding`.
- Space layout is stable, human-readable, and locale-first:

```text
<space>/
  <locale>/
    <slug>.html            # sanitized rich-text HTML (Tiptap output)
    <slug>.meta.json       # optional exported metadata for Drive-side maintenance
```

- Every locale is an independent Drive file node. A document group (`tenant + app + slug`)
  owns one node per active locale; a locale without its own node falls back to the
  deployment fallback locale (`zh-CN`), and the public response always reports the
  locale actually served so the reader can disclose the fallback.
- Drive file names use the document slug, never the database id, so editors can identify
  content in Drive. Renaming a node in Drive is safe because documents stores the node id.
- The Drive node id, not the path, remains the authoritative content reference.

### D3. Storage split: Drive owns content, documents owns delivery metadata

| Data | Owner | Storage |
| --- | --- | --- |
| Rich-text body | Drive | Drive file node in the documents space |
| Document id, slug, locale, title, summary, status, version, publish state | documents | `documents_page` |
| Drive space binding and node reference | documents | `documents_page.drive_space_id`, `drive_node_id`, `drive_content_version` |
| Sanitized delivery projection (`content_html`, `content_hash`) | documents | `documents_page_revision` |
| Audit trail | documents | `documents_audit_log` |

The delivery projection is a cache, not a second source of truth: it is written only by a publish
operation that first reads the Drive node, and it is invalidated by unpublish, delete, or a new
publish. Drive remains the only place an author edits content.

### D4. Drive content through Rust crates

- `sdkwork-documents-drive` links the Drive Rust crates
  (`sdkwork-drive-workspace-service`, `sdkwork-drive-object-runtime`,
  `sdkwork-drive-config`, `sdkwork-drive-storage-contract`) in-process and opens a
  dedicated Drive pool on the documents database (`DRIVE_SPEC.md` §9.2).
- The adapter creates the `documents` space, ensures a folder per locale, uploads
  `<slug>.html` through `DriveUploaderService::upload_bytes`, and persists the returned
  `drive_space_id` / `drive_node_id` on the document row.
- Reads resolve the latest active Drive object for the node and stream it through the
  Drive object store. No Drive HTTP API, service credential, presigned URL, bucket, or
  object key crosses the documents API.
- Publishing fails when the Drive adapter is unavailable or the Drive write fails; the
  document keeps its previous status and database copy. Each successful publish records
  an immutable revision (`documents_document_revision`) with the Drive node, checksum, and
  version number.

### D5. API surfaces

Backend API (admin, dual-token + `documents.admin`):

```text
GET    /backend/v3/api/documents/pages                 list/filter (q, status, locale, page)
POST   /backend/v3/api/documents/pages                 create draft
GET    /backend/v3/api/documents/pages/{pageId}        retrieve (body from Drive)
PATCH  /backend/v3/api/documents/pages/{pageId}        update metadata
DELETE /backend/v3/api/documents/pages/{pageId}        delete (draft/archived only)
POST   /backend/v3/api/documents/pages/{pageId}/publish
POST   /backend/v3/api/documents/pages/{pageId}/unpublish
POST   /backend/v3/api/documents/pages/{pageId}/drive_sync   read Drive and refresh revision
```

App API (authenticated preview, dual-token + `documents.read`):

```text
GET /app/v3/api/documents/pages/{documentRef}          preview any status in the console
```

Public delivery (no IAM, published content only):

```text
GET /doc/v3/api/documents/pages                         published index
GET /doc/v3/api/documents/pages/{documentRef}           published document (metadata + content_html)
```

- Every response uses `SdkWorkApiResponse`; errors use `ProblemDetail` (API_SPEC §4.5, §14, §15).
- `documentRef` is a slug or id; the resolver rejects ambiguous slug collisions with
  `409`/`ProblemDetail`.
- Public delivery is read-only, rate-limited, tenant-scoped by the host, and serves only
  `published` revisions. Content-Language reflects the document locale; list responses carry
  `Vary: Accept-Language`.

### D6. Rich text and sanitization

- The editor stores Tiptap HTML plus a plain-text summary projection.
- Sanitization happens on the server at publish time (allowlist from `I18N_SPEC.md` §8 rich-text
  rule and `SECURITY_SPEC.md`): permitted tags/attributes only, `javascript:`/`data:` URLs
  rejected, unknown nodes escaped.
- The public page renders the sanitized `content_html`; drafts and raw editor JSON are never
  delivered publicly.

### D7. Admin information architecture

`sdkwork-documents` gains `@sdkwork/documents-pc-admin-documents`:

- `DocumentCenterPage` — searchable table (title, slug, locale, status, updated, published).
- `DocumentEditorPage` — rich-text editor, metadata panel (title, slug, locale, summary, status),
  Drive binding panel (space, node id, last sync), preview, publish/unpublish actions.
- `DocumentSettingsPage` — documents space provisioning status and default locale.
- All copy goes through `legalCenter.*` / `documentsAdmin.*` i18n keys; all API calls go through
  generated SDK clients.

CloudRouter admin integration:

- New top-level admin module `documentCenter` (header label 文档中心) in
  `adminModuleRegistry.ts`, with `pathPrefixes: ['/admin/documents']`.
- Menu group: 文档管理 → 文档列表 / 新建文档; 设置 → 文档中心设置.
- Routes are lazy-loaded from the documents admin package and guarded by
  `documents.admin.access` through the existing `AdminRoutePermissionGuard`.
- The cloudrouter app declares the documents backend SDK client and base URL; no raw HTTP.

### D8. Migration of the current static legal pages

- The current `/privacy`, `/terms`, `/cookies` static pages become the seed content for the
  documents space: a one-time import uploads the three policy documents to Drive, creates
  `documents_page` rows with stable slugs, and publishes revision 1.
- `/privacy`, `/terms`, `/cookies` become compatibility redirects to `/docs/<slug>`.
- The static `@sdkwork/documents-pc-legal` package remains only as migration source and is removed
  from the portal route table once the Drive-backed pages serve the same content.

## 3. Data model (PostgreSQL, prefix `documents_`)

```text
documents_space_binding   tenant_id, app_key, space_id, status, created_at, updated_at
documents_page            id, tenant_id, app_key, locale, slug, title, summary,
                          drive_space_id, drive_node_id, drive_content_version,
                          status(draft|published|archived), published_revision_id,
                          version, created_by, updated_by, created_at, updated_at
documents_page_revision   id, page_id, revision_number, content_html, content_hash,
                          drive_node_id, drive_content_version, created_by, created_at
documents_audit_log       id, tenant_id, page_id, action, actor_id, payload_json, created_at
UNIQUE (tenant_id, app_key, locale, slug)
UNIQUE (tenant_id, app_key, id)  -- id is globally generated, tenant checks stay explicit
```

- Rich text is not stored twice in `documents_page`; only the published revision stores
  `content_html`.
- Draft preview reads Drive directly and does not create a revision.

## 4. Phases and acceptance gates

| Phase | Deliverable | Gate |
| --- | --- | --- |
| P1 | Drive `documents` space type + documents schema/migration | Rust checks, OpenAPI checks, DB schema check |
| P2 | documents contract/service/repository/routes (admin + public delivery) | route tests, envelope checks, `cargo test` |
| P3 | Generated app/backend SDKs and cloudrouter client wiring | SDK generation check, typecheck |
| P4 | documents admin package (list/editor rich text/publish) | package typecheck/tests |
| P5 | CloudRouter `/docs` public pages + `/dev-docs` migration | portal tests, production build |
| P6 | CloudRouter admin 文档中心 header + routes | admin tests, permission guard tests |
| P7 | Legal document migration + redirects + docs | end-to-end smoke, i18n check |

## 5. Risks and mitigations

- **Drive upload complexity**: Drive file creation requires upload sessions. Mitigation: admin uses
  the generated drive app SDK uploader, and documents stores only the resulting node id.
- **Service-to-service Drive read**: requires a documented ingress credential. Mitigation: reuse
  the existing Drive internal boundary pattern; fail closed when the credential or space is absent.
- **Public delivery abuse**: rate-limit by tenant/IP, cache published revisions, reject drafts.
- **Slug collisions across locales**: unique per `(tenant, app, locale, slug)`; lookup by id always
  wins; ambiguous cross-locale slug returns a locale-qualified `409`.
- **Route cutover**: keep compatibility redirects for one release; never delete developer docs.
