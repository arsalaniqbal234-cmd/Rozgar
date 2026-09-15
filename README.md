# Rozgar — Remote Job Listings Platform

A full-stack job discovery app that aggregates listings from RemoteOK, Arbeitnow,
and Jobicy. Search opportunities, shortlist jobs in your browser, and save searches
for email alerts.

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Neon for production)
- **Caching:** Redis and short-lived public-search caching in the browser
- **Scraper:** Python (requests)
- **Authentication and alerts:** Clerk and Resend
- **Deployment:** Vercel frontend/API, with a separate scheduler process for recurring work

## Features
- Professional light/dark interface with responsive grid and list views
- Personal browser shortlist, quick career filters, keyboard search, and job sharing
- Lightweight job summaries and short-lived public-search caching
- Three source integrations: RemoteOK, Arbeitnow, and Jobicy
- Deduplication — prevents the same job from being added twice
- Real database search (title/company match)
- Location, salary, and remote filters with cursor pagination
- Job detail endpoint with direct apply links
- Authenticated saved searches and email alerts to verified account addresses
- API key protection on manual scrape endpoints
- Protected pipeline health dashboard and Sentry monitoring
- Error handling for network/database failures
- Responsive, modern UI

## Project Structure

```text
Rozgar/
├── Backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Database models
│   │   ├── routers/         # Jobs, saved searches, and health endpoints
│   │   ├── scrapers/        # Source integrations
│   │   └── run_scheduler.py # Recurring scrape and alert worker
│   ├── alembic/             # Database migrations
│   ├── database.py          # Database connection setup
│   └── requirements.txt
├── Frontend/
│   ├── app/                 # Next.js pages, shared components, and styles
│   ├── lib/                 # API client, search state, and shortlist storage
│   ├── tests/               # Unit tests
│   └── e2e/                 # Browser tests
├── .github/workflows/       # CI checks
└── docs/                    # Architecture, release evidence, and runbooks
```

## Setup

Use Python 3.11 and Node.js 24 to match CI. Provision PostgreSQL and Redis, and
create a Clerk application for sign-in. The example database and Redis URLs use
local ports `55432` and `56379`; change them to match your services. Commands below
use Windows PowerShell and start from the repository root.

### Backend

```powershell
cd Backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

For a new checkout, copy `Backend/.env.example` to `Backend/.env`. Preserve an
existing environment file. Set `DATABASE_URL`, `REDIS_URL`, and a private
`SCRAPE_SECRET_KEY`. Configure the Clerk issuer and secret key for the same Clerk
application used by the frontend; keep `CORS_ORIGINS`, `FRONTEND_URL`, and
`CLERK_AUTHORIZED_PARTIES` aligned with `http://localhost:3000` for local use.

Apply the database migrations before starting the API:

```powershell
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The API runs on `http://127.0.0.1:8000`; interactive API documentation is at
`http://127.0.0.1:8000/docs`. For an existing production database, follow the backup
and migration steps in the [runbook](docs/week-7-runbook.md).

To fetch jobs on a schedule, open another terminal in `Backend` and run:

```powershell
.\venv\Scripts\python.exe -m app.run_scheduler
```

The scheduler runs separately from the API. Email delivery also needs a Resend API
key, verified sender, and the backend Clerk secret key. See the environment example
and runbook for the remaining settings.

### Frontend
Open another terminal at the repository root:

```powershell
cd Frontend
npm ci
```

For a new checkout, copy `Frontend/.env.example` to `Frontend/.env.local`. Set
`NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` and the Clerk publishable/secret keys from
your Clerk application. Keep private keys in environment files or hosting settings,
never in Git.
Keep `NEXT_PUBLIC_EMAIL_ALERTS_ENABLED=false` until the backend email sender and
separate scheduler are running; only then set it to `true` and rebuild the frontend.

```powershell
npm run dev
```

The website runs on `http://localhost:3000`. Production builds use `npm run build`
followed by `npm run start`. Set the public API URL before building because it is
embedded in the browser bundle.

## API Endpoints
- `GET /jobs` — Filtered, paginated jobs; `summary=true` omits descriptions
- `GET /jobs/{job_id}` — Get a single job by ID
- `GET /search?keyword=...` — Search jobs by title/company
- `POST /scrape/{source}` — Scrape `remoteok`, `arbeitnow`, or `jobicy`; requires `x-api-key`
- `POST /scrape-all` — Scrape all sources; requires `x-api-key`
- `POST /cron/scrape-all` — Scheduled trigger; requires `Authorization: Bearer <CRON_SECRET>`
- `GET /saved-searches/`, `POST /saved-searches/` — List or create owned searches; requires a Clerk bearer token
- `DELETE /saved-searches/{search_id}` — Delete an owned search; requires a Clerk bearer token
- `GET /health/live`, `GET /health/ready` — Liveness and dependency readiness
- `GET /health` — Pipeline dashboard data; requires an authenticated administrator
- `GET /docs` — Interactive API documentation

## Environment Variables
Use [Backend/.env.example](Backend/.env.example) and
[Frontend/.env.example](Frontend/.env.example) for the full configuration.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string for server search caching |
| `SCRAPE_SECRET_KEY` | API key for `/scrape/{source}` and `/scrape-all` |
| `CRON_SECRET` | Bearer secret for `/cron/scrape-all` |
| `NEXT_PUBLIC_API_URL` | Backend URL embedded into the frontend build |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend Clerk application key |
| `NEXT_PUBLIC_EMAIL_ALERTS_ENABLED` | Show active email-alert wording only when delivery and scheduling are running |
| `CLERK_SECRET_KEY` | Clerk secret; backend uses it to verify saved-search email ownership |
| `CLERK_ISSUER`, `CLERK_AUTHORIZED_PARTIES` | Backend session issuer and permitted frontend origins |
| `CORS_ORIGINS`, `FRONTEND_URL` | Browser API access origins and frontend URL used in alert links |
| `RESEND_API_KEY`, `SENDER_EMAIL` | Email delivery credentials and verified sender |
| `ADMIN_USER_IDS` | Clerk user IDs permitted to view the health dashboard |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Server and browser error monitoring |

## Production hardening

The existing frontend and API Vercel projects now deploy from this one GitHub
repository. See the [single-repository deployment guide](docs/deployment.md) for
their root directories, normal releases, live checks, and rollback.

The latest [job discovery refresh](docs/ui-refresh.md) preserves existing features,
adds a personal shortlist, and documents performance measurements and deployment
requirements for the combined repository.

Week 7 adds authenticated saved searches, durable non-duplicate alerts, Redis search
caching, database search indexes, per-source pipeline monitoring, Sentry integration,
tests, and CI. See the [week 7 plan](docs/week-7-plan.md) and
[week 7 runbook](docs/week-7-runbook.md) for acceptance criteria and deployment steps.

Week 8 release evidence, the owned search-latency metric, launch gates, architecture,
and presentation are documented in the [week 8 release](docs/week-8-release.md),
[architecture](docs/architecture.md), and [demo script](docs/demo-script.md).
