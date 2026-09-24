"""Run with python -m app.import_pakistan [--dry-run]. Never sends emails."""

import argparse
import json

from app.scrapers import PAKISTAN_SOURCES


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Fetch and validate without writing to the database")
    args = parser.parse_args()
    failed = False
    for source, adapter in PAKISTAN_SOURCES.items():
        if args.dry_run:
            try:
                jobs = adapter().run()
                result = {"status": "ok", "fetched": len(jobs),
                          "locations": sorted({job.location for job in jobs})}
            except Exception as error:
                result = {"status": "failed", "error": type(error).__name__}
        else:
            from app.pipeline import scrape_source
            result = scrape_source(source, send_alerts=False)
        print(json.dumps({"source": source, **result}), flush=True)
        failed |= result["status"] != "ok"
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())
