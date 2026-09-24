"""Offline location suggestions, independent of currently advertised vacancies."""

from functools import lru_cache
from pathlib import Path

from app.locations import PAKISTAN_CITIES, suggests_pakistan


@lru_cache(maxsize=1)
def places():
    # File order prioritizes larger places. Include familiar local spellings from
    # our importer, without using this broad gazetteer to infer job countries.
    names = Path(__file__).with_name("data").joinpath("pakistan_places.txt").read_text(encoding="utf-8").splitlines()
    return {name.casefold(): name for name in dict.fromkeys([*names, *PAKISTAN_CITIES])}


def selected_pakistan_city(query: str) -> str | None:
    city, separator, country = query.strip().rpartition(",")
    if separator and country.strip().casefold() == "pakistan":
        return places().get(city.strip().casefold())
    return None


@lru_cache(maxsize=256)
def pakistan_place_suggestions(query: str, limit: int = 8) -> tuple[str, ...]:
    value = query.strip().casefold()
    if not value:
        return ()
    if suggests_pakistan(value):
        return ("Pakistan",)
    selected = selected_pakistan_city(value)
    if selected:
        return (selected + ", Pakistan",)
    directory = places()
    matches = [directory[value]] if value in directory else []
    # Prefer prefixes to substrings; preserve population ordering in each group.
    for prefix in (True, False):
        for key, name in directory.items():
            if key == value:
                continue
            if (key.startswith(value) if prefix else value in key and not key.startswith(value)):
                matches.append(name)
                if len(matches) >= limit:
                    return tuple(name + ", Pakistan" for name in matches[:limit])
    return tuple(name + ", Pakistan" for name in matches[:limit])
