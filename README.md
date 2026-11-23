# My Life Happens Travel

The website for **mylifehappenstravel.com**: Tony & Sharon's real trips, written up day by day.

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

### Our own photos from Apple Photos

Ask Claude **`/trip-photos <trip>`** (for example `/trip-photos italy-2026`). It finds the trip's
photos in Photos by the itinerary's dates, fixes camera clocks, shortlists the best, and opens a review
page where you tick your favourites and choose where each goes. Then it exports full size for just
those, resizes them (no GPS or EXIF), adds them to the page, checks it on phone and desktop, and opens
a pull request.

The tools are in `tools/photos/` (`tools/photos/run --help`); the steps are in
`.claude/skills/trip-photos/SKILL.md`. Working files stay in a `trip-photos-work` folder next to the
repo, never in it. Photos needs **Full Disk Access** turned on for the Claude app while you do this.

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

## Flight stats

The lifetime numbers on the home page and the "By the numbers" section of the About page (miles,
flights, airports, the route map) come from our Flighty export. To update them:

1. In Flighty: **Settings → Account Data → Export Your Flights**. The CSV arrives by email.
2. Run `python3 tools/flights.py path/to/FlightyExport-YYYY-MM-DD.csv` (keep the CSV outside this
   repo; it holds booking codes and seats). It writes `content/flights.json` with only the year,
   airline, airports, miles and time in the air for each flight, and which trip it belongs to.
3. Run `python3 tools/build.py` and commit.

Canceled flights are left out automatically; flights we tracked but didn't take go in `NOT_FLOWN`
in `tools/flights.py`. A new airport or airline stops the script until it's added there.
Trip pages show a "Flights" line in "At a glance" for flights within a day of the trip's dates.

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

`mylifehappenstravel.com/italy`, `/barcelona`, `/vegas`, `/california`, `/london`, `/paris`, `/montreal`, `/tahoe`, `/ireland` go straight to each
trip (set in `netlify.toml`). Handy for an Instagram bio.

## Newsletter sign-up

The sign-up box at the bottom of every page uses **Netlify Forms**: no setup needed. After the
first deploy, sign-ups appear in Netlify under **Forms → newsletter**. You can turn on email
notifications there, or export the list into Mailchimp, Kit or similar later.

## Going live on Netlify

1. Netlify deploys this repository from the `main` branch to **mylifehappenstravel.com** (`www`
   forwards there too; `mylifehappenstravel.netlify.app` shows the same site). Merge into `main` and
   it's live. `netlify.toml` tells Netlify to publish `site/`, with no build command.
2. **The old domain:** `mylifehappens.com` is still the Squarespace site. To bring it here as well,
   add it in the Netlify site's **Domain management** and set the DNS records Netlify shows you
   where the domain is registered (Squarespace Domains if you bought it there).
3. **Before cancelling Squarespace:** the old site also holds the 2009–2015 journal, family blogs
   and the banner, sticker and 3D-print shops. None of that is moved here. Export anything you
   want to keep first (Squarespace: *Settings → Import & Export*).

### The old one-page Netlify sites

To keep links you've already shared working, replace the contents of each old site
(`mlkitaly`, `mlhireland`, `mlhvegas`, `mlhcalifornia`, `barcelonamallorca`) with a single
`_redirects` file, for example for `mlkitaly.netlify.app`:

```
/*  https://mylifehappenstravel.com/itineraries/italy-2026/  301!
```

## Gear

`content/gear.json` lists the products on the Gear page (`/gear/`); the first one also appears on the
home page. Each item has a `name`, a short `category` (e.g. "Sleep · on the plane"), a one-line
`note` in our voice, the affiliate `url`, and an optional `photo` key from `PHOTOS` (our own photos
only, not Amazon's product images). Items with no `name` yet are skipped, so a link can be parked
there until we've written it up. Run `python3 tools/build.py` after editing.
