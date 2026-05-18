// Modern site — editorial, contemporary, generous whitespace.
// Same palette context + page model as postcard-site.jsx, different visual DNA:
// no rotation, no paper texture, no handwriting accents, no polaroid frames.
// Newsreader display serif + DM Sans body + JetBrains Mono. Subtle shadows,
// hairline rules, pill tags, big breathing photo grids.

const M_FONTS = {
  display: '"Instrument Serif", "Newsreader", "Tiempos", "Iowan Old Style", Georgia, serif',
  body:    '"DM Sans", "Inter", -apple-system, "Helvetica Neue", Arial, sans-serif',
  mono:    '"JetBrains Mono", "DM Mono", ui-monospace, monospace',
};

const M_DENSITY = {
  cozy:    { pad: 56,  sectionGap: 80,  h1: 0.9 },
  regular: { pad: 80,  sectionGap: 112, h1: 1   },
  airy:    { pad: 112, sectionGap: 144, h1: 1.1 },
};

const ModernCtx = React.createContext({ C: PALETTES.tuscan, D: M_DENSITY.regular });
const useM = () => React.useContext(ModernCtx);

// ───────── primitives ─────────
function Tag({ children, color, subtle }) {
  const { C } = useM();
  const c = color || C.primary;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: M_FONTS.mono, fontSize: 10.5, letterSpacing: 1.6,
      textTransform: 'uppercase', color: c, fontWeight: 500,
    }}>
      {!subtle && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'inline-block' }} />}
      {children}
    </span>
  );
}

function Pill({ children, color, bg, active }) {
  const { C } = useM();
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: 999,
      fontFamily: M_FONTS.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
      color: active ? C.cream : (color || C.primaryDk),
      background: active ? C.deep : (bg || `${C.primary}1a`),
      fontWeight: 600,
    }}>{children}</span>
  );
}

function Btn({ children, onClick, primary, subtle, dark, href, ...rest }) {
  const { C } = useM();
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 22px', fontFamily: M_FONTS.body, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', borderRadius: 999, border: 'none', textDecoration: 'none',
    transition: 'transform .15s, background .15s, box-shadow .15s',
  };
  let style;
  if (primary) style = { ...base, background: C.primary, color: C.cream };
  else if (dark) style = { ...base, background: C.deep, color: C.cream };
  else if (subtle) style = { ...base, background: 'transparent', color: C.deep, border: `1px solid ${C.deep}30` };
  else style = { ...base, background: C.deep, color: C.cream };
  const Tag = href ? 'a' : 'button';
  return (
    <Tag href={href} onClick={onClick} style={style}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      {...rest}>
      {children}
    </Tag>
  );
}

function Rule({ color }) {
  const { C } = useM();
  return <div style={{ height: 1, background: color || `${C.ink}14`, width: '100%' }} />;
}

// container with max-width and side padding driven by density.pad
function Container({ children, style }) {
  const { D } = useM();
  return (
    <div data-r="container" style={{ maxWidth: 1320, margin: '0 auto', padding: `0 ${D.pad}px`, ...style }}>{children}</div>
  );
}

// ───────── NAV ─────────
function Nav({ page, setPage }) {
  const { C } = useM();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setOpen(false); }, [page]);
  return (
    <React.Fragment>
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: `${C.cream}f0`, backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${C.ink}10`,
    }}>
      <Container style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', height: 60, gap: 24 }}>
        <button onClick={() => setPage('home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0, whiteSpace: 'nowrap', flex: '0 0 auto' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.deep, color: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: M_FONTS.display, fontSize: 16, fontStyle: 'italic', lineHeight: 1, transform: 'translateY(1px)' }}>m</div>
          <div style={{ fontFamily: M_FONTS.display, fontSize: 17, color: C.deep, lineHeight: 1, letterSpacing: -0.2 }}>
            My Life Happens
          </div>
        </button>
        <nav data-r="nav-links" style={{ display: 'flex', gap: 2, alignItems: 'center', flex: '0 1 auto', minWidth: 0 }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              background: 'transparent',
              color: page === n.id ? C.primary : C.ink,
              border: 'none', padding: '6px 10px', fontFamily: M_FONTS.body, fontSize: 13,
              cursor: 'pointer', fontWeight: page === n.id ? 600 : 500,
              whiteSpace: 'nowrap', position: 'relative',
            }}>
              {n.label}
              {page === n.id && <span style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: C.primary }} />}
            </button>
          ))}
        </nav>
        <Btn primary onClick={() => setPage('app')} style={{ padding: '8px 14px', fontSize: 12.5, whiteSpace: 'nowrap', flex: '0 0 auto' }} data-r="nav-cta">Get the app</Btn>
        <button data-r="nav-burger" onClick={() => setOpen(true)}
          style={{ background: 'transparent', border: `1px solid ${C.ink}20`, color: C.deep, borderRadius: 999, width: 38, height: 38, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', padding: 0 }}>
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1h14M1 7h14M1 13h14"/></svg>
        </button>
      </Container>
    </header>
    <div data-r="nav-drawer" data-open={open ? '1' : '0'} onClick={() => setOpen(false)}>
      <div data-r="nav-drawer-panel" onClick={(e) => e.stopPropagation()} style={{ background: C.cream }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: M_FONTS.display, fontSize: 20, color: C.deep, fontStyle: 'italic' }}>Menu</div>
          <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: C.ink, fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        </div>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => { setPage(n.id); }}
            style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '14px 4px', fontFamily: M_FONTS.display, fontSize: 22, color: page === n.id ? C.primary : C.deep, fontWeight: 400, fontStyle: page === n.id ? 'italic' : 'normal', cursor: 'pointer', borderBottom: `1px solid ${C.ink}12` }}>
            {n.label}
          </button>
        ))}
        <Btn primary onClick={() => { setPage('app'); }} style={{ marginTop: 22, justifyContent: 'center' }}>Get the app</Btn>
      </div>
    </div>
    </React.Fragment>
  );
}

// ───────── HOME ─────────
function Home({ setPage }) {
  const { C, D } = useM();
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: M_FONTS.body }}>
      {/* hero */}
      <section style={{ paddingTop: D.sectionGap * 0.6, paddingBottom: D.sectionGap }}>
        <Container>
          <Tag>Featured Itinerary · Italy · 10 days</Tag>
          <h1 data-r="h1-xl" style={{
            fontFamily: M_FONTS.display, fontWeight: 400,
            fontSize: 112 * D.h1, lineHeight: 1.02, letterSpacing: -0.5,
            margin: '24px 0 22px', color: C.deep, maxWidth: 1100,
          }}>
            Ten days in Italy,<br/><em style={{ color: C.primary, fontWeight: 400 }}>done right.</em>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: C.inkSoft, maxWidth: 620, margin: '0 0 36px', fontWeight: 400 }}>
            Florence, Venice and Rome — Renaissance art, Adriatic canals, ancient ruins, and great pasta. Five nights in Florence, three in Venice, with smart day trips woven in.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn primary onClick={() => setPage('detail')}>Open the itinerary →</Btn>
            <Btn subtle onClick={() => setPage('photography')}>See the photographs</Btn>
          </div>
        </Container>

        {/* hero image strip */}
        <Container style={{ marginTop: 56 }}>
          <div data-r="hero-strip" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 16, height: 480 }}>
            <image-slot id="m-hero-1" src="assets/florence-arno-sunset.jpg" placeholder="Florence · Arno at sunset" shape="rounded" radius="12"
              style={{ display: 'block', width: '100%', height: '100%', background: '#e6d8b8' }} />
            <image-slot id="m-hero-2" src="assets/cooking-class.jpg" placeholder="Cooking class · Towns of Italy" shape="rounded" radius="12"
              style={{ display: 'block', width: '100%', height: '100%', background: '#e6d8b8' }} />
            <image-slot id="m-hero-3" src="assets/murano.jpg" placeholder="Murano · coloured glass" shape="rounded" radius="12"
              style={{ display: 'block', width: '100%', height: '100%', background: '#e6d8b8' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 12.5, color: C.inkSoft, fontFamily: M_FONTS.mono, letterSpacing: 1, textTransform: 'uppercase' }}>
            <span>Florence · day 1</span>
            <span>Day 3 · pasta class</span>
            <span>Murano · day 7</span>
          </div>
        </Container>
      </section>

      {/* stats — clean editorial */}
      <section style={{ background: C.paper, padding: `${D.sectionGap * 0.6}px 0`, borderTop: `1px solid ${C.ink}10`, borderBottom: `1px solid ${C.ink}10` }}>
        <Container>
          <div data-r="stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {[['10', 'days'], ['3', 'cities'], ['4', 'day trips'], ['1', 'cheese-wheel pasta']].map(([n, l], i) => (
              <div key={l} style={{ borderLeft: i ? `1px solid ${C.ink}14` : 'none', paddingLeft: i ? 32 : 0 }}>
                <div style={{ fontFamily: M_FONTS.display, fontSize: 64, color: C.deep, lineHeight: 1, letterSpacing: -1 }}>{n}</div>
                <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* more itineraries */}
      <section style={{ padding: `${D.sectionGap}px 0` }}>
        <Container>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <Tag>Recently logged</Tag>
              <h2 data-r="h2" style={{ fontFamily: M_FONTS.display, fontSize: 56 * D.h1, color: C.deep, margin: '12px 0 0', lineHeight: 1, letterSpacing: -1, fontWeight: 400 }}>
                More itineraries.
              </h2>
            </div>
            <button onClick={() => setPage('itineraries')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: M_FONTS.body, fontSize: 14, color: C.primary, fontWeight: 600 }}>
              Browse all 24 →
            </button>
          </div>
          <div data-r="cards-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {ITINERARIES.slice(1, 4).map((it) => (
              <ItCard key={it.id} it={it} />
            ))}
          </div>
        </Container>
      </section>

      {/* video promo */}
      <section style={{ padding: `${D.sectionGap}px 0`, background: C.paper }}>
        <Container>
          <div data-r="video-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 64, alignItems: 'center' }}>
            <div>
              <Tag>YouTube · {SITE.youtube}</Tag>
              <h2 data-r="h2" style={{ fontFamily: M_FONTS.display, fontSize: 64 * D.h1, color: C.deep, margin: '14px 0 16px', lineHeight: 1.04, letterSpacing: -0.4, fontWeight: 400 }}>
                The long version, <em style={{ color: C.primary }}>uncut.</em>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: C.inkSoft, maxWidth: 420, margin: '0 0 28px' }}>
                Twenty-four unhurried minutes — Rome to Venice, every train, every meal, every place we'd go back to. New on YouTube.
              </p>
              <Btn dark onClick={() => setPage('videos')}>▶ Watch · 24:08</Btn>
            </div>
            <button onClick={() => setPage('videos')} style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', border: 'none', cursor: 'pointer', padding: 0 }}>
              <image-slot id="m-home-vid" placeholder="Italy in 14 days · long version" shape="rect" radius="0"
                style={{ display: 'block', width: '100%', height: '100%' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,.55))' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 76, height: 76, borderRadius: '50%', background: 'rgba(255,255,255,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                <div style={{ width: 0, height: 0, borderLeft: `20px solid ${C.deep}`, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', marginLeft: 6 }} />
              </div>
            </button>
          </div>
        </Container>
      </section>

      {/* HappenUpon app */}
      <section style={{ padding: `${D.sectionGap}px 0` }}>
        <Container>
          <div data-r="app-split" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.cream, fontFamily: M_FONTS.display, fontSize: 28, fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>H</div>
                <Tag>The app · iPhone</Tag>
              </div>
              <h2 data-r="h2" style={{ fontFamily: M_FONTS.display, fontSize: 56 * D.h1, color: C.deep, margin: '0 0 18px', lineHeight: 1.04, letterSpacing: -0.4, fontWeight: 400 }}>
                HappenUpon. <em style={{ color: C.primary }}>Every booking, day by day.</em>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: C.inkSoft, maxWidth: 480, margin: '0 0 28px' }}>
                Paste a confirmation email — HappenUpon pulls flights, hotels, restaurants, and codes into a clean day-by-day timeline. The travel planner we built for ourselves.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Btn dark onClick={() => setPage('app')}>Download for iPhone</Btn>
                <span style={{ fontSize: 13.5, color: C.inkSoft }}>Free for 2 trips · Pro $29/yr</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div data-r="phone-frame" style={{ width: 260, height: 540, background: C.deep, borderRadius: 40, padding: 10, boxShadow: '0 30px 60px rgba(0,0,0,.18), 0 0 0 2px ' + C.ink + '08' }}>
                <image-slot id="m-home-app" placeholder="HappenUpon · timeline" shape="rounded" radius="30"
                  style={{ display: 'block', width: '100%', height: '100%', background: C.cream }} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Reels />
      <Footer setPage={setPage} />
    </div>
  );
}

// itinerary card
function ItCard({ it, onClick }) {
  const { C } = useM();
  return (
    <article onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform .25s', position: 'relative' }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ borderRadius: 12, overflow: 'hidden', background: '#e6d8b8' }}>
        <image-slot id={'m-it-' + it.id} placeholder={it.title} shape="rect" radius="0"
          style={{ display: 'block', width: '100%', aspectRatio: '4/3' }} />
      </div>
      <div style={{ paddingTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Tag subtle>{it.country}</Tag>
          <span style={{ fontFamily: M_FONTS.mono, fontSize: 10.5, color: C.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>{it.days}d · {it.season}</span>
        </div>
        <h3 style={{ fontFamily: M_FONTS.display, fontSize: 26, color: C.deep, margin: '4px 0 6px', lineHeight: 1.1, letterSpacing: -0.4, fontWeight: 400 }}>{it.title}</h3>
        <p style={{ fontSize: 14, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>{it.blurb}</p>
      </div>
    </article>
  );
}

// ───────── BROWSE ─────────
function Browse({ setPage }) {
  const { C, D } = useM();
  const [filter, setFilter] = React.useState('All');
  const visible = ITINERARIES.filter((it) => filter === 'All' || it.pace === filter);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: M_FONTS.body }}>
      <section style={{ paddingTop: D.sectionGap * 0.6, paddingBottom: 40 }}>
        <Container>
          <Tag>The archive — 24 entries</Tag>
          <h1 data-r="h1-xl" style={{ fontFamily: M_FONTS.display, fontSize: 96 * D.h1, color: C.deep, margin: '20px 0 16px', lineHeight: 1.04, letterSpacing: -0.5, fontWeight: 400, maxWidth: 900 }}>
            Every itinerary, <em style={{ color: C.primary }}>filed by feeling.</em>
          </h1>
          <p style={{ fontSize: 18, color: C.inkSoft, maxWidth: 540, margin: '0 0 32px', lineHeight: 1.5 }}>
            Twenty-four trips, each written like a letter to ourselves. Filter by pace, season, or place.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.inkSoft, marginRight: 6, fontFamily: M_FONTS.mono, letterSpacing: 1, textTransform: 'uppercase' }}>Pace</span>
            {['All', 'Slow', 'Moderate', 'Active'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? C.deep : 'transparent',
                color: filter === f ? C.cream : C.deep,
                border: `1px solid ${filter === f ? C.deep : C.ink + '20'}`,
                padding: '6px 14px', fontFamily: M_FONTS.body, fontSize: 13, cursor: 'pointer',
                borderRadius: 999, fontWeight: 500,
              }}>{f}</button>
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: M_FONTS.mono, fontSize: 11, color: C.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>{visible.length} trips</span>
          </div>
        </Container>
      </section>
      <section style={{ paddingBottom: D.sectionGap }}>
        <Container>
          <div data-r="cards-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36, rowGap: 56 }}>
            {visible.map((it) => (
              <ItCard key={it.id} it={it} onClick={() => it.id === 'italy-14' && setPage('detail')} />
            ))}
          </div>
        </Container>
      </section>
      <Footer setPage={setPage} />
    </div>
  );
}

// ───────── DETAIL ─────────
function Detail({ setPage }) {
  const { C, D } = useM();
  const [openDay, setOpenDay] = React.useState(7);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: M_FONTS.body }}>
      {/* hero */}
      <section style={{ paddingTop: D.sectionGap * 0.6, paddingBottom: D.sectionGap * 0.6 }}>
        <Container>
          <Tag>Itinerary № 14 · Italy · Spring 2026</Tag>
          <h1 data-r="h1-xl" style={{ fontFamily: M_FONTS.display, fontSize: 156 * D.h1, color: C.deep, margin: '20px 0 0', lineHeight: 1.0, letterSpacing: -1, fontWeight: 400 }}>
            Italy,<br/><em style={{ color: C.primary }}>slowly.</em>
          </h1>
          <p style={{ fontFamily: M_FONTS.display, fontStyle: 'italic', fontSize: 26, color: C.inkSoft, maxWidth: 720, margin: '28px 0 0', lineHeight: 1.35, fontWeight: 400 }}>
            {ITALY.subtitle}
          </p>
        </Container>
      </section>

      {/* hero photo + meta */}
      <Container>
        <div style={{ borderRadius: 16, overflow: 'hidden', background: '#e6d8b8' }}>
          <image-slot id="m-dt-hero" placeholder="Tuscan hillside · cover photo" shape="rect" radius="0"
            style={{ display: 'block', width: '100%', aspectRatio: '21/9' }} />
        </div>
        {/* meta strip */}
        <div data-r="meta-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, marginTop: 48, paddingTop: 28, paddingBottom: 28, borderTop: `1px solid ${C.ink}14`, borderBottom: `1px solid ${C.ink}14` }}>
          {Object.entries(ITALY.meta).map(([k, v], i) => (
            <div key={k} style={{ paddingLeft: i ? 24 : 0, borderLeft: i ? `1px solid ${C.ink}10` : 'none' }}>
              <div style={{ fontFamily: M_FONTS.mono, fontSize: 10, color: C.inkSoft, letterSpacing: 1.4, textTransform: 'uppercase' }}>{k.replace(/([A-Z])/g, ' $1')}</div>
              <div style={{ fontFamily: M_FONTS.display, fontSize: 18, color: C.deep, marginTop: 6, fontWeight: 400 }}>{v}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* intro */}
      <section style={{ padding: `${D.sectionGap}px 0` }}>
        <Container><div data-r="intro-split" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80 }}>
          <Tag>The intro</Tag>
          <p style={{ fontFamily: M_FONTS.display, fontStyle: 'italic', fontSize: 28, lineHeight: 1.4, color: C.deep, margin: 0, fontWeight: 400, letterSpacing: -0.3 }}>
            {ITALY.intro}
          </p>
        </div></Container>
      </section>

      {/* route map */}
      <section style={{ paddingBottom: D.sectionGap }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
            <h2 style={{ fontFamily: M_FONTS.display, fontSize: 40 * D.h1, color: C.deep, margin: 0, letterSpacing: -0.6, fontWeight: 400 }}>The route</h2>
            <span style={{ fontFamily: M_FONTS.mono, fontSize: 11, color: C.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>5 cities · 6 stops · 1,420 km</span>
          </div>
          <div style={{ background: C.paper, borderRadius: 16, padding: 40, position: 'relative', overflow: 'hidden' }}>
            <ModernRouteMap />
          </div>
        </Container>
      </section>

      {/* day list */}
      <section style={{ paddingBottom: D.sectionGap }}>
        <Container>
          <h2 data-r="h2" style={{ fontFamily: M_FONTS.display, fontSize: 48 * D.h1, color: C.deep, margin: '0 0 12px', letterSpacing: -1, fontWeight: 400 }}>
            Day by day.
          </h2>
          <p style={{ fontSize: 16, color: C.inkSoft, margin: '0 0 32px' }}>Click any day to expand.</p>
          <div style={{ borderTop: `1px solid ${C.ink}14` }}>
            {ITALY.days.map((d) => (
              <DayRow key={d.day} d={d} open={openDay === d.day} onClick={() => setOpenDay(openDay === d.day ? -1 : d.day)} />
            ))}
          </div>
        </Container>
      </section>

      {/* tips */}
      <section style={{ background: C.paper, padding: `${D.sectionGap}px 0` }}>
        <Container>
          <Tag>What we'd tell you</Tag>
          <h2 data-r="h2" style={{ fontFamily: M_FONTS.display, fontSize: 56 * D.h1, color: C.deep, margin: '14px 0 36px', letterSpacing: -0.3, fontWeight: 400, lineHeight: 0.95 }}>
            A few hard-won tips.
          </h2>
          <div data-r="cards-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 36, rowGap: 40 }}>
            {ITALY.tips.map((t, i) => (
              <div key={i} style={{ paddingTop: 20, borderTop: `1px solid ${C.ink}20` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
                  <span style={{ fontFamily: M_FONTS.mono, fontSize: 11, color: C.primary, letterSpacing: 1.4, fontWeight: 500 }}>0{i + 1}</span>
                  <h4 style={{ fontFamily: M_FONTS.display, fontSize: 26, color: C.deep, margin: 0, letterSpacing: -0.4, fontWeight: 400 }}>{t.title}</h4>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>{t.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <Footer setPage={setPage} />
    </div>
  );
}

function DayRow({ d, open, onClick }) {
  const { C } = useM();
  return (
    <div style={{ borderBottom: `1px solid ${C.ink}14`, background: open ? `${C.paper}60` : 'transparent', transition: 'background .15s' }}>
      <button onClick={onClick} data-r="day-row" style={{
        width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
        padding: '22px 0', textAlign: 'left', fontFamily: 'inherit', color: 'inherit',
        display: 'grid', gridTemplateColumns: '70px 130px 1fr 110px 30px', alignItems: 'center', gap: 24,
      }}>
        <div style={{ fontFamily: M_FONTS.display, fontSize: 32, color: C.primary, lineHeight: 1, fontStyle: 'italic', fontWeight: 400 }}>{String(d.day).padStart(2, '0')}</div>
        <div data-r="day-row-tag" style={{ fontFamily: M_FONTS.mono, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.inkSoft }}>{d.city}</div>
        <div data-r="day-row-title" style={{ fontFamily: M_FONTS.display, fontSize: 22, color: C.deep, letterSpacing: -0.3, fontWeight: 400 }}>{d.title}</div>
        <div data-r="day-row-km" style={{ fontFamily: M_FONTS.mono, fontSize: 10.5, color: C.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>{d.date} · {d.tag}</div>
        <div style={{ fontSize: 20, color: C.inkSoft, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .2s', textAlign: 'right' }}>+</div>
      </button>
      {open && (
        <div data-r="day-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32, padding: '6px 0 32px 100px' }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', background: '#e6d8b8' }}>
            <image-slot id={'m-dt-d' + d.day} placeholder={`Day ${d.day} · ${d.city}`} shape="rect" radius="0"
              style={{ display: 'block', width: '100%', aspectRatio: '4/5' }} />
          </div>
          <div>
            <p style={{ fontFamily: M_FONTS.display, fontStyle: 'italic', fontSize: 19, lineHeight: 1.5, color: C.ink, margin: '0 0 24px', fontWeight: 400 }}>
              {d.body}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 20, borderTop: `1px solid ${C.ink}14` }}>
              <div>
                <div style={{ fontFamily: M_FONTS.mono, fontSize: 10, color: C.inkSoft, letterSpacing: 1.4, textTransform: 'uppercase' }}>Stayed</div>
                <div style={{ fontFamily: M_FONTS.display, fontSize: 17, color: C.deep, marginTop: 6, fontWeight: 400 }}>{d.hotel}</div>
              </div>
              <div>
                <div style={{ fontFamily: M_FONTS.mono, fontSize: 10, color: C.inkSoft, letterSpacing: 1.4, textTransform: 'uppercase' }}>Ate</div>
                <div style={{ fontFamily: M_FONTS.display, fontSize: 17, color: C.deep, marginTop: 6, fontWeight: 400 }}>{d.eat}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModernRouteMap() {
  const { C } = useM();
  const stops = [
    { name: 'Florence',  x: 410, y: 220, days: '1-5, 9' },
    { name: 'Pisa',      x: 380, y: 240, days: '4',     side: true },
    { name: 'Lucca',     x: 388, y: 220, days: '4',     side: true, offsetY: -18 },
    { name: 'Rome',      x: 420, y: 295, days: '5' },
    { name: 'Venice',    x: 480, y: 145, days: '6-8' },
    { name: 'Prosecco',  x: 470, y: 170, days: '8',     side: true, offsetY: -16 },
  ];
  const italyPath = "M 405 110 L 415 130 L 430 145 L 460 150 L 485 145 L 500 155 L 495 175 L 480 180 L 460 185 L 440 195 L 425 215 L 415 240 L 420 265 L 425 295 L 440 320 L 450 345 L 445 365 L 430 380 L 415 385 L 405 380 L 395 365 L 380 345 L 360 320 L 345 295 L 350 265 L 360 240 L 370 215 L 380 195 L 395 180 L 400 160 L 395 140 Z";
  return (
    <svg viewBox="0 0 800 420" style={{ width: '100%', height: 'auto', maxHeight: 480, display: 'block' }} fill="none">
      <path d={italyPath} fill={C.cream} stroke={C.ink + '40'} strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx="305" cy="320" rx="22" ry="32" fill={C.cream} stroke={C.ink + '40'} strokeWidth="1" transform="rotate(-12 305 320)" />
      <g stroke={C.primary} strokeWidth="2" fill="none" strokeLinecap="round">
        {stops.slice(0, -1).map((s, i) => {
          const n = stops[i + 1];
          const cx = (s.x + n.x) / 2 + (i % 2 ? 12 : -12);
          const cy = (s.y + n.y) / 2 - 8;
          return <path key={i} d={`M ${s.x} ${s.y} Q ${cx} ${cy} ${n.x} ${n.y}`} />;
        })}
      </g>
      {stops.map((s, i) => (
        <g key={s.name}>
          <circle cx={s.x} cy={s.y} r="6" fill={C.primary} />
          <circle cx={s.x} cy={s.y} r="11" fill="none" stroke={C.primary} strokeWidth="1" opacity=".3" />
          <text x={s.x + (s.side ? -14 : 14)} y={s.y + 4}
            textAnchor={s.side ? 'end' : 'start'}
            fontFamily={M_FONTS.display} fontSize="15" fill={C.deep} fontWeight="400">{s.name}</text>
          <text x={s.x + (s.side ? -14 : 14)} y={s.y + 18}
            textAnchor={s.side ? 'end' : 'start'}
            fontFamily={M_FONTS.mono} fontSize="9" letterSpacing="1" fill={C.inkSoft}>DAY {s.days}</text>
        </g>
      ))}
    </svg>
  );
}

// ───────── PHOTOGRAPHY ─────────
function Photo({ setPage }) {
  const { C, D } = useM();
  const [open, setOpen] = React.useState(null);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: M_FONTS.body }}>
      <section style={{ paddingTop: D.sectionGap * 0.6, paddingBottom: D.sectionGap * 0.6 }}>
        <Container>
          <Tag>Photography · Italy 2026 · 12 frames</Tag>
          <h1 data-r="h1-xl" style={{ fontFamily: M_FONTS.display, fontSize: 96 * D.h1, color: C.deep, margin: '20px 0 14px', lineHeight: 1.04, letterSpacing: -0.5, fontWeight: 400 }}>
            Twelve frames<br/><em style={{ color: C.primary }}>from two weeks.</em>
          </h1>
          <p style={{ fontSize: 17, color: C.inkSoft, maxWidth: 580, margin: 0, lineHeight: 1.5 }}>
            Shot on a Fujifilm X100VI, mostly before breakfast. Click any photograph to open it.
          </p>
        </Container>
      </section>
      <section style={{ paddingBottom: D.sectionGap }}>
        <Container>
          {/* mosaic grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: '64px', gap: 14 }}>
            {PHOTOS.map((p, i) => {
              const spans = [
                { c: 'span 5', r: 'span 6' }, { c: 'span 3', r: 'span 5' }, { c: 'span 4', r: 'span 4' },
                { c: 'span 4', r: 'span 5' }, { c: 'span 4', r: 'span 4' }, { c: 'span 4', r: 'span 4' },
                { c: 'span 3', r: 'span 5' }, { c: 'span 3', r: 'span 4' }, { c: 'span 3', r: 'span 5' },
                { c: 'span 3', r: 'span 4' }, { c: 'span 4', r: 'span 5' }, { c: 'span 5', r: 'span 4' },
              ][i];
              return (
                <button key={p.id} onClick={() => setOpen(p)} style={{
                  gridColumn: spans.c, gridRow: spans.r, padding: 0, border: 'none', cursor: 'pointer',
                  background: 'transparent', position: 'relative', overflow: 'hidden', borderRadius: 10,
                }}>
                  <image-slot id={'m-ph-' + p.id} placeholder={p.caption} shape="rect" radius="0"
                    style={{ display: 'block', width: '100%', height: '100%', background: '#e6d8b8' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,.7))', opacity: 0, transition: 'opacity .2s', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 14 }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                    <div style={{ color: '#fff', fontFamily: M_FONTS.display, fontSize: 16, fontStyle: 'italic', fontWeight: 400 }}>{p.caption}</div>
                    <div style={{ color: 'rgba(255,255,255,.8)', fontFamily: M_FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{p.location}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Container>
      </section>
      {open && <Lightbox photo={open} onClose={() => setOpen(null)} setOpen={setOpen} />}
      <Footer setPage={setPage} />
    </div>
  );
}

function Lightbox({ photo, onClose, setOpen }) {
  const { C } = useM();
  const idx = PHOTOS.indexOf(photo);
  const go = (d) => setOpen(PHOTOS[(idx + d + PHOTOS.length) % PHOTOS.length]);
  React.useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [photo]);
  const arrow = (side) => ({
    position: 'fixed', top: '50%', [side]: 24, transform: 'translateY(-50%)',
    width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.1)',
    color: '#fff', border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', fontSize: 22,
    fontFamily: M_FONTS.display, backdropFilter: 'blur(8px)', zIndex: 110,
    display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 3,
  });
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,15,.95)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, backdropFilter: 'blur(12px)' }}>
      <button onClick={(e) => { e.stopPropagation(); go(-1); }} style={arrow('left')}>‹</button>
      <button onClick={(e) => { e.stopPropagation(); go(1); }} style={arrow('right')}>›</button>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, width: '100%' }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', background: '#1a1714' }}>
          <image-slot id={'m-ph-' + photo.id} placeholder={photo.caption} shape="rect" radius="0"
            style={{ display: 'block', width: '100%', aspectRatio: '4/5' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18, color: '#fff' }}>
          <div>
            <div style={{ fontFamily: M_FONTS.display, fontStyle: 'italic', fontSize: 24, fontWeight: 400 }}>{photo.caption}</div>
            <div style={{ fontFamily: M_FONTS.mono, fontSize: 11, letterSpacing: 1.5, opacity: .7, textTransform: 'uppercase', marginTop: 6 }}>{photo.location} · {idx + 1} / {PHOTOS.length}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '8px 16px', fontFamily: M_FONTS.body, fontSize: 12, cursor: 'pointer', borderRadius: 999 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ───────── VIDEOS ─────────
function Videos({ setPage }) {
  const { C, D } = useM();
  const [active, setActive] = React.useState(VIDEOS[0]);
  const [playing, setPlaying] = React.useState(false);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: M_FONTS.body }}>
      <section style={{ paddingTop: D.sectionGap * 0.6, paddingBottom: 40 }}>
        <Container style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Tag>YouTube · {SITE.youtube}</Tag>
            <h1 data-r="h1-xl" style={{ fontFamily: M_FONTS.display, fontSize: 96 * D.h1, color: C.deep, margin: '20px 0 0', lineHeight: 1.04, letterSpacing: -0.5, fontWeight: 400 }}>
              The <em style={{ color: C.primary }}>films.</em>
            </h1>
          </div>
          <a href={SITE.youtubeUrl} target="_blank" rel="noopener" style={{ fontFamily: M_FONTS.body, fontSize: 13, color: C.primary, fontWeight: 600, textDecoration: 'none', borderBottom: `1.5px solid ${C.primary}`, paddingBottom: 4 }}>
            Subscribe · 184K →
          </a>
        </Container>
      </section>
      <Container>
        <div style={{ position: 'relative', background: '#000', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9', cursor: 'pointer' }} onClick={() => setPlaying(true)}>
          {playing ? (
            <iframe src={`https://www.youtube.com/embed/${active.id}?autoplay=1&rel=0`} title={active.title} allow="autoplay; encrypted-media" allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
          ) : (
            <>
              <image-slot id={'m-vid-feat-' + active.title.slice(0,6).replace(/\W/g,'')} placeholder={'Thumbnail · ' + active.title} shape="rect" radius="0"
                style={{ display: 'block', width: '100%', height: '100%' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,.7))', display: 'flex', alignItems: 'flex-end', padding: 40 }}>
                <div style={{ color: '#fff', maxWidth: 600 }}>
                  <Tag color={C.accent}>Featured</Tag>
                  <h2 style={{ fontFamily: M_FONTS.display, fontSize: 44, margin: '10px 0 4px', letterSpacing: -1, fontWeight: 400, color: '#fff' }}>{active.title}</h2>
                  <div style={{ fontFamily: M_FONTS.mono, fontSize: 11.5, letterSpacing: 1.5, opacity: .85, textTransform: 'uppercase' }}>{active.dur} · {active.views} views</div>
                </div>
              </div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 84, height: 84, borderRadius: '50%', background: 'rgba(255,255,255,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                <div style={{ width: 0, height: 0, borderLeft: `22px solid ${C.deep}`, borderTop: '13px solid transparent', borderBottom: '13px solid transparent', marginLeft: 6 }} />
              </div>
            </>
          )}
        </div>
      </Container>
      <section style={{ padding: `${D.sectionGap}px 0` }}>
        <Container>
          <h2 style={{ fontFamily: M_FONTS.display, fontSize: 36 * D.h1, color: C.deep, margin: '0 0 32px', letterSpacing: -0.6, fontWeight: 400 }}>More from the channel</h2>
          <div data-r="cards-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, rowGap: 40 }}>
            {VIDEOS.slice(1).map((v, i) => (
              <button key={i} onClick={() => { setActive(v); setPlaying(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, transition: 'transform .2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                  <image-slot id={'m-vid-' + i} placeholder={v.title} shape="rect" radius="0"
                    style={{ display: 'block', width: '100%', aspectRatio: '16/9' }} />
                  <div style={{ position: 'absolute', right: 10, bottom: 10, background: 'rgba(0,0,0,.85)', color: '#fff', fontFamily: M_FONTS.mono, fontSize: 11, padding: '2px 7px', letterSpacing: 0.5, borderRadius: 4 }}>{v.dur}</div>
                </div>
                <h4 style={{ fontFamily: M_FONTS.display, fontSize: 20, color: C.deep, margin: '14px 0 4px', lineHeight: 1.2, letterSpacing: -0.3, fontWeight: 400 }}>{v.title}</h4>
                <div style={{ fontFamily: M_FONTS.mono, fontSize: 10.5, letterSpacing: 1, color: C.inkSoft, textTransform: 'uppercase' }}>{v.views} · {v.date}</div>
              </button>
            ))}
          </div>
        </Container>
      </section>
      <Reels />
      <Footer setPage={setPage} />
    </div>
  );
}

// ───────── REELS ─────────
function Reels() {
  const { C, D } = useM();
  return (
    <section style={{ padding: `${D.sectionGap * 0.7}px 0`, borderTop: `1px solid ${C.ink}10`, borderBottom: `1px solid ${C.ink}10` }}>
      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Tag>Instagram · {SITE.instagram}</Tag>
            <h3 style={{ fontFamily: M_FONTS.display, fontSize: 40 * D.h1, color: C.deep, margin: '12px 0 0', lineHeight: 1, letterSpacing: -0.6, fontWeight: 400 }}>Reels, in passing.</h3>
          </div>
          <a href={SITE.instagramUrl} target="_blank" rel="noopener" style={{ fontFamily: M_FONTS.body, fontSize: 13, color: C.primary, fontWeight: 600, textDecoration: 'none' }}>Follow →</a>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
          {REELS.map((r) => (
            <div key={r.id} style={{ flex: '0 0 200px', position: 'relative', cursor: 'pointer', scrollSnapAlign: 'start', borderRadius: 10, overflow: 'hidden' }}>
              <image-slot id={'m-reel-' + r.id} src={r.id === 'r01' ? 'assets/insta-bennett-lane.jpg' : r.id === 'r02' ? 'assets/insta-where-now.jpg' : undefined} placeholder={r.label} shape="rect" radius="0"
                style={{ display: 'block', width: 200, height: 350, background: '#e6d8b8' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,.75))', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)', color: '#fff', fontFamily: M_FONTS.mono, fontSize: 9, padding: '3px 7px', letterSpacing: 1, fontWeight: 600, borderRadius: 4 }}>▶ REEL</div>
              <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, color: '#fff' }}>
                <div style={{ fontFamily: M_FONTS.display, fontStyle: 'italic', fontSize: 16, fontWeight: 400 }}>{r.label}</div>
                <div style={{ fontFamily: M_FONTS.mono, fontSize: 10, opacity: .85, letterSpacing: 1, marginTop: 4 }}>♥ {r.likes}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ───────── SHOP ─────────
function Shop({ setPage }) {
  const { C, D } = useM();
  const cats = ['All', ...new Set(SHOP.map((s) => s.cat))];
  const [cat, setCat] = React.useState('All');
  const visible = SHOP.filter((s) => cat === 'All' || s.cat === cat);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: M_FONTS.body }}>
      <section style={{ paddingTop: D.sectionGap * 0.6, paddingBottom: 40 }}>
        <Container>
          <Tag>The shop · Affiliate</Tag>
          <h1 data-r="h1-xl" style={{ fontFamily: M_FONTS.display, fontSize: 96 * D.h1, color: C.deep, margin: '20px 0 16px', lineHeight: 1.04, letterSpacing: -0.5, fontWeight: 400 }}>
            What we <em style={{ color: C.primary }}>actually use.</em>
          </h1>
          <p style={{ fontSize: 16, color: C.inkSoft, maxWidth: 600, margin: '0 0 28px', lineHeight: 1.55 }}>
            Honest list. Links earn us a small commission and never cost you more. We don't recommend anything we haven't worn out on the road.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cats.map((f) => (
              <button key={f} onClick={() => setCat(f)} style={{
                background: cat === f ? C.deep : 'transparent', color: cat === f ? C.cream : C.deep,
                border: `1px solid ${cat === f ? C.deep : C.ink + '20'}`,
                padding: '6px 14px', fontFamily: M_FONTS.body, fontSize: 12.5, cursor: 'pointer',
                borderRadius: 999, fontWeight: 500,
              }}>{f}</button>
            ))}
          </div>
        </Container>
      </section>
      <section style={{ paddingBottom: D.sectionGap }}>
        <Container>
          <div data-r="cards-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28, rowGap: 32 }}>
            {visible.map((s) => (
              <article key={s.id} data-r="shop-card" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, paddingTop: 20, borderTop: `1px solid ${C.ink}14`, cursor: 'pointer', transition: 'transform .2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ borderRadius: 10, overflow: 'hidden', background: '#e6d8b8' }}>
                  <image-slot id={'m-shop-' + s.id} placeholder={s.name} shape="rect" radius="0"
                    style={{ display: 'block', width: '100%', height: 200 }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <Tag subtle>{s.cat}</Tag>
                    <span style={{ fontFamily: M_FONTS.display, fontStyle: 'italic', fontSize: 22, color: C.primary, fontWeight: 400 }}>{s.price}</span>
                  </div>
                  <h3 style={{ fontFamily: M_FONTS.display, fontSize: 24, color: C.deep, margin: '4px 0 10px', lineHeight: 1.15, letterSpacing: -0.3, fontWeight: 400 }}>{s.name}</h3>
                  <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.6, margin: '0 0 14px' }}>{s.why}</p>
                  <span style={{ fontFamily: M_FONTS.body, fontSize: 13, color: C.deep, fontWeight: 600, borderBottom: `1.5px solid ${C.primary}`, paddingBottom: 3 }}>Shop on Amazon →</span>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <Footer setPage={setPage} />
    </div>
  );
}

// ───────── APP ─────────
function App({ setPage }) {
  const { C, D } = useM();
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: M_FONTS.body }}>
      <section style={{ paddingTop: D.sectionGap * 0.6, paddingBottom: D.sectionGap }}>
        <Container>
          <div data-r="app-split" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 22 }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.cream, fontFamily: M_FONTS.display, fontStyle: 'italic', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>H</div>
                <div>
                  <Tag>The app · iPhone</Tag>
                  <div style={{ fontFamily: M_FONTS.display, fontSize: 24, color: C.deep, marginTop: 4, fontWeight: 400 }}>HappenUpon</div>
                </div>
              </div>
              <h1 data-r="h1-xl" style={{ fontFamily: M_FONTS.display, fontSize: 96 * D.h1, color: C.deep, margin: '0 0 22px', lineHeight: 1.02, letterSpacing: -0.5, fontWeight: 400 }}>
                Every booking,<br/><em style={{ color: C.primary }}>day by day.</em>
              </h1>
              <p style={{ fontSize: 17, color: C.inkSoft, maxWidth: 480, margin: '0 0 32px', lineHeight: 1.55 }}>
                Flights, hotels, restaurants, activities, cruises — organized into a clean timeline you can actually use mid-trip. Paste a confirmation email; HappenUpon does the typing.
              </p>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <Btn dark> Download for iPhone</Btn>
                <span style={{ fontSize: 13.5, color: C.inkSoft }}>Free for 2 trips · Pro $29/yr</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', height: 600 }}>
              <div data-r="phone-frame" style={{ width: 280, height: 580, background: C.deep, borderRadius: 42, padding: 11, boxShadow: '0 36px 80px rgba(0,0,0,.22)' }}>
                <image-slot id="m-app-1" placeholder="App · timeline" shape="rounded" radius="30"
                  style={{ display: 'block', width: '100%', height: '100%', background: C.cream }} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section style={{ background: C.paper, padding: `${D.sectionGap}px 0` }}>
        <Container>
          <Tag>What it does</Tag>
          <h2 data-r="h2" style={{ fontFamily: M_FONTS.display, fontSize: 56 * D.h1, color: C.deep, margin: '14px 0 48px', letterSpacing: -0.3, fontWeight: 400, lineHeight: 0.95 }}>
            A planner you'll <em style={{ color: C.primary }}>actually open.</em>
          </h2>
          <div data-r="cards-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, rowGap: 48 }}>
            {[
              ['Email Auto-Parse', 'Paste a confirmation. AI extracts every detail in seconds.'],
              ['Secure Vault', 'Passport, Global Entry, loyalty numbers — encrypted in iOS Keychain. Never on a server.'],
              ['PDF Export', 'A beautiful shareable PDF for travel companions. Hide sensitive details with one toggle.'],
              ['10 item types', 'Flights, hotels, cars, restaurants, activities, transport, cruises, places, notes, journals.'],
              ['Day-by-day', 'Every booking on one timeline. Tap any item for full details. Swipe to delete.'],
              ['Backup & Restore', 'Export any trip to iCloud Drive. Restore on a new device in seconds.'],
            ].map(([t, b], i) => (
              <div key={t} style={{ paddingTop: 20, borderTop: `1px solid ${C.ink}20` }}>
                <div style={{ fontFamily: M_FONTS.mono, fontSize: 11, color: C.primary, letterSpacing: 1.4, fontWeight: 500, marginBottom: 6 }}>0{i + 1}</div>
                <h4 style={{ fontFamily: M_FONTS.display, fontSize: 24, color: C.deep, margin: '0 0 10px', letterSpacing: -0.3, fontWeight: 400 }}>{t}</h4>
                <p style={{ fontSize: 14.5, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section style={{ padding: `${D.sectionGap}px 0` }}>
        <Container>
          <Tag>Pricing</Tag>
          <h2 data-r="h2" style={{ fontFamily: M_FONTS.display, fontSize: 48 * D.h1, color: C.deep, margin: '14px 0 48px', letterSpacing: -1, fontWeight: 400, lineHeight: 0.95 }}>
            Free for 2 trips. <em style={{ color: C.primary }}>$29/yr</em> for unlimited.
          </h2>
          <div data-r="cards-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            {[
              { name: 'Free', price: '$0', feats: ['2 active trips', 'All 10 item types', 'Secure Vault', 'PDF Export', 'Manual entry'], hi: false },
              { name: 'Pro',  price: '$29/yr', feats: ['Unlimited trips', 'Email Auto-Parse', 'All Free features', 'Priority updates', 'Cloud sync'], hi: true },
            ].map((p) => (
              <div key={p.name} style={{
                background: p.hi ? C.deep : '#fff', color: p.hi ? C.cream : C.ink,
                padding: 36, borderRadius: 16, boxShadow: p.hi ? '0 12px 40px rgba(0,0,0,.18)' : '0 1px 2px rgba(0,0,0,.04), 0 8px 28px rgba(0,0,0,.06)',
                border: p.hi ? 'none' : `1px solid ${C.ink}10`,
                position: 'relative',
              }}>
                {p.hi && (
                  <div style={{ position: 'absolute', top: 24, right: 24 }}>
                    <span style={{ fontFamily: M_FONTS.mono, fontSize: 10, letterSpacing: 1.4, color: C.accent, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,.1)' }}>RECOMMENDED</span>
                  </div>
                )}
                <div style={{ fontFamily: M_FONTS.display, fontSize: 32, color: p.hi ? C.accent : C.deep, fontWeight: 400, letterSpacing: -0.4 }}>{p.name}</div>
                <div style={{ fontFamily: M_FONTS.display, fontSize: 56, color: p.hi ? C.cream : C.primary, marginTop: 8, lineHeight: 1, letterSpacing: -0.4, fontWeight: 400 }}>{p.price}</div>
                <Rule color={p.hi ? 'rgba(255,255,255,.15)' : C.ink + '10'} />
                <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', fontSize: 14, lineHeight: 1.9 }}>
                  {p.feats.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: p.hi ? C.accent : C.primary }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <Footer setPage={setPage} />
    </div>
  );
}

// ───────── FOOTER ─────────
function Footer({ setPage }) {
  const { C, D } = useM();
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  return (
    <footer style={{ background: C.deep, color: C.cream, padding: `${D.sectionGap * 0.6}px 0 32px` }}>
      <Container>
        <div data-r="newsletter-split" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 64, paddingBottom: 48, borderBottom: `1px solid rgba(255,255,255,.12)` }}>
          <div>
            <Tag color={C.accent}>Newsletter</Tag>
            <h3 style={{ fontFamily: M_FONTS.display, fontSize: 56 * D.h1, color: C.cream, margin: '14px 0 12px', letterSpacing: -0.3, fontWeight: 400, lineHeight: 0.95 }}>
              Letters from the road,<br/><em style={{ color: C.accent }}>monthly.</em>
            </h3>
            <p style={{ fontSize: 15, opacity: .75, maxWidth: 460, margin: 0, lineHeight: 1.55 }}>
              One email a month. New itineraries, the photographs we couldn't fit, and where we're going next.
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (email) setSent(true); }} style={{ alignSelf: 'end' }}>
            {sent ? (
              <div style={{ fontFamily: M_FONTS.display, fontStyle: 'italic', fontSize: 20, color: C.accent, fontWeight: 400 }}>Thank you — see you next month.</div>
            ) : (
              <div style={{ display: 'flex', borderBottom: `1px solid ${C.cream}`, paddingBottom: 8 }}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                  style={{ flex: 1, background: 'transparent', border: 'none', color: C.cream, fontFamily: M_FONTS.display, fontSize: 20, fontStyle: 'italic', outline: 'none' }} />
                <button type="submit" style={{ background: 'transparent', border: 'none', color: C.cream, fontFamily: M_FONTS.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>Subscribe →</button>
              </div>
            )}
          </form>
        </div>
        <div data-r="footer-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28, fontSize: 12.5, color: 'rgba(255,255,255,.6)', fontFamily: M_FONTS.mono, letterSpacing: 1, textTransform: 'uppercase', flexWrap: 'wrap', gap: 12 }}>
          <div>© 2026 {SITE.brand} · By {SITE.authors}</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href={SITE.youtubeUrl} target="_blank" rel="noopener" style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none' }}>YouTube</a>
            <a href={SITE.instagramUrl} target="_blank" rel="noopener" style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none' }}>Instagram</a>
            <button onClick={() => setPage('app')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.85)', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', cursor: 'pointer', padding: 0 }}>HappenUpon</button>
          </div>
        </div>
      </Container>
    </footer>
  );
}

// ───────── ROOT ─────────
function ModernSite({ palette = 'tuscan', density = 'regular' }) {
  const [page, setPage] = React.useState('home');
  const value = React.useMemo(() => ({
    C: PALETTES[palette] || PALETTES.tuscan,
    D: M_DENSITY[density] || M_DENSITY.regular,
  }), [palette, density]);
  const scrollerRef = React.useRef(null);
  React.useEffect(() => { if (scrollerRef.current) scrollerRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);
  const Page = { home: Home, itineraries: Browse, detail: Detail, photography: Photo, videos: Videos, shop: Shop, app: App }[page] || Home;
  return (
    <ModernCtx.Provider value={value}>
      <div ref={scrollerRef} style={{ height: '100%', overflowY: 'auto', background: value.C.cream, position: 'relative' }}>
        <Nav page={page} setPage={setPage} />
        <Page setPage={setPage} />
      </div>
    </ModernCtx.Provider>
  );
}

Object.assign(window, { ModernSite });
