from contextlib import nullcontext
from unittest.mock import MagicMock, Mock

import pytest

from app import crud, pipeline
from app.locations import is_pakistan_location, normalize_pakistan_location
from app.models import Job, JobSource
from app.scrapers import PAKISTAN_SOURCES
from app.scrapers.base import NormalizedJob
from app.scrapers.pakistan import PakistanGreenhouseScraper, PakistanLeverScraper, PakistanWorkableScraper


@pytest.mark.parametrize("location,country,expected", [
    ("Karachi, Pakistan", None, True), ("Lahore", None, True),
    ("Islamabad", None, True), ("Remote - PK", None, True),
    ("Hyderabad", None, False), ("Hyderabad", "PK", True),
    ("Hyderabad, India", "IN", False), ("Punjab", None, False),
    ("Lahore, Virginia, United States", None, False),
    ("Lahore", "US", False), ("Worldwide", None, False),
    ("Remote", None, False), ("Pakistan", None, True),
    ("Pakistanis worldwide", None, False), (None, None, False),
    ("Islamabad; Lahore", None, True), ("Lahore, Punjab", None, True),
])
def test_pakistan_location_matching(location, country, expected):
    assert is_pakistan_location(location, country) is expected


def test_normalize_country_without_inventing_a_city():
    assert normalize_pakistan_location(" PK ") == "Pakistan"
    assert normalize_pakistan_location("Lahore, PK") == "Lahore, Pakistan"
    assert normalize_pakistan_location("Lahore") == "Lahore, Pakistan"
    assert normalize_pakistan_location("Karachi, Pakistan") == "Karachi, Pakistan"


def greenhouse_job(identifier, location, **kwargs):
    return {"id": identifier, "title": "Engineer", "location": {"name": location},
            "absolute_url": f"https://example.com/jobs/{identifier}", **kwargs}


def test_greenhouse_imports_all_pakistan_jobs_including_onsite():
    scraper = PakistanGreenhouseScraper("example", "Example")
    raw = [greenhouse_job(i, "Lahore") for i in range(1, 91)]
    raw += [greenhouse_job(91, "Pakistan - Remote", content="&lt;p&gt;Build&lt;/p&gt;"),
            greenhouse_job(92, "Remote - US"), greenhouse_job(93, "Worldwide"),
            greenhouse_job(94, "Karachi", title=""), {"id": 95}]
    jobs = scraper.parse({"jobs": raw})
    assert len(jobs) == 91  # No inherited 80-job cap.
    assert jobs[0].location == "Lahore, Pakistan" and not jobs[0].is_remote
    assert jobs[-1].is_remote and jobs[-1].description == "<p>Build</p>"


def test_lever_uses_country_and_preserves_description_sections():
    base = {"id": "one", "text": "Developer", "hostedUrl": "https://jobs.lever.co/example/one",
            "categories": {"location": "Hyderabad"}, "country": "PK", "workplaceType": "hybrid",
            "description": "<p>Intro</p>", "lists": [{"text": "Requirements", "content": "<li>Python</li>"}],
            "additional": "<p>Benefits</p>"}
    jobs = PakistanLeverScraper("example", "Example").parse([
        base, {**base, "id": "india", "country": "IN"},
        {**base, "id": "world", "country": None, "categories": {"location": "Worldwide"}},
    ])
    assert len(jobs) == 1 and jobs[0].location == "Hyderabad, Pakistan"
    assert not jobs[0].is_remote
    assert all(part in jobs[0].description for part in ("Intro", "Requirements", "Python", "Benefits"))
    foreign = {**base, "country": "US", "categories": {"location": "Lahore", "allLocations": ["Lahore"]}}
    assert PakistanLeverScraper("example", "Example").parse([foreign]) == []


def test_workable_filters_each_location_and_retains_full_description():
    base = {"shortcode": "one", "title": "Analyst", "url": "https://apply.workable.com/j/one",
            "locations": [{"city": "Hyderabad", "countryCode": "IN"},
                          {"city": "Karachi", "region": "Sindh", "countryCode": "PK"}],
            "telecommuting": True, "description": "Intro", "requirements": "Skills", "benefits": "Benefits"}
    jobs = PakistanWorkableScraper("example", "Example").parse({"jobs": [
        base, {**base, "shortcode": "foreign", "locations": [{"city": "Hyderabad", "countryCode": "IN"}]},
        {**base, "shortcode": "hidden", "locations": [{"countryCode": "PK", "hidden": True}]},
    ]})
    assert len(jobs) == 1 and jobs[0].location == "Karachi, Sindh, Pakistan"
    assert jobs[0].is_remote and "Skills" in jobs[0].description


def test_workable_merges_repeated_shortcode_across_cities():
    base = {"shortcode": "one", "title": "Analyst", "url": "https://apply.workable.com/j/one"}
    jobs = PakistanWorkableScraper("example", "Example").parse({"jobs": [
        {**base, "country": "Pakistan", "city": city} for city in ["Lahore", "Karachi", "Lahore"]
    ]})
    assert len(jobs) == 1
    assert jobs[0].location == "Lahore, Pakistan; Karachi, Pakistan"
    assert len(jobs[0].raw_data["location_variants"]) == 3


@pytest.mark.parametrize("adapter", [PakistanGreenhouseScraper, PakistanLeverScraper, PakistanWorkableScraper])
def test_invalid_source_payload_is_a_failure(adapter):
    with pytest.raises(ValueError):
        adapter("example", "Example").parse({"error": "unavailable"})


@pytest.mark.parametrize("payload,expected_status", [
    ({"jobs": []}, "ok"),
    ({"jobs": [greenhouse_job(1, "Dubai")]}, "ok"),
    ({"error": "unavailable"}, "failed"),
])
def test_pipeline_empty_results_and_invalid_payloads(payload, expected_status, monkeypatch):
    session = MagicMock()
    session.__enter__.return_value = session
    session.get.side_effect = lambda *args: session.add.call_args.args[0]
    monkeypatch.setattr(pipeline, "SessionLocal", lambda: session)
    monkeypatch.setattr(pipeline, "pipeline_lock", lambda _: nullcontext(True))
    monkeypatch.setattr(PakistanGreenhouseScraper, "fetch_with_retry", lambda _: payload)
    upsert, invalidate, report, alerts = Mock(), Mock(), Mock(), Mock()
    monkeypatch.setattr(pipeline.crud, "upsert_jobs", upsert)
    monkeypatch.setattr(pipeline.cache, "invalidate_jobs", invalidate)
    monkeypatch.setattr(pipeline, "report_failure", report)
    monkeypatch.setattr(pipeline, "run_alert_engine", alerts)

    result = pipeline.scrape_source("greenhouse_careem", send_alerts=False)

    run = session.add.call_args.args[0]
    assert result["status"] == run.status == expected_status
    assert run.finished_at is not None and run.duration_ms >= 0
    if expected_status == "ok":
        assert result == {"status": "ok", "added": 0, "skipped": 0}
        assert (run.fetched, run.added, run.skipped) == (0, 0, 0)
        assert run.error_code is None
        report.assert_not_called()
        session.rollback.assert_not_called()
    else:
        assert result["error"] == run.error_code == "ValueError"
        report.assert_called_once()
        session.rollback.assert_called_once()
    upsert.assert_not_called()
    invalidate.assert_not_called()
    alerts.assert_not_called()


@pytest.mark.parametrize("source,company", [
    ("greenhouse_gomotive", "Motive"),
    ("workable_pakistan-mobile-communication-limited-pmcl", "JazzWorld"),
    ("workable_inbox-business-technologies", "Inbox Business Technologies"),
    ("workable_joinbeam", "Beam AI"),
    ("workable_thingtrax", "ThingTrax"),
    ("workable_flatgigs", "Flatgigs"),
    ("workable_opperate", "Opperate"),
    ("workable_surglobal", "Sur"),
    ("workable_virtuestaff", "VirtueStaff"),
    ("workable_volga-partners", "Volga Partners"),
    ("greenhouse_nysonian", "Nysonian"),
    ("greenhouse_flipdish", "Flipdish"),
    ("greenhouse_knowledgecity", "KnowledgeCity"),
    ("workable_creativechaos", "Creative Chaos"),
    ("workable_codeninjapk", "CodeNinja"),
    ("workable_bayutdubizzle", "Bayut | dubizzle"),
    ("workable_jeeny", "Jeeny"),
    ("workable_remotebase", "Remotebase"),
    ("workable_pavago", "Pavago"),
    ("workable_autoleap", "AutoLeap"),
])
def test_new_sources_fetch_correct_board_and_only_import_pakistan(source, company, monkeypatch):
    monkeypatch.setattr("app.scrapers.base.time.sleep", lambda _: None)
    provider, token = source.split("_", 1)
    response = Mock()
    if provider == "greenhouse":
        response.json.return_value = {"jobs": [
            greenhouse_job(1, "Lahore"), greenhouse_job(2, "Dubai"),
            greenhouse_job(3, "Worldwide"),
        ]}
        endpoint = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs"
        params = {"content": "true"}
    else:
        response.json.return_value = {"jobs": [
            {"shortcode": str(i), "title": "Engineer", "country": country, "city": city,
             "url": f"https://apply.workable.com/j/{i}", "description": "Build software"}
            for i, country, city in [(1, "Pakistan", "Lahore"), (2, "UAE", "Dubai"), (3, "", "")]
        ]}
        endpoint = f"https://www.workable.com/api/accounts/{token}"
        params = {"details": "true"}
    get = Mock(return_value=response)
    monkeypatch.setattr("requests.get", get)
    scraper = pipeline.AVAILABLE_SCRAPERS[source]()
    jobs = scraper.run()
    get.assert_called_once_with(endpoint, params=params, timeout=(5, 20),
                                headers={"User-Agent": "Rozgar/0.8 (public job listings)"})
    response.raise_for_status.assert_called_once()
    assert scraper.refresh_existing is True
    assert scraper.source_name == source
    assert len(jobs) == 1
    assert jobs[0].source_id == f"{source}_1"
    assert jobs[0].company == company
    assert jobs[0].location == "Lahore, Pakistan"


def store(db, identifier, location, **kwargs):
    record = NormalizedJob(source_id=identifier, title="Engineer", company="Example",
                           url=f"https://example.com/{identifier}", location=location, **kwargs).to_dict()
    crud.upsert_jobs(db, [record])
    db.commit()
    return record


def test_pakistan_search_and_suggestions_include_legacy_city_only_jobs(client, db):
    for identifier, location in [("lahore", "Lahore"), ("karachi", "Karachi, Pakistan"),
                                 ("islamabad", "Islamabad"), ("india", "Hyderabad, India"),
                                 ("world", "Worldwide"), ("us", "Lahore, Virginia, United States")]:
        store(db, identifier, location)
    for query in ["Pakistan", " pakistan ", "PK", "pak"]:
        response = client.get("/jobs", params={"location": query, "summary": True})
        assert response.status_code == 200
        assert {job["source_id"] for job in response.json()} == {"lahore", "karachi", "islamabad"}
    for query in ["pak", "Pakistan", "pAkI", "pk"]:
        suggestions = client.get("/jobs/suggestions", params={"field": "location", "q": query}).json()
        assert suggestions[0] == "Pakistan"
        assert "Lahore" in suggestions and "Hyderabad, India" not in suggestions
    assert len(client.get("/jobs", params={"location": "Lahore"}).json()) == 2
    assert client.get("/jobs", params={"location": "%"}).json() == []
    assert client.get("/jobs", params={"location": "Pakistan", "remote_only": True}).json() == []


def test_pakistan_locations_are_available_without_listings(client):
    for query, expected in [("Pakistan", "Pakistan"), ("rawalpindi", "Rawalpindi, Pakistan"),
                            ("hyderabad", "Hyderabad, Pakistan"), ("gwadar", "Gwadar, Pakistan"),
                            ("skardu", "Skardu, Pakistan"), ("sahiwal", "Sahiwal, Pakistan")]:
        values = client.get("/jobs/suggestions", params={"field": "location", "q": query}).json()
        assert values[0] == expected
        assert len(values) <= 8
    assert client.get("/jobs", params={"location": "Rawalpindi, Pakistan"}).json() == []


def test_selected_catalog_city_matches_region_and_multiple_locations(client, db):
    store(db, "rawalpindi", "Rawalpindi, Punjab, Pakistan")
    store(db, "multi", "Islamabad, Pakistan; Rawalpindi, Pakistan")
    store(db, "legacy", "Rawalpindi")
    store(db, "foreign", "Hyderabad, India")
    rows = client.get("/jobs", params={"location": "Rawalpindi, Pakistan"}).json()
    assert {row["source_id"] for row in rows} == {"rawalpindi", "multi", "legacy"}
    assert client.get("/jobs", params={"location": "Hyderabad, Pakistan"}).json() == []


def test_repeat_import_updates_owned_job_without_duplicates(db):
    record = store(db, "greenhouse_careem_1", "Lahore")
    before = db.query(Job).one()
    identifier, created = before.id, before.created_at
    changed = {**record, "location": "Lahore, Pakistan", "title": "Senior Engineer", "raw_data": {"updated": True}}
    assert crud.upsert_jobs(db, [changed], refresh_existing=True) == 0
    db.commit()
    db.expire_all()
    after = db.query(Job).one()
    assert (after.id, after.created_at) == (identifier, created)
    assert after.location == "Lahore, Pakistan" and after.title == "Senior Engineer"
    assert db.query(JobSource).one().raw_data == {"updated": True}
    assert crud.upsert_jobs(db, [{**changed, "source_id": "another_1", "title": "Wrong"}], refresh_existing=True) == 0
    db.commit()
    db.expire_all()
    assert db.query(Job).one().title == "Senior Engineer"
    assert db.query(JobSource).count() == 2


def test_pipeline_stores_pakistan_jobs_and_import_does_not_send_alerts(client, db, monkeypatch):
    monkeypatch.setattr("app.scrapers.base.time.sleep", lambda _: None)
    response = Mock()
    response.json.return_value = {"jobs": [greenhouse_job(1, "Lahore"), greenhouse_job(2, "Dubai")]}
    monkeypatch.setattr("requests.get", Mock(return_value=response))
    alerts = Mock(side_effect=AssertionError("Initial import must not send email"))
    monkeypatch.setattr(pipeline, "run_alert_engine", alerts)
    assert pipeline.scrape_source("greenhouse_careem", send_alerts=False)["added"] == 1
    assert pipeline.scrape_source("greenhouse_careem", send_alerts=False)["added"] == 0
    rows = client.get("/jobs", params={"location": "Pakistan"}).json()
    assert len(rows) == 1 and rows[0]["company"] == "Careem"
    assert rows[0]["location"] == "Lahore, Pakistan"
    assert not rows[0]["is_remote"]
    alerts.assert_not_called()
    assert len(PAKISTAN_SOURCES) == 25
