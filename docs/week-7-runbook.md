# Rozgar week 7 runbook

This runbook covers the fast, tested, and monitored release. It does not cover the
week 8 production launch or claim the earlier 10/50-source milestone is complete.

## Required configuration

Copy `Backend/.env.example` and `Frontend/.env.example`; keep real values out of
Git. At minimum configure PostgreSQL, Redis, the Clerk issuer/authorized frontend
origins, and the matching frontend Clerk publishable key. Add the user IDs allowed
to view `/health` to `ADMIN_USER_IDS`.

Alerts additionally require a Clerk secret key, a Resend API key, and a verified
sender. Monitoring requires separate backend and frontend Sentry DSNs. Source-map
upload in CI also needs the Sentry organization, project, and auth token.

## Deploy safely

1. Back up PostgreSQL and test restoring the backup. Migration `7a01_week7` has an
   intentionally non-automatic downgrade because deleting alert delivery history
   can resend email.
2. Run `cd Backend` and `alembic upgrade head` once. The migration preserves jobs,
   disables legacy saved searches whose recipients were never verified, and creates
   the cache/search, delivery, source, and scrape-run structures.
3. Deploy Redis with eviction enabled. The API still reads from PostgreSQL when
   Redis is unavailable, so a cache outage should reduce speed rather than availability.
4. Deploy the API and verify `/health/live` and `/health/ready`. The latter checks
   PostgreSQL and Redis and must return HTTP 200 before routing traffic.
5. Deploy one scheduler process with `python -m app.run_scheduler`. Database
   advisory locks prevent duplicate source or alert workers during restarts.
6. Build and deploy `Frontend`, then sign in as an ID listed in `ADMIN_USER_IDS`
   and inspect `/health` for every source.

Docker users can run `docker compose up --build`; its migration service must finish
before the API and scheduler start. The compose file expects PostgreSQL through the
configured `DATABASE_URL` and supplies its own Redis service.

## Release verification

- Save a search, check it appears under `/saved-searches`, and confirm another user
  cannot read or delete it.
- Scrape a matching new job. Confirm exactly one alert delivery becomes `sent`, then
  repeat the scrape and confirm no duplicate delivery is created.
- Cause one controlled non-production error in the API and frontend and confirm both
  arrive in Sentry without request headers, cookies, email addresses, or query text.
- Stop Redis temporarily and confirm `/jobs` responds with `X-Cache: BYPASS`. Restart
  it and confirm a repeated query becomes `X-Cache: HIT`.
- Run the repository CI-equivalent checks: backend `ruff`, `pytest`, and the benchmark;
  frontend audit, lint, typecheck, unit tests, production build, and browser tests.

## Failure response

- `ready` returns 503: keep the instance out of rotation and inspect PostgreSQL first.
- A source is `failed`, `stale`, or `stalled`: check its latest error code and Sentry
  event, repair the source, then run that source through the protected scrape endpoint.
- Alerts are `retry`: the worker will retry with the same provider idempotency key.
  `needs_review` means the provider outcome remained ambiguous for nearly 24 hours;
  inspect Resend before changing that row to avoid duplicate mail.
- Redis is unavailable: leave the API running, restore Redis, and allow old cache keys
  to expire. Job writes also rotate the cache version.

## Rollback

Roll the API, scheduler, and frontend images back together. Keep the week 7 schema and
delivery rows during an application rollback. If the schema must be removed, stop all
writers and restore the verified pre-migration backup; do not delete delivery history
from a live alert system.
