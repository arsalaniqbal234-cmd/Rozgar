from functools import partial

from .arbeitnow import ArbeitnowScraper
from .ashby import AshbyScraper
from .boards import BOARDS
from .greenhouse import GreenhouseScraper
from .jobicy import JobicyScraper
from .remoteok import RemoteOKScraper
from .pakistan import PAKISTAN_BOARDS

AVAILABLE_SCRAPERS = {
    "remoteok": RemoteOKScraper,
    "arbeitnow": ArbeitnowScraper,
    "jobicy": JobicyScraper,
}

ADAPTERS = {"greenhouse": GreenhouseScraper, "ashby": AshbyScraper}
for provider, token, company in BOARDS:
    AVAILABLE_SCRAPERS[f"{provider}_{token}"] = partial(ADAPTERS[provider], token, company)

PAKISTAN_SOURCES = {}
for adapter, token, company in PAKISTAN_BOARDS:
    source = adapter(token, company).source_name
    PAKISTAN_SOURCES[source] = partial(adapter, token, company)
AVAILABLE_SCRAPERS.update(PAKISTAN_SOURCES)
