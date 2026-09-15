# Source expansion: configured count versus live reliability

The registry in `Backend/app/scrapers/boards.py` contains 38 Greenhouse and 11 Ashby
company boards. Together with RemoteOK, Arbeitnow, and Jobicy, the backend tracks
52 distinct sites. Board tokens are data; the provider adapters in `greenhouse.py`
and `ashby.py` normalize each site's published remote jobs into the existing job
contract. This is 52 sites, **not** 52 independently written scraper parsers.

On 2026-09-15 each registered employer board returned at least one remote-labelled,
published posting through its provider's public GET endpoint. The boards are
candidate sources that can later close jobs, change names, or reject a request;
the protected `/health` page records actual `ok`, `failed`, `stale`, and `never_run`
statuses rather than assuming a registered source is healthy. The provider APIs
are documented by [Greenhouse](https://docs.greenhouse.io/job-board.html) and
[Ashby](https://developers.ashbyhq.com/docs/public-job-posting-api).

Each source fetches public board data with a request delay/retry policy and stores
at most 80 recently updated remote listings per run. This bounds PostgreSQL work
inside a Vercel Function. A real `greenhouse_remotecom` run on the isolated test
PostgreSQL added 80 rows in 8.31 seconds, with email disabled; both new adapters
also normalized their live provider responses. CI checks that all registry keys
have protected Vercel Cron paths. These checks do **not** prove 52 production jobs
ran successfully for days or that every job is open to residents of Pakistan.
Location text is shown to users, and employer eligibility must be read on the
original application page.

`Backend/vercel.json` schedules one GET route per source daily plus an alert pass.
All require the existing `CRON_SECRET` bearer token. Source runs are spread across
UTC hours 00–17; the alert pass is scheduled at 20:00 UTC. On Vercel Hobby the
[cron limit](https://vercel.com/docs/cron-jobs/usage-and-pricing) is once per day,
and invocation may occur anywhere in the scheduled hour. This is an autonomous
daily ingest path, not a near-real-time alert worker. The Docker Compose
`scheduler` service remains the path to frequent runs on an always-on Codeaza host.
Until that host and email provider are active, user-facing email alerts stay paused.

## Production acceptance for the source-count milestone

1. Confirm the backend Vercel deployment is Ready and all 53 Cron Jobs appear in
   Project Settings > Cron Jobs; `CRON_SECRET` must target Production.
2. After the first daily cycle, sign in as an `ADMIN_USER_IDS` account and inspect
   `/health`. Count source statuses from real `scrape_runs`; investigate any
   `never_run`, `failed`, `stale`, or `stalled` source rather than counting it healthy.
3. Repeat for at least several cycles. Measure successful run rate, new jobs,
   failed sources, and maximum source age. Test two source URLs and application
   links from the public website.
4. If a source takes near the Vercel Function duration limit or returns too many
   posts, move that source to the always-on worker or split work. Do not silently
   remove failures from the source count.

Blocked/anti-bot sites were deliberately not bypassed. The lead's browser-automation
exercise and Codeaza-hosted worker still require an approved list and host access.
