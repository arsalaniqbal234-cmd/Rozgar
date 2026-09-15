# Job discovery refresh

The existing job search, location and salary filters, remote filter, saved-search
alerts, employer application links, health dashboard, monitoring, and light/dark
themes remain available.

## New experience

- Responsive career-focused home page, consistent navigation and footer, and
  coordinated light/dark palettes.
- Local shortlist: save up to 100 jobs without signing in, revisit them at
  `/shortlist`, and remove them individually. Only display metadata is stored.
  It is specific to this browser; clearing site storage removes the list.
- Grid and list views, career keyword presets, and `/` to focus job search.
- Copy a job's link from its detail page.
- Loading placeholders, keyboard focus styles, skip link, and reduced-motion support.
- Saved-search failures finish loading and can be retried; theme switching also
  works when local storage is blocked.

## Performance

Listings request `GET /jobs?summary=true` to omit descriptions from both the SQL
selection and JSON response. Existing callers without this option keep the full
response. Job detail responses are unchanged.

On September 15, 2026, read-only requests for the first 20 jobs in the configured
database returned 13,701 bytes normally and 6,485 bytes in summary mode: a 52.7%
payload reduction. This is a sample payload measurement, not a production latency
claim. Descriptions of different lengths will produce different savings.

The client caches up to 40 public search responses for 30 seconds. Filters and
cursors have separate entries. Retry clears the cache. Authenticated requests,
saved searches, mutations, and health requests are never cached. Request timeouts
cover body downloads as well as response headers. Text searches are debounced.
Job cards disable eager route prefetching to reduce background requests. The visual
design uses system fonts and CSS, with no external illustration/font downloads.

## Verification

- Frontend lint, production build and type check.
- Unit tests cover cache expiry/isolation, response timeouts, cancellation, shortlist
  storage limits, corrupt/blocked storage, multi-tab updates, and saved-search retry.
- Playwright exercises search, detail links, HTTP error recovery, shortlist persistence,
  career presets, layouts, themes, and viewport overflow on desktop and mobile.
- Backend tests verify summary/full-response compatibility, cursor pagination,
  separate cache keys, and that serialization performs no per-row description loads.

## Production release, September 15, 2026

The combined repository, `arsalaniqbal234-cmd/Rozgar`, contains the complete
implementation through commit `727b164`. Its GitHub CI run passed. The existing Vercel
projects are still connected to `jobfrontend` and `jobbackend`, so the matching
source changes were published to those repositories as separate release commits.
A push to `Rozgar` alone does not rebuild the existing domains.

| Public domain | Vercel project | Published repository head | Live result |
| --- | --- | --- | --- |
| https://jobsi-ten.vercel.app | `codeaza1/jobsi` | `jobfrontend` `872eda9` | Real jobs loaded; desktop and mobile browser checks passed |
| https://jobs-codeaza1.vercel.app | `codeaza1/jobs` | `jobbackend` `728d3a1` | Liveness and readiness returned 200; summary listing returned 200 |

The production frontend API setting had been entered as a Markdown link, which
made the browser request a nonexistent path on the frontend. It is now the plain
URL `https://jobs-codeaza1.vercel.app`, and the public jobs feed loads. The build
now rejects malformed URLs and missing or local API URLs in Vercel production.
The backend `pyproject.toml` now declares the pinned runtime dependencies, because
Vercel's Python builder selected it and the initial backend deployment failed.
The rebuilt backend is healthy against the configured production database.

Matching Clerk development-instance keys and allowed frontend origins were added
to the two existing Vercel projects without printing or committing their values.
The live browser test opened sign-in, signed in a temporary synthetic Clerk user,
created and listed one owned saved search, confirmed it persisted after reload,
deleted it, and removed the temporary user. The public shortlist likewise
persisted after reload. The live mobile page loaded 20 real job cards, retained
dark mode after reload, and had no horizontal viewport overflow.

These are development-instance Clerk keys (`pk_test_`/`sk_test_`). A production
Clerk instance and its matching keys must be provided before relying on this as
a public authentication launch. No production Resend API key or verified sender
was available, so creating a saved search works but email alert delivery is
disabled and was not tested. The public site now tells visitors that email alerts
are paused while keeping saved searches available. Set frontend
`NEXT_PUBLIC_EMAIL_ALERTS_ENABLED=true` and rebuild only after `RESEND_API_KEY`, a
verified `SENDER_EMAIL`, and the separate scheduler are active. The scheduler is
not started by the Vercel API deployment. Backend readiness reported `cache: disabled`
because Redis was not configured; the public frontend still uses the bounded
30-second cache and smaller summary responses described above.

Previous Vercel deployments remain available for rollback. Connecting both
projects directly to `Rozgar` with `Frontend` and `Backend` root directories would
remove the need to mirror future releases into the old repositories.
