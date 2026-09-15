from pathlib import Path
import tomllib
import json


def test_vercel_and_pip_install_the_same_runtime_dependencies():
    root = Path(__file__).resolve().parents[1]
    manifest = tomllib.loads((root / "pyproject.toml").read_text())
    requirements = {
        line.strip() for line in (root / "requirements.txt").read_text().splitlines()
        if line.strip() and not line.startswith("#")
    }
    assert set(manifest["project"]["dependencies"]) == requirements
    assert manifest["tool"]["uv"]["package"] is False

    repository_requirements = root.parent / "requirements.txt"
    if repository_requirements.exists():
        root_requirements = {
            line.strip()
            for line in repository_requirements.read_text().splitlines()
            if line.strip() and not line.startswith("#")
        }
        assert root_requirements == requirements


def test_vercel_daily_crons_cover_every_registered_source():
    from app.scrapers import AVAILABLE_SCRAPERS

    root = Path(__file__).resolve().parents[1]
    config = json.loads((root / "vercel.json").read_text())
    paths = [cron["path"] for cron in config["crons"]]
    assert len(paths) == len(set(paths))
    assert set(paths) == {f"/cron/scrape/{source}" for source in AVAILABLE_SCRAPERS} | {"/cron/alerts"}
    assert len(paths) <= 100
    assert all(cron["schedule"].endswith("* * *") for cron in config["crons"])
