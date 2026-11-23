# My Life Happens Travel

The website for **mylifehappens.com**: Tony & Sharon's real trips, written up day by day.

Every itinerary is stored as data (one JSON file per trip) and turned into web pages by a small
Python script. All trips share one design, the way the big travel blogs do, so adding a trip is
"write the data, run the build", not "design a new page".

## What's where

```
content/
  SCHEMA.md                  the itinerary data format, with an example
  itineraries/*.json         one file per trip  ← edit these
tools/
  build.py                   turns content/ into HTML in site/ (also holds the photo list)
site/                        ← everything Netlify publishes (generated + assets)
  index.html                 home page
  itineraries/               list page + one folder per trip
  about/, thanks/, 404.html, sitemap.xml, robots.txt
  assets/css/site.css        all styles
  assets/js/site.js          mobile menu, region filter, "on this page" highlight
  assets/img/                photos at web sizes (800 / 1600 / 2400 px, .jpg + .webp)
netlify.toml                 Netlify settings: publish folder, short links, redirects
design/prototype/            the original design mock-up (not published; kept for reference)
```

## Adding a trip

1. Copy an existing file in `content/itineraries/` (e.g. `italy-2026.json`) to `<place>-<year>.json`
   and fill it in. `content/SCHEMA.md` explains every field.
2. Add photos (see below) and point the trip's `hero` at them in `TRIP_PHOTOS` in `tools/build.py`.
3. Run `python3 tools/build.py`. It regenerates the home page, the list, the trip page and the sitemap.
4. Preview, then commit everything (including the generated files in `site/`).

Or just ask Claude: *"Add our Japan trip"* and paste your plan or booking notes.

### Photos

Resize camera originals before adding them (20–30 MB files make pages crawl). From the repo root:

```
python3 - <<'EOF'
from PIL import Image, ImageOps
src, key = "path/to/photo.jpg", "japan-kyoto"          # key = name used in build.py
im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
for w in (800, 1600):
    r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if im.width > w else im
    r.save(f"site/assets/img/{key}-{w}.jpg", quality=80, optimize=True, progressive=True)
    r.save(f"site/assets/img/{key}-{w}.webp", quality=76, method=6)
EOF
```

Then add the key to `PHOTOS` in `tools/build.py` with its 800px width/height, the largest width
you made, a short description (alt text) and a credit (`"Unsplash"` for stock, `""` for your own).

Five photos are currently free Unsplash stock (Barcelona, Golden Gate, Ireland, the Las Vegas sign,
the Colosseum). Swap them for your own whenever you can: your own photos are what make a travel
site feel real.

### Instagram photos

Instagram doesn't allow other sites to pull photos automatically, so export them once:
Instagram app → **Settings → Accounts Center → Your information and permissions → Download your
information** → choose *Media*, format *HTML*, high quality. Instagram emails a zip; drop the photos
you like into a folder in this repo (or send them to Claude) and they can be resized and added
with the snippet above.

## Videos

`content/videos.json` lists the YouTube videos shown on the home page (newest three) and on trip
pages (a trip lists the ids it wants in `"videos"`). Videos only load when someone presses play,
so pages stay fast. The channel's public feed lists every video:
`https://www.youtube.com/feeds/videos.xml?channel_id=UChGwHSH0eNh_fp6XNtfj5jg`

## Maps

Each trip's route map uses [Leaflet](https://leafletjs.com) (bundled in `site/assets/vendor/`) with
OpenStreetMap's free tiles, which only ask for the attribution shown on the map. If the site ever
gets a lot of traffic, switch to a paid tile provider in `site/assets/js/site.js`.

## Previewing locally

```
python3 tools/build.py && cd site && python3 -m http.server 8000
```

Then open http://localhost:8000.

## Short links

`mylifehappens.com/italy`, `/barcelona`, `/vegas`, `/california`, `/london`, `/paris`, `/ireland` go straight to each
trip (set in `netlify.toml`). Handy for an Instagram bio.

## Newsletter sign-up

The sign-up box at the bottom of every page uses **Netlify Forms**: no setup needed. After the
first deploy, sign-ups appear in Netlify under **Forms → newsletter**. You can turn on email
notifications there, or export the list into Mailchimp, Kit or similar later.

## Going live on Netlify

1. Netlify is already deploying this repository to `mylifehappenstravel.netlify.app` from the
   `main` branch. Merge this work into `main` and it goes live there. `netlify.toml` tells Netlify
   to publish `site/`, with no build command.
2. **Domain:** in the site's **Domain management**, add `mylifehappens.com` (and `www`), then set the
   DNS records Netlify shows you at wherever the domain is registered (Squarespace Domains if you
   bought it there). HTTPS is set up automatically.
3. **Before cancelling Squarespace:** the old site also holds the 2009–2015 journal, family blogs
   and the banner, sticker and 3D-print shops. None of that is moved here. Export anything you
   want to keep first (Squarespace: *Settings → Import & Export*).

### The old one-page Netlify sites

To keep links you've already shared working, replace the contents of each old site
(`mlkitaly`, `mlhireland`, `mlhvegas`, `mlhcalifornia`, `barcelonamallorca`) with a single
`_redirects` file, for example for `mlkitaly.netlify.app`:

```
/*  https://mylifehappens.com/itineraries/italy-2026/  301!
```
