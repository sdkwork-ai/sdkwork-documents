# Common seeds

Shared seed SQL referenced from `seeds/seed.manifest.json`.

- `100_*` through `121_*`: generated developer-catalog seeds.
- `200_platform_policies.sql`: privacy policy, terms of service, and cookie policy for the
  platform tenant in `zh-CN` and `en-US`.
- `210_industry_standards.sql`: GDPR, PIPL, ISO/IEC 27001, and SOC 2 reference documents in
  `zh-CN` and `en-US`.

The `200_*` and `210_*` files are idempotent (`ON CONFLICT` on the public slug) and are applied on
boot through the standard seed profile.
