# Pakistan location directory

`pakistan_places.txt` is derived from GeoNames' complete Pakistan country extract:
https://download.geonames.org/export/dump/PK.zip (retrieved 2026-09-24).

Attribution: GeoNames, https://www.geonames.org/.
License: Creative Commons Attribution 4.0,
https://creativecommons.org/licenses/by/4.0/.

Transformation: retain country `PK` and feature codes `PPL`, `PPLA`, `PPLA2`,
`PPLA3`, `PPLA4`, `PPLC`, `PPLL`; use ASCII names, deduplicate case-insensitively
and order by descending population then name. This includes cities, towns and
villages (112,490 distinct names), without an arbitrary population cutoff.
Abandoned/historical settlements and city sections are excluded. GeoNames is a
community-maintained gazetteer and cannot guarantee absolute completeness.

The file supports suggestions only. It is not used to infer Pakistan eligibility
from ambiguous city names or to imply that a location has current vacancies.
