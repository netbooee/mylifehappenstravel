#!/usr/bin/env python3
"""Turn a Flighty export into content/flights.json (the lifetime flight stats on the site).

    python3 tools/flights.py ~/Downloads/FlightyExport-2026-11-23.csv
    python3 tools/build.py

Get the export in Flighty: Settings → Account Data → Export Your Flights (it arrives by email).
Keep the CSV itself OUT of this repo: it holds booking codes, seats and tail numbers. Only the
fields below are copied into content/flights.json:

    year, airline, from, to, miles, minutes in the air, and which trip on the site it belongs to.

Canceled flights are skipped automatically. Flights we tracked but didn't take go in NOT_FLOWN.
A new airport or airline in the export stops the script with a message: add it to AIRPORTS or
AIRLINES below (right-click the airport in Google Maps to copy its coordinates).
Only the Python standard library is needed.
"""
from __future__ import annotations

import csv
import datetime as dt
import json
import math
import pathlib
import re
import sys
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "content" / "flights.json"
TRIPS = ROOT / "content" / "itineraries"

# Flights in the export that we didn't actually take: "date airline-code flight-number".
NOT_FLOWN = {
    "2018-06-28 UAL 1551": "rebooked onto the later UA 1202 the same day",
    "2026-02-03 JBU 956": "duplicate of the JetBlue red-eye home the night before",
    "2026-08-18 UAL 1948": "tracked, not ours (we flew Cancún → Newark that day)",
    "2026-08-27 UAL 2823": "tracked while rebooking; we came home on UA 1134",
}

# code: (city or airport name as shown on the site, country, latitude, longitude, time zone)
AIRPORTS = {
    "EWR": ("Newark", "USA", 40.6895, -74.1745, "America/New_York"),
    "JFK": ("New York", "USA", 40.6413, -73.7781, "America/New_York"),
    "LGA": ("New York", "USA", 40.7769, -73.8740, "America/New_York"),
    "BOS": ("Boston", "USA", 42.3656, -71.0096, "America/New_York"),
    "DCA": ("Washington", "USA", 38.8512, -77.0402, "America/New_York"),
    "IAD": ("Washington", "USA", 38.9531, -77.4565, "America/New_York"),
    "CLT": ("Charlotte", "USA", 35.2140, -80.9431, "America/New_York"),
    "MCO": ("Orlando", "USA", 28.4312, -81.3081, "America/New_York"),
    "MIA": ("Miami", "USA", 25.7959, -80.2870, "America/New_York"),
    "FLL": ("Fort Lauderdale", "USA", 26.0742, -80.1506, "America/New_York"),
    "BNA": ("Nashville", "USA", 36.1263, -86.6774, "America/Chicago"),
    "MSP": ("Minneapolis", "USA", 44.8848, -93.2223, "America/Chicago"),
    "MCI": ("Kansas City", "USA", 39.2976, -94.7139, "America/Chicago"),
    "DEN": ("Denver", "USA", 39.8561, -104.6737, "America/Denver"),
    "SLC": ("Salt Lake City", "USA", 40.7899, -111.9791, "America/Denver"),
    "PHX": ("Phoenix", "USA", 33.4352, -112.0101, "America/Phoenix"),
    "LAS": ("Las Vegas", "USA", 36.0840, -115.1537, "America/Los_Angeles"),
    "LAX": ("Los Angeles", "USA", 33.9416, -118.4085, "America/Los_Angeles"),
    "SFO": ("San Francisco", "USA", 37.6213, -122.3790, "America/Los_Angeles"),
    "SJU": ("San Juan", "Puerto Rico", 18.4394, -66.0018, "America/Puerto_Rico"),
    "PLS": ("Providenciales", "Turks & Caicos", 21.7736, -72.2659, "America/Grand_Turk"),
    "CUN": ("Cancún", "Mexico", 21.0365, -86.8771, "America/Cancun"),
    "LHR": ("London", "England", 51.4700, -0.4543, "Europe/London"),
    "CDG": ("Paris", "France", 49.0097, 2.5479, "Europe/Paris"),
    "ZRH": ("Zurich", "Switzerland", 47.4582, 8.5555, "Europe/Zurich"),
    "VIE": ("Vienna", "Austria", 48.1103, 16.5697, "Europe/Vienna"),
    "FLR": ("Florence", "Italy", 43.8100, 11.2051, "Europe/Rome"),
    "OPO": ("Porto", "Portugal", 41.2481, -8.6814, "Europe/Lisbon"),
    "BCN": ("Barcelona", "Spain", 41.2974, 2.0833, "Europe/Madrid"),
    "PMI": ("Palma de Mallorca", "Spain", 39.5517, 2.7388, "Europe/Madrid"),
}

AIRLINES = {
    "UAL": "United", "DAL": "Delta", "AAL": "American", "JBU": "JetBlue", "ASA": "Alaska",
    "NKS": "Spirit", "SWR": "Swiss", "TAP": "TAP Air Portugal", "AUA": "Austrian", "RYR": "Ryanair",
}


def miles(a: str, b: str) -> int:
    """Great-circle distance in statute miles (what Flighty and airlines use)."""
    _, _, la1, lo1, _ = AIRPORTS[a]
    _, _, la2, lo2, _ = AIRPORTS[b]
    p1, p2, dl = math.radians(la1), math.radians(la2), math.radians(lo2 - lo1)
    dp = p2 - p1
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * 3958.8 * math.asin(math.sqrt(h)))


def minutes(row: dict, a: str, b: str) -> int | None:
    """Time in the air: actual take-off → landing if Flighty has it, else gate to gate."""
    for dep, arr in (("Take off (Actual)", "Landing (Actual)"),
                     ("Gate Departure (Actual)", "Gate Arrival (Actual)"),
                     ("Take off (Scheduled)", "Landing (Scheduled)"),
                     ("Gate Departure (Scheduled)", "Gate Arrival (Scheduled)")):
        if row.get(dep) and row.get(arr):
            t1 = dt.datetime.fromisoformat(row[dep]).replace(tzinfo=ZoneInfo(AIRPORTS[a][4]))
            t2 = dt.datetime.fromisoformat(row[arr]).replace(tzinfo=ZoneInfo(AIRPORTS[b][4]))
            m = round((t2 - t1).total_seconds() / 60)
            if 15 <= m <= 20 * 60:  # ignore obviously broken timestamps
                return m
    return None


def main(path: str) -> None:
    trips = [json.loads(p.read_text(encoding="utf-8")) for p in TRIPS.glob("*.json")]
    windows = [(t["slug"], dt.date.fromisoformat(t["start"]) - dt.timedelta(days=1),
                dt.date.fromisoformat(t["end"]) + dt.timedelta(days=1)) for t in trips if t.get("start") and t.get("end")]
    flights, skipped, missing = [], [], set()
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            date, al, num, a, b = row["Date"], row["Airline"], row["Flight"], row["From"], row["To"]
            key = f"{date} {al} {num}"
            if row["Canceled"].strip().lower() == "true":
                skipped.append(f"{key} {a}→{b} (canceled)")
                continue
            if key in NOT_FLOWN:
                skipped.append(f"{key} {a}→{b} ({NOT_FLOWN[key]})")
                continue
            if row.get("Diverted To"):
                b = row["Diverted To"]
            missing |= {x for x in (a, b) if x not in AIRPORTS} | ({al} if al not in AIRLINES else set())
            if missing:
                continue
            d = dt.date.fromisoformat(date)
            flights.append({
                "year": d.year,
                "airline": AIRLINES[al],
                "from": a,
                "to": b,
                "miles": miles(a, b),
                "minutes": minutes(row, a, b),
                "trip": next((s for s, lo, hi in windows if lo <= d <= hi), ""),
            })
    if missing:
        sys.exit(f"Add these to AIRPORTS / AIRLINES in tools/flights.py first: {', '.join(sorted(missing))}")
    used = sorted({x for fl in flights for x in (fl["from"], fl["to"])})
    data = {
        "updated": (re.findall(r"\d{4}-\d{2}-\d{2}", pathlib.Path(path).name) or [dt.date.today().isoformat()])[-1],
        "airports": {c: {"name": AIRPORTS[c][0], "country": AIRPORTS[c][1], "lat": AIRPORTS[c][2], "lon": AIRPORTS[c][3]} for c in used},
        "flights": flights,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(flights)} flights, {len(used)} airports")
    for s in skipped:
        print("  skipped", s)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
