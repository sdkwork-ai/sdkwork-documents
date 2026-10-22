# Locale seeds

Locale-specific seed SQL referenced from `seeds/seed.manifest.json`.

Developer-catalog labels are localized in the catalog's own `*_i18n` JSONB
columns and are populated by the common catalog seeds, so they do not need a
per-locale SQL file. The API resolves them from `Accept-Language`; see
`../catalog/README.md`.
