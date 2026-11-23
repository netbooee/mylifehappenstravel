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
          if (getComputedStyle(a.parentElement.parentElement).display === 'flex') {
            a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
          }
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    byId.forEach((_a, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
  const pb = document.querySelector('.print-btn');
  if (pb) pb.addEventListener('click', () => window.print());
});
