#!/usr/bin/env python3
"""Build the My Life Happens Travel site.

Reads every trip in content/itineraries/*.json and writes plain HTML into site/:

    site/index.html                      home page
    site/itineraries/index.html          all itineraries (filter by region)
    site/itineraries/<slug>/index.html   one page per trip
    site/about/index.html                about us
    site/404.html, site/sitemap.xml

Run it after adding or editing a trip:   python3 tools/build.py
Only the Python standard library is needed. The generated HTML is committed, so Netlify
just publishes the site/ folder; no build step runs there.
"""
from __future__ import annotations

import datetime as dt
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
CONTENT = ROOT / "content" / "itineraries"
DOMAIN = "https://mylifehappens.com"
INSTAGRAM = "https://www.instagram.com/mylifehappenstravel"
YOUTUBE = "https://www.youtube.com/@MyLifeHappensTravel"
VIDEOS: list[dict] = []  # filled from content/videos.json in main()

# ── Photos ────────────────────────────────────────────────────────────────────
# key: (width, height of the 800px version, largest width available, alt text, credit or "")
# Files live in site/assets/img/<key>-<width>.{jpg,webp}; widths are 800, 1600 and sometimes 2400.
PHOTOS = {
    "valley-of-fire-1": (800, 450, 2400, "Taking photos on the striped red and white sandstone at Valley of Fire, Nevada", ""),
    "valley-of-fire-2": (800, 450, 1600, "Red sandstone domes under a blue sky at Valley of Fire, Nevada", ""),
    "valley-of-fire-3": (800, 450, 1600, "Rippled red rock formations at Valley of Fire State Park", ""),
    "valley-of-fire-4": (800, 450, 1600, "Wind-carved red rocks and desert scrub at Valley of Fire", ""),
    "valley-of-fire-5": (800, 450, 1600, "Red rock outcrops at Valley of Fire State Park", ""),
    "valley-of-fire-6": (800, 1422, 1600, "Smiling from inside a sandstone arch at Valley of Fire", ""),
    "valley-of-fire-7": (800, 1422, 1600, "Arms up on top of a red rock at Valley of Fire", ""),
    "florence-arno": (800, 534, 2400, "The Arno at sunset in Florence, with the Ponte Vecchio and the Uffizi along the river", ""),
    "florence-street": (640, 1136, 800, "A golden Florentine street of shuttered palazzi", ""),
    "florence-coffee": (640, 1136, 800, "A cappuccino at a Florence café", ""),
    "rome-colosseum": (800, 533, 1600, "The Colosseum in Rome on a bright day", "Unsplash"),
    "calistoga": (800, 533, 800, "Arms raised in the vineyard at Bennett Lane Winery, Calistoga", ""),
    "golden-gate": (800, 450, 1600, "The Golden Gate Bridge over turquoise water", "Unsplash"),
    "vegas-sign": (800, 600, 1600, "The Welcome to Fabulous Las Vegas sign at night", "Unsplash"),
    "vegas-strip": (800, 1200, 1600, "The Las Vegas Strip lit up at night", "Unsplash"),
    "ireland-castle": (800, 533, 1600, "An ivy-covered castle ruin in the green Irish countryside", "Unsplash"),
    "barcelona-montjuic": (800, 450, 1600, "Montjuïc and the National Palace in Barcelona under a fiery sunset", "Unsplash"),
    "in-flight": (800, 800, 800, "A window seat, ready for take-off", ""),
    # our own photos of the two of us, from the travel-selfies folder (GPS removed)
    "bcn-first-afternoon": (800, 1422, 1200, "Tony and Sharon on their first afternoon in Barcelona", ""),
    "bcn-arc-de-triomf": (800, 1422, 1200, "Tony and Sharon in front of the Arc de Triomf, Barcelona", ""),
    "mallorca-sunset": (800, 1422, 1200, "Tony and Sharon at sunset over Camp de Mar, Mallorca", ""),
    "ita-easter-gelato": (800, 1422, 1200, "Easter Sunday gelato in Florence", ""),
    "ita-colosseum": (800, 1422, 1200, "Tony and Sharon at the Colosseum, Rome", ""),
    "ita-pantheon": (800, 1422, 1200, "Tony and Sharon in front of the Pantheon, Rome", ""),
    "ita-trevi": (800, 1422, 1200, "Tony and Sharon at the Trevi Fountain, Rome", ""),
    "ita-venice-canal": (800, 1422, 1200, "Tony and Sharon beside a canal in Venice", ""),
    "ita-venice-boat": (800, 1422, 1200, "Tony and Sharon on a boat on a Venice canal", ""),
    "cal-mount-tamalpais": (800, 1422, 1200, "Tony and Sharon on the Mount Tamalpais and Muir Woods day", ""),
    "cal-vineyard": (800, 1422, 1200, "Tony and Sharon in a Calistoga vineyard", ""),
    "cal-wine": (800, 1067, 1200, "Tony and Sharon with a glass of wine each in Calistoga", ""),
    "veg-casino": (800, 1422, 1200, "Tony and Sharon on a Saturday night in Las Vegas", ""),
    "veg-sign": (800, 1422, 1200, "Tony and Sharon by a Welcome to Fabulous Las Vegas sign at the Grand Canal Shoppes", ""),
    "veg-neon": (800, 1422, 1200, "Tony and Sharon under the neon at the Grand Canal Shoppes", ""),
    "zafiro-pool": (800, 533, 1086, "Relaxing by our private plunge pool at Zafiro Palace Andratx, with the hills of Camp de Mar beyond", ""),
    "zafiro-cocktail": (724, 1086, 724, "A cocktail and a book on the sun deck at Zafiro Palace Andratx", ""),
    "zafiro-sunhat": (724, 1086, 724, "Sun hat on, by the pool at Zafiro Palace Andratx, Mallorca", ""),
}

# Per-trip photos: the hero (big photo at the top) and an optional gallery.
TRIP_PHOTOS = {
    "barcelona": {"hero": "zafiro-pool", "place": "Zafiro Palace Andratx, Mallorca", "gallery": []},
    "italy": {"hero": "florence-arno", "place": "The Arno, Florence", "gallery": ["florence-street", "florence-coffee"]},
    "vegas": {"hero": "valley-of-fire-3", "place": "Valley of Fire, Nevada",
              "gallery": ["valley-of-fire-1", "valley-of-fire-6", "valley-of-fire-2", "valley-of-fire-7", "vegas-sign"]},
    "california": {"hero": "golden-gate", "place": "Golden Gate Bridge, San Francisco", "gallery": ["calistoga"]},
    "ireland": {"hero": "ireland-castle", "place": "The Irish countryside", "gallery": []},
}

e = html.escape


def picture(key: str, sizes: str, cls: str = "", lazy: bool = True, alt: str | None = None, priority: bool = False) -> str:
    w, h, big, default_alt, _credit = PHOTOS[key]
    widths = sorted({x for x in (800, 1600, 2400) if x <= big} | {big}) if big >= 800 else [800]
    src = lambda ext: ", ".join(f"/assets/img/{key}-{x}.{ext} {x if x > 800 else w}w" for x in widths)
    loading = ' loading="lazy" decoding="async"' if lazy else ""
    fp = ' fetchpriority="high"' if priority else ""
    return (f'<picture class="{cls}"><source type="image/webp" srcset="{src("webp")}" sizes="{sizes}">'
            f'<img src="/assets/img/{key}-800.jpg" srcset="{src("jpg")}" sizes="{sizes}" width="{w}" height="{h}" '
            f'alt="{e(default_alt if alt is None else alt)}"{loading}{fp}></picture>')


# ── Dates ─────────────────────────────────────────────────────────────────────
def parse(d: str):
    return dt.date.fromisoformat(d) if d else None


def date_range(t: dict) -> str:
    s, f = parse(t.get("start", "")), parse(t.get("end", ""))
    if not s:
        return ""
    if not f or f == s:
        return f"{s:%b} {s.day}, {s.year}"
    if s.year != f.year:
        return f"{s:%b} {s.day}, {s.year} – {f:%b} {f.day}, {f.year}"
    if s.month != f.month:
        return f"{s:%b} {s.day} – {f:%b} {f.day}, {f.year}"
    return f"{s:%b} {s.day}–{f.day}, {s.year}"


def month_year(t: dict) -> str:
    s = parse(t.get("start", ""))
    return f"{s:%B %Y}" if s else ""


# ── Shared page chrome ────────────────────────────────────────────────────────
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500'
         '&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">')


def head(title: str, desc: str, path: str, image: str = "valley-of-fire-1", noindex: bool = False, extra: str = "") -> str:
    full = title if "My Life Happens" in title else f"{title} · My Life Happens Travel"
    robots = '<meta name="robots" content="noindex">' if noindex else f'<link rel="canonical" href="{DOMAIN}{path}">'
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(full)}</title>
<meta name="description" content="{e(desc)}">
{robots}
<meta property="og:type" content="website">
<meta property="og:site_name" content="My Life Happens Travel">
<meta property="og:title" content="{e(full)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{DOMAIN}{path}">
<meta property="og:image" content="{DOMAIN}/assets/img/{image}-1600.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#faf6ef">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
{FONTS}
<link rel="stylesheet" href="/assets/css/site.css">
{extra}<script src="/assets/js/site.js" defer></script>
</head>
"""


NAV = [("/itineraries/", "Itineraries"), ("/about/", "About us"), ("/#gear", "Gear")]


def header(current: str = "", over_photo: bool = False) -> str:
    links = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if href == current else ""}>{label}</a>' for href, label in NAV)
    return f"""<a class="skip" href="#main">Skip to content</a>
<header class="site-header{' over-photo' if over_photo else ''}">
  <div class="wrap">
    <a class="brand" href="/" aria-label="My Life Happens Travel, home">
      <svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20"/><path d="M8 27 L16 15 L21 22 L25 17 L32 27 Z" fill="currentColor"/><circle cx="27" cy="12" r="3" fill="currentColor"/></svg>
      <span class="brand-name">My Life Happens<em>Travel</em></span>
    </a>
    <button class="menu-btn" aria-expanded="false" aria-controls="site-nav"><span class="sr">Menu</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      {links}
      <a class="nav-ig" href="{INSTAGRAM}" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="dot"/></svg><span class="sr-sm">Instagram</span></a>
      <a class="nav-ig" href="{YOUTUBE}" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.5v5l4.5-2.5z" class="dot"/></svg><span class="sr-sm">YouTube</span></a>
    </nav>
  </div>
</header>
"""


def footer(trips: list[dict]) -> str:
    trip_links = "".join(f'<li><a href="/itineraries/{t["slug"]}/">{e(t["title"])}</a></li>' for t in trips)
    return f"""<section class="signup" aria-labelledby="signup-h">
  <div class="wrap signup-inner">
    <div>
      <span class="eyebrow">Never miss a trip</span>
      <h2 id="signup-h">Get our next itinerary <em>in your inbox.</em></h2>
      <p>One email when a new trip goes up. That's it.</p>
    </div>
    <form name="newsletter" method="POST" action="/thanks/" data-netlify="true" netlify-honeypot="company" class="signup-form">
      <input type="hidden" name="form-name" value="newsletter">
      <p class="hp"><label>Leave this empty <input name="company"></label></p>
      <label class="sr" for="signup-email">Email address</label>
      <input id="signup-email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required>
      <button class="btn primary" type="submit">Sign me up</button>
    </form>
  </div>
</section>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <a class="brand" href="/"><svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20"/><path d="M8 27 L16 15 L21 22 L25 17 L32 27 Z" fill="currentColor"/><circle cx="27" cy="12" r="3" fill="currentColor"/></svg><span class="brand-name">My Life Happens<em>Travel</em></span></a>
      <p>Real trips, planned down to the dinner reservation, by Tony &amp; Sharon. Life is made for exploring.</p>
    </div>
    <div>
      <h3>Itineraries</h3>
      <ul>{trip_links}<li><a href="/itineraries/">All itineraries →</a></li></ul>
    </div>
    <div>
      <h3>More</h3>
      <ul>
        <li><a href="/about/">About us</a></li>
        <li><a href="/#gear">Gear we use</a></li>
        <li><a href="{INSTAGRAM}" rel="noopener">Instagram</a></li>
        <li><a href="{YOUTUBE}" rel="noopener">YouTube</a></li>
      </ul>
    </div>
    <p class="footer-base">© {dt.date.today().year} My Life Happens Travel · Some links are affiliate links: we may earn a small commission at no extra cost to you.</p>
  </div>
</footer>
</body>
</html>
"""


# ── Cards ─────────────────────────────────────────────────────────────────────
def trip_card(t: dict, size: str = "", heading: str = "h3") -> str:
    ph = TRIP_PHOTOS.get(t.get("hero", ""), {})
    sizes = "(min-width: 1100px) 560px, (min-width: 700px) 50vw, 100vw" if size == "lg" else "(min-width: 1100px) 380px, (min-width: 700px) 50vw, 100vw"
    media = picture(ph["hero"], sizes, "card-img") if ph else '<div class="card-img placeholder"></div>'
    when = date_range(t) or f'{t["days"]} days'
    return f"""<article class="card {size}" data-region="{e(t["region"])}">
  <div class="card-media">{media}<span class="badge">{t["days"]} days</span></div>
  <div class="card-body">
    <p class="card-kicker">{e(t["country"])} · {e(month_year(t) or t["region"])}</p>
    <{heading} class="card-title"><a href="/itineraries/{t["slug"]}/">{e(t["title"])}</a></{heading}>
    <p class="card-text">{e(t["summary"])}</p>
    <p class="card-when">{e(when)}</p>
  </div>
</article>"""


ICONS = {
    "clock": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    "bed": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/></svg>',
    "fork": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 1-3 4-3 7s1 4 3 4"/></svg>',
    "ticket": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>',
    "check": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10"/></svg>',
    "pin": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    "move": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8z"/></svg>',
    "play": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
    "video": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/></svg>',
    "map": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
    "bulb": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/></svg>',
}


# What kind of stop a timeline item is, for its icon (pattern from trip planners like
# Mindtrip, Tripadvisor and KAYAK: a small category icon on every stop).
KIND_RULES = [
    ("see", r"\btour\b|\bmuseum|\bclimb\b"),
    ("stay", r"\bcheck(?:ing)?[ -]?(?:in|out)\b(?! for)"),
    ("eat", r"\b(?:breakfast|brunch|lunch|dinner|dine|caf[eé]|coffee|cappuccino|espresso|gelato|tapas|pizza|restaurant|trattoria|osteria|bistro|aperitivo|negroni|tastings?|wine|winery|drinks?|cocktails?|pub|pints?|donuts?|sandwich|snack|food|eat)\b"),
    ("move", r"\b(?:fly|flight|airport|train|frecciarossa|taxi|uber|drive|car|bus|flixbus|ferry|vaporetto|water taxi|cable car|shuttle|transfer|leave|depart|land)\b"),
]
KIND_ICON = {"stay": "bed", "see": "pin", "eat": "fork", "move": "move"}
KIND_LABEL = {"stay": "Hotel", "see": "Sight", "eat": "Food & drink", "move": "Getting there"}


def item_kind(text: str) -> str:
    low = text.lower()
    for kind, rx in KIND_RULES:
        if re.search(rx, low):
            return kind
    return "see"


def video_card(v: dict, heading: str = "h3") -> str:
    vid = e(v["id"])
    return f"""<article class="video">
  <a class="yt" href="https://www.youtube.com/watch?v={vid}" data-yt="{vid}" rel="noopener" aria-label="Play video: {e(v["title"])}">
    <img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" width="480" height="360" alt="" loading="lazy" decoding="async">
    <span class="play">{ICONS["play"]}</span>
  </a>
  <p class="card-kicker">{e(v.get("place", ""))}</p>
  <{heading} class="video-title">{e(v["title"])}</{heading}>
</article>"""


# ── Pages ─────────────────────────────────────────────────────────────────────
def home(trips: list[dict]) -> str:
    latest, rest = trips[0], trips[1:]
    lph = TRIP_PHOTOS[latest["hero"]]
    glance = "".join(f'<div><dt>{e(g["label"])}</dt><dd>{e(g["value"])}</dd></div>' for g in latest.get("glance", [])[:4])
    regions: dict[str, list[dict]] = {}
    for t in trips:
        regions.setdefault(t["region"], []).append(t)
    been = "".join(
        f'<div class="region"><h3>{e(r)}</h3><ul>' + "".join(
            f'<li><a href="/itineraries/{t["slug"]}/"><span>{e(t["title"])}</span><small>{e(t["country"])} · {t["days"]} days</small></a></li>' for t in ts)
        + "</ul></div>" for r, ts in regions.items())
    total_days = sum(t["days"] for t in trips)
    return head("My Life Happens Travel · Real trips, the exact plans",
                "Day-by-day travel itineraries from trips we actually took: the hotels, the restaurants, the tickets and the timings, so you can take them too.",
                "/") + f"""<body class="home">
{header(over_photo=True)}
<main id="main">
  <section class="hero">
    {picture("valley-of-fire-1", "100vw", "hero-img", lazy=False, priority=True)}
    <div class="hero-shade"></div>
    <div class="wrap hero-content">
      <span class="eyebrow light">Tony &amp; Sharon · Travel itineraries</span>
      <h1>Real trips. <em>The exact plans.</em></h1>
      <p class="hero-lede">Every itinerary here is a trip we actually took: the hotels, the tables we booked, the tickets and the timings, day by day. Steal the whole thing, or just the best bits.</p>
      <div class="actions">
        <a class="btn primary" href="/itineraries/">Browse our itineraries</a>
        <a class="btn glass" href="/about/">Meet us</a>
      </div>
    </div>
    <p class="hero-caption">Valley of Fire, Nevada</p>
  </section>

  <section class="stats" aria-label="At a glance">
    <div class="wrap stats-row">
      <div><strong>{len(trips)}</strong><span>trips written up</span></div>
      <div><strong>{total_days}</strong><span>days planned, hour by hour</span></div>
      <div><strong>{len({t["country"] for t in trips})}</strong><span>countries</span></div>
      <div><strong>2</strong><span>travelers, one shared calendar</span></div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section-head"><div><span class="eyebrow">Latest trip</span><h2>Just back from <em>{e(latest["country"])}.</em></h2></div></div>
      <article class="feature">
        <a class="feature-media" href="/itineraries/{latest["slug"]}/" tabindex="-1" aria-hidden="true">{picture(lph["hero"], "(min-width: 960px) 60vw, 100vw", "feature-img")}<span class="badge">{latest["days"]} days</span></a>
        <div class="feature-body">
          <p class="card-kicker">{e(latest["country"])} · {e(date_range(latest))}</p>
          <h3><a href="/itineraries/{latest["slug"]}/">{e(latest["title"])}</a></h3>
          <p class="feature-sub">{e(latest.get("subtitle", ""))}</p>
          <p>{e(latest["summary"])}</p>
          <dl class="mini-glance">{glance}</dl>
          <a class="btn dark" href="/itineraries/{latest["slug"]}/">Read the itinerary →</a>
        </div>
      </article>
    </div>
  </section>

  <section class="section tint">
    <div class="wrap">
      <div class="section-head">
        <div><span class="eyebrow">Itineraries</span><h2>Where we've <em>been lately.</em></h2></div>
        <a class="more" href="/itineraries/">See all {len(trips)} itineraries →</a>
      </div>
      <div class="cards two">{"".join(trip_card(t, "lg") for t in rest)}</div>
    </div>
  </section>

  <section class="section how">
    <div class="wrap">
      <div class="section-head center"><div><span class="eyebrow">How our itineraries work</span><h2>Everything you need, <em>nothing you don't.</em></h2><p>We plan like it's a group project for two. Each write-up is the plan we actually used, tidied up for you.</p></div></div>
      <div class="how-grid">
        <div>{ICONS["clock"]}<h3>Hour by hour</h3><p>A real timeline for every day: when to leave, when to eat, when to slow down.</p></div>
        <div>{ICONS["ticket"]}<h3>What to book ahead</h3><p>The tours, tables and timed tickets that sell out, so you know what to lock in before you fly.</p></div>
        <div>{ICONS["bed"]}<h3>Where we stayed</h3><p>The hotels we chose for each base, and why they worked for the plan.</p></div>
        <div>{ICONS["fork"]}<h3>Where we ate</h3><p>Every restaurant, bar and café we'd send a friend to, organised by stop.</p></div>
      </div>
    </div>
  </section>

  <section class="section tint about-band">
    <div class="wrap split">
      <div class="about-photos">
        {picture("mallorca-sunset", "(min-width: 960px) 260px, 45vw", "ap1")}
        {picture("ita-trevi", "(min-width: 960px) 320px, 55vw", "ap2")}
      </div>
      <div>
        <span class="eyebrow">Hi, we're Tony &amp; Sharon</span>
        <h2>Two travelers, <em>one shared calendar.</em></h2>
        <p class="lede">We're the kind of travelers who have the dinner reservations sorted before the flights are even booked. Mornings are planned, afternoons stay loose, and there's always a table waiting at the end of the day.</p>
        <p>This site is where those plans live. If one of our trips looks like your kind of trip, take it.</p>
        <div class="actions"><a class="btn dark" href="/about/">More about us</a></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section-head"><div><span class="eyebrow">By region</span><h2>Pick a <em>direction.</em></h2></div></div>
      <div class="regions">{been}</div>
    </div>
  </section>

  <section class="section tint" id="gear">
    <div class="wrap split">
      <div>
        <span class="eyebrow">Gear we actually use</span>
        <h2>Pack smarter, <em>travel better.</em></h2>
        <p class="lede">Only things we've packed ourselves and would buy again.</p>
      </div>
      <div class="gear-card">
        {picture("in-flight", "(min-width: 960px) 200px, 40vw", "gear-img")}
        <div>
          <p class="card-kicker">Sleep · on the plane</p>
          <h3>Airplane Head Strap with Eye Mask</h3>
          <p>A 360° headrest that holds softly across your head instead of propping up your chin, so you don't wake up bobbing into your neighbour's shoulder.</p>
          <a class="btn dark sm" href="https://amzn.to/4s5lhJ9" rel="sponsored noopener">Shop on Amazon →</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="videos">
    <div class="wrap">
      <div class="section-head"><div><span class="eyebrow">YouTube · @MyLifeHappensTravel</span><h2>Watch the trips <em>come to life.</em></h2></div><a class="more" href="{YOUTUBE}" rel="noopener">Subscribe on YouTube →</a></div>
      <div class="videos">{"".join(video_card(v) for v in VIDEOS[:3])}</div>
    </div>
  </section>

  <section class="section tint insta">
    <div class="wrap">
      <div class="section-head"><div><span class="eyebrow">Instagram · @mylifehappenstravel</span><h2>Follow along <em>from the road.</em></h2></div><a class="more" href="{INSTAGRAM}" rel="noopener">Follow us on Instagram →</a></div>
      <div class="insta-grid">
        <a href="https://www.instagram.com/p/DM_vT1oJnyP/" rel="noopener">{picture("calistoga", "(min-width: 960px) 25vw, 50vw", alt="")}<span>Back at Bennett Lane Winery in Calistoga 🍷</span></a>
        <a href="https://www.instagram.com/p/DLySb5aRZLd/" rel="noopener">{picture("in-flight", "(min-width: 960px) 25vw, 50vw", alt="")}<span>Where am I going now?</span></a>
        <a href="{INSTAGRAM}" rel="noopener">{picture("valley-of-fire-7", "(min-width: 960px) 25vw, 50vw", alt="")}<span>Valley of Fire, Nevada</span></a>
        <a href="{INSTAGRAM}" rel="noopener">{picture("florence-street", "(min-width: 960px) 25vw, 50vw", alt="")}<span>Florence, Italy</span></a>
      </div>
    </div>
  </section>
</main>
""" + footer(trips)


def itineraries_index(trips: list[dict]) -> str:
    regions = sorted({t["region"] for t in trips})
    chips = '<button class="chip" aria-pressed="true" data-filter="all">All</button>' + "".join(
        f'<button class="chip" aria-pressed="false" data-filter="{e(r)}">{e(r)}</button>' for r in regions)
    return head("Itineraries", "Day-by-day itineraries from trips we actually took, across Europe and North America.", "/itineraries/") + f"""<body>
{header("/itineraries/")}
<main id="main">
  <section class="page-head">
    <div class="wrap">
      <span class="eyebrow">Itineraries</span>
      <h1>Every trip, <em>day by day.</em></h1>
      <p class="lede">The exact plans from trips we've taken: where we stayed, what we booked, where we ate and how we paced it. Newest first.</p>
      <div class="chips" role="group" aria-label="Filter by region">{chips}</div>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="wrap"><div class="cards three" id="trip-list">{"".join(trip_card(t, heading="h2") for t in trips)}</div></div>
  </section>
</main>
""" + footer(trips)


def itinerary(t: dict, trips: list[dict]) -> str:
    ph = TRIP_PHOTOS.get(t.get("hero", ""), {})
    slug = t["slug"]
    when = date_range(t)
    meta = [f'{t["days"]} days'] + ([when] if when else []) + [f'{t["region"]} · {t["country"]}']

    # sections that exist
    toc = []
    days_html = []
    for i, d in enumerate(t["days_plan"], 1):
        did = f"day-{i}"
        toc.append((did, d["label"], d.get("place", "")))
        items = "".join(
            f'<li class="k-{item_kind(it["text"])}"><span class="time">{e(it.get("time", ""))}</span>'
            f'<span class="k" title="{KIND_LABEL[item_kind(it["text"])]}">{ICONS[KIND_ICON[item_kind(it["text"])]]}</span><span class="what">{e(it["text"])}'
            f'{" <span class=\"booked\">" + ICONS["check"] + "Booked ahead</span>" if it.get("booked") else ""}</span></li>'
            for it in d.get("items", []))
        days_html.append(f"""<section class="day" id="{did}">
  <header class="day-head">
    <span class="day-label">{e(d["label"])}</span>
    <span class="day-meta">{e(d.get("date", ""))}{" · " if d.get("date") and d.get("place") else ""}{e(d.get("place", ""))}</span>
  </header>
  <h3>{e(d["title"])}</h3>
  {f'<p class="day-text">{e(d["text"])}</p>' if d.get("text") else ""}
  {'<div class="day-photos">' + "".join(f"<figure>{picture(k, '(min-width: 980px) 400px, 50vw')}</figure>" for k in d["photos"]) + "</div>" if d.get("photos") else ""}
  {f'<ol class="timeline">{items}</ol>' if items else ""}
  {f'<p class="tip">{ICONS["bulb"]}<span><strong>Tip:</strong> {e(d["tip"])}</span></p>' if d.get("tip") else ""}
</section>""")

    extra = []
    if t.get("stays"):
        cards = "".join(f'<li><h4>{e(s["name"])}</h4><p class="sub">{ICONS["pin"]}{e(s.get("place", ""))}{" · " + e(s["nights"]) if s.get("nights") else ""}</p>{f"<p>{e(s["note"])}</p>" if s.get("note") else ""}</li>' for s in t["stays"])
        extra.append(("stay", "Where we stayed", f'<ul class="stays">{cards}</ul>', "bed"))
    trip_videos = [v for v in VIDEOS if v["id"] in t.get("videos", [])]
    if trip_videos:
        extra.append(("video", "Watch the video", '<div class="videos one">' + "".join(video_card(v, "h4") for v in trip_videos) + "</div>", "video"))
    if t.get("eats"):
        groups: dict[str, list[dict]] = {}
        for x in t["eats"]:
            groups.setdefault(x.get("place", "") or "Around town", []).append(x)
        body = "".join(
            f'<div class="eat-group"><h4>{e(p)}</h4><ul>' + "".join(
                f'<li><strong>{e(x["name"])}</strong>{f" <span class=\"type\">{e(x["type"])}</span>" if x.get("type") else ""}{f"<p>{e(x["note"])}</p>" if x.get("note") else ""}</li>' for x in xs)
            + "</ul></div>" for p, xs in groups.items())
        extra.append(("eat", "Where we ate", f'<div class="eats">{body}</div>', "fork"))
    if t.get("book_ahead"):
        lis = "".join(f"<li>{ICONS['check']}<span>{e(b)}</span></li>" for b in t["book_ahead"])
        extra.append(("book", "Book these ahead", f'<ul class="checklist">{lis}</ul>', "ticket"))
    if t.get("tips"):
        lis = "".join(f'<li><h4>{e(x["title"])}</h4><p>{e(x["text"])}</p></li>' for x in t["tips"])
        extra.append(("tips", "Our tips", f'<ul class="tips">{lis}</ul>', "bulb"))

    extra_html = "".join(f'<section class="block" id="{i}"><h2>{ICONS[ic]}{e(h)}</h2>{b}</section>' for i, h, b, ic in extra)
    toc_html = "".join(f'<li><a href="#{i}">{e(lbl)}<small>{e(p)}</small></a></li>' for i, lbl, p in toc) + "".join(
        f'<li><a href="#{i}">{e(h)}</a></li>' for i, h, _b, _ic in extra)
    glance = "".join(f'<div><dt>{e(g["label"])}</dt><dd>{e(g["value"])}</dd></div>' for g in t.get("glance", []))
    route = ""
    if t.get("route"):
        route = '<ol class="route" aria-label="Route">' + "".join(f"<li>{e(r)}</li>" for r in t["route"]) + "</ol>"
    route_map, map_head = "", ""
    coords = t.get("map", {})
    if t.get("route") and all(r in coords for r in t["route"]):
        stops = []
        for r in t["route"]:
            if r not in [x[0] for x in stops]:
                stops.append([r, *coords[r]])
        data = json.dumps({"stops": stops, "path": [coords[r] for r in t["route"]]}, ensure_ascii=False)
        route_map = (f'<div class="route-map" data-map="{e(data)}" role="img" aria-label="Map of the route: {e(", ".join(x[0] for x in stops))}"></div>'
                     '<ol class="map-key">' + "".join(f"<li><span>{i}</span>{e(x[0])}</li>" for i, x in enumerate(stops, 1)) + "</ol>")
        map_head = ('<link rel="stylesheet" href="/assets/vendor/leaflet/leaflet.css">\n'
                    '<script src="/assets/vendor/leaflet/leaflet.js" defer></script>\n')
    gallery = ""
    if ph.get("gallery"):
        gallery = f'<div class="gallery" data-count="{len(ph["gallery"])}">' + "".join(
            f'<figure>{picture(k, "(min-width: 960px) 280px, 45vw")}</figure>' for k in ph["gallery"]) + "</div>"
    credit = PHOTOS[ph["hero"]][4] if ph else ""
    others = [x for x in trips if x["slug"] != slug][:3]
    hero_media = picture(ph["hero"], "100vw", "hero-img", lazy=False, priority=True) if ph else ""
    return head(f'{t["title"]}: {t["subtitle"]}' if t.get("subtitle") else t["title"], t["summary"], f"/itineraries/{slug}/",
                image=ph.get("hero", "valley-of-fire-1"), extra=map_head) + f"""<body class="trip">
{header("/itineraries/", over_photo=bool(ph))}
<main id="main">
  <section class="hero trip-hero{'' if ph else ' no-photo'}">
    {hero_media}
    <div class="hero-shade"></div>
    <div class="wrap hero-content">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/itineraries/">Itineraries</a><span>›</span><span>{e(t["region"])}</span><span>›</span><span>{e(t["country"])}</span></nav>
      <h1>{e(t["title"])}{f'<em>{e(t["subtitle"])}</em>' if t.get("subtitle") else ""}</h1>
      <p class="trip-meta">{"".join(f"<span>{e(m)}</span>" for m in meta)}</p>
    </div>
    {f'<p class="hero-caption">{e(ph["place"])}{" · Photo: " + credit if credit else ""}</p>' if ph else ""}
  </section>

  <div class="wrap trip-layout">
    <aside class="toc" aria-label="On this page">
      <p class="toc-title">On this page</p>
      <ol>{toc_html}</ol>
      <button class="btn ghost sm print-btn" type="button">Print this itinerary</button>
    </aside>

    <article class="trip-body">
      <p class="byline">By Tony &amp; Sharon{f" · Traveled {month_year(t)}" if month_year(t) else ""}</p>
      <div class="intro">{"".join(f"<p>{e(p)}</p>" for p in t.get("intro", []))}</div>
      {f'<dl class="glance"><p class="glance-title">At a glance</p>{glance}</dl>' if glance else ""}
      {f'<div class="route-wrap"><p class="glance-title">The route</p>{route}{route_map}</div>' if route else ""}
      {gallery}
      <h2 class="days-title">{ICONS["clock"]}The plan, day by day</h2>
      {"".join(days_html)}
      {extra_html}
    </article>
  </div>

  <section class="section tint">
    <div class="wrap">
      <div class="section-head"><div><span class="eyebrow">Keep exploring</span><h2>More <em>itineraries.</em></h2></div><a class="more" href="/itineraries/">All itineraries →</a></div>
      <div class="cards three">{"".join(trip_card(x) for x in others)}</div>
    </div>
  </section>
</main>
""" + footer(trips)


def about(trips: list[dict]) -> str:
    countries = sorted({t["country"] for t in trips})
    return head("About us", "We're Tony & Sharon, and this is where we keep the plans from every trip we take.", "/about/",
                image="ita-trevi") + f"""<body>
{header("/about/")}
<main id="main">
  <section class="page-head">
    <div class="wrap split about-top">
      <div>
        <span class="eyebrow">About us</span>
        <h1>Hi, we're <em>Tony &amp; Sharon.</em></h1>
        <p class="lede">We travel together, and we plan together: flights, hotels, tours, and above all the dinner reservations. My Life Happens Travel is where we keep those plans and share them.</p>
      </div>
      <div class="about-photos solo">{picture("cal-wine", "(min-width: 960px) 360px, 70vw", "ap1", lazy=False)}</div>
    </div>
  </section>
  <section class="section tint">
    <div class="wrap prose">
      <h2>How we travel</h2>
      <p>Our trips have a rhythm: active mornings with the big sights and the tours we've booked, looser afternoons to wander, and evenings at a table we've been looking forward to all day. We book the things that sell out well ahead, and leave room for everything else.</p>
      <h2>Why we write it all down</h2>
      <p>Every trip starts as a detailed plan: times, tickets, addresses and reservations. After we get home, we tidy that plan up and post it here, so anyone planning the same trip can borrow as much or as little of it as they like.</p>
      <h2>Where we've been</h2>
      <p>So far on the site: {", ".join(e(c) for c in countries)}, with more trips on the way.</p>
      <div class="actions"><a class="btn primary" href="/itineraries/">See our itineraries</a><a class="btn ghost" href="{INSTAGRAM}" rel="noopener">Say hi on Instagram</a></div>
    </div>
  </section>
</main>
""" + footer(trips)


def simple_page(trips, title, eyebrow, h1, lede, path, noindex=True) -> str:
    return head(title, lede, path, noindex=noindex) + f"""<body>
{header()}
<main id="main">
  <section class="page-head tall">
    <div class="wrap">
      <span class="eyebrow">{eyebrow}</span>
      <h1>{h1}</h1>
      <p class="lede">{lede}</p>
      <div class="actions"><a class="btn primary" href="/itineraries/">See all itineraries</a><a class="btn ghost" href="/">Back to the home page</a></div>
    </div>
  </section>
</main>
""" + footer(trips)


def main() -> None:
    trips = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(CONTENT.glob("*.json"))]
    # newest first; trips without dates go last
    trips.sort(key=lambda t: t.get("start") or "0000", reverse=True)
    VIDEOS[:] = sorted(json.loads((ROOT / "content" / "videos.json").read_text(encoding="utf-8")), key=lambda v: v["date"], reverse=True)

    def write(rel: str, text: str) -> None:
        p = SITE / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
        print("wrote", rel)

    write("index.html", home(trips))
    write("itineraries/index.html", itineraries_index(trips))
    for t in trips:
        write(f"itineraries/{t['slug']}/index.html", itinerary(t, trips))
    write("about/index.html", about(trips))
    write("404.html", simple_page(trips, "Page not found", "404 · page not found", "Took a <em>wrong turn.</em>",
                                  "That page isn't here. If you followed a link to our old site, the trip you're after is probably in the itineraries.", "/404"))
    write("thanks/index.html", simple_page(trips, "Thanks for signing up", "You're on the list", "Thank <em>you!</em>",
                                           "We'll email you when the next itinerary goes up.", "/thanks/"))
    urls = ["/", "/itineraries/", "/about/"] + [f"/itineraries/{t['slug']}/" for t in trips]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{DOMAIN}{u}</loc></url>\n" for u in urls) + "</urlset>\n")


if __name__ == "__main__":
    main()
