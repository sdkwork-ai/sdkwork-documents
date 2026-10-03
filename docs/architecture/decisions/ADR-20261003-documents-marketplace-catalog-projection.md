# ADR-20261003-documents-marketplace-catalog-projection

Status: accepted
Owner: SDKWork maintainers
Updated: 2026-10-03
Specs: DOMAIN_SPEC.md, DATABASE_SPEC.md, SDK_MANIFEST_SPEC.md, COMPOSABLE_ARCHITECTURE_SPEC.md, API_SPEC.md, DOCUMENTATION_SPEC.md

## Context

SDKWork is a composable ("building block") workspace: every module repository publishes its own
owned artifacts — `specs/component.spec.json` (`contracts.apiAuthorities[]`), `apis/` OpenAPI
authorities (`authority-manifest.json`, `authority-index.json`, `manifest.json`), route manifests
(`sdks/_route-manifests/`), and SDK families (`sdks/<family>/sdk-manifest.json`). There is no
workspace-level index of those published APIs and SDKs, so a consumer cannot discover "which
modules expose which API surface, in which version, for which language, and where the SDK package
lives" without reading every repository.

This repository already owns the human-facing discovery surfaces for that material
(`@sdkwork/documents-pc-api-reference`, `@sdkwork/documents-pc-sdk-reference`, hosted by
`sdkwork-documents-pc` and by other applications such as `sdkwork-cloudrouter-pc`). The requested
feature is an **API market and SDK market**: browsable category trees plus API entries and SDK
entries with versions, endpoints, packages, and downloads.

Two governance facts constrain the shape of that feature:

- `DOMAIN_SPEC.md` section 3 assigns "Plugins, **marketplace**, extension registry, app store" to
  domain `ecosystem`, and reserves the capability token `catalog` for domain `commerce`
  (`DOMAIN_SPEC.md` section 3.1). A transactional marketplace therefore does not belong to this
  repository's `content` / `documents` bounded context.
- `sdkwork-specs/README.md` ("do not add a parallel host catalog that repeats those facts"),
  `SDK_MANIFEST_SPEC.md` section "Parallel registry prohibition", and
  `COMPOSABLE_ARCHITECTURE_SPEC.md` forbid restating owned API/SDK facts in a second authority.
  At the same time `DOMAIN_SPEC.md` section 5 explicitly permits the other direction: "A domain may
  expose **read projections** for other domains, but the projection owner and refresh semantics must
  be explicit."

## Decision

1. **Scope and boundary.** This repository owns an **API/SDK discovery catalog** (browsable
   categories, API entries with versions and endpoints, SDK entries with versions and language
   packages, download hand-off) — a documentation and discovery surface. It explicitly does **not**
   own publisher onboarding, listing review, pricing, checkout, settlement, or ratings. Adding any of
   those is the trigger to migrate the feature to domain `ecosystem` (or to consume `sdkwork-appstore`
   / `sdkwork-catalog` / `sdkwork-order` / `sdkwork-payment`).
2. **Catalog is a projection, not an authority.** Ingested API/SDK facts are stored as an explicitly
   labelled read model (`read_model` profile per `DATABASE_SPEC.md` section 5) keyed by the source's
   own stable identifiers (`apiAuthority`, `sdkFamily`), carrying source lineage
   (`source_ref`, `source_sha256`), freshness (`synced_at`, `last_sync_run_id`) and rebuild state
   (`projection_state`). The owning repository remains the single source of truth for every projected
   field; the catalog never writes back.
3. **Field authority matrix.** Only these fields are market-owned; everything else is projected.

   | Field group | Authority | Catalog role |
   | --- | --- | --- |
   | `apiAuthority`, API prefix/base path, OpenAPI spec URL + `spec_sha256` | source repository (`specs/component.spec.json`, `apis/**`) | projected snapshot + drift detection |
   | API endpoint rows (`method`, `path`, `operationId`, `auth`, `tag`) | source repository (`sdks/_route-manifests/**`, OpenAPI) | projected, rebuilt per API version |
   | `sdkFamily`, package name, languages, `apiVersion`, release state | source repository (`sdks/<family>/sdk-manifest.json`) | projected snapshot |
   | category binding, lifecycle status, visibility, featured flag, sort order | this repository | authoritative (operator-owned) |
   | sync runs and items, source lineage and hashes, projection state | this repository | authoritative (operational) |
   | view/download counters, favorites (later phase) | this repository | authoritative (market-owned telemetry) |

4. **Naming.** Tables stay inside the single registered prefix `documents_` and use the module-local
   `market` bounded-context segment (`documents_market_*`); the OpenAPI tag and API authority stay
   `documents` (`sdkwork-documents-{open,app,backend}-api`). No second database prefix family and no
   new domain catalog entry is introduced.
5. **Ingestion is a scanned bundle pushed through a contract endpoint.** A workspace scanner
   (`tools/market/scan-workspace.mjs`) reads the declaration files listed in the Context, emits one
   deterministic bundle with a content hash, and the backend ingest API
   (`POST /backend/v3/api/market/sync-runs`) upserts idempotently by natural key, recording a
   `sync_run` plus per-resource `sync_item` outcomes. Missing sources are marked `projection_state =
   'missing'` rather than deleted.
6. **Delivery.** Anonymous browsing is out of scope for the first phase: the market pages are served
   by `sdkwork-documents-pc` behind the existing session gate, and the catalog is read through the
   generated app SDK (`@sdkwork/documents-app-sdk`).

## Alternatives

- **New `ecosystem` domain/repository.** Governance-perfect for a transactional marketplace, but the
  requested capability is discovery over published contracts, and it would add a new domain catalog
  entry, a new repository, and a new deployment surface for the same read-only content.
  Rejected for this phase; recorded above as the migration trigger.
- **A parallel authoritative registry** (catalog rows treated as the source of truth). Forbidden by
  `sdkwork-specs/README.md`, `SDK_MANIFEST_SPEC.md`, and `COMPOSABLE_ARCHITECTURE_SPEC.md`.
  Rejected.
- **No database at all** (render the catalog from the aggregated OpenAPI documents at request time).
  Avoids all projection concerns but cannot express categories, operator curation, publish state,
  SDK language packages, or download telemetry, and re-scans the workspace on every request.
  Rejected.
- **Reuse `sdkwork-appstore` tables.** Its subject is applications (publisher, listing, release,
  artifact, price); APIs and SDKs have no publisher/listing/price semantics here. Only its
  release/artifact/download mechanics are reused as a pattern. Rejected as a schema source.

## Consequences

- The catalog can be wrong or stale only in a detectable way: every projected row carries
  `source_ref` + `source_sha256` + `synced_at`, so drift is visible and repairs are a re-scan.
- The market owns a small, clearly bounded set of new tables under `documents_market_*`; the existing
  `documents_document` / `documents_revision` / `documents_audit_log` tables are untouched.
- Category trees, operator curation, and telemetry are durable across re-scans because they are not
  derived from source repositories.
- The scanner is a developer/CI tool, not a runtime dependency; the runtime path is the ingest API
  plus ordinary catalog reads.
- Reviewers can audit compliance with the "no parallel registry" rule by checking the field authority
  matrix above against the generated DDL and DTO surface.

## Verification

- Database contract: `pnpm db:validate`, `pnpm test:contract:database`.
- Repository alignment: `pnpm check:architecture-alignment`, `node tools/check_sdkwork_documents_architecture_alignment.mjs`.
- Contract and SDK generation: `pnpm api:materialize:check`, `pnpm sdk:generate:check`, `pnpm sdk:check`.
- API standards: `node ../sdkwork-specs/tools/check-api-operation-patterns.mjs --workspace .`,
  `check-api-response-envelope.mjs`, `check-pagination.mjs` (list/search endpoints), and the
  int64 wire contract for projected identifiers.
- Projection semantics: migration and repository tests must prove that a re-scan updates projected
  rows in place and marks disappeared sources `missing` without deleting market-owned curation.

## Supersedes / Superseded By

Supersedes: none.
Superseded by: none (becomes superseded if the feature gains transactional marketplace semantics and
migrates to domain `ecosystem`).
