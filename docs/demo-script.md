# Twenty-minute Rozgar demo

## 0-2 minutes: problem and outcome

Explain that Rozgar collects remote job listings into one searchable feed and closes
the loop with authenticated saved searches and non-duplicate alerts. State the honest
release scope: a hardened three-source beta, with 50-source expansion still outstanding.

## 2-6 minutes: user journey

Open the mobile viewport, search and filter jobs, load the next cursor page, open a
clean job-detail URL, and follow the employer application link. Sign in, save a search,
open Saved searches, and show that deleting it stops alerts.

## 6-10 minutes: data pipeline

Walk through `BaseScraper` and normalized validation, source registration, raw response
retention, canonical URL deduplication, per-source scheduling, and advisory locks. Trigger
one authorized source run and show the resulting job and scrape-run record.

## 10-13 minutes: alert correctness

Show the saved-search matching filters, unique search/job delivery record, durable retry
state, provider idempotency key, cooldown, and `needs_review` outcome for ambiguous old
sends. Repeat the same scrape and demonstrate that no second delivery is created.

## 13-16 minutes: speed and health

Run the benchmark or show its CI output: database p95 39.43 ms and cached p95 11.89 ms
for the recorded 10,000-row run. Open `/health`, explain `ok`, `failed`, `stale`, and
`stalled`, then show a Redis outage returning database results with `X-Cache: BYPASS`.

## 16-18 minutes: quality and operations

Show CI gates, the migration preservation test, backend/frontend tests, mobile browser
test, dependency audit, Sentry event scrubbing, readiness probe, and rollback runbook.

## 18-20 minutes: ownership and questions

State the owned metric and its 69.8% p95 reduction, distinguish local benchmark evidence
from production latency, identify the source-count gap, and describe the next measurable
step: collect one week of production search p95 and alert delivery success data.
