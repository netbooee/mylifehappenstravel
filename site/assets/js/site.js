// Small enhancements; every page works without them.
document.addEventListener('DOMContentLoaded', () => {
  // mobile menu
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  // region filter on /itineraries/
  const chips = document.querySelectorAll('.chip[data-filter]');
  const cards = document.querySelectorAll('#trip-list .card');
  const apply = (f) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
    cards.forEach((c) => { c.hidden = f !== 'all' && c.dataset.region !== f; });
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    apply(c.dataset.filter);
    history.replaceState(null, '', c.dataset.filter === 'all' ? location.pathname : '#' + encodeURIComponent(c.dataset.filter));
  }));
  if (chips.length && location.hash) {
    const f = decodeURIComponent(location.hash.slice(1));
    if ([...chips].some((c) => c.dataset.filter === f)) apply(f);
  }

  // itinerary: highlight the section you're reading in the day list / phone day strip.
  // Kept deliberately light so scrolling never stutters:
  //  - the highlight is a single class swap, done only when the day actually changes;
  //  - on phones the strip is slid sideways only once the reader stops scrolling, so it never
  //    animates at the same time as their swipe (and never with scrollIntoView, which would
  //    also move the page and cut a swipe short on iOS).
  const links = [...document.querySelectorAll('.toc a')];
  if (links.length && 'IntersectionObserver' in window) {
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const strip = document.querySelector('.toc ol');
    let current = null;
    let idle = 0;

    const centreStrip = () => {
      if (!current || !strip || strip.scrollWidth <= strip.clientWidth) return;
      const left = current.offsetLeft - (strip.clientWidth - current.offsetWidth) / 2;
      if (Math.abs(strip.scrollLeft - left) > 4) strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    };
    const whenScrollStops = () => { clearTimeout(idle); idle = setTimeout(centreStrip, 140); };
    window.addEventListener('scroll', whenScrollStops, { passive: true });

    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const a = byId.get(en.target.id);
        if (!a || a === current) continue;
        if (current) current.classList.remove('active');
        a.classList.add('active');
        current = a;
      }
    }, { rootMargin: '-20% 0px -70% 0px' });
    byId.forEach((_a, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  // YouTube: load the player only when someone presses play
  document.querySelectorAll('a.yt[data-yt]').forEach((a) => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const f = document.createElement('div');
      f.className = 'yt-frame';
      const i = document.createElement('iframe');
      i.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(a.dataset.yt) + '?autoplay=1&rel=0';
      i.title = a.getAttribute('aria-label') || 'YouTube video';
      i.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      i.allowFullscreen = true;
      f.appendChild(i);
      a.replaceWith(f);
    });
  });

  // itinerary route map (Leaflet + OpenStreetMap tiles; light use with attribution is allowed)
  const mapEl = document.querySelector('.route-map');
  if (mapEl && window.L) {
    const d = JSON.parse(mapEl.dataset.map);
    const map = L.map(mapEl, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.polyline(d.path, { color: '#c2502b', weight: 3, opacity: 0.85, dashArray: '6 8' }).addTo(map);
    d.stops.forEach((s, i) => {
      L.marker([s[1], s[2]], {
        title: s[0],
        icon: L.divIcon({ className: 'pin', html: '<span>' + (i + 1) + '</span>', iconSize: [28, 28], iconAnchor: [14, 14] }),
      }).bindTooltip(s[0]).addTo(map);
    });
    map.fitBounds(L.latLngBounds(d.stops.map((s) => [s[1], s[2]])), { padding: [36, 36] });
  }
  // about page: every route we've flown, drawn as great-circle arcs
  const fm = document.querySelector('.flight-map');
  if (fm && window.L) {
    const d = JSON.parse(fm.dataset.flights);
    const ap = Object.fromEntries(d.airports.map((a) => [a[0], a]));
    const rad = Math.PI / 180;
    const arc = (a, b) => { // points along the shortest path over the globe
      const [p1, l1, p2, l2] = [a[2] * rad, a[3] * rad, b[2] * rad, b[3] * rad];
      const v = (p, l) => [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
      const A = v(p1, l1), B = v(p2, l2);
      const w = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
      if (w < 1e-6) return [[a[2], a[3]], [b[2], b[3]]];
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const t = i / 48, s1 = Math.sin((1 - t) * w) / Math.sin(w), s2 = Math.sin(t * w) / Math.sin(w);
        const x = s1 * A[0] + s2 * B[0], y = s1 * A[1] + s2 * B[1], z = s1 * A[2] + s2 * B[2];
        pts.push([Math.atan2(z, Math.hypot(x, y)) / rad, Math.atan2(y, x) / rad]);
      }
      return pts;
    };
    const map = L.map(fm, { scrollWheelZoom: false, worldCopyJump: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 12,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    const plural = (k) => k + (k === 1 ? ' flight' : ' flights');
    d.routes.forEach(([k, a, b]) => {
      const line = L.polyline(arc(ap[a], ap[b]), { color: '#c2502b', weight: Math.min(1.5 + k * 0.35, 5), opacity: 0.8 })
        .bindTooltip(ap[a][1] + ' ↔ ' + ap[b][1] + ' · ' + plural(k), { sticky: true }).addTo(map);
      line.on('mouseover', () => line.setStyle({ color: '#17494d' }));
      line.on('mouseout', () => line.setStyle({ color: '#c2502b' }));
    });
    d.airports.forEach((a) => {
      L.circleMarker([a[2], a[3]], { radius: a[0] === 'EWR' ? 7 : 5, color: '#fff', weight: 2, fillColor: '#17494d', fillOpacity: 1 })
        .bindTooltip(a[1] + ' (' + a[0] + ') · ' + plural(a[4])).addTo(map);
    });
    map.fitBounds(L.latLngBounds(d.airports.map((a) => [a[2], a[3]])), { padding: [24, 24] });
  }

  const pb = document.querySelector('.print-btn');
  if (pb) pb.addEventListener('click', () => window.print());
});
