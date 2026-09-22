from datetime import datetime, timedelta, timezone
from unittest.mock import Mock

from fastapi import HTTPException

from app import alerts, auth
from app.main import app
from app.models import AlertDelivery, CompanyAlertDelivery, CompanyFollow, Job, SavedSearch


def add_job(db, source, company="Acme", created_at=None):
    job = Job(source_id=source, title="Engineer", company=company,
              url=f"https://example.com/jobs/{source}", created_at=created_at)
    db.add(job)
    db.commit()
    return job


def auth_as(user="user_a"):
    app.dependency_overrides[auth.current_user] = lambda: user


def test_follow_requires_login_and_verified_email(client, db, monkeypatch):
    item = add_job(db, "one")
    assert client.get("/company-follows").status_code == 401
    assert client.post("/company-follows", json={"job_id": item.id}).status_code == 401
    auth_as()
    monkeypatch.setattr("app.routers.company_follows.verified_email", lambda _: (_ for _ in ()).throw(HTTPException(403, "Verify email")))
    assert client.post("/company-follows", json={"job_id": item.id}).status_code == 403
    assert db.query(CompanyFollow).count() == 0


def test_follow_idempotent_ownership_and_reactivation(client, db, monkeypatch):
    item = add_job(db, "one", company=" Acme ")
    other = add_job(db, "two", company="acme")
    auth_as()
    monkeypatch.setattr("app.routers.company_follows.verified_email", lambda _: "person@example.com")
    first = client.post("/company-follows", json={"job_id": item.id})
    assert first.status_code == 200, first.text
    follow_id = first.json()["id"]
    assert client.post("/company-follows", json={"job_id": other.id}).json()["id"] == follow_id
    assert client.get("/company-follows").json()[0]["company_name"] == "acme"
    auth_as("user_b")
    assert client.get("/company-follows").json() == []
    assert client.delete(f"/company-follows/{follow_id}").status_code == 404
    auth_as()
    assert client.delete(f"/company-follows/{follow_id}").status_code == 204
    assert client.get("/company-follows").json() == []
    assert client.post("/company-follows", json={"job_id": item.id}).json()["id"] == follow_id
    assert client.get("/company-follows").json()[0]["is_active"]


def test_company_alert_matches_new_exact_company_and_cooldown(db, monkeypatch):
    follow = CompanyFollow(user_id="user_a", company_name="Acme", company_key="acme",
                           email="person@example.com", followed_at=datetime.now(timezone.utc) - timedelta(hours=1))
    db.add(follow)
    db.commit()
    old = add_job(db, "old", created_at=datetime.now(timezone.utc) - timedelta(days=2))
    match = add_job(db, "match", company=" ACME ")
    add_job(db, "other", company="Acme Labs")
    assert alerts.queue_company_alerts(db) == 1
    assert alerts.queue_company_alerts(db) == 0
    assert db.query(CompanyAlertDelivery).one().job_id == match.id != old.id
    monkeypatch.setattr(alerts, "verified_email", lambda _: "person@example.com")
    monkeypatch.setenv("RESEND_API_KEY", "test")
    response = Mock()
    response.json.return_value = {"id": "email_company"}
    sender = Mock(return_value=response)
    monkeypatch.setattr(alerts.requests, "post", sender)
    assert alerts.deliver_company_pending(db) == 1
    assert alerts.deliver_company_pending(db) == 0
    assert sender.call_args.kwargs["headers"]["Idempotency-Key"].startswith("rozgar-company-alert-")
    assert "New role at Acme" in sender.call_args.kwargs["json"]["subject"]


def test_cross_channel_dedup_and_unfollow_cancels_pending(client, db, monkeypatch):
    item = add_job(db, "one")
    follow = CompanyFollow(user_id="user_a", company_name="Acme", company_key="acme",
                           email="person@example.com", followed_at=datetime.now(timezone.utc) - timedelta(hours=1))
    search = SavedSearch(user_id="user_a", email="person@example.com", keywords="Engineer",
                         filters={}, created_at=datetime.now(timezone.utc) - timedelta(hours=1))
    db.add_all([follow, search])
    db.commit()
    assert alerts.queue_company_alerts(db) == 1
    assert alerts.queue_alerts(db) == 0
    assert db.query(AlertDelivery).count() == 0
    auth_as()
    assert client.delete(f"/company-follows/{follow.id}").status_code == 204
    assert db.query(CompanyAlertDelivery).one().status == "cancelled"
    monkeypatch.setattr(alerts, "verified_email", lambda _: "person@example.com")
    assert alerts.deliver_company_pending(db) == 0
    assert alerts.queue_alerts(db) == 1


def test_unverified_account_cannot_receive_company_alert(db, monkeypatch):
    follow = CompanyFollow(user_id="user_a", company_name="Acme", company_key="acme",
                           email="person@example.com", followed_at=datetime.now(timezone.utc) - timedelta(hours=1))
    db.add(follow)
    db.commit()
    add_job(db, "one")
    alerts.queue_company_alerts(db)
    monkeypatch.setattr(alerts, "verified_email", lambda _: (_ for _ in ()).throw(HTTPException(403, "Unverified")))
    assert alerts.deliver_company_pending(db) == 0
    db.refresh(follow)
    assert not follow.is_active
    assert db.query(CompanyAlertDelivery).one().status == "cancelled"
