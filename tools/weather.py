#!/usr/bin/env python3
"""Look up the weather we actually had on each trip and save it into the trip's JSON.

Uses Open-Meteo's free historical archive (no key needed):
https://open-meteo.com/en/docs/historical-weather-api

For every place in SPOTS it fetches the daily high, low and rain for our dates there, then
stores a short summary under "weather" in content/itineraries/<slug>.json. tools/build.py turns
that into the "What to wear" section on the trip page. The build itself never goes online.

Run it when you add a trip (add the trip's places to SPOTS first):
    python3 tools/weather.py            # every trip in SPOTS
    python3 tools/weather.py italy-2026 # just one trip
"""
from __future__ import annotations

import datetime as dt
import json
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "itineraries"
API = "https://archive-api.open-meteo.com/v1/archive"

# slug -> list of (place shown on the page, latitude, longitude, [(first day, last day), ...])
SPOTS: dict[str, list[tuple[str, float, float, list[tuple[str, str]]]]] = {
    "barcelona-mallorca-2026": [
        ("Barcelona", 41.3851, 2.1734, [("2026-07-02", "2026-07-03"), ("2026-07-09", "2026-07-10")]),
        ("Camp de Mar, Mallorca", 39.5378, 2.4227, [("2026-07-04", "2026-07-08")]),
    ],
    "italy-2026": [
        ("Florence, Pisa & Lucca", 43.7696, 11.2558, [("2026-04-03", "2026-04-06"), ("2026-04-11", "2026-04-12")]),
        ("Rome", 41.9028, 12.4964, [("2026-04-07", "2026-04-07")]),
        ("Venice & the Prosecco Hills", 45.4408, 12.3155, [("2026-04-08", "2026-04-10")]),
    ],
    "las-vegas-2026": [
        ("Las Vegas & Valley of Fire", 36.1147, -115.1728, [("2026-01-30", "2026-02-02")]),
    ],
    "california-coast-2025": [
        ("Carmel, Cambria & Monterey", 36.6002, -121.8947, [("2025-07-24", "2025-07-30")]),
        ("Half Moon Bay & Muir Woods", 37.4636, -122.4286, [("2025-07-31", "2025-08-02")]),
        ("Calistoga & Napa", 38.5788, -122.5797, [("2025-08-03", "2025-08-04"), ("2025-08-07", "2025-08-07")]),
        ("Mendocino", 39.3077, -123.7995, [("2025-08-05", "2025-08-06")]),
        ("San Francisco", 37.7749, -122.4194, [("2025-08-08", "2025-08-10")]),
    ],
    "london-paris-2025": [
        ("London", 51.5072, -0.1276, [("2025-04-12", "2025-04-15")]),
        ("Paris & Versailles", 48.8566, 2.3522, [("2025-04-16", "2025-04-20")]),
    ],
    "milwaukee-fencing-2025": [
        ("Milwaukee", 43.0389, -87.9065, [("2025-06-30", "2025-07-04")]),
    ],
    "montreal-2024": [
        ("Saratoga, New York", 43.0831, -73.7846, [("2024-08-21", "2024-08-21")]),
        ("Montreal", 45.5019, -73.5674, [("2024-08-22", "2024-08-25")]),
    ],
    "northern-california-2023": [
        ("San Francisco & Marin", 37.7749, -122.4194, [("2023-06-23", "2023-06-25"), ("2023-06-30", "2023-06-30")]),
        ("Calistoga", 38.5788, -122.5797, [("2023-06-26", "2023-06-27")]),
        ("Mendocino", 39.3077, -123.7995, [("2023-06-28", "2023-06-29")]),
        ("Lake Tahoe", 38.9399, -119.9772, [("2023-07-01", "2023-07-04")]),
    ],
    # "ireland": no dates on the trip yet, so no weather.
}


def fetch(lat: float, lon: float, start: str, end: str) -> list[dict]:
    q = urllib.parse.urlencode({
        "latitude": lat, "longitude": lon, "start_date": start, "end_date": end,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "temperature_unit": "fahrenheit", "precipitation_unit": "inch", "timezone": "auto",
    })
    for attempt in range(6):  # the free API allows a limited number of calls per minute
        try:
            time.sleep(1.5)
            with urllib.request.urlopen(f"{API}?{q}", timeout=30) as r:
                d = json.load(r)["daily"]
            break
        except urllib.error.HTTPError as err:
            if err.code != 429 or attempt == 5:
                raise
            time.sleep(15 * (attempt + 1))
        except urllib.error.URLError:
            if attempt == 5:
                raise
            time.sleep(10 * (attempt + 1))
    return [{"date": t, "hi": hi, "lo": lo, "rain": pr}
            for t, hi, lo, pr in zip(d["time"], d["temperature_2m_max"], d["temperature_2m_min"], d["precipitation_sum"])
            if hi is not None and lo is not None]


def dates_label(ranges: list[tuple[str, str]]) -> str:
    out = []
    for a, b in ranges:
        da, db = dt.date.fromisoformat(a), dt.date.fromisoformat(b)
        if da == db:
            out.append(f"{da:%b} {da.day}")
        elif da.month == db.month:
            out.append(f"{da:%b} {da.day}–{db.day}")
        else:
            out.append(f"{da:%b} {da.day} – {db:%b} {db.day}")
    return " & ".join(out)


def summarize(slug: str) -> dict:
    spots = []
    for place, lat, lon, ranges in SPOTS[slug]:
        days = [d for a, b in ranges for d in fetch(lat, lon, a, b)]
        if not days:
            continue
        spots.append({
            "place": place,
            "dates": dates_label(ranges),
            "high": round(sum(d["hi"] for d in days) / len(days)),
            "low": round(sum(d["lo"] for d in days) / len(days)),
            "warmest": round(max(d["hi"] for d in days)),
            "coolest": round(min(d["lo"] for d in days)),
            "rain_days": sum(1 for d in days if (d["rain"] or 0) >= 0.04),
            "days": len(days),
        })
    return {"source": "Open-Meteo historical weather", "unit": "F", "spots": spots}


def main() -> None:
    slugs = sys.argv[1:] or list(SPOTS)
    for slug in slugs:
        if slug not in SPOTS:
            print(f"skip {slug}: add its places to SPOTS first")
            continue
        f = CONTENT / f"{slug}.json"
        t = json.loads(f.read_text(encoding="utf-8"))
        t["weather"] = summarize(slug)
        f.write_text(json.dumps(t, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(slug, "→", "; ".join(f'{s["place"]}: {s["low"]}–{s["high"]}°F, rain {s["rain_days"]}/{s["days"]}d' for s in t["weather"]["spots"]))


if __name__ == "__main__":
    main()
