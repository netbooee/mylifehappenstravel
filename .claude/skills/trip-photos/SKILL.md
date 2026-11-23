---
name: trip-photos
description: Pick Tony & Sharon's own photos for a trip from Apple Photos and add them to the site (day strips, gallery, hero), then open a pull request. Use when they ask to add, choose or update photos for a trip, e.g. "/trip-photos italy-2026" or "add our Italy photos".
---

# Trip photos: from Apple Photos to the trip page

The toolkit is `tools/photos/run <command> <slug>` (a slug is an itinerary file name in
`content/itineraries/` without `.json`). It does the mechanical work; you do the judging: which photos
are good, what goes where, alt text and day text. Everything bulky (previews, full-size exports, picks)
goes in the work folder printed by each command (`$TRIP_PHOTOS_WORK`, default `../trip-photos-work`
next to the repo). Never put any of it in the repo.

If no slug was given, list the itineraries and ask which trip. If the trip has no itinerary yet, add it
first ("Adding a trip" in `README.md`).

## Rules (always)

- **The Photos library is read-only.** Use only the toolkit's commands on it. Never import, edit, add
  keywords/albums, or run AppleScript that changes Photos.
- **Never export or download originals in bulk.** Previews come from Photos' own small copies; only the
  final picks are exported (`export`), and only those may be fetched from iCloud.
- **Privacy on the published site:** no GPS or EXIF (the toolkit strips them; `verify` checks), no one
  named except Tony and Sharon, no photos where strangers' faces are prominent, nothing that shows a
  document, ticket, booking code, screen or address. `find` drops what Photos labels as documents, but
  look for them anyway.
- Alt text follows the site's style: short, describes the scene, names only "Tony and Sharon" (or one
  of them), and the place as the itinerary names it, e.g. "Tony and Sharon in front of the Arc de
  Triomf, Barcelona". Places not in the itinerary are fine once they've confirmed them (a tour's stops).
- Ask before using any source other than Apple Photos (Dropbox, Google Photos…).

## 1. Find the photos

```
tools/photos/run find <slug>
```

The first run sets up its own Python (a few minutes, inside the work folder, nothing system-wide).
If it says the library can't be opened for permissions, stop and ask them to turn on
**System Settings → Privacy & Security → Full Disk Access** for the Claude app; don't work around it.

Report the counts it prints (kept photos per day, skipped screenshots/documents/elsewhere, iCloud-only).

**Camera clocks.** Phones have GPS and set their clocks themselves; standalone cameras (e.g. the Lumix
DC-S9) often don't. `find` lists every camera batch of 5+ photos with no GPS. For each one:

1. `tools/photos/run previews <slug>` then `tools/photos/run sheets <slug> --batches`, and look at the
   batch sheets next to the day sheets (step 2) to see where each batch really belongs.
2. Use the hints: "frame numbers: +6 h relative to import [X]" compares consecutive frame numbers
   across two imports of the same camera. If import X has GPS or is already fixed, the hint is the fix.
3. Write the fixes to `clock.json` in the trip's work folder, as hours to add (or `"exclude"` for
   photos that aren't from this trip, such as another camera's photos from home):
   ```json
   {"DC-S9 | GMT-0400 | added 2026-07-08 | frac-seconds": 12,
    "DC-S9 | GMT-0800 | added 2026-07-12 | frac-seconds": "exclude"}
   ```
4. Run `find` again (then `previews`, which only makes what's new) and check the per-day counts make sense.

Example from the Barcelona trip: the Lumix was a day behind and one of its two imports was 6 hours
off again, so Sagrada Família (Day 2 morning) showed up as Day 1 afternoon. Fixes were +18 h and +12 h.

## 2. Look and shortlist

```
tools/photos/run previews <slug>
tools/photos/run sheets <slug>
```

`sheets` prints numbered contact sheets per day: every distinct moment (bursts, re-saved edits and
duplicate imports are grouped under their best shot). Read every sheet. Don't rely on Photos' quality
score: on the Barcelona trip it ranked the photos we chose as low as 185th of 194. For trips with
thousands of photos, `--per-scene 3` keeps the best 3 of each scene instead.

Write `shortlist.json` in the trip's work folder: about 25–35 photos, keyed by uuid (from
`photos.json`, matched by the number `n` on the sheets), each with where it would go and a one-line reason:

```json
{"03B6DC73-E561-4E2A-BA60-E7A6B7EDE069": {"slot": "Day 2", "reason": "The two of you above the city at Park Güell"}}
```

`slot` is a day label exactly as in the itinerary (`"Day 2"`, `"Days 4–6"`), `"Gallery"` or `"Hero"`.
Priorities: days with no photos first (1–2 each), then a gallery mixing the city, the sea/landscape and
the two of them, then hero options (wide landscapes, at least 1600 px wide). Days that already have
photos: suggest only clearly better ones. Prefer sharp, well-lit, flattering shots of the two of them
or the places. If a day is a tour or outing with empty text, say what the photos show it was.

## 3. They pick

```
tools/photos/run review <slug>
tools/photos/run serve <slug>        # run in the background; opens the page in their browser
```

Tell them: tick the photos they want, change "where it goes" with the menu if they like, press
**Save my picks**, then tell you they're done. The page writes `picks.json` in the work folder. (If it
was opened without the server, it copies the picks to paste instead.) Stop the server afterwards.

## 4. Export, name and place

```
tools/photos/run export <slug>
```

Exports full size for the picks only (edited versions preferred, no RAW, iCloud downloads for these only).

Then edit `picks.json`: give each pick
- `"key"`: `<prefix>-<what>` in kebab case, like the existing keys (`bcn-…` Barcelona, `mallorca-…`,
  `zafiro-…` hotel, `ita-…` Italy…). Check `PHOTOS` in `tools/build.py` so you don't reuse one.
- `"alt"`: alt text (rules above).
- optional `"crop": [left, top, right, bottom]` as fractions, when a photo needs reframing (below).

Order `picks.json` the way photos should appear: each day's new photos follow the ones already there,
in this order. Then:

```
tools/photos/run publish <slug> [--gallery-order key1,key2,...]
```

It resizes (800 and up to 1200 px; the hero 800/1600/2400), converts to sRGB, strips all metadata,
writes `site/assets/img/`, adds the `PHOTOS` entries, updates `TRIP_PHOTOS` (hero, gallery) and the
itinerary's day photos. `--dry-run` shows the changes without writing. Run it again after any change;
it replaces its own entries.

**Layout rules it warns about** (fix them, don't just pass them on):
- At most 4 photos per day. 3 shows as one wide + two on phones, 4 as a 2×2 grid.
- A day with a single photo shows it 4:3. A tall photo gets cropped around the middle, so check signs
  and faces; if they're cut, set `crop` to a 4:3 box (e.g. `[0, 0.10, 1, 0.6625]` keeps the top of a
  3:4 portrait) and publish again.
- Gallery: 5, 8 or 11 photos fill the grid. The first photo is shown large; lead with the best one.
- The hero must be a wide landscape at least 1600 px wide (it's also the share-preview image).

If they named a tour or asked for day text, fill in the day's `text` in the itinerary (same voice as
the other days: "We…", one or two sentences).

## 5. Check

```
tools/photos/run verify <slug>
```

Rebuilds the site (with the toolkit's Python 3.12; the Mac's own `python3` is too old for `build.py`),
checks every image on the trip page loads and carries no EXIF/XMP, and repeats the layout warnings.
Then look at the page yourself: add a `site` entry to `.claude/launch.json` running
`<work>/.env/venv/bin/python -m http.server -d site 8000`, open `/itineraries/<slug>/` in the browser
pane, and check it at phone width (375 px) and desktop: no sideways scrolling, gallery and day strips
without gaps, nothing important cropped.

## 6. Pull request

Per `CLAUDE.md`: branch `<slug>-photos`, commit the source and the generated `site/` files, push, and
open a pull request into `main` without asking. Use `gh pr create` if the GitHub CLI is installed and
signed in; otherwise open the pre-filled compare page
(`https://github.com/netbooee/mylifehappenstravel/compare/main...<branch>?expand=1&title=…&body=…`)
in the browser pane, where they may need to sign in themselves (never type their password). Merge only
when they ask. If a push asks for a password, they need to sign in once (GitHub Desktop, or a personal
access token in Terminal), which macOS then remembers.

## 7. Tidy up

Tell them the work folder's size. The trip's subfolder (previews, picks) can be deleted once the pull
request is merged; `.env` is the toolkit's Python, reused for every trip.
