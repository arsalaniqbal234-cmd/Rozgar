# Changelog

## 0.8.1 - 2026-09-15

- Refreshed the full job-discovery interface with coordinated light and dark themes.
- Added a browser-local shortlist, grid/list views, career presets, keyboard search,
  and job-link sharing while preserving existing filters, alerts and application links.
- Added optional compact job listings and bounded public-search caching.
- Fixed stalled response-body timeouts and saved-search retry/loading feedback.
- Added desktop/mobile regression coverage and documented deployment requirements.

## 0.8.0 - 2026-09-14

- Added authenticated, owner-scoped saved searches using verified Clerk identities.
- Added durable, idempotent job-alert delivery with retry and cooldown state.
- Added canonical URL deduplication, raw source retention, and per-source run history.
- Added Redis search caching, PostgreSQL search indexes, and cursor pagination.
- Added Sentry instrumentation, readiness checks, and a protected pipeline dashboard.
- Added backend, frontend, migration, browser, benchmark, security-audit, and CI checks.
- Added architecture, operations, metric, release, rollback, and presentation guidance.
- Updated Next.js to a patched release after dependency audit findings.
