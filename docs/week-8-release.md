# Week 8: launch, own a number, defend the work

## Release objective

Ship the hardened job platform, own search response time, and present evidence that
the system is fast, testable, observable, and recoverable. Production publication is
complete only after the GitHub push triggers or an operator performs deployment and
the live checks below pass.

## Owned metric

**Metric:** filtered job-search API p95 response time.

The reproducible local benchmark uses 10,000 synthetic jobs, 50 measured requests per
mode, local PostgreSQL, local Redis, and FastAPI's in-process test transport. It measures
application/database/cache time, not public internet latency.

| Version represented | Cache hits | Median | p95 |
|---|---:|---:|---:|
| Baseline database path | 0/50 | 16.95 ms | 39.43 ms |
| Redis-cached path | 50/50 | 7.25 ms | 11.89 ms |

The cached p95 is **69.8% lower** than the database-only baseline and comfortably below
the week 7 sub-second target. Reproduce it with `Backend/venv/Scripts/python.exe -B
Backend/scripts/benchmark_search.py` on Windows or the equivalent virtual-environment
Python on Linux. CI runs the same benchmark and fails if warm p95 reaches one second.

This is engineering evidence, not a claim about production users. After launch, record
at least one week of production `Server-Timing`/platform latency and replace this section
with real traffic p50/p95, sample size, region, and date range.

## Launch gates

- Backend tests, migration test, lint, dependency check, benchmark, and Docker build pass.
- Frontend audit, lint, typecheck, unit tests, production build, and desktop/mobile browser
  tests pass.
- Production secrets are configured from the example files and are absent from Git.
- Database backup restoration has been tested before applying the week 7 migration.
- `/health/live` and `/health/ready` return HTTP 200 after deployment.
- An administrator can open `/health`; all sources are `ok` or have an owned incident.
- One controlled frontend and backend exception arrives in Sentry with sensitive fields
  removed.
- One authorized test user saves a search, receives one real matching alert, receives no
  duplicate after a repeated scrape, and can delete the search to stop future alerts.

## Current external gates

The repository cannot create production credentials or prove deployment by itself.
Production needs Clerk issuer/keys and authorized origins, `ADMIN_USER_IDS`, PostgreSQL,
Redis, Resend credentials plus a verified sender, Sentry projects, and the Codeaza/Vercel
deployment connection. Do not mark the live-user and real-alert gates complete until
their evidence exists.

## Remaining roadmap exception

Source expansion after the initial release registers 52 independently tracked sites:
three remote feeds, 38 Greenhouse employer boards, and 11 Ashby employer boards.
Every employer board returned at least one published remote posting during the
2026-09-15 validation; one source from each new adapter normalized live data, and one
Greenhouse source wrote 80 jobs into the isolated test database in 8.31 seconds.
This reaches the configured source-count milestones, but does not yet prove 50+
sources ran reliably in production for a sustained period. The daily Vercel Cron
rollout and protected health dashboard need real run histories before making that
claim. Browser automation for blocked sites remains outside this public-API rollout.
