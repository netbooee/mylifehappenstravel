# Redirects for the old one-page trip sites

Each folder here is the whole "site" for an old Netlify address, and it just forwards visitors to
the trip's page on the main site. Set that Netlify site's **Base directory** to the folder (Site
configuration → Build & deploy → Build settings), leave the build command empty, and deploy.

| Old address | Folder | Goes to |
| --- | --- | --- |
| barcelonamallorca.netlify.app | `redirects/barcelonamallorca` | `/itineraries/barcelona-mallorca-2026/` |

The links point at `mylifehappenstravel.netlify.app`, which shows the same site as
`mylifehappenstravel.com`, so they keep working whichever address people use.
