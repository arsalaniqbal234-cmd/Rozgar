import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.config import origins
from app.observability import report_failure, setup_monitoring
from app.routers import company_follows, health, jobs, saved_searches, shortlist

setup_monitoring()
app = FastAPI(title="Rozgar API", version="0.8.0")
app.add_middleware(
    CORSMiddleware, allow_origins=origins(), allow_credentials=True,
    allow_origin_regex=r"^https://jobsi(?:-[a-z0-9-]+)?-codeaza1\.vercel\.app$",
    allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type", "X-API-Key"],
    expose_headers=["X-Cache", "Server-Timing", "X-Request-ID"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = uuid.uuid4().hex
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as error:
        report_failure("api", error)
        response = JSONResponse(status_code=500, content={
            "detail": "Something went wrong. Please try again.", "request_id": request_id,
        })
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Response-Time-Ms"] = f"{(time.perf_counter()-start)*1000:.2f}"
    if request.url.path.startswith(("/saved-searches", "/company-follows", "/shortlist", "/health")) or request.url.path == "/jobs/likes" or request.url.path.endswith("/like"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/")
def home():
    return {"message": "Rozgar API running"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


app.include_router(jobs.router)
app.include_router(saved_searches.router)
app.include_router(shortlist.router)
app.include_router(company_follows.router)
app.include_router(health.router)
