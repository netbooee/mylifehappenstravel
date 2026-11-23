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

  // itinerary: highlight the section you're reading, print button
  const links = [...document.querySelectorAll('.toc a')];
  if (links.length && 'IntersectionObserver' in window) {
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove('active'));
        const a = byId.get(en.target.id);
        if (a) {
          a.classList.add('active');
          // On phones the day list is a horizontal strip. Slide only the strip so the active day
          // is centred. Never use scrollIntoView here: it also scrolls the page, which cuts off
          // the reader's swipe mid-flick on iOS.
          const strip = a.closest('ol');
          if (strip && strip.scrollWidth > strip.clientWidth) {
            const left = a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2;
            strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
          }
        }
      });
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
  const pb = document.querySelector('.print-btn');
  if (pb) pb.addEventListener('click', () => window.print());
});
