# Documents Database Module

Canonical authoritative-server lifecycle assets for `sdkwork-documents` under `DATABASE_FRAMEWORK_SPEC.md`.

- `databaseRole`: `authoritative-server`
- `moduleId`: `documents`
- `serviceCode`: `DOCUMENTS`
- `owner`: `documents-platform`
- `tablePrefix`: `documents_`
- `contract tables`: 14, listed in `contract/schema.yaml`
- `engine`: PostgreSQL only
- `autoMigrate`: disabled by default
- `seedOnBoot`: enabled; the runtime applies the standard seed profile on startup so a fresh
  install exposes the developer catalog and the bootstrap document set immediately

SQLite is not part of this authoritative database root. Any embedded SQLite adapter is non-authoritative and must own a separate `client-local` lifecycle contract before production use.

## Developer catalog

The module also owns the platform-wide developer catalog served by the API market
and SDK market:

- `documents_catalog_category`, `documents_catalog_module`, `documents_api_surface`,
  `documents_api_schema`, `documents_api_operation`, `documents_api_surface_category`,
  `documents_sdk_language`, `documents_sdk_family`, `documents_sdk_release`,
  `documents_sdk_category`, and `documents_catalog_sync`.
- Every sdkwork-space module contributes its OpenAPI surfaces (`open-api`,
  `app-api`, `backend-api`, `internal-api`, `gateway-api`, ...), normalized
  operations, and generated SDK families in every declared language.
- `database/seeds/catalog/generate_catalog_seed.py` scans the sibling
  `sdkwork-*` checkouts and emits the committed seed files
  (`database/seeds/common/100_*` through `121_*`) plus
  `database/seeds/catalog/catalog.summary.json`. Refresh with
  `python database/seeds/catalog/generate_catalog_seed.py`; verify with
  `python database/seeds/catalog/generate_catalog_seed.py --check`.
- The App Store embeds the documents API market and SDK market; both read this
  catalog through the documents app-api and its generated SDK.


## Document center bootstrap content

`database/seeds/common/200_platform_policies.sql` and
`database/seeds/common/210_industry_standards.sql` seed the published document set for the
platform tenant (`100001`, application `sdkwork-cloudrouter`) in `zh-CN` and `en-US`:

- Policies: privacy policy, terms of service, cookie policy.
- Industry references: GDPR, PIPL, ISO/IEC 27001, SOC 2.

Rows carry a stable `slug`, `locale`, `category`, `sort_order`, and `published_at`, so
`/docs/{slug-or-id}` can resolve them without a frontend release. The seeds are idempotent
(`ON CONFLICT (tenant_id, app_key, locale, slug)`) and are applied by
`sdkwork-documents-database-host` on boot for development, test, staging, demo, and production.
Set `SDKWORK_DATABASE_SEED_ON_BOOT=false` to opt a deployment out.

Install and deploy steps `MUST` apply pending migrations before the service starts
(`pnpm run db:migrate` or the installer lifecycle command, per `DATABASE_FRAMEWORK_SPEC.md` §4.4).
`autoMigrate` stays disabled so production never migrates implicitly; boot seeding then publishes
the document set on the first startup after migration.

## Layout

1. `database/ddl/baseline/postgres/0001_documents_baseline.sql` is the greenfield PostgreSQL DDL snapshot.
2. `database/migrations/postgres/` contains versioned incremental migrations with explicit lock, timeout, rollback, and transaction metadata.
3. `database/seeds/` contains common and locale-aware initialization data.
4. `database/drift/` declares non-mutating drift policy.

## Initialization state

This module is in initialization state per `DATABASE_FRAMEWORK_SPEC.md` section 7.5.

- `baselineStrategy`: `baseline-plus-migrations`
- Primary baseline: `ddl/baseline/postgres/0001_documents_baseline.sql` (immutable bootstrap anchor; not the complete active table inventory by itself)
- Ordered migrations: `migrations/postgres/0001_developer_catalog.up.sql` adds the developer catalog tables; `0002_developer_catalog_i18n.up.sql` adds localized catalog columns; `0003_document_center_pages.up.sql` adds the public document identity columns and indexes; `0004_document_drive_binding.up.sql` adds the per-locale Drive space/node binding and content-source columns.
- Seeds: `common/001_bootstrap.sql`, the developer catalog seed files, the platform policy and industry-standard document seeds, plus the `zh-CN` default locale; `en-US` is declared active and the remaining locales are reserved placeholders per section 8.1.
- Consolidation level: baseline is current; no migration has been folded into it and no tracked migration has been rewritten.

## Commands

```bash
pnpm run db:validate
pnpm run db:materialize:contract
pnpm run db:plan
pnpm run db:init
pnpm run db:migrate
pnpm run db:seed
pnpm run db:status
pnpm run db:drift:check
```

`db:validate` runs the canonical validator `../sdkwork-specs/tools/check-database-framework-standard.mjs`.

Runtime services MUST create pools through `sdkwork-database-sqlx` and register `DefaultDatabaseModule` at bootstrap via `sdkwork-documents-database-host`.

## Related specifications

- `DATABASE_FRAMEWORK_SPEC.md` — database module layout, initialization state, governance.
- `DATABASE_SPEC.md` — relational data, naming, and table authority rules.
- `MIGRATION_SPEC.md` — schema version migration records and compatibility windows.
