# Rozgar — Frontend

Next.js frontend for the Rozgar remote job listings platform.

## Setup

```bash
npm install
```

Create a `.env.local` file:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000


## Run

```bash
npm run dev
```

Runs on `http://localhost:3000`

## Tech Stack
- Next.js
- React
- Tailwind CSS

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and
`npm run test:e2e`. Browser tests cover desktop and phone-sized feed behavior, job
details, and error recovery.

The operations page is `/health`. The backend only returns its data to authenticated
Clerk users listed in `ADMIN_USER_IDS`.
