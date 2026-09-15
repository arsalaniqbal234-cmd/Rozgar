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

## Existing production deployment

Source of truth: `arsalaniqbal234-cmd/Rozgar`.

At review time, Vercel's existing frontend and backend projects were still linked
to the older `jobfrontend` and `jobbackend` repositories. A push to `Rozgar` alone
does not deploy those sites. An authenticated Vercel operator should connect the
existing projects to the combined repository:

| Existing site | Root directory | Framework |
| --- | --- | --- |
| https://jobsi-ten.vercel.app | `Frontend` | Next.js |
| https://jobs-codeaza1.vercel.app | `Backend` | Existing Python/Vercel configuration |

Keep each project's existing domains and production environment variables.
Set frontend `NEXT_PUBLIC_API_URL` to the deployed backend URL. Configure the
matching Clerk keys/issuer and backend CORS/authorized frontend origins using the
example environment files. Apply required migrations once using the existing
runbook before deploying code that depends on them.

Deploy the backend first, check `/health/live`, `/health/ready` and
`/jobs?summary=true&limit=1`, then deploy the frontend. Verify the public site,
sign-in, owned saved searches, and local shortlist. Keep the previous Vercel
deployments available for rollback. Deployment is complete only after these live
checks; local tests and a GitHub push are not deployment evidence.
