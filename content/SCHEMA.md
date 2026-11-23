# Itinerary data format

Each trip is one JSON file in `content/itineraries/<slug>.json`. `tools/build.py` turns it into
`site/itineraries/<slug>/index.html` using the shared itinerary template, and adds it to the
home page, the itineraries list and the sitemap.

All text is plain text (no HTML). Keep the writing in our own voice ("we", "us"): we're Tony & Sharon.

```jsonc
{
  "slug": "italy-2026",                     // folder name / URL
  "title": "10 Days in Italy",              // big headline
  "subtitle": "Florence, Venice & Rome",    // second line of the headline
  "summary": "One or two sentences for cards and search engines.",
  "country": "Italy",
  "region": "Europe",                        // Europe | North America | ...
  "start": "2026-04-02",                     // ISO dates of the actual trip
  "end": "2026-04-12",
  "days": 10,                                // length in days as we'd describe it
  "hero": "italy",                           // photo key (see tools/build.py PHOTOS); leave "" if none
  "glance": [                                // 4–6 quick facts for the "at a glance" box
    { "label": "Bases", "value": "Florence (5 nights), Venice (3 nights)" },
    { "label": "Getting around", "value": "High-speed trains" }
  ],
  "intro": ["Paragraph.", "Paragraph."],     // 1–3 paragraphs: why this trip, how it's paced
  "route": ["Florence", "Pisa & Lucca", "Rome", "Venice"],   // stops in order, short names
  "days_plan": [
    {
      "label": "Day 1",                      // "Day 1" or "Days 5–7" for a slow stretch
      "date": "Thu, Apr 2",                  // short date, or "" if unknown
      "place": "Florence",
      "title": "Landing in Florence & a first aperitivo",
      "text": "Optional short paragraph describing the day.",
      "items": [                             // the timeline; may be empty
        { "time": "4:00 PM", "text": "Land in Florence, check in at L'Orologio", "booked": true },
        { "time": "", "text": "Dinner at L'Osteria di Giovanni" }
      ],
      "tip": "Optional one-line tip for this day."
    }
  ],
  "stays": [ { "name": "L'Orologio Firenze", "place": "Florence", "nights": "5 nights", "note": "Right on Piazza Santa Maria Novella." } ],
  "eats":  [ { "name": "L'Osteria di Giovanni", "place": "Florence", "note": "Classic Florentine trattoria.", "type": "Dinner" } ],
  "book_ahead": ["Uffizi & Accademia tour", "Campanile climb (timed entry)"],
  "tips": [ { "title": "Pack light for the trains", "text": "..." } ],
  "map": {                                   // coordinates for every stop in "route" → the route map
    "Florence": [43.7696, 11.2558],
    "Rome": [41.9028, 12.4964]
  },
  "videos": ["4GLtHpa4wJE"]                  // YouTube ids from content/videos.json to show on this trip
}
```

Each timeline item gets an icon automatically from its wording (meal, sight, hotel or getting
around); see `KIND_RULES` in `tools/build.py`. The route map only appears when every stop in
`route` has coordinates in `map` (right-click a place in Google Maps to copy its coordinates).

Fields other than `slug`, `title`, `summary`, `country`, `region`, `start`, `end`, `days` and
`days_plan` may be empty (`""` or `[]`); the template simply leaves those sections out.
