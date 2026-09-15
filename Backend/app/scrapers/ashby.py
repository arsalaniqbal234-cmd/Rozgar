import hashlib

import requests

from app.scrapers.base import BaseScraper


class AshbyScraper(BaseScraper):
    """Read remote, listed jobs from a company's public Ashby board."""

    def __init__(self, board_token: str, company: str):
        self.board_token = board_token
        self.company = company
        self.source_name = "ashby_" + board_token

    def fetch(self):
        response = requests.get(
            f"https://api.ashbyhq.com/posting-api/job-board/{self.board_token}",
            params={"includeCompensation": "true"}, timeout=(5, 20),
            headers={"User-Agent": "Rozgar/0.8 (public job listings)"},
        )
        response.raise_for_status()
        return response.json()

    def parse(self, raw_data):
        records = []
        for job in raw_data.get("jobs", []):
            if job.get("isRemote") is not True or job.get("isListed", True) is not True:
                continue
            url = job.get("applyUrl") or job.get("jobUrl") or ""
            identifier = hashlib.sha256(url.encode()).hexdigest()[:24]
            location = job.get("location") or ""
            salary = None
            compensation = job.get("compensation") or {}
            for part in compensation.get("summaryComponents") or []:
                if (part.get("compensationType") == "Salary" and part.get("currencyCode") == "USD"
                    and part.get("interval") == "1 YEAR"):
                    value = part.get("minValue")
                    if isinstance(value, (int, float)) and 0 < value < 2_147_483_647:
                        salary = int(value)
                    break
            records.append({
                "source_id": f"ashby_{self.board_token}_{identifier}",
                "title": job.get("title", ""), "company": self.company, "url": url,
                "description": job.get("descriptionHtml") or "",
                "location": "Remote" + (" · " + location if location else ""),
                "is_remote": True, "raw_data": job,
                "salary": salary, "salary_currency": "USD" if salary else None,
                "salary_period": "annual" if salary else None,
            })
        records.sort(key=lambda row: row["raw_data"].get("publishedAt") or "", reverse=True)
        return self.normalize(records[:80])
