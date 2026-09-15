import requests

from app.scrapers.base import BaseScraper


class GreenhouseScraper(BaseScraper):
    """Read published remote jobs from a company's public Greenhouse board."""

    def __init__(self, board_token: str, company: str):
        self.board_token = board_token
        self.company = company
        self.source_name = "greenhouse_" + board_token

    def fetch(self):
        response = requests.get(
            f"https://boards-api.greenhouse.io/v1/boards/{self.board_token}/jobs",
            params={"content": "true"}, timeout=(5, 20),
            headers={"User-Agent": "Rozgar/0.8 (public job listings)"},
        )
        response.raise_for_status()
        return response.json()

    def parse(self, raw_data):
        records = []
        for job in raw_data.get("jobs", []):
            if not job.get("id"):
                continue
            location = job.get("location") or {}
            location_name = str(location.get("name") or "") if isinstance(location, dict) else ""
            if not any(word in location_name.casefold() for word in ("remote", "worldwide", "anywhere")):
                continue
            records.append({
                "source_id": f"greenhouse_{self.board_token}_{job.get('id')}",
                "title": job.get("title", ""), "company": self.company,
                "url": job.get("absolute_url", ""), "description": job.get("content") or "",
                "location": location_name, "is_remote": True, "raw_data": job,
            })
        # Bound database work for each serverless invocation; prefer recently updated posts.
        records.sort(key=lambda row: row["raw_data"].get("updated_at") or "", reverse=True)
        return self.normalize(records[:80])
