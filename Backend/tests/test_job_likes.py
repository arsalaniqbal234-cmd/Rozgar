from app import auth
from app.main import app
from app.models import Job


def test_likes_are_shared_and_unique_per_user(client, db):
    job = Job(source_id="remoteok_like_test", title="Engineer", company="Example",
              url="https://example.com/job", is_remote=True)
    db.add(job)
    db.commit()

    path = f"/jobs/{job.id}/like"
    assert client.put(path).status_code == 401
    app.dependency_overrides[auth.current_user] = lambda: "user_one"
    assert client.put(path).json() == {"job_id": job.id, "likes": 1, "is_liked": True}
    assert client.put(path).json()["likes"] == 1

    app.dependency_overrides[auth.current_user] = lambda: "user_two"
    app.dependency_overrides[auth.optional_user] = lambda: "user_two"
    assert client.get("/jobs/likes", params={"ids": job.id}).json() == [
        {"job_id": job.id, "likes": 1, "is_liked": False}]
    assert client.put(path).json()["likes"] == 2
    assert client.delete(path).json() == {"job_id": job.id, "likes": 1, "is_liked": False}

    app.dependency_overrides[auth.optional_user] = lambda: None
    assert client.get("/jobs/likes", params={"ids": job.id}).json()[0]["likes"] == 1
