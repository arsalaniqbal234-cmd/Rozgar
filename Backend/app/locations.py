"""Conservative Pakistan matching shared by imports, search and suggestions."""

import re


PAKISTAN_ALIASES = {"pakistan", "pk", "pak"}
# Ambiguous names (Hyderabad, Punjab, Kashmir) need an explicit country.
PAKISTAN_CITIES = (
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Peshawar",
    "Quetta", "Multan", "Sialkot", "Gujranwala", "Bahawalpur", "Sargodha",
    "Sukkur", "Abbottabad", "Sahiwal", "Gujrat", "Jhelum", "Mardan",
    "Muzaffarabad", "Mirpur Khas", "Rahim Yar Khan", "Dera Ghazi Khan",
    "Larkana", "Nawabshah", "Gilgit", "Skardu", "Gwadar", "Wah Cantt", "Taxila",
)
COUNTRY_PATTERN = r"\b(?:pakistan|pk|pak)\b"
# Match a city-only location or a city with a known Pakistan region, not
# e.g. 'Lahore, Virginia, United States'. Keep original multi-location text.
CITY_PATTERN = (
    r"(^|[;/|\u00b7])\s*(?:" + "|".join(PAKISTAN_CITIES) + r")"
    r"(?:\s*,\s*(?:Punjab|Sindh|Balochistan|Khyber Pakhtunkhwa|Islamabad Capital Territory))?"
    r"\s*($|[;/|\u00b7])"
)


def is_pakistan_location(location: str | None, country: str | None = None) -> bool:
    if country and country.strip():
        return country.strip().casefold() in PAKISTAN_ALIASES
    return bool(re.search(COUNTRY_PATTERN, location or "", re.I)
                or re.search(CITY_PATTERN, location or "", re.I))


def normalize_pakistan_location(location: str | None) -> str:
    value = " ".join((location or "").split())
    if not value or value.casefold() in PAKISTAN_ALIASES:
        return "Pakistan"
    if re.search(r"\bpakistan\b", value, re.I):
        return value
    # Expand country codes rather than displaying 'Lahore, PK, Pakistan'.
    if re.search(COUNTRY_PATTERN, value, re.I):
        return re.sub(COUNTRY_PATTERN, "Pakistan", value, flags=re.I)
    return value + ", Pakistan"


def pakistan_location_condition(column):
    from sqlalchemy import or_

    # PostgreSQL spells word boundaries \y; Python spells them \b.
    return or_(column.regexp_match(COUNTRY_PATTERN.replace(r"\b", r"\y"), flags="i"),
               column.regexp_match(CITY_PATTERN, flags="i"))


def suggests_pakistan(query: str) -> bool:
    value = query.strip().casefold()
    return bool(value) and ("pakistan".startswith(value) or value in PAKISTAN_ALIASES)
