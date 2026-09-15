from functools import partial

from .arbeitnow import ArbeitnowScraper
from .ashby import AshbyScraper
from .boards import BOARDS
from .greenhouse import GreenhouseScraper
from .jobicy import JobicyScraper
from .remoteok import RemoteOKScraper

AVAILABLE_SCRAPERS = {
    "remoteok": RemoteOKScraper,
    "arbeitnow": ArbeitnowScraper,
    "jobicy": JobicyScraper,
}

ADAPTERS = {"greenhouse": GreenhouseScraper, "ashby": AshbyScraper}
for provider, token, company in BOARDS:
    AVAILABLE_SCRAPERS[f"{provider}_{token}"] = partial(ADAPTERS[provider], token, company)
