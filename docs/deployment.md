# Deploy Rozgar from one GitHub repository

`arsalaniqbal234-cmd/Rozgar` is the source for both applications. Keep two Vercel
projects: the Next.js website and the Python API have different build roots,
environment variables, and public domains. Both existing projects now track
`Rozgar` on the `main` branch.

| Existing Vercel project | GitHub repository | Root Directory | Public address |
| --- | --- | --- | --- |
| `codeaza1/jobsi` | `arsalaniqbal234-cmd/Rozgar` | `Frontend` | https://jobsi-ten.vercel.app |
| `codeaza1/jobs` | `arsalaniqbal234-cmd/Rozgar` | `Backend` | https://jobs-codeaza1.vercel.app |

The folder names are case-sensitive on Vercel. `Frontend/package.json` and
`Frontend/next.config.ts` belong to the Next.js project. `Backend/vercel.json`
and `Backend/pyproject.toml` belong to the Python project. Vercel's project-level
environment settings and domains stay with the same projects when their Git
connections change. The backend needs `DATABASE_URL`; the frontend needs a plain
`NEXT_PUBLIC_API_URL=https://jobs-codeaza1.vercel.app`. Both projects have matching
Clerk development-instance settings for the currently verified sign-in flow.
The frontend rewrites `/api/jobs`, `/api/saved-searches`, and `/api/health` to
that backend URL. Browser requests stay on the website's origin, so temporary
Vercel deployment URLs do not require separate entries in backend `CORS_ORIGINS`.
The direct public API still uses CORS for callers on other origins.

## Normal release

Run Git commands from the **Rozgar repository root**, including when you change
only one app. A push to root `main` now triggers the Vercel projects connected to
that repository. You no longer need matching commits in `jobfrontend` and
`jobbackend`.

```powershell
git status
git add -- Frontend Backend docs README.md
git commit -m "feat: describe the finished change"
git push origin main
```

Stage only the paths you actually changed; the `git add` line is an example.
The root CI workflow checks both apps. Check the frontend and backend deployment
statuses in Vercel after pushing. Both projects have the **Skip deployment when
root and dependencies are unchanged** switch disabled in Settings > Build and
Deployment > Root Directory. This repository mixes Python and JavaScript without
a supported JavaScript workspace, so a root push should build both projects.
This also makes documentation-only pushes useful as deployment checks; each push
will consume a build for both apps.

## Release checks

Check `GET /health/live`, `GET /health/ready`, and
`GET /jobs?summary=true&limit=1` on the API. Then open the website, search for a
real job, open its details, and confirm a shortlisted job survives a reload.
Also open the newest deployment URL in a browser and confirm the job feed loads;
its network requests should be to the same-origin `/api/jobs` path. Older
deployment URLs are immutable snapshots and retain the code they were built with.
When authentication settings change, also verify sign-in and owned saved-search
create/list/delete with a test account. A green GitHub check does not verify the
public domains by itself.

Email alerts are currently paused. They need production Clerk keys, a Resend API
key, a verified sender, and a running scheduler before public delivery
can be enabled. The backend project now registers protected Vercel Cron GET routes
for each of its 52 sources and one alert pass. Vercel Hobby invokes each route at
most daily, with imprecise timing; it cannot meet the roadmap's prompt-alert goal.
Use the existing Docker/Codeaza scheduler process for frequent source and alert
checks once that host is available. After those services work, set
`NEXT_PUBLIC_EMAIL_ALERTS_ENABLED=true` on the frontend project and rebuild it.
The API deployment on Vercel does not start the always-on APScheduler process.
Redis server caching is likewise optional and currently disabled; browser caching
and summary responses still work.

## Existing repositories and rollback

The former `jobfrontend` and `jobbackend` GitHub repositories remain available as
history and rollback sources. Their local `.git` directories are preserved in
the ignored `.git-archives` folder, so Git commands inside `Frontend` or `Backend`
now resolve to the combined root repository. Do not publish routine changes to
the former repositories.

Vercel keeps previous successful deployments for each existing project. If a new
build fails, inspect its logs; if a new release reaches production but fails live
checks, use that project's previous successful deployment for rollback. The
projects' domains and environment variables remain with the projects. The
former Git repositories can be reconnected from Project Settings > Git if the
Git-source migration itself must be reversed; restore each project's previous
Root Directory setting at the same time.

Vercel's [monorepo guide](https://vercel.com/docs/monorepos) describes the
two-project, one-repository layout. Its [GitHub guide](https://vercel.com/docs/git/vercel-for-github)
explains changing an existing project's Git repository, and its
[build guide](https://vercel.com/docs/builds/configure-a-build) explains Root Directory.
