# Documents Database Module

Canonical authoritative-server lifecycle assets for `sdkwork-documents` under `DATABASE_FRAMEWORK_SPEC.md`.

- `databaseRole`: `authoritative-server`
- `moduleId`: `documents`
- `serviceCode`: `DOCUMENTS`
- `owner`: `documents-platform`
- `tablePrefix`: `documents_`
- `contract tables`: 3, listed in `contract/schema.yaml`
- `engine`: PostgreSQL only
- `autoMigrate`: disabled by default

SQLite is not part of this authoritative database root. Any embedded SQLite adapter is non-authoritative and must own a separate `client-local` lifecycle contract before production use.

## Layout

1. `database/ddl/baseline/postgres/0001_documents_baseline.sql` is the greenfield PostgreSQL DDL snapshot.
2. `database/migrations/postgres/` contains versioned incremental migrations with explicit lock, timeout, rollback, and transaction metadata.
3. `database/seeds/` contains common and locale-aware initialization data.
4. `database/drift/` declares non-mutating drift policy.

## Initialization state

This module is in initialization state per `DATABASE_FRAMEWORK_SPEC.md` section 7.5.

- `baselineStrategy`: `baseline-plus-migrations`
- Primary baseline: `ddl/baseline/postgres/0001_documents_baseline.sql` (immutable bootstrap anchor; not the complete active table inventory by itself)
- Ordered migrations: none yet — `migrations/postgres/` is empty until the contract evolves. A fresh install applies the baseline followed by the ordered migrations, so the baseline and the migration files jointly define the contract.
- Seeds: `common/001_bootstrap.sql` plus the `zh-CN` default locale; `en-US` is declared active and the remaining locales are reserved placeholders per section 8.1.
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
