# My Life Happens Travel

The website for **mylifehappens.com**: our home page plus a day-by-day itinerary for every trip.

It is a plain static site. There is no build step and nothing to install: every page is an HTML file, and Netlify publishes the `site/` folder exactly as it is.

## What's where

```
site/                         ← everything Netlify publishes
  index.html                  home page
  itineraries/
    index.html                list of all itineraries
    barcelona-mallorca-2026/  one folder per trip, each with its own index.html
    italy-2026/
    las-vegas-2026/
    california-coast-2025/
    ireland/
  assets/
    css/site.css              styles for the home page, itinerary list and 404 page
    img/                      web-sized photos (.jpg + .webp)
    favicon.svg
  404.html                    "page not found"
  robots.txt, sitemap.xml     for search engines
netlify.toml                  Netlify settings: publish folder, short links, redirects
design/prototype/             the original design mock-up (not published; kept for reference)
```

Each itinerary page is **self-contained**: its styles live inside the page, so every trip can have its own look (Barcelona is a Spanish festival poster, Italy is Renaissance serif, and so on). The home page and the list page share `site/assets/css/site.css`.

## Adding a new trip

1. Create `site/itineraries/<place>-<year>/index.html` (for example `japan-2027`). Link back home with `href="/"`.
2. Add a card for it near the top of the cards in **both** `site/index.html` and `site/itineraries/index.html` (newest first), and a line in each page's footer list.
3. Add its address to `site/sitemap.xml`.
4. Optional: add a short link like `/japan` in `netlify.toml`.
5. Photos: resize to about 1200px wide before adding them to `site/assets/img/`. Camera originals (20–30 MB) make pages slow.

Or just ask Claude: *"Add an itinerary for our Japan trip"* with your notes and bookings.

## Short links

| Link | Goes to |
| --- | --- |
| mylifehappens.com/barcelona | Barcelona & Mallorca 2026 |
| mylifehappens.com/italy | Florence, Venice & Rome 2026 |
| mylifehappens.com/vegas | Las Vegas 2026 |
| mylifehappens.com/california | California Coast 2025 |
| mylifehappens.com/ireland | Dublin & Beyond |

## Previewing locally

```
cd site && python3 -m http.server 8000
```

Then open http://localhost:8000.

## Going live on Netlify

1. In Netlify: **Add new site → Import an existing project → GitHub**, and pick this repository. Netlify reads `netlify.toml`, so leave the build command empty; the publish directory is `site`.
2. Check the new `*.netlify.app` address works.
3. **Domain:** in the site's **Domain management**, add `mylifehappens.com` (and `www`). Netlify then tells you which DNS records to set, or offers to manage DNS for you. Make the change at wherever the domain is registered (Squarespace Domains if you bought it through Squarespace). HTTPS is set up automatically once DNS points at Netlify.
4. **Before cancelling Squarespace:** the old Squarespace site also has the 2009–2015 journal, family blogs and the banner, sticker and 3D-print shops. None of that is moved here. Export anything you want to keep (Squarespace: *Settings → Import & Export*) first.

### The old one-page Netlify sites

The trips used to live on separate Netlify sites (`mlkitaly`, `mlhireland`, `mlhvegas`, `mlhcalifornia`, `barcelonamallorca`). To keep links you've already shared working, replace each one's contents with a single `_redirects` file, for example for `mlkitaly.netlify.app`:

```
/*  https://mylifehappens.com/itineraries/italy-2026/  301!
```
