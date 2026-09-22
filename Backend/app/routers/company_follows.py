from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import schemas
from app.auth import current_user, verified_email
from app.models import CompanyAlertDelivery, CompanyFollow, Job
from database import get_db

router = APIRouter(prefix="/company-follows", tags=["Company Follows"])
MAX_FOLLOWS = 50


def company_key(name: str) -> str:
    return name.strip().lower()


@router.get("/", response_model=list[schemas.CompanyFollowResponse])
@router.get("", response_model=list[schemas.CompanyFollowResponse], include_in_schema=False)
def list_follows(db: Session = Depends(get_db), user_id: str = Depends(current_user)):
    return db.query(CompanyFollow).filter_by(user_id=user_id, is_active=True).order_by(CompanyFollow.company_name).all()


@router.post("/", response_model=schemas.CompanyFollowResponse)
@router.post("", response_model=schemas.CompanyFollowResponse, include_in_schema=False)
def follow_company(data: schemas.CompanyFollowCreate, db: Session = Depends(get_db),
                   user_id: str = Depends(current_user)):
    job = db.get(Job, data.job_id)
    if job is None or not job.company.strip():
        raise HTTPException(404, "Job or company not found")
    key = company_key(job.company)
    if len(key) > 200:
        raise HTTPException(422, "Company name is too long")
    email = verified_email(user_id)
    # Serialize follows by user to enforce the cap and avoid duplicate inserts.
    db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:key))"), {"key": "company-follows:" + user_id})
    follow = db.query(CompanyFollow).filter_by(user_id=user_id, company_key=key).first()
    if follow is not None:
        if not follow.is_active:
            follow.followed_at = datetime.now(timezone.utc)
            follow.last_notified_at = None
        follow.is_active = True
        follow.email = email
        follow.company_name = job.company.strip()
    else:
        if db.query(CompanyFollow).filter_by(user_id=user_id, is_active=True).count() >= MAX_FOLLOWS:
            raise HTTPException(409, "Company follow limit reached")
        follow = CompanyFollow(user_id=user_id, company_name=job.company.strip(), company_key=key, email=email)
        db.add(follow)
    db.commit()
    db.refresh(follow)
    return follow


@router.delete("/{follow_id}", status_code=204)
def unfollow_company(follow_id: int, db: Session = Depends(get_db),
                     user_id: str = Depends(current_user)):
    follow = db.query(CompanyFollow).filter_by(id=follow_id, user_id=user_id, is_active=True).first()
    if follow is None:
        raise HTTPException(404, "Company follow not found")
    follow.is_active = False
    db.query(CompanyAlertDelivery).filter(
        CompanyAlertDelivery.follow_id == follow.id,
        CompanyAlertDelivery.status.in_(["pending", "retry"]),
    ).update({"status": "cancelled"}, synchronize_session=False)
    db.commit()
