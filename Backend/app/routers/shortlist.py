from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import or_, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.auth import current_user
from app.models import SavedJob
from database import get_db

router = APIRouter(prefix="/shortlist", tags=["shortlist"])


class Identity(BaseModel):
    id: int = Field(gt=0)
    source_id: str = Field(min_length=1, max_length=300)


class Summary(Identity):
    title: str = Field(min_length=1, max_length=300)
    company: str = Field(min_length=1, max_length=300)
    url: HttpUrl = Field(max_length=2048)
    is_remote: bool
    salary: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    location: str | None = Field(default=None, max_length=300)
    salary_currency: str | None = Field(default=None, max_length=50)
    salary_period: str | None = Field(default=None, max_length=50)


class Changes(BaseModel):
    additions: list[Summary] = Field(default_factory=list, max_length=100)
    removals: list[Identity] = Field(default_factory=list, max_length=100)


@router.post("/sync", response_model=list[Summary])
def sync_shortlist(changes: Changes, user_id: str = Depends(current_user), db: Session = Depends(get_db)):
    # Serialize this user's merge and capacity check across tabs/devices.
    db.execute(text("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))"), {"key": "shortlist:" + user_id})
    for item in changes.removals:
        db.query(SavedJob).filter(SavedJob.user_id == user_id, or_(
            SavedJob.job_id == item.id, SavedJob.source_id == item.source_id)).delete(synchronize_session=False)
    for item in changes.additions:
        db.execute(insert(SavedJob).values(user_id=user_id, source_id=item.source_id,
            job_id=item.id, payload=item.model_dump(mode="json")).on_conflict_do_nothing())
    rows = db.query(SavedJob).filter_by(user_id=user_id).order_by(SavedJob.job_id.desc()).all()
    if len(rows) > 100:
        db.rollback()
        raise HTTPException(409, "Your account shortlist holds up to 100 jobs. Guest saves have not been removed.")
    result = [row.payload for row in rows]
    db.commit()
    return result
