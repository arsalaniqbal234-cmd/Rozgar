# Rozgar — Remote Job Listings Platform

A full-stack web app that scrapes remote job listings from RemoteOK and displays them in a clean, searchable interface.

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Neon for production)
- **Scraper:** Python (requests)
- **Deployment:** Vercel (frontend + backend)

## Features
- Scrapes live job data from RemoteOK's public API
- Deduplication — prevents the same job from being added twice
- Real database search (title/company match)
- Job detail endpoint with direct apply links
- API key protection on the scrape endpoint
- Error handling for network/database failures
- Responsive, modern UI

## Project Structure

Rozgar/
├── Backend/ # FastAPI backend
│ ├── app/
│ │ └── main.py # API routes
│ ├── models.py # Database models
│ ├── database.py # DB connection setup
│ └── requirements.txt
└── frontend/ # Next.js frontend
└── src/app/
└── page.tsx

## Setup

### Backend
```bash
cd Backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

Create a `.env` file (see `.env.example` for the required format), then run:
```bash
uvicorn app.main:app --reload
```
Runs on `http://127.0.0.1:8000`

### Frontend
```bash
cd frontend
npm install
```

Create a `.env.local` file:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000


```bash
npm run dev
```
Runs on `http://localhost:3000`

## API Endpoints
- `GET /jobs` — List all jobs
- `GET /jobs/{job_id}` — Get a single job by ID
- `GET /search?keyword=...` — Search jobs by title/company
- `POST /scrape` — Scrape new jobs (requires `x-api-key` header)
- `GET /docs` — Interactive API documentation

## Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SCRAPE_SECRET_KEY` | API key required to trigger `/scrape` |