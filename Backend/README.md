# Rozgar backend

FastAPI, PostgreSQL, Redis, APScheduler, and resilient source adapters for the Rozgar
job platform.

## Local setup

1. Create and activate a Python 3.11 virtual environment.
2. Install `requirements-dev.txt` for development or `requirements.txt` for runtime.
3. Copy `.env.example` to `.env` and provide local credentials.
4. Run `alembic upgrade head`.
5. Start the API with `uvicorn app.main:app --reload`.
6. Start one scheduler process with `python -m app.run_scheduler`.

`GET /health/live` is the process liveness probe and `GET /health/ready` checks
PostgreSQL plus configured Redis. `GET /health` requires an authenticated Clerk user
listed in `ADMIN_USER_IDS` and returns pipeline and alert-delivery health.

## Verification

Run `ruff check app database.py alembic tests scripts`, `pytest -q`, and
`python scripts/benchmark_search.py`. The tests and benchmark require dedicated local
PostgreSQL and Redis services matching the test defaults. The test bootstrap refuses a
non-local database or a database whose name does not end in `_test`.

Production migration and alert rollback guidance lives in the monorepo's
`docs/week-7-runbook.md`. Back up PostgreSQL before migration; delivery history is kept
to prevent repeated email.

## Company follow alerts

Apply the `8b61d9a2e4c0` migration with `alembic upgrade head` before deploying the
API. A signed-in user with a verified primary Clerk email can follow a company from
any job detail page. Clicking the external Apply link also creates the follow; this
records intent to apply, since the employer site cannot report completion to Rozgar.
`GET /company-follows` lists active follows, `POST /company-follows` accepts
`{"job_id": 123}` and is idempotent, and `DELETE /company-follows/{id}` stops alerts.
All routes require the user's Clerk bearer token. The `/followed-companies` page
is linked from each company email for authenticated opt-out.

The alert worker checks company follows after each scrape and on its regular alert
run. Matching uses a normalized exact company name because there is no companies
table or stable company ID. If multiple unrelated employers share a name, use a
verified company identity before enabling follows for those listings. New roles
must be posted after the follow time. Delivery records retain the job ID (which is
deduplicated upstream by source ID and URL fingerprint), exact payload, and Resend
idempotency key. Unfollowing cancels pending deliveries. Reverification at send
time prevents an account with an unverified primary email from receiving alerts.

The follow email links to the authenticated management page; it is not a one-click
unsubscribe endpoint. Add a signed unsubscribe token before using this for any
campaign where one-click unsubscribe is required.
