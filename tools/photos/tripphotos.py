#!/usr/bin/env python3
"""Pick our own trip photos from Apple Photos and add them to the site.

Run through the wrapper, which sets up its own Python on first use:

    tools/photos/run find     <slug>   # find the trip's photos (Photos library is only read)
    tools/photos/run previews <slug>   # 1024px previews from Photos' own small copies
    tools/photos/run sheets   <slug>   # numbered contact sheets for Claude to look through
    tools/photos/run review   <slug>   # build review.html from shortlist.json
    tools/photos/run serve    <slug>   # open the review page; "Save my picks" writes picks.json
    tools/photos/run export   <slug>   # full-size copies of the picks only
    tools/photos/run publish  <slug>   # resize into site/, update build.py and the itinerary
    tools/photos/run verify   <slug>   # rebuild the site and check every image on the trip page

Working files (previews, exports, picks) live outside the repo in the work folder:
$TRIP_PHOTOS_WORK, or a "trip-photos-work" folder next to the repo. They are never committed.
See .claude/skills/trip-photos/SKILL.md for the full workflow.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import html
import http.server
import importlib.util
import io
import json
import os
import pathlib
import re
import statistics
import subprocess
import sys
import webbrowser

REPO = pathlib.Path(__file__).resolve().parents[2]
WORK = pathlib.Path(os.environ.get("TRIP_PHOTOS_WORK") or REPO.parent / "trip-photos-work").expanduser()
ITINERARIES = REPO / "content" / "itineraries"
BUILD_PY = REPO / "tools" / "build.py"
IMG_DIR = REPO / "site" / "assets" / "img"

# Photos' own labels / AI captions that mean "this is paperwork, not a travel photo".
PRIVATE_LABELS = {"Driver’s License", "Driver's License", "Passport", "Identity Document", "Credit Card",
                  "Receipt", "Boarding Pass", "Ticket", "Barcode", "QR Code"}
PRIVATE_CAPTION = re.compile(r"\b(passport|driver'?s? licen[cs]e|id card|identity card|credit card|boarding pass|"
                             r"ticket|receipt|invoice|bank|screenshot|qr code|barcode)\b", re.I)
MARGIN_DEG = 1.5          # how far outside the itinerary's map points still counts as "on the trip"
NEAR_DUP_SECONDS = 2      # shots this close together (same camera) count as one moment
GALLERY_GOOD_COUNTS = {2, 5, 8, 11}  # sizes that fill the trip gallery grid on desktop


# ── helpers ──────────────────────────────────────────────────────────────────
def trip_dir(slug: str) -> pathlib.Path:
    d = WORK / slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_json(path: pathlib.Path, default=None):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def save_json(path: pathlib.Path, data) -> None:
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


def load_trip(slug: str) -> tuple[dict, pathlib.Path, str]:
    path = ITINERARIES / f"{slug}.json"
    if not path.exists():
        sys.exit(f"No itinerary at {path}. Slugs: {', '.join(p.stem for p in ITINERARIES.glob('*.json'))}")
    raw = path.read_text(encoding="utf-8")
    return json.loads(raw), path, raw


def write_trip(path: pathlib.Path, trip: dict, raw: str) -> None:
    """Write the itinerary back in exactly the repo's format (2-space JSON, UTF-8, same trailing newline)."""
    assert json.dumps(json.loads(raw), indent=2, ensure_ascii=False) == raw.rstrip("\n"), \
        f"{path.name} isn't in the expected 2-space JSON format; refusing to rewrite it"
    path.write_text(json.dumps(trip, indent=2, ensure_ascii=False) + ("\n" if raw.endswith("\n") else ""),
                    encoding="utf-8")


def _day_dates(text: str, start: dt.date) -> list[dt.date]:
    """Calendar dates named in a day's "date" ("Fri, Apr 3", "Sat, Aug 9 – Sun, Aug 10"), year from the trip."""
    found = []
    for mon, day in re.findall(r"\b([A-Z][a-z]{2})[a-z]*\.? (\d{1,2})\b", text or ""):
        try:
            d = dt.datetime.strptime(f"{mon} {day} {start.year}", "%b %d %Y").date()
        except ValueError:
            continue
        if d < start - dt.timedelta(days=7):      # a trip running over New Year
            d = d.replace(year=d.year + 1)
        found.append(d)
    return found


def day_slots(trip: dict) -> list[tuple[str, list[dt.date]]]:
    """[(label, [dates])] for each days_plan entry. Uses the day's own "date" when it names one ("Fri, Apr 3"),
    since Day 1 isn't always the trip's start (an overnight flight); otherwise "Day 2" -> start+1,
    "Days 4–6" -> start+3..start+5."""
    start = dt.date.fromisoformat(trip["start"])
    out = []
    for d in trip.get("days_plan", []):
        nums = [int(x) for x in re.findall(r"\d+", d["label"])]
        if not nums:
            continue
        named = _day_dates(d.get("date", ""), start)
        if named:
            first, last = min(named), max(named)
            out.append((d["label"], [first + dt.timedelta(days=i) for i in range((last - first).days + 1)]))
        else:
            out.append((d["label"], [start + dt.timedelta(days=n - 1) for n in range(nums[0], nums[-1] + 1)]))
    return out


def region_box(trip: dict):
    pts = list((trip.get("map") or {}).values())
    if not pts:
        return None
    lats, lons = [p[0] for p in pts], [p[1] for p in pts]
    return (min(lats) - MARGIN_DEG, max(lats) + MARGIN_DEG, min(lons) - MARGIN_DEG, max(lons) + MARGIN_DEG)


def in_box(box, lat, lon) -> bool:
    return box[0] <= lat <= box[1] and box[2] <= lon <= box[3]


def font(size: int):
    from PIL import ImageFont
    for f in ("/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc"):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


# ── find ─────────────────────────────────────────────────────────────────────
def cmd_find(a) -> None:
    import osxphotos

    trip, _, _ = load_trip(a.slug)
    start, end = dt.date.fromisoformat(trip["start"]), dt.date.fromisoformat(trip["end"])
    pad = dt.timedelta(days=a.pad_days)
    box = region_box(trip)
    from osxphotos.utils import get_last_library_path, get_system_library_path
    library = a.library or get_last_library_path() or get_system_library_path()
    if not library:
        sys.exit("Couldn't work out where the Photos library is; pass it with --library /path/to/Library.photoslibrary")
    try:
        db = osxphotos.PhotosDB(dbfile=library)
    except Exception as e:  # usually macOS privacy: Full Disk Access isn't on for the app running this
        sys.exit(f"Couldn't open the Photos library at {library} ({e}).\nIf this is a permissions error, turn on "
                 "System Settings → Privacy & Security → Full Disk Access for the app running Claude, then try "
                 "again. Nothing was changed.")
    print(f"Reading (not changing) {library}")
    found = db.photos(from_date=dt.datetime.combine(start - pad, dt.time()),
                      to_date=dt.datetime.combine(end + pad + dt.timedelta(days=1), dt.time()))

    stats = collections.Counter(videos=sum(p.ismovie for p in found))
    rows = []
    for p in found:
        if p.ismovie:
            continue
        if p.screenshot or getattr(p, "screen_recording", False):
            stats["screenshots"] += 1
            continue
        if p.hidden or p.intrash:
            stats["hidden or deleted"] += 1
            continue
        labels = list(p.labels or [])
        caption = getattr(p, "ai_caption", None) or ""
        lat, lon = p.location if p.location else (None, None)
        if PRIVATE_LABELS & set(labels) or PRIVATE_CAPTION.search(caption):
            stats["documents (passports, tickets, screenshots…)"] += 1
            continue
        if box and lat is not None and not in_box(box, lat, lon):
            stats["taken somewhere else (GPS)"] += 1
            continue
        exif = p.exif_info
        score = getattr(p.score, "overall", None) if p.score else None
        rows.append({
            "uuid": p.uuid,
            "date": p.date.isoformat(),
            "tz": p.tzname,
            "camera": (exif.camera_model if exif else None) or "unknown",
            "has_gps": lat is not None,
            "file": p.original_filename,
            "size": p.original_filesize,
            "added": p.date_added.date().isoformat() if p.date_added else "",
            "frac": p.date.microsecond != 0,
            "score": round(score or 0, 3),
            "favorite": bool(p.favorite),
            "faces": len(p.face_info or []),
            "edited": bool(p.hasadjustments),
            "document": "Document" in labels,
            "missing": bool(p.ismissing),
            "w": p.width, "h": p.height,
            "derivatives": [x for x in (p.path_derivatives or []) if x],
            "original": p.path if (p.path and not p.ismissing) else None,
            "fingerprint": p.fingerprint,
        })

    # Clock batches: one camera's photos from one import, recorded in one time zone.
    def batch_id(r):
        return f'{r["camera"]} | {r["tz"]} | added {r["added"]} | {"frac" if r["frac"] else "whole"}-seconds'
    batches = collections.defaultdict(list)
    for r in rows:
        r["batch"] = batch_id(r)
        batches[r["batch"]].append(r)

    # The trip's real time zone: what the GPS-tagged photos (phones) were recorded in.
    anchored = [dt.datetime.fromisoformat(r["date"]).utcoffset() for r in rows if r["has_gps"]]
    trip_off = statistics.mode(anchored) if anchored else (
        statistics.mode([dt.datetime.fromisoformat(r["date"]).utcoffset() for r in rows]) if rows else dt.timedelta())
    trip_tz = dt.timezone(trip_off)

    clock = load_json(trip_dir(a.slug) / "clock.json", {})
    slots = day_slots(trip)
    date_to_slot = {d: label for label, ds in slots for d in ds}

    for r in rows:
        fix = clock.get(r["batch"], 0)
        if fix == "exclude":  # e.g. someone else's camera, or photos from another trip
            stats["in batches excluded in clock.json"] += 1
            r["excluded"] = True
            fix = 0
        t = dt.datetime.fromisoformat(r["date"]) + dt.timedelta(hours=float(fix))
        local = t.astimezone(trip_tz)
        r["t"] = local.isoformat(timespec="seconds")
        r["slot"] = None if r.get("excluded") else date_to_slot.get(local.date())

    # Duplicates: the same file imported twice, then near-identical moments (bursts, re-saved edits).
    rows.sort(key=lambda r: (r["t"], r["uuid"]))
    seen = {}
    for r in rows:
        k = (r["file"], r["size"])
        if k in seen and r["fingerprint"] == seen[k]["fingerprint"]:
            r["dup_of"] = seen[k]["uuid"]
        else:
            seen[k] = r
    groups, last = [], None
    for r in rows:
        if r.get("dup_of"):
            continue
        t = dt.datetime.fromisoformat(r["t"])
        if last and (t - last[0]).total_seconds() <= NEAR_DUP_SECONDS and (
                r["camera"] == last[1]["camera"] or "unknown" in (r["camera"], last[1]["camera"])):
            groups[-1].append(r)
        else:
            groups.append([r])
        last = (t, r)
    for g in groups:
        best = max(g, key=lambda r: (r["edited"], r["score"]))
        for r in g:
            r["moment"] = best["uuid"]

    for r in rows:
        r["rank"] = round(r["score"] + 0.15 * r["favorite"] + 0.04 * min(r["faces"], 2) - 0.3 * r["document"], 3)

    kept = [r for r in rows if r["slot"] and not r.get("dup_of")]
    for n, r in enumerate(kept):
        r["n"] = n

    # Batch report, so a wrong camera clock can be spotted and fixed in clock.json.
    report = []
    for bid, rs in sorted(batches.items(), key=lambda kv: -len(kv[1])):
        inside = sum(1 for r in rs if r["slot"])
        info = {"batch": bid, "photos": len(rs), "on_trip_days": inside, "gps": sum(r["has_gps"] for r in rs),
                "first": min(r["t"] for r in rs), "last": max(r["t"] for r in rs),
                "offset_hours": clock.get(bid, 0)}
        if not info["gps"] and bid not in clock and len(rs) >= 5:
            info["check"] = ("no GPS: confirm the times against the phone photos (sheets --batches)"
                             + (f"; {len(rs) - inside} fall outside the trip dates" if inside < len(rs) else ""))
            hint = frame_offset_hint(rs, batches)
            if hint:
                info["frame_hint_hours"], info["frame_hint_vs"] = hint
        report.append(info)

    td = trip_dir(a.slug)
    save_json(td / "photos.json", kept)
    save_json(td / "batches.json", {"trip_utc_offset_hours": trip_off.total_seconds() / 3600, "batches": report})
    stats["outside the trip dates"] = sum(1 for r in rows if not r["slot"])
    stats["duplicate imports"] = sum(1 for r in rows if r.get("dup_of"))
    print(f"{len(found)} items in Photos between {start - pad} and {end + pad} "
          f"(trip {start} → {end}, UTC{trip_off.total_seconds() / 3600:+g}).")
    for k, v in stats.items():
        if v:
            print(f"  skipped {v} {k}")
    print(f"Kept {len(kept)} photos on trip days, {len({r['moment'] for r in kept})} distinct moments, "
          f"{sum(r['missing'] for r in kept)} only in iCloud.")
    per_day = collections.Counter(r["slot"] for r in kept)
    print("  " + ", ".join(f"{label}: {per_day.get(label, 0)}" for label, _ in slots))
    unanchored = [b for b in report if "check" in b]
    small = sum(1 for b in report if not b["gps"] and b["batch"] not in clock and b["photos"] < 5)
    if clock:
        print(f"Applied {len(clock)} clock fix(es) from clock.json.")
    if unanchored:
        print(f"{len(unanchored)} camera batch(es) of 5+ photos have no GPS; check their clocks "
              f"(`sheets --batches`, then clock.json):")
        for b in unanchored:
            hint = (f"\n          frame numbers: {b['frame_hint_hours']:+g} h relative to import [{b['frame_hint_vs']}]"
                    if b.get("frame_hint_hours") else "")
            print(f"  {b['photos']:4d}  {b['batch']}  [{b['first'][:16]} → {b['last'][:16]}, "
                  f"{b['on_trip_days']} on trip days]{hint}")
    if small:
        print(f"  (+{small} smaller batches of 1–4 photos without GPS, listed in batches.json)")
    print(f"Wrote {td / 'photos.json'}")


def frame_offset_hint(rs, batches):
    """For files named like P1010163.JPG: compare against the same camera's other imports by frame number.
    Consecutive frames should be seconds apart, so a steady gap means this import is shifted."""
    num = lambda r: int(m.group(1)) if (m := re.search(r"(\d{3,})", r["file"] or "")) else None
    mine = {num(r): r for r in rs if num(r) is not None}
    if not mine:
        return None
    cam = rs[0]["camera"]
    best = None
    for bid, b in sorted(batches.items(), key=lambda kv: -len(kv[1])):  # compare with each other import
        if b is rs or b[0]["camera"] != cam:
            continue
        others = {num(r): r for r in b if num(r) is not None}
        if not others:
            continue
        keys = sorted(others)
        gaps = []
        for f, r in mine.items():
            near = min(keys, key=lambda k: abs(k - f))
            if abs(near - f) <= 3:
                gap = dt.datetime.fromisoformat(r["date"]) - dt.datetime.fromisoformat(others[near]["date"])
                gaps.append(gap.total_seconds() / 3600)
        if len(gaps) >= 3:
            med = statistics.median(gaps)
            steady = sum(abs(g - med) <= 0.5 for g in gaps) >= 0.6 * len(gaps)  # most frames agree
            h = round(med * 2) / 2
            if steady and abs(h) >= 1:
                best = (-h, bid)
            break
    return best


# ── previews ─────────────────────────────────────────────────────────────────
def cmd_previews(a) -> None:
    from PIL import Image, ImageOps
    import pillow_heif
    pillow_heif.register_heif_opener()

    td = trip_dir(a.slug)
    rows = load_json(td / "photos.json") or sys.exit("Run `find` first.")
    out = td / "previews"
    out.mkdir(exist_ok=True)
    made = skipped = 0
    for r in rows:
        dest = out / f'{r["uuid"]}.jpg'
        r["preview"] = f"previews/{dest.name}"
        if dest.exists():
            continue
        # Photos' own small copies first (largest), the original only if it's already on disk. Never iCloud.
        sources = sorted((p for p in r["derivatives"] if os.path.exists(p)), key=os.path.getsize, reverse=True)
        if not sources and r["original"] and os.path.exists(r["original"]):
            sources = [r["original"]]
        for src in sources:
            try:
                with Image.open(src) as im:
                    im = ImageOps.exif_transpose(im).convert("RGB")
                    im.thumbnail((1024, 1024), Image.LANCZOS)
                    im.save(dest, "JPEG", quality=80, optimize=True)
                made += 1
                break
            except Exception:
                continue
        else:
            r["preview"] = None
            skipped += 1
    save_json(td / "photos.json", rows)
    size = sum(f.stat().st_size for f in out.iterdir()) / 1e6
    print(f"{made} new previews, {skipped} with no local copy (left out), previews folder {size:.0f} MB.")


# ── sheets ───────────────────────────────────────────────────────────────────
def contact_sheet(items, path, cols=6, tile=300):
    from PIL import Image, ImageDraw
    rows_n = (len(items) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tile, rows_n * (tile + 24)), "white")
    d, f = ImageDraw.Draw(sheet), font(18)
    for k, (img_path, label) in enumerate(items):
        x, y = (k % cols) * tile, (k // cols) * (tile + 24)
        try:
            with Image.open(img_path) as im:
                im.thumbnail((tile - 6, tile - 6))
                sheet.paste(im, (x + 3 + (tile - 6 - im.width) // 2, y + 3 + (tile - 6 - im.height) // 2))
        except Exception:
            pass
        d.text((x + 4, y + tile - 2), label[:34], fill="black", font=f)
    sheet.save(path, quality=72)


def scene_sample(day, per_scene):
    """For very big trips: split the day into scenes at 5-minute gaps and keep the best few of each,
    plus every favourite. Keeps coverage of every place, at the cost of missing some good shots."""
    scenes, last = [], None
    for r in sorted(day, key=lambda r: r["t"]):
        t = dt.datetime.fromisoformat(r["t"])
        if not scenes or (t - last).total_seconds() > 300:
            scenes.append([])
        scenes[-1].append(r)
        last = t
    keep = set()
    for sc in scenes:
        keep |= {r["uuid"] for r in sorted(sc, key=lambda r: -r["rank"])[:per_scene]}
        keep |= {r["uuid"] for r in sc if r["favorite"]}
    return [r for r in sorted(day, key=lambda r: r["t"]) if r["uuid"] in keep]


def cmd_sheets(a) -> None:
    td = trip_dir(a.slug)
    rows = [r for r in (load_json(td / "photos.json") or []) if r.get("preview")]
    if not rows:
        sys.exit("Run `find` and `previews` first.")
    out = td / "sheets"
    out.mkdir(exist_ok=True)
    for f in out.glob("*.jpg"):  # replace only this kind of sheet (day sheets or batch sheets)
        if f.name.startswith("batch_") == bool(a.batches):
            f.unlink()
    cam = lambda r: {"unknown": "?"}.get(r["camera"], r["camera"].split()[0][:6])
    lab = lambda r: f'{r["n"]} {r["t"][11:16]} {cam(r)}{" *" if r["favorite"] else ""}'
    made = []
    if a.batches:
        batches = load_json(td / "batches.json")["batches"]
        for i, b in enumerate(x for x in batches if "check" in x):
            rs = sorted((r for r in rows if r["batch"] == b["batch"]), key=lambda r: r["t"])
            step = max(1, len(rs) // 18)
            items = [(td / r["preview"], f'{r["n"]} {r["t"][5:16]}') for r in rs[::step][:18]]
            if items:
                p = out / f"batch_{i:02d}.jpg"
                contact_sheet(items, p)
                made.append(f"{p.name}: {b['batch']}")
    else:
        # Every distinct moment by default: Photos' quality score is a poor guide to which shots we like
        # (on the Barcelona trip it ranked the Passion Tower stairs 141st of 194 that day).
        for label, _ in day_slots(load_trip(a.slug)[0]):
            day = [r for r in rows if r["slot"] == label and r["moment"] == r["uuid"]]
            top = scene_sample(day, a.per_scene) if a.per_scene else sorted(day, key=lambda r: r["t"])
            for s in range(0, len(top), 30):
                safe = re.sub(r"\W+", "_", label).strip("_")
                p = out / f"{safe}_{s // 30}.jpg"
                contact_sheet([(td / r["preview"], lab(r)) for r in top[s:s + 30]], p)
                made.append(f"{p.name}: {label}, {len(top[s:s + 30])} of {len(day)} moments")
    print("\n".join(str(out / m) for m in made) or "No sheets made.")


# ── review page ──────────────────────────────────────────────────────────────
def cmd_review(a) -> None:
    trip, _, _ = load_trip(a.slug)
    td = trip_dir(a.slug)
    rows = [r for r in (load_json(td / "photos.json") or []) if r.get("preview")]
    short = load_json(td / "shortlist.json", {})          # {uuid: {"slot": "...", "reason": "..."}}
    labels = [label for label, _ in day_slots(trip)]
    options = ["—"] + labels + ["Gallery", "Hero"]

    def card(r, s):
        opts = "".join(f'<option{" selected" if o == (s or {}).get("slot") else ""}>{html.escape(o)}</option>'
                       for o in options)
        why = (f'<p class="why">{html.escape(s.get("reason", ""))}</p>') if s else ""
        return (f'<figure class="card{" short" if s else ""}" data-uuid="{r["uuid"]}" data-n="{r["n"]}">'
                f'<a href="{r["preview"]}" target="_blank"><img src="{r["preview"]}" loading="lazy" alt=""></a>'
                f'<figcaption><label class="pick"><input type="checkbox"> <b>#{r["n"]}</b> '
                f'<span class="time">{r["t"][11:16]}</span></label>'
                f'<select aria-label="Where it goes">{opts}</select>{why}</figcaption></figure>')

    secs = []
    for day in trip.get("days_plan", []):
        label = day["label"]
        rs = [r for r in rows if r["slot"] == label]
        have = len(day.get("photos", []))
        sl = [r for r in rs if r["uuid"] in short]
        rest = [r for r in rs if r["uuid"] not in short]
        secs.append(f"""<section><h2>{html.escape(label)} <span>{html.escape(day.get("date", ""))} · {html.escape(day.get("title", ""))}</span></h2>
<p class="note">{"Already has " + str(have) + " photo(s) on the site." if have else "No photos on the site yet."}</p>
<div class="grid">{"".join(card(r, short[r["uuid"]]) for r in sl) or '<p class="note">Nothing shortlisted.</p>'}</div>
<details><summary>All {len(rs)} photos from this day</summary><div class="grid small">{"".join(card(r, None) for r in rest)}</div></details></section>""")

    page = REVIEW_TEMPLATE.replace("{{TITLE}}", html.escape(trip["title"])).replace("{{COUNT}}", str(len(short))) \
        .replace("{{SECTIONS}}", "".join(secs))
    (td / "review.html").write_text(page, encoding="utf-8")
    print(f"Wrote {td / 'review.html'} ({len(rows)} photos, {len(short)} shortlisted). Open it with `serve`.")


REVIEW_TEMPLATE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Trip Photo Picks</title><style>
:root{--bg:#faf8f5;--fg:#222;--muted:#6b6660;--card:#fff;--line:#e6e1da;--accent:#b4532a;--pick:#2f7d4f}
@media (prefers-color-scheme:dark){:root{--bg:#1b1a19;--fg:#eee;--muted:#a8a29c;--card:#262422;--line:#3a3734;--accent:#e08a5f;--pick:#5fc28a}}
*{box-sizing:border-box}body{margin:0;font:15px/1.45 -apple-system,system-ui,sans-serif;background:var(--bg);color:var(--fg)}
header{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
header h1{font-size:18px;margin:0;flex:1 1 auto}#count{font-weight:400;color:var(--muted)}
button{font:inherit;padding:8px 14px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer}
button.ghost{background:transparent;color:var(--accent)}main{max-width:1400px;margin:0 auto;padding:8px 16px 80px}
.intro,.note{color:var(--muted)}section{margin-top:28px}h2{font-size:20px;margin:0 0 4px}h2 span{font-weight:400;color:var(--muted);font-size:15px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;align-items:start}
.grid.small{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-top:12px}
.card{margin:0;background:var(--card);border:2px solid var(--line);border-radius:10px;overflow:hidden}
.card.short{border-color:var(--accent)}.card.chosen{border-color:var(--pick);box-shadow:0 0 0 2px var(--pick)}
.card img{display:block;width:100%;height:auto;max-height:340px;object-fit:contain;background:#0001}.small .card img{max-height:200px}
figcaption{padding:8px 10px;display:grid;gap:6px}.pick{display:flex;gap:6px;align-items:center;cursor:pointer}.pick input{width:18px;height:18px}
.time{color:var(--muted);font-size:13px}select{font:inherit;font-size:13px;padding:3px}.why{margin:0;font-size:13px}
details{margin-top:12px}summary{cursor:pointer;color:var(--accent)}#msg{width:100%;color:var(--pick);font-weight:600}
#out{width:100%;height:110px;font:12px ui-monospace,monospace;display:none}
</style></head><body>
<header><h1>{{TITLE}}: pick your photos <span id="count">(0 picked)</span></h1>
<button id="save">Save my picks</button><button class="ghost" id="all">Tick whole shortlist</button><div id="msg"></div></header>
<main><p class="intro">{{COUNT}} shortlisted photos are outlined, with where each would go and why. Tick the ones you want,
change where they go with the menu if you like, then press <b>Save my picks</b> and tell Claude you're done.
Click a photo to see it larger.</p><textarea id="out" readonly></textarea>{{SECTIONS}}</main>
<script>
const cards=[...document.querySelectorAll('.card')];
function refresh(){let c=0;cards.forEach(f=>{const on=f.querySelector('input').checked;f.classList.toggle('chosen',on);if(on)c++});
document.getElementById('count').textContent='('+c+' picked)'}
cards.forEach(f=>{f.querySelector('input').addEventListener('change',refresh);
 f.querySelector('select').addEventListener('change',e=>{if(e.target.value!=='—'){f.querySelector('input').checked=true;refresh()}})});
document.getElementById('all').onclick=()=>{document.querySelectorAll('.card.short input').forEach(b=>b.checked=true);refresh()};
document.getElementById('save').onclick=async()=>{
 const picks=cards.filter(f=>f.querySelector('input').checked).map(f=>{const s=f.querySelector('select').value;
  const sec=f.closest('section').querySelector('h2').firstChild.textContent.trim();
  return {uuid:f.dataset.uuid,n:+f.dataset.n,slot:s==='—'?sec:s}});
 const msg=document.getElementById('msg');
 try{const r=await fetch('/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(picks)});
  if(!r.ok)throw 0;msg.textContent='Saved '+picks.length+' picks. Tell Claude you\\'re done.'}
 catch(e){const o=document.getElementById('out');o.value=JSON.stringify(picks);o.style.display='block';o.select();
  try{await navigator.clipboard.writeText(o.value)}catch(_){document.execCommand('copy')}
  msg.textContent='Couldn\\'t save from here, so your picks are copied: paste them to Claude.'}};
</script></body></html>"""


def cmd_serve(a) -> None:
    td = trip_dir(a.slug)
    if not (td / "review.html").exists():
        sys.exit("Run `review` first.")

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kw):
            super().__init__(*args, directory=str(td), **kw)

        def do_POST(self):
            if self.path != "/save":
                return self.send_error(404)
            picks = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            old = {p["uuid"]: p for p in load_json(td / "picks.json", [])}
            for p in picks:  # keep any key/alt/crop Claude already wrote for a photo that's still picked
                p.update({k: v for k, v in old.get(p["uuid"], {}).items() if k not in p})
            save_json(td / "picks.json", picks)
            print(f"Saved {len(picks)} picks to {td / 'picks.json'}", flush=True)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")

        def log_message(self, *args):
            pass

    srv = http.server.ThreadingHTTPServer(("127.0.0.1", a.port), Handler)
    url = f"http://127.0.0.1:{a.port}/review.html"
    print(f"Review page: {url}  (Ctrl-C to stop)", flush=True)
    if not a.no_open:
        webbrowser.open(url)
    srv.serve_forever()


# ── export ───────────────────────────────────────────────────────────────────
def cmd_export(a) -> None:
    td = trip_dir(a.slug)
    picks = load_json(td / "picks.json") or sys.exit("No picks.json yet: save picks from the review page first.")
    out = td / "picks"
    out.mkdir(exist_ok=True)
    todo = [p["uuid"] for p in picks if not find_export(out, p["uuid"])]
    if not todo:
        print(f"All {len(picks)} picks already exported to {out}.")
        return
    (td / "picks.txt").write_text("\n".join(todo) + "\n")
    osxphotos = pathlib.Path(sys.executable).with_name("osxphotos")
    cmd = [str(osxphotos), "export", str(out), "--uuid-from-file", str(td / "picks.txt"),
           "--download-missing",          # fetch from iCloud through Photos, for these picks only
           "--convert-to-jpeg", "--skip-original-if-edited", "--skip-live", "--skip-raw",
           "--filename", "{uuid}"]
    subprocess.run(cmd, check=True)
    missing = [p["uuid"] for p in picks if not find_export(out, p["uuid"])]
    size = sum(f.stat().st_size for f in out.iterdir() if f.is_file()) / 1e6
    print(f"Exported to {out} ({size:.0f} MB)." + (f" Not exported: {missing}" if missing else ""))


def find_export(folder: pathlib.Path, uuid: str):
    files = sorted((f for f in folder.glob(f"{uuid}*") if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".heic")),
                   key=lambda f: "_edited" not in f.stem)  # prefer the edited version
    return files[0] if files else None


# ── publish ──────────────────────────────────────────────────────────────────
def web_image(src: pathlib.Path, crop=None):
    """Open, orient, convert to sRGB and copy into a fresh image (so no EXIF/XMP/GPS can survive)."""
    from PIL import Image, ImageCms, ImageOps
    with Image.open(src) as im:
        icc = im.info.get("icc_profile")
        im = ImageOps.exif_transpose(im)
        if icc:
            im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)),
                                           ImageCms.createProfile("sRGB"), outputMode="RGB")
        im = im.convert("RGB")
    if crop:  # [left, top, right, bottom] as fractions of the photo
        w, h = im.size
        im = im.crop((round(crop[0] * w), round(crop[1] * h), round(crop[2] * w), round(crop[3] * h)))
    clean = Image.new("RGB", im.size)
    clean.paste(im)
    return clean


def save_sizes(im, key: str, widths) -> tuple[int, int, int]:
    from PIL import Image
    widths = sorted({min(w, im.width) for w in widths})
    dims = {}
    for w in widths:
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if im.width > w else im
        r.save(IMG_DIR / f"{key}-{w}.jpg", quality=80, optimize=True, progressive=True)
        r.save(IMG_DIR / f"{key}-{w}.webp", quality=76, method=6)
        dims[w] = r.size
    first = widths[0]
    return dims[first][0], dims[first][1], widths[-1]


def load_build_module():
    spec = importlib.util.spec_from_file_location("site_build", BUILD_PY)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def block_bounds(lines, start_pat):
    s = next(i for i, l in enumerate(lines) if re.match(start_pat, l))
    e = next(i for i in range(s + 1, len(lines)) if lines[i].startswith("}"))
    return s, e


def update_photos(text: str, entries: dict, title: str) -> str:
    lines = text.split("\n")
    s, e = block_bounds(lines, r"^PHOTOS = \{")
    new = []
    for key, (w, h, big, alt) in entries.items():
        line = f'    {json.dumps(key)}: ({w}, {h}, {big}, {json.dumps(alt, ensure_ascii=False)}, ""),'
        hit = next((i for i in range(s, e) if lines[i].startswith(f"    {json.dumps(key)}:")), None)
        if hit is not None:
            lines[hit] = line
        else:
            new.append(line)
    if new:
        lines[e:e] = [f"    # {title}: our own photos (resized, no EXIF/GPS)"] + new
    return "\n".join(lines)


def update_trip_photos(text: str, name: str, hero: str, place: str, gallery: list[str]) -> str:
    lines = text.split("\n")
    s, e = block_bounds(lines, r"^TRIP_PHOTOS = \{")
    gal = ", ".join(json.dumps(k) for k in gallery)
    head = f'    {json.dumps(name)}: {{"hero": {json.dumps(hero)}, "place": {json.dumps(place, ensure_ascii=False)},'
    pad = " " * (len(f'    {json.dumps(name)}: {{'))
    if len(head) + len(gal) + 16 <= 110:
        entry = [f'{head} "gallery": [{gal}]}},']
    else:
        items, cur, out = [json.dumps(k) for k in gallery], "", []
        for it in items:
            if cur and len(cur) + len(it) + 2 > 90:
                out.append(cur + ",")
                cur = it
            else:
                cur = f"{cur}, {it}" if cur else it
        out.append(cur)
        entry = [head, f'{pad}"gallery": [{out[0]}'] + [f"{pad}            {o}" for o in out[1:]]
        entry[-1] += "]},"
    i = next((i for i in range(s, e) if lines[i].startswith(f"    {json.dumps(name)}:")), None)
    if i is None:
        lines[e:e] = entry
    else:
        j, depth = i, 0
        while True:  # the entry may span several lines; find where its braces close
            depth += lines[j].count("{") + lines[j].count("[") - lines[j].count("}") - lines[j].count("]")
            if depth <= 0:
                break
            j += 1
        lines[i:j + 1] = entry
    return "\n".join(lines)


def cmd_publish(a) -> None:
    trip, trip_path, raw = load_trip(a.slug)
    td = trip_dir(a.slug)
    picks = load_json(td / "picks.json") or sys.exit("No picks.json yet.")
    problems = [f'#{p.get("n")} needs a "key" and an "alt"' for p in picks if not (p.get("key") and p.get("alt"))]
    problems += [f'#{p.get("n")}: unknown slot "{p["slot"]}"' for p in picks
                 if p["slot"] not in {d["label"] for d in trip["days_plan"]} | {"Gallery", "Hero"}]
    problems += [f'#{p.get("n")}: not exported yet' for p in picks if not find_export(td / "picks", p["uuid"])]
    keys = collections.Counter(p.get("key") for p in picks)
    problems += [f'key "{k}" used twice' for k, c in keys.items() if k and c > 1]
    if sum(p["slot"] == "Hero" for p in picks) > 1:
        problems.append("more than one photo is marked Hero")
    if problems:
        sys.exit("Fix picks.json first:\n  " + "\n  ".join(problems))

    entries = {}
    for p in picks:
        im = web_image(find_export(td / "picks", p["uuid"]), p.get("crop"))
        widths = (800, 1600, 2400) if p["slot"] == "Hero" else (800, 1200)
        if a.dry_run:
            entries[p["key"]] = (800, round(im.height * 800 / im.width), min(im.width, widths[-1]), p["alt"])
        else:
            entries[p["key"]] = (*save_sizes(im, p["key"], widths), p["alt"])

    # itinerary: append each day's new photos after the ones already there
    for d in trip["days_plan"]:
        add = [p["key"] for p in picks if p["slot"] == d["label"]]
        if add:
            d["photos"] = list(dict.fromkeys(d.get("photos", []) + add))

    site = load_build_module()
    name = trip.get("hero") or a.slug.split("-")[0]
    current = site.TRIP_PHOTOS.get(name, {})
    hero = next((p["key"] for p in picks if p["slot"] == "Hero"), current.get("hero"))
    if not hero:
        sys.exit(f'This trip has no hero photo yet: mark one pick as "Hero".')
    place = next((p.get("place") for p in picks if p["slot"] == "Hero" and p.get("place")), None) \
        or current.get("place") or trip.get("country", "")
    gallery = list(dict.fromkeys(current.get("gallery", []) + [p["key"] for p in picks if p["slot"] == "Gallery"]))
    if a.gallery_order:
        gallery = a.gallery_order.split(",")
    trip["hero"] = name

    text = update_photos(BUILD_PY.read_text(encoding="utf-8"), entries, trip["title"])
    text = update_trip_photos(text, name, hero, place, gallery)
    if a.dry_run:
        print(text[text.index("TRIP_PHOTOS = {"):text.index("TRIP_PHOTOS = {") + 900])
        print({d["label"]: d.get("photos") for d in trip["days_plan"]})
        return
    BUILD_PY.write_text(text, encoding="utf-8")
    write_trip(trip_path, trip, raw)
    print(f"Added {len(entries)} photos to {BUILD_PY.relative_to(REPO)} and {trip_path.relative_to(REPO)}.")
    for w in layout_warnings(trip, gallery, entries):
        print("  ! " + w)
    print("Next: `verify`, then check the page in a browser at phone and desktop width.")


def layout_warnings(trip, gallery, entries=None):
    site = None
    out = []
    for d in trip["days_plan"]:
        ph = d.get("photos", [])
        if len(ph) > 4:
            out.append(f'{d["label"]} has {len(ph)} photos; more than 4 makes a ragged strip. Move some to the gallery.')
        if len(ph) == 1:
            k = ph[0]
            w, h = (entries or {}).get(k, (None, None))[:2] if entries and k in entries else (None, None)
            if w is None:
                site = site or load_build_module()
                w, h = site.PHOTOS[k][:2]
            if h > w * 0.8:
                out.append(f'{d["label"]} has one tall photo ({k}); the page crops it to 4:3 around the middle. '
                           'If that cuts a face or sign, set "crop" for it in picks.json and publish again.')
    if gallery and len(gallery) not in GALLERY_GOOD_COUNTS:
        out.append(f"The gallery has {len(gallery)} photos; 5, 8 or 11 fill the grid with no gaps.")
    return out


# ── verify ───────────────────────────────────────────────────────────────────
def cmd_verify(a) -> None:
    from PIL import Image
    trip, _, _ = load_trip(a.slug)
    r = subprocess.run([sys.executable, str(BUILD_PY)], cwd=REPO, capture_output=True, text=True)
    if r.returncode:
        sys.exit("build.py failed:\n" + r.stderr[-2000:])
    page = (REPO / "site" / "itineraries" / a.slug / "index.html").read_text(encoding="utf-8")
    share = re.search(r'property="og:image" content="[^"]*/assets/img/([\w.-]+)"', page)
    if share and not (IMG_DIR / share.group(1)).exists():
        print(f"  ! The share-preview image (og:image) {share.group(1)} doesn't exist, so links to this page "
              "show no picture. build.py asks for the hero at 1600px; give the hero a 1600px version.")
    page = re.sub(r'<meta property="og:image"[^>]*>', "", page)
    files = sorted(set(re.findall(r"/assets/img/([\w.-]+\.(?:jpg|webp))", page)))
    bad, meta = [], []
    for f in files:
        p = IMG_DIR / f
        try:
            with Image.open(p) as im:
                im.load()
                if len(im.getexif()) or {"exif", "xmp"} & set(im.info):
                    meta.append(f)
        except Exception:
            bad.append(f)
    site = load_build_module()
    ph = site.TRIP_PHOTOS.get(trip.get("hero"), {})
    print(f"Built the site. The trip page uses {len(files)} image files: "
          f"{'all load' if not bad else 'BROKEN: ' + ', '.join(bad)}; "
          f"{'none carry EXIF/XMP' if not meta else 'METADATA in: ' + ', '.join(meta)}.")
    print("Photos per day: " + ", ".join(f'{d["label"]} {len(d.get("photos", []))}' for d in trip["days_plan"])
          + f"; gallery {len(ph.get('gallery', []))}; hero {ph.get('hero')}.")
    for w in layout_warnings(trip, ph.get("gallery", [])):
        print("  ! " + w)
    if bad or meta:
        sys.exit(1)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("find", "previews", "sheets", "review", "serve", "export", "publish", "verify"):
        sp = sub.add_parser(name)
        sp.add_argument("slug", help="itinerary file name without .json, e.g. italy-2026")
        if name == "find":
            sp.add_argument("--pad-days", type=int, default=3, help="also search this many days either side")
            sp.add_argument("--library", help="path to a Photos library (default: the system library)")
        if name == "sheets":
            sp.add_argument("--per-scene", type=int, default=0,
                            help="big trips only: keep the best N per scene instead of every moment")
            sp.add_argument("--batches", action="store_true", help="sample sheets of cameras with no GPS")
        if name == "serve":
            sp.add_argument("--port", type=int, default=8765)
            sp.add_argument("--no-open", action="store_true")
        if name == "publish":
            sp.add_argument("--dry-run", action="store_true")
            sp.add_argument("--gallery-order", help="comma-separated keys: the whole gallery, in order")
    a = ap.parse_args()
    globals()[f"cmd_{a.cmd}"](a)


if __name__ == "__main__":
    main()
