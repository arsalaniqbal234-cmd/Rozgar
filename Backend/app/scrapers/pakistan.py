"""Pakistan vacancies from employers' public, published-job feeds.

These adapters deliberately do not treat worldwide/unspecified remote jobs as
Pakistan vacancies. All published matches are imported, without a top-N cutoff.
"""

from html import escape, unescape

import requests

from app.locations import is_pakistan_location, normalize_pakistan_location
from app.scrapers.base import BaseScraper
from app.scrapers.greenhouse import GreenhouseScraper


class PakistanGreenhouseScraper(GreenhouseScraper):
    refresh_existing = True

    def parse(self, raw_data):
        if not isinstance(raw_data, dict) or not isinstance(raw_data.get("jobs"), list):
            raise ValueError("Invalid Greenhouse jobs response")
        records = []
        for job in raw_data["jobs"]:
            if not isinstance(job, dict) or not job.get("id"):
                continue
            location = job.get("location") or {}
            name = location.get("name", "") if isinstance(location, dict) else ""
            if not is_pakistan_location(name):
                continue
            records.append({
                "source_id": f"greenhouse_{self.board_token}_{job['id']}",
                "title": job.get("title") or "", "company": self.company,
                "url": job.get("absolute_url") or "",
                "description": unescape(job.get("content") or ""),
                "location": normalize_pakistan_location(name),
                "is_remote": "remote" in name.casefold(), "raw_data": job,
            })
        return self.normalize(records)


class PakistanLeverScraper(BaseScraper):
    refresh_existing = True

    def __init__(self, board_token: str, company: str):
        self.board_token, self.company = board_token, company
        self.source_name = "lever_" + board_token

    def fetch(self):
        response = requests.get(
            f"https://api.lever.co/v0/postings/{self.board_token}",
            params={"mode": "json"}, timeout=(5, 20),
            headers={"User-Agent": "Rozgar/0.8 (public job listings)"},
        )
        response.raise_for_status()
        return response.json()

    def parse(self, raw_data):
        if not isinstance(raw_data, list):
            raise ValueError("Invalid Lever jobs response")
        records = []
        for job in raw_data:
            if not isinstance(job, dict) or not job.get("id"):
                continue
            categories = job.get("categories") or {}
            name = categories.get("location") or ""
            locations = categories.get("allLocations") or [name]
            pakistan = [value for value in locations if is_pakistan_location(
                value, job.get("country") if value == name else None,
            )]
            if not pakistan and not is_pakistan_location(name, job.get("country")):
                continue
            description = job.get("description") or ""
            for section in job.get("lists") or []:
                description += "<h3>" + escape(section.get("text") or "") + "</h3>"
                description += "<ul>" + (section.get("content") or "") + "</ul>"
            description += job.get("additional") or ""
            records.append({
                "source_id": f"lever_{self.board_token}_{job['id']}",
                "title": job.get("text") or "", "company": self.company,
                "url": job.get("hostedUrl") or job.get("applyUrl") or "",
                "description": description,
                "location": normalize_pakistan_location("; ".join(pakistan) if pakistan else name),
                "is_remote": job.get("workplaceType") == "remote", "raw_data": job,
            })
        return self.normalize(records)


class PakistanWorkableScraper(BaseScraper):
    refresh_existing = True

    def __init__(self, board_token: str, company: str):
        self.board_token, self.company = board_token, company
        self.source_name = "workable_" + board_token

    def fetch(self):
        response = requests.get(
            f"https://www.workable.com/api/accounts/{self.board_token}",
            params={"details": "true"}, timeout=(5, 20),
            headers={"User-Agent": "Rozgar/0.8 (public job listings)"},
        )
        response.raise_for_status()
        return response.json()

    def parse(self, raw_data):
        if not isinstance(raw_data, dict) or not isinstance(raw_data.get("jobs"), list):
            raise ValueError("Invalid Workable jobs response")
        records = []
        for job in raw_data["jobs"]:
            if not isinstance(job, dict) or not job.get("shortcode"):
                continue
            locations = job.get("locations") or [{
                "country": job.get("country"), "city": job.get("city"), "region": job.get("state"),
            }]
            names = []
            for location in locations:
                if not isinstance(location, dict) or location.get("hidden"):
                    continue
                country = location.get("countryCode") or location.get("country")
                if not is_pakistan_location(location.get("city"), country):
                    continue
                name = ", ".join(value for value in [location.get("city"), location.get("region")] if value)
                names.append(normalize_pakistan_location(name))
            if not names:
                continue
            description = job.get("description") or ""
            for key in ("requirements", "benefits"):
                if job.get(key):
                    description += f"<h3>{key.title()}</h3>" + job[key]
            records.append({
                "source_id": f"workable_{self.board_token}_{job['shortcode']}",
                "title": job.get("title") or "", "company": self.company,
                "url": job.get("url") or job.get("application_url") or "",
                "description": description, "location": "; ".join(dict.fromkeys(names)),
                "is_remote": job.get("telecommuting") is True, "raw_data": job,
            })
        # Workable can repeat one shortcode once per city. Merge the locations
        # before upserting, otherwise the last city silently overwrites the rest.
        merged = {}
        for record in records:
            previous = merged.get(record["source_id"])
            if previous is None:
                merged[record["source_id"]] = record
                continue
            names = previous["location"].split("; ") + record["location"].split("; ")
            previous["location"] = "; ".join(dict.fromkeys(names))
            variants = previous["raw_data"].get("location_variants", [previous["raw_data"]])
            previous["raw_data"] = {"location_variants": [*variants, record["raw_data"]]}
        return self.normalize(list(merged.values()))


# Validated against the public feeds on 2026-09-24. Expand only after checking
# the live endpoint and location fields; this is not a claim of nationwide completeness.
PAKISTAN_BOARDS = (
    (PakistanGreenhouseScraper, "careem", "Careem"),
    (PakistanGreenhouseScraper, "joblogic", "Joblogic"),
    (PakistanLeverScraper, "educative", "Educative"),
    (PakistanWorkableScraper, "devsinc-17", "Devsinc"),
    (PakistanWorkableScraper, "pakistan-single-window", "Pakistan Single Window"),
)
