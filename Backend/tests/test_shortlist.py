from app import auth
from app.main import app


def summary(job_id=1, source="remoteok_1"):
    return {"id": job_id, "source_id": source, "title": "Engineer", "company": "Example",
            "url": "https://example.com/job", "salary": None, "is_remote": True}


def test_shortlist_auth_merge_deduplication_and_isolation(client):
    assert client.post("/shortlist/sync", json={}).status_code == 401
    app.dependency_overrides[auth.current_user] = lambda: "user_a"
    first = summary()
    second = summary(2, "remoteok_2")
    assert client.post("/shortlist/sync", json={"additions": [first]}).status_code == 200
    response = client.post("/shortlist/sync", json={"additions": [first, second, summary(99)]})
    assert response.headers["Cache-Control"] == "no-store"
    assert {row["id"] for row in response.json()} == {1, 2}
    assert len(client.post("/shortlist/sync", json={"additions": [summary(1, "alias")]}).json()) == 2
    app.dependency_overrides[auth.current_user] = lambda: "user_b"
    assert client.post("/shortlist/sync", json={}).json() == []
    assert client.post("/shortlist/sync", json={"removals": [first]}).json() == []
    app.dependency_overrides[auth.current_user] = lambda: "user_a"
    assert len(client.post("/shortlist/sync", json={}).json()) == 2
    assert [row["id"] for row in client.post("/shortlist/sync", json={"removals": [summary(99)]}).json()] == [2]


def test_shortlist_validation_and_capacity_do_not_erase_saved_jobs(client):
    app.dependency_overrides[auth.current_user] = lambda: "user_a"
    invalid = {**summary(), "url": "javascript:alert(1)"}
    assert client.post("/shortlist/sync", json={"additions": [invalid]}).status_code == 422
    jobs = [summary(i + 1, f"source_{i}") for i in range(100)]
    assert len(client.post("/shortlist/sync", json={"additions": jobs}).json()) == 100
    assert client.post("/shortlist/sync", json={"additions": [summary(101, "extra")]}).status_code == 409
    assert len(client.post("/shortlist/sync", json={}).json()) == 100
