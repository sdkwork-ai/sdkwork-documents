# PLAN-2026-1003-documents-api-sdk-marketplace

Status: active
Owner: SDKWork maintainers
Updated: 2026-10-03
Specs: DOMAIN_SPEC.md, DATABASE_SPEC.md, DATABASE_FRAMEWORK_SPEC.md, API_SPEC.md, PAGINATION_SPEC.md, SDK_SPEC.md, SDK_WORKSPACE_GENERATION_SPEC.md, FRONTEND_SPEC.md, I18N_SPEC.md, TEST_SPEC.md
Related: [ADR-20261003-documents-marketplace-catalog-projection.md](../../architecture/decisions/ADR-20261003-documents-marketplace-catalog-projection.md)

## 1. Objective

Add an **API market** and an **SDK market** to `sdkwork-documents`: category trees plus browsable,
searchable API and SDK entries covering every module in the SDKWork workspace, with detail pages,
version and endpoint inventory, SDK language packages and download hand-off, and the backend,
contract, SDK, and frontend work needed to run and verify it.

Non-goals for this plan: publisher onboarding, listing review workflow, pricing, checkout,
settlement, ratings, anonymous (unauthenticated) browsing, and application listings
(`sdkwork-appstore` owns those). The catalog is a projection plus market-owned curation; see the ADR.

## 2. Confirmed decisions

| Id | Decision |
| --- | --- |
| D1 | Stay inside this repository: domain `content`, capability `documents`, OpenAPI tag `documents`, database prefix `documents_`, tables `documents_market_*`. |
| D2 | First phase = categories + browse + search + detail + SDK download, plus the minimal operator surface (category management, publish/unpublish, sync runs) required to load data. |
| D3 | Ingestion = workspace scanner CLI producing a bundle, pushed into a backend ingest API (idempotent upsert). CI self-publish and remote-URL pull are later evolution options. |
| D4 | Front end ships in `sdkwork-documents-pc` only, behind the existing session gate. |
| D5 | Catalog rows are platform-scoped (`tenant_id = 0`, `organization_id = 0` sentinels) with real tenant writes reserved for a later phase. |
| D6 | New endpoints use the `SdkWorkApiResponse` / `ProblemDetail` envelope. The legacy `PlusApiResult` surface in the existing sdk-reference feature is a separate remediation item, not part of this plan. |

## 3. Ingest contract (data sources)

Scanner priority, because the declaration plane is not uniform across modules
(`agent.app.config.json` exists in 58 repositories; `apis/authority-manifest.json` only in some):

1. `<repo>/specs/component.spec.json` → `contracts.apiAuthorities[]` (`name`, `prefix`, `authorityOpenApi`, `sdkFamily`) — primary API index.
2. `<repo>/apis/authority-manifest.json`, `apis/**/authority-index.json`, `apis/manifest.json` → authority↔SDK path pairs, `pathPrefix`, `sha256`.
3. `<repo>/sdks/<family>/sdk-manifest.json` → SDK identity, `apiVersion`, `discoverySurface`, `languages[]`, `packageName`.
4. `<repo>/sdks/_route-manifests/**/*.route-manifest.json` → endpoint inventory (`method`, `path`, `operationId`, `tags`, `auth`) for `documents_market_api_endpoint`.
5. `<repo>/apis/**/*.openapi.json` → titles, summaries, tags, operation counts (enrichment).
6. `<repo>/agent.app.config.json` → module identity, `backend.domain/capability`, release version, icon (tolerate absence).
7. `<repo>/generated/composition.resolved.json` → consumer edges (later phase: "used by").

Bundle: deterministically ordered JSON plus `sha256`; importer is idempotent by natural key
(`source_code`, `api_authority`, `sdk_family`, `version`).

## 4. Database design

Conventions: prefix `documents_`; `id BIGINT` (application-generated snowflake) + `uuid`;
`tenant_id` / `organization_id` sentinels; audit and lifecycle columns; soft delete with partial
unique indexes; localized `*_translation` tables; TEXT + CHECK for closed enums and dictionary rows
for open ones; `metadata JSONB` for extensions only; every index named for one query.

| Migration | Tables |
| --- | --- |
| `0001_market_catalog_core` | `documents_market_source`, `documents_market_category`, `documents_market_category_translation`, `documents_market_dictionary`, `documents_market_dictionary_translation`, `documents_market_tag`, `documents_market_tag_translation`, `documents_market_resource_tag`, `documents_market_api`, `documents_market_api_translation`, `documents_market_api_version`, `documents_market_api_endpoint` |
| `0002_market_sdk_and_sync` | `documents_market_sdk`, `documents_market_sdk_translation`, `documents_market_sdk_version`, `documents_market_sdk_package`, `documents_market_api_sdk_binding`, `documents_market_sync_run`, `documents_market_sync_item` |
| `0003_market_engagement` (later) | `documents_market_metric_daily`, `documents_market_favorite`, `documents_market_change_log` |

Projection columns on every projected table: `source_ref`, `source_sha256`, `synced_at`,
`last_sync_run_id`, `projection_state` (`fresh` \| `stale` \| `missing`).

Required repository artifacts per migration: `.up.sql` + `.down.sql` with the `-- sdkwork:migration`
header (`id`, `engine`, `module`, `purpose`, `reversible`, `rollback`, `transactional`, `lock`,
`lock_timeout`, `statement_timeout`), replay-safe DDL (`CREATE TABLE IF NOT EXISTS`,
`CREATE INDEX IF NOT EXISTS`), registration in `database/contract/schema.yaml` and
`table-registry.json`, a `docs/schema-registry/tables/*.yaml` fragment, the reference seeds
(category tree and dictionary values in `database/seeds/common` + `database/seeds/locales/{zh-CN,en-US}`),
and an updated `database/README.md` initialization state.

Known trap: `database/contract/*` and the baseline DDL are rewritten wholesale by
`tools/materialize_phase1_contracts.mjs`, which `pnpm verify` runs unconditionally. New tables must be
added to that generator's emitted registry lists in the same change, or the registries lose them.
The baseline file itself stays unchanged (immutable anchor); the market tables live in migrations.

## 5. Backend design

| Layer | Work |
| --- | --- |
| Workspace dependency | add `sdkwork-database-id` for the canonical snowflake id provider |
| `crates/sdkwork-documents-contract` | market DTOs (`items` + `pageInfo` for every list), `Market*RequestContext`, repository and per-surface port traits, i64-as-string serde |
| `crates/sdkwork-content-documents-service` | market service: publish state machine, visibility, category tree validation, idempotent bundle upsert, endpoint projection rebuild |
| `crates/sdkwork-content-documents-repository-sqlx` | market repository with SQL-side pagination and tenant/org isolation tests |
| `crates/sdkwork-content-documents-market` (new feature crate) | routers merged into the existing surfaces, `SdkWorkApiResponse` success mapping, `application/problem+json` errors |
| `crates/sdkwork-routes-documents-{app,backend}-api` | mount routers, paths, handlers, both route-manifest lists (`manifest.rs::ROUTES` and `http_route_manifest.rs`) |
| Contract generation | `tools/materialize_phase1_contracts.mjs` path tables, `tools/verify_openapi_operation_ids.ps1` required ids, then `pnpm api:materialize` and `pnpm sdk:generate` |

Endpoint surface (P1): app-api `GET /app/v3/api/market/{categories,apis,apis/{apiId},apis/{apiId}/versions,apis/{apiId}/endpoints,apis/{apiId}/sdks,sdks,sdks/{sdkId},sdks/{sdkId}/versions,sdks/{sdkId}/packages,search}` and
`POST /app/v3/api/market/sdks/{sdkId}/archives`; backend-api sync runs
(`POST|GET /backend/v3/api/market/sync-runs`, `GET …/{runId}`, `GET …/{runId}/items`), category CRUD,
`PATCH` for API/SDK curation, `DELETE` for soft delete, `GET|PATCH /backend/v3/api/market/sources`.
operationIds follow `<resource>.<action>` in lowerCamel with no underscores.

## 6. Frontend design

- New package `apps/sdkwork-documents-pc/packages/sdkwork-documents-pc-market`
  (`@sdkwork/documents-pc-market`) exporting `ApiMarket`, `ApiMarketDetail`, `SdkMarket`,
  `SdkMarketDetail`, with a service module that calls the generated app SDK through
  `getDocumentsAppSdkClient()` (no raw `fetch`).
- Routes `/api-market`, `/api-market/:apiId`, `/sdk-market`, `/sdk-market/:sdkId` registered in
  `src/bootstrap/routes.ts`, `packages/sdkwork-documents-pc-core` (route constants + navigation
  items) and `packages/sdkwork-documents-pc-shell` (router + home cards).
- i18n copy in `packages/sdkwork-documents-pc-i18n/src/resources/public/market.ts` (zh-CN, en-US).
- Cross-links: API detail → existing `/api-reference`; SDK detail → existing `/sdk-reference`.

## 7. Verification commands

```bash
# database
pnpm db:validate
pnpm test:contract:database
node tools/materialize_phase1_contracts.mjs --check

# rust
cargo fmt -- --check
cargo clippy --workspace --tests -- -D warnings
cargo test -p <touched crates>
cargo test --workspace

# contract / SDK
pnpm api:materialize:check
pnpm sdk:generate:check
pnpm sdk:check
node ../sdkwork-specs/tools/check-api-operation-patterns.mjs --workspace .
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .
node ../sdkwork-specs/tools/check-pagination.mjs --workspace .   # list/search endpoints

# repository / frontend
pnpm check:architecture-alignment
pnpm test:topology
pnpm test:pc-architecture
powershell -ExecutionPolicy Bypass -File tools/verify_sdkwork_structure.ps1
powershell -ExecutionPolicy Bypass -File tools/verify_openapi_operation_ids.ps1
pnpm --filter sdkwork-documents-pc typecheck
pnpm build:browser
```

## 8. Steps

| Step | Deliverable | Gate |
| --- | --- | --- |
| 0 | This plan, the ADR, `docs/INDEX.yaml` and `TECH_ARCHITECTURE.md` decision index entries | documentation review |
| 1 | Repair the drifted verification gates (see section 10) | `pnpm check:architecture-alignment`, structure and OpenAPI verifiers, topology and PC contract tests, `db:validate` |
| 2 | Migration `0001` + contract registries + generator registration + schema-registry fragment | `pnpm db:validate`, `pnpm test:contract:database` |
| 3 | Migration `0002` + category/dictionary seeds with locale files and checksums | same as step 2 |
| 4 | Contract crate DTOs and ports | `cargo test -p sdkwork-documents-contract` |
| 5 | sqlx market repository with isolation tests | `cargo test -p sdkwork-content-documents-repository-sqlx` |
| 6 | Market service (curation rules, bundle upsert) | `cargo test -p sdkwork-content-documents-service` |
| 7 | Market feature crate with routers and problem+json errors | `cargo test -p sdkwork-content-documents-market` |
| 8 | Mount on app-api and backend-api, both route manifests in sync | route crate tests, `pnpm api:assembly:validate` |
| 9 | OpenAPI paths + regenerated SDK families, validator lists updated | `pnpm api:materialize:check`, `pnpm sdk:generate:check`, `pnpm sdk:check`, pagination and envelope validators |
| 10 | Workspace scanner + bundle format + unit tests | `node --test tools/market/*.test.mjs` |
| 11 | Ingest end-to-end (CLI → backend API → DB), idempotency proof by running twice | repeated import leaves counts unchanged |
| 12 | Market pages: browse, search, detail, navigation, i18n, service layer | `pnpm --filter sdkwork-documents-pc typecheck`, `pnpm test:pc-architecture` |
| 13 | SDK download/archive hand-off and cross-links to the reference pages | `pnpm build:browser` |
| 14 | (Later) telemetry, favorites, anonymous browsing, CI self-publish | per feature |
| 15 | Full acceptance and documentation update | `pnpm check`, `pnpm verify` |

## 9. Risks

- **Registry overwrite.** `tools/materialize_phase1_contracts.mjs` rewrites `database/contract/*`;
  step 2 must update the generator with the new tables.
- **Crate-local migration mirror.** `sdkwork-content-documents-repository-sqlx` still bootstraps from
  its own frozen `migrations/` constants while `migrations/DEPRECATED.md` forbids adding files there;
  the test bootstrap must be pointed at `database/` so the market tables exist in tests.
- **Migration numbering.** Post-baseline migrations start at `0001` (sibling repository convention);
  record the chosen range in `database/README.md`.
- **Envelope debt.** The existing sdk-reference feature returns the forbidden `PlusApiResult`
  envelope; new endpoints must not copy it (D6).
- **No anonymous browsing (D4).** Market pages require a session; opening them publicly later needs a
  public path prefix on the API surface plus a public route decision in the PC app.
- **Pagination.** Catalog lists are inherently paged: SQL-side pagination with `PageInfo` is required
  by `PAGINATION_SPEC.md`, not optional.

## 10. Step 1 completion record (2026-10-03)

Pre-existing drift repaired so the repository's own gates can be used as acceptance evidence.
No Rust source and no database artifact was changed in this step.

| Repair | Evidence |
| --- | --- |
| Architecture alignment checker crashed on `cloud.development` (dereferenced a process the topology standard forbids). Rewrote the assertion to the standard: `APP_RUNTIME_TOPOLOGY_SPEC.md` requires `cloud.development` to resolve remote surfaces and forbids local API-plane processes, and the resolved plan reports `localProcesses: []`. | `node tools/check_sdkwork_documents_architecture_alignment.mjs` → "Architecture alignment passed" |
| Stale expectations in the same checker: topology `schemaVersion 2` (fleet and framework are on 5), `runtime-env.<env>.example.json` (fleet uses `runtime-env.<profile>.<env>.json`), literal `verify` script tokens (the aggregate body lives in `_sdkwork:verify` per `PNPM_SCRIPT_SPEC.md`), literal `documents-dev.mjs` dev entry, literal hyphenated assembly dependency key. | same run |
| `tests/contracts/architecture_alignment.test.mjs` and `tools/verify_phase1.ps1` invoked a non-existent `tools/check_sdkwork_ai_prod_architecture_alignment.mjs` (never existed in history); repointed both to the real checker. | `node --test tests/contracts/architecture_alignment.test.mjs` → 1 pass |
| Missing `crates/sdkwork-content-documents-repository-sqlx/tests/sqlite_document_store.rs` was still asserted although the SQLite adapter was deliberately retired in `f845f30`; removed the stale assertion. | alignment checker pass |
| `specs/topology.spec.json` schemaVersion expectation in `tools/verify_sdkwork_structure.ps1` updated to 5. | `tools/verify_sdkwork_structure.ps1` pass |
| Assembly and gateway crate `specs/component.spec.json` roots were not module-qualified; corrected to `sdkwork-documents/crates/...` (the form every other crate uses and the assembly materializer emits). | `tools/verify_sdkwork_structure.ps1` pass |
| Six generated contract files had operationIds renamed to bare verbs and duplicate `sdkReference.create` by commit `feac6bf`, and `apis/**` had drifted from `sdks/**`. Restored the canonical dotted ids from the generator's authored route tables for open-api/app-api/backend-api specs, then re-ran the canonical chain (`sdks/standardize-documents-sdk-family.mjs`, `tools/materialize-apis-authority.mjs`, `tools/patch-route-manifest-extensions.mjs`). | `verify_openapi_operation_ids.ps1`, `standardize --check`, `materialize-apis-authority --check` all pass |
| `verify_openapi_operation_ids.ps1` required schemas `DocumentList` and `ProblemDetails`, neither of which the generator emits; corrected to the canonical `DocumentListResponse` and `ProblemDetail`. | same run |
| `scripts/verify-documents-topology.test.mjs` expected four environments (the spec has five, including `demo`) and required a platform gateway URL in standalone profiles (fleet standalone profiles omit it; the PC app has a documented dev default). | `node --test scripts/verify-documents-topology.test.mjs` → 9 pass |
| PC architecture contract test and PC `specs/component.spec.json` referenced the retired `runtime-env.*.example.json` names; both now follow the profile-scoped runtime-env documents declared by `specs/topology.spec.json`. | `node --test apps/sdkwork-documents-pc/tests/documents-pc-architecture.contract.test.mjs` → 1 pass |
| `Cargo.toml` listed `crates/sdkwork-api-documents-assembly` twice in `[workspace] members`; deduplicated. | `cargo metadata --no-deps` exit 0 |

### 10.1 Remaining Step 1 finding (needs a decision)

`cargo test --workspace --no-fail-fast` reports three failures that Step 1 did **not** touch (no Rust
source was modified in this step). All three are route-crate context/auth acceptance drift against the
linked `sdkwork-web-framework` sibling checkout:

| Test | Observation |
| --- | --- |
| `sdkwork-routes-documents-backend-api :: backend_web_framework_routes :: backend_router_web_framework_accepts_dev_jwt_dual_tokens_before_handler` | expected `200`, got `401` |
| `sdkwork-routes-documents-open-api :: open_web_framework_routes :: open_router_web_framework_accepts_dev_api_key_claim_string_before_handler` | expected `200`, got `401` |
| `sdkwork-routes-documents-open-api :: open_api_routes :: open_list_documents_returns_payload_with_context` | recorded context tenant `100001`, test expects `1`; response body is still a bare `{"items"…}` payload rather than the `SdkWorkApiResponse` envelope |

These are authentication / tenant-resolution semantics, which `AGENTS.md` places behind human review,
and they are independent of the marketplace work. They must be resolved (or explicitly waived) before
`pnpm verify` can be claimed green, because `_sdkwork:verify` runs `cargo test --workspace`.
