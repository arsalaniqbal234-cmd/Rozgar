# Pakistan job imports and location search

The Pakistan sources extend the existing jobs table, API and search interface.
No frontend redesign, database migration or change to existing remote feeds is needed.

## Sources

Validated on 2026-09-24 using the employers' public published-job APIs:

| Source ID | Employer | API |
| --- | --- | --- |
| `greenhouse_careem` | Careem | Greenhouse |
| `greenhouse_joblogic` | Joblogic | Greenhouse |
| `lever_educative` | Educative | Lever |
| `workable_devsinc-17` | Devsinc | Workable |
| `workable_pakistan-single-window` | Pakistan Single Window | Workable |

API references: [Greenhouse](https://docs.greenhouse.io/job-board.html),
[Lever](https://github.com/lever/postings-api),
[Workable](https://workable.readme.io/reference/jobs-1).

These five sources are an initial coverage set, not every job in Pakistan.
Pakistan Single Window also advertises recruitment on behalf of other organizations;
the original description preserves that attribution. The company label identifies
the publishing employer board.

## Import

From `Backend`, using the existing `.env` database configuration:

```powershell
.\venv\Scripts\python.exe -m app.import_pakistan --dry-run
.\venv\Scripts\python.exe -m app.import_pakistan
```

The first command fetches and validates without database writes. The second uses
the existing locked, transactional pipeline and records per-source results. It
does not send email. A source failure produces a nonzero exit status; other sources
continue. Re-running deduplicates by source ID/canonical URL and refreshes fields
only when the importing source owns the listing. IDs and creation times stay stable.

The separate scheduler automatically includes these sources. Five additional
daily Vercel cron routes are configured; those routes require deployment of this
branch. Existing cron authentication remains required.

## Matching and display

Only locations explicitly in Pakistan or recognized unambiguous Pakistan cities
qualify. Country metadata takes precedence when provided. Worldwide/unspecified
remote jobs are not assumed to be in Pakistan. Onsite, hybrid and remote listings
are imported; only explicit remote roles set the existing `is_remote` flag.
Hybrid jobs retain their source description and are not mislabeled remote.

Imported locations include `Pakistan`, so the current platform can display and
search them immediately. Backend country search additionally resolves `Pakistan`,
`PK` and `PAK` to city-only legacy records. Autocomplete offers `Pakistan` first for
country prefixes/aliases independently of current listings. The offline GeoNames
Pakistan directory also supplies city/town suggestions, including Rawalpindi,
even when no vacancies exist there. Selecting `City, Pakistan` matches listings
with an intervening province or multiple locations. Directory provenance and
license are in `Backend/app/data/README.md`. Ambiguous city/region names
(e.g. Hyderabad or Punjab alone) require country information. Salaries are left
empty when the adapters cannot determine a reliable amount, currency and period.

The existing job lifecycle is unchanged: a disappeared source listing is not
automatically deleted or expired. Public feeds provide currently published jobs at
fetch time; the original Apply page remains authoritative for availability.

## Verification

Backend regression coverage includes location boundaries, foreign/ambiguous
locations, complete source parsing, duplicates, refreshes, country suggestions,
API results and the no-email import path. The frontend regression test verifies
keyboard selection of the Pakistan country suggestion.

Validated import on 2026-09-24: 95 new unique jobs (Careem 7, Joblogic 14,
Educative 10, Devsinc 31, Pakistan Single Window 33). The configured database and
the deployed website's `/api/jobs?location=Pakistan` both returned 96 matches,
including one existing listing. Re-importing Pakistan Single Window added zero
duplicates and preserved all cities for repeated shortcodes.

All 64 backend tests, the frontend country-selection test, frontend type checking,
and lint on the changed files passed. The full backend lint run has an existing
unused-variable finding at `tests/test_company_follows.py:77`; that unrelated file
was not changed. The new country suggestion/alias behavior and cron registrations
remain branch changes until deployed; imported jobs are already in the database.

The logo/location follow-up adds official local assets for the five Pakistan
employer boards, including the 1024px PSW mark. Asset URLs are recorded in
`Frontend/public/company-logos/pakistan-sources.json`. No card layout changes were
needed. Verification after this follow-up: 65 backend tests, six focused frontend
tests, TypeScript checking and lint on changed code passed.
