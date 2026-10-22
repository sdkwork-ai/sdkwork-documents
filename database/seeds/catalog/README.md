# Developer Catalog Seeds

The developer catalog is the platform-wide inventory behind the documents API
market and SDK market. Its source of truth is the sdkwork-space checkout, not a
hand-maintained spreadsheet.

Current inventory: **74 modules, 142 API surfaces (3,681 operations), 154 SDK
families, 450 language releases, 15 categories**.

## What is scanned

`generate_catalog_seed.py` walks every sibling `sdkwork-*` module and collects:

- `apis/<surface>/...` OpenAPI documents (`open-api`, `app-api`, `backend-api`,
  `internal-api`, `gateway-api`, `admin-api`, `rpc`, and custom surfaces).
- `sdks/*/sdk-manifest.json` declarations, including SDK type, package name,
  languages, version, and release metadata.

The scanner normalizes language aliases (`c#` -> `csharp`, `node` ->
`typescript`, `golang` -> `go`) and infers the SDK type from `sdkType`,
`sdkSurface`, `discoverySurface.sdkTarget`, or the package suffix.

## Files

| Path | Purpose |
| --- | --- |
| `catalog.config.json` | Category taxonomy, module-to-category map, surface labels, tag mapping, language metadata, and locale labels. |
| `generate_catalog_seed.py` | Scanner and seed generator. Supports `--check` and `--summary-only`. |
| `verify_catalog_coverage.py` | Independent regression: every module with API/SDK assets appears in the catalog, every OpenAPI document has a surface, every SDK manifest has a family, and identifiers/categories are consistent. |
| `verify_catalog_seed_sql.py` | Optional `pglast` AST/regression check: PostgreSQL syntax, column/value arity, JSONB payloads, foreign keys, uniqueness, primary category links, and per-surface operation counts. |
| `catalog.summary.json` | Generated counts and category/type distribution; committed for review. |
| `../common/100_catalog_taxonomy.sql` | 15 primary categories. |
| `../common/101_catalog_modules.sql` | Module inventory. |
| `../common/110_api_surfaces_*.sql` | API surfaces, OpenAPI documents, operations, and category links. |
| `../common/120_sdk_families_*.sql` | SDK families. |
| `../common/121_sdk_releases_*.sql` | Per-language SDK releases and install commands. |

Every file is written with deterministic UUIDv5 identifiers and
`INSERT ... ON CONFLICT ... DO UPDATE`, so the catalog seeds are idempotent and
safe to re-apply. Removed rows are not pruned automatically; retire them with a
migration when a module or surface is deleted.

## Localized labels

Every user-visible catalog label has a canonical English column and a JSONB
override column keyed by BCP 47 locale (`{"en-US":"App API","zh-CN":"应用 API"}`):

- category: `name_i18n`, `description_i18n`
- module: `name_i18n`, `description_i18n`
- API surface: `surface_name_i18n`, `title_i18n`, `description_i18n`
- API operation: `summary_i18n`, `description_i18n`
- SDK language: `language_name_i18n`
- SDK family: `sdk_name_i18n`, `description_i18n`

`catalog.config.json` owns the curated Chinese taxonomy and surface labels.
The generator derives Chinese titles for surfaces and SDKs when the title
contains a known surface label; custom product names and descriptions fall back
to the canonical English value. The API resolves labels from the request
`Accept-Language` header (exact tag, then language base tag, then canonical
English), so the same database row serves every locale.

## Refresh

```bash
python database/seeds/catalog/generate_catalog_seed.py
python database/seeds/catalog/generate_catalog_seed.py --check
python database/seeds/catalog/verify_catalog_coverage.py
python database/seeds/catalog/verify_catalog_seed_sql.py
```

`--check` fails when the committed seeds or summary are stale.
`verify_catalog_coverage.py` fails when a module, OpenAPI document, or SDK
manifest exists in the workspace but never reached the catalog; it also checks
that API authorities and SDK codes are unique, that every surface has
operations (zero-operation placeholder documents are seeded as `draft`), and
that every SDK family has at least one language release.

`verify_catalog_seed_sql.py` is an optional developer check (it needs
`pip install pglast`). It parses every seed with PostgreSQL's own parser,
validates column/value arity and JSONB payloads, checks foreign keys and
uniqueness, and compares each surface's seeded operation count with
`operation_count`. Without `pglast` it prints a skip notice and exits zero.

Run both after any change to a module's `apis/` directory or
`sdks/*/sdk-manifest.json`, and commit the regenerated files together with that
change.

## Apply

```bash
pnpm db:init
pnpm db:seed
```

The catalog seed files are registered in `database/seeds/seed.manifest.json`
before the locale seeds. The tenant scope is `100001`; the generated
`documents_*` ids are deterministic and stable across refreshes.

`database/database.manifest.json` enables `seedOnBoot` for the documents module.
Migrations stay explicit for authoritative-server modules: the gateway's
`--migrate-databases` pre-start step (and `[database] autoMigrate` in
development) applies pending schema changes. A host that owns the documents
database lifecycle — including `sdkwork-api-cloud-gateway` when it embeds the
documents surface — therefore applies pending migrations and the catalog seeds
on startup. Seed content is checksummed in the database history, so an unchanged
catalog is skipped on later starts and an updated catalog is applied
idempotently.

## Adding a category or module

1. Add the category to `categories` in `catalog.config.json` (code, English and
   Chinese names, English and Chinese descriptions, icon, sort order).
2. Add the module to `moduleCategories` or a surface/tag mapping.
3. Regenerate and commit the seeds and `catalog.summary.json`.
4. Run `pnpm db:validate` and the documents API checks.
