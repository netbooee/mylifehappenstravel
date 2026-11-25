"""Draw the "Where we've been" maps (world and US states) as inline SVG when the site builds.

Boundaries come from world-atlas 2.0.2 (Natural Earth 1:50m countries) and us-atlas 3.0.1
(US Census states, already projected to Albers USA), both by Mike Bostock under the ISC licence
and kept in tools/geo/ so the build never goes online. Only the standard library is used.
"""
from __future__ import annotations

import json
import math
import pathlib

GEO = pathlib.Path(__file__).resolve().parent / "geo"

# Equal Earth projection (Šavrič, Patterson & Jenny, 2018)
_A1, _A2, _A3, _A4, _M = 1.340264, -0.081106, 0.000893, 0.003796, math.sqrt(3) / 2
WORLD_W = 1000.0
_K = WORLD_W / (2 * math.pi / (_M * _A1))      # scale so the full world is WORLD_W wide
WORLD_TOP, WORLD_BOTTOM = 84.0, -57.0           # latitudes kept (no Antarctica)


def _equal_earth(lon: float, lat: float) -> tuple[float, float]:
    lam, phi = math.radians(lon), math.radians(lat)
    t = math.asin(_M * math.sin(phi))
    t2, t6 = t * t, t ** 6
    x = lam * math.cos(t) / (_M * (_A1 + 3 * _A2 * t2 + t6 * (7 * _A3 + 9 * _A4 * t2)))
    y = t * (_A1 + _A2 * t2 + t6 * (_A3 + _A4 * t2))
    return x, y


_, _Y0 = _equal_earth(0, WORLD_TOP)
WORLD_H = round((_Y0 - _equal_earth(0, WORLD_BOTTOM)[1]) * _K, 1)


def world_xy(lon: float, lat: float) -> tuple[float, float]:
    x, y = _equal_earth(lon, lat)
    return WORLD_W / 2 + x * _K, (_Y0 - y) * _K


def world_box(west: float, south: float, east: float, north: float) -> str:
    """An SVG viewBox around a lon/lat box (used for the zoomed-in views)."""
    pts = [world_xy(lo, la) for lo in (west, east, (west + east) / 2) for la in (south, north)]
    x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
    y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
    return f"{x0:.0f} {y0:.0f} {x1 - x0:.0f} {y1 - y0:.0f}"


def _features(path: pathlib.Path, obj: str):
    """Decode a TopoJSON object into (name, [polygon [ring [(x, y)]]]) without any library."""
    t = json.loads(path.read_text(encoding="utf-8"))
    (sx, sy), (tx, ty) = t["transform"]["scale"], t["transform"]["translate"]
    arcs = []
    for a in t["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in a:
            x, y = x + dx, y + dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(ids):
        out: list = []
        for i in ids:
            pts = arcs[i] if i >= 0 else arcs[~i][::-1]
            out.extend(pts if not out else pts[1:])
        return out

    for g in t["objects"][obj]["geometries"]:
        polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"] if g["type"] == "MultiPolygon" else []
        if polys:
            yield g["properties"]["name"], [[ring(r) for r in p] for p in polys]


def _path(rings, eps: float, min_size: float) -> str:
    """Rings already in SVG units → a compact path: thin out points closer than eps, drop specks."""
    out = []
    for r in rings:
        xs, ys = [p[0] for p in r], [p[1] for p in r]
        if max(xs) - min(xs) < min_size and max(ys) - min(ys) < min_size:
            continue
        kept = [r[0]]
        for p in r[1:-1]:
            if abs(p[0] - kept[-1][0]) + abs(p[1] - kept[-1][1]) >= eps:
                kept.append(p)
        if len(kept) < 3:
            continue
        pts = [(round(x * 10), round(y * 10)) for x, y in kept]     # whole tenths: the SVGs use viewBoxes ×10
        d = [f"M{pts[0][0]} {pts[0][1]}"]
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            if (bx, by) != (ax, ay):
                dx, dy = bx - ax, by - ay
                d.append(f"l{dx}{dy}" if dy < 0 else f"l{dx} {dy}")
        out.append("".join(d) + "z")
    return "".join(out)


def _centre(rings) -> tuple[float, float]:
    """Middle of the largest ring's bounding box: where a marker for a small place goes."""
    big = max(rings, key=lambda r: (max(p[0] for p in r) - min(p[0] for p in r)) * (max(p[1] for p in r) - min(p[1] for p in r)))
    xs, ys = [p[0] for p in big], [p[1] for p in big]
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2


EUROPE = (-12, 34, 32, 61)  # lon/lat box of the zoomed-in Europe view
# Overseas parts we leave off a country, so a visit to Paris doesn't colour in French Guiana:
# only rings starting inside this lon/lat box are drawn.
MAINLAND = {"France": (-6, 41, 10, 52)}


def world_shapes(keep: set[str]):
    """Every country as (name, svg path, (x, y) centre, area of its bounding box).

    Countries in the Europe view (and the ones in `keep`) get finer outlines, because that view is
    zoomed in about 9×; everywhere else a coarse outline is plenty and keeps the page light."""
    ex0, ey0 = world_xy(EUROPE[0], EUROPE[3])
    ex1, ey1 = world_xy(EUROPE[2], EUROPE[1])
    for name, polys in _features(GEO / "countries-50m.json", "countries"):
        if name == "Antarctica":
            continue
        if name in MAINLAND:
            w, so, ea, no = MAINLAND[name]
            polys = [p for p in polys if w <= p[0][0][0] <= ea and so <= p[0][0][1] <= no]
        rings = [[world_xy(lon, max(min(lat, WORLD_TOP), WORLD_BOTTOM)) for lon, lat in r] for p in polys for r in p]
        cx, cy = _centre(rings)
        if name in keep:
            d = _path(rings, eps=0.1, min_size=0)
        elif ex0 - 30 <= cx <= ex1 + 30 and ey0 - 30 <= cy <= ey1 + 30:
            d = _path(rings, eps=0.35, min_size=0.3)
        else:
            d = _path(rings, eps=1.0, min_size=1.8)
        if d:
            xs = [p[0] for r in rings for p in r]
            ys = [p[1] for r in rings for p in r]
            yield name, d, (cx, cy), (max(xs) - min(xs)) * (max(ys) - min(ys))


US_W, US_H = 975, 610


def us_shapes():
    """Every state (plus DC) as (name, svg path, centre, bbox area), in us-atlas's Albers layout."""
    for name, polys in _features(GEO / "states-albers-10m.json", "states"):
        rings = [r for p in polys for r in p]
        d = _path(rings, eps=0.5, min_size=0.8)
        xs = [p[0] for r in rings for p in r]
        ys = [p[1] for r in rings for p in r]
        yield name, d, _centre(rings), (max(xs) - min(xs)) * (max(ys) - min(ys))
