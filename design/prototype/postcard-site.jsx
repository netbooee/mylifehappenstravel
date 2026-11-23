// Postcard site — sun-soaked, palette-aware.
// Palettes share the same role keys (cream/paper/accent/primary/primaryDk/deep/deepDk/secondary/ink/inkSoft)
// so swapping the palette restyles the whole site without component changes.

const PALETTES = {
  tuscan: {
    name: 'Tuscan',
    cream:    '#fbf3df',
    paper:    '#f7e9c5',
    accent:   '#f3c64e',      // butter
    primary:  '#c96442',      // terracotta
    primaryDk:'#a04929',
    deep:     '#1a3a5c',      // navy
    deepDk:   '#0f2440',
    secondary:'#7a8546',      // olive
    ink:      '#2a1f15',
    inkSoft:  '#705a44',
    grain:    'rgba(201,100,66,.025)',
  },
  coastal: {
    name: 'Coastal',
    cream:    '#f3eee6',
    paper:    '#e7ddc9',
    accent:   '#e9b551',      // sand
    primary:  '#e16a4d',      // coral
    primaryDk:'#b8472d',
    deep:     '#0e3a4c',      // ocean
    deepDk:   '#062330',
    secondary:'#5a7d6e',      // seafoam
    ink:      '#1a2026',
    inkSoft:  '#5a6770',
    grain:    'rgba(225,106,77,.025)',
  },
  sageRust: {
    name: 'Sage & Rust',
    cream:    '#f1ecde',
    paper:    '#e0d9c1',
    accent:   '#d49b3a',      // mustard
    primary:  '#a13e1f',      // deep rust
    primaryDk:'#7a2f15',
    deep:     '#2d4534',      // forest
    deepDk:   '#1a2a1f',
    secondary:'#7d8a5a',      // sage
    ink:      '#221c14',
    inkSoft:  '#5e5640',
    grain:    'rgba(161,62,31,.025)',
  },
  dusk: {
    name: 'Dusk',
    cream:    '#f5ecdf',
    paper:    '#ecdbc3',
    accent:   '#e89f4a',      // amber
    primary:  '#a83e5b',      // berry
    primaryDk:'#7d2843',
    deep:     '#2b2342',      // aubergine
    deepDk:   '#1a1530',
    secondary:'#8a5a7d',      // plum
    ink:      '#221825',
    inkSoft:  '#6a5c6e',
    grain:    'rgba(168,62,91,.025)',
  },
};

const FONTS = {
  display:  '"DM Serif Display", "Playfair Display", Georgia, serif',
  hand:     '"Caveat", "Reenie Beanie", "Bradley Hand", cursive',
  body:     '"DM Sans", "Geist", -apple-system, "Helvetica Neue", Arial, sans-serif',
  mono:     '"DM Mono", "JetBrains Mono", ui-monospace, monospace',
};

const DENSITY = {
  cozy:    { pad: 36, sectionGap: 48, h1: 0.85, body: 0.96 },
  regular: { pad: 48, sectionGap: 64, h1: 1,    body: 1 },
  airy:    { pad: 64, sectionGap: 88, h1: 1.12, body: 1.04 },
};

const PalCtx = React.createContext({ C: PALETTES.tuscan, F: FONTS, D: DENSITY.regular });
const usePal = () => React.useContext(PalCtx);

// ───────── paper texture (subtle SVG noise) ─────────
const PAPER_BG = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 0.55  0 0 0 0 0.4  0 0 0 0 0.25  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// ───────── primitives ─────────
function Stamp({ children, color, rotate = -8, size = 12, bg = 'transparent' }) {
  const { C } = usePal();
  const c = color || C.primary;
  return (
    <div style={{
      display: 'inline-block', border: `2.5px solid ${c}`, color: c, background: bg,
      padding: '4px 10px', fontFamily: FONTS.mono, fontSize: size, letterSpacing: 1.5,
      textTransform: 'uppercase', fontWeight: 700,
      transform: `rotate(${rotate}deg)`, borderRadius: 4,
    }}>{children}</div>
  );
}

function Hand({ children, color, rotate = -1, size = 28, style }) {
  const { C } = usePal();
  return (
    <span style={{
      fontFamily: FONTS.hand, fontSize: size, color: color || C.primary,
      transform: `rotate(${rotate}deg)`, display: 'inline-block', lineHeight: 1, ...style,
    }}>{children}</span>
  );
}

function Polaroid({ id, label, w, h, ratio, rotate = 0, captionInside, hand = false, stamp, stampColor, frameBg = '#fff' }) {
  const { C } = usePal();
  return (
    <div style={{
      background: frameBg, padding: 10, paddingBottom: captionInside ? 36 : 10,
      boxShadow: '0 6px 24px rgba(42,31,21,.14), 0 0 0 1px rgba(42,31,21,.05)',
      transform: rotate ? `rotate(${rotate}deg)` : 'none', display: 'inline-block', position: 'relative',
    }}>
      <image-slot id={id} placeholder={label} shape="rect" radius="0"
        style={{ display: 'block', width: w ? w + 'px' : '100%', height: h ? h + 'px' : 'auto', aspectRatio: ratio, background: '#e6d8b8' }} />
      {captionInside && (
        <div style={{ paddingTop: 10, fontFamily: hand ? FONTS.hand : FONTS.body, fontSize: hand ? 18 : 12, color: hand ? C.ink : C.inkSoft, textAlign: 'center', lineHeight: 1.15 }}>
          {captionInside}
        </div>
      )}
      {stamp && (
        <div style={{ position: 'absolute', top: -12, right: -12 }}>
          <Stamp color={stampColor} rotate={12} size={9} bg={C.cream}>{stamp}</Stamp>
        </div>
      )}
    </div>
  );
}

// ───────── NAV ─────────
function Nav({ page, setPage }) {
  const { C } = usePal();
  return (
    <header style={{
      background: C.cream, borderBottom: `2px dashed ${C.primary}`,
      padding: '18px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(8px)',
    }}>
      <button onClick={() => setPage('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: 0 }}>
        <div style={{ position: 'relative', width: 46, height: 46 }}>
          <div style={{ position: 'absolute', inset: 0, background: C.primary, borderRadius: '50%', boxShadow: `0 2px 0 ${C.primaryDk}` }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cream, fontFamily: FONTS.display, fontSize: 24, lineHeight: 1, transform: 'translateY(1px)' }}>m</div>
        </div>
        <div style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, color: C.deep, lineHeight: 1 }}>My Life Happens</div>
          <Hand size={18} style={{ marginTop: 2 }}>travel ✈</Hand>
        </div>
      </button>
      <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            background: page === n.id ? C.deep : 'transparent',
            color: page === n.id ? C.cream : C.deep,
            border: 'none', padding: '8px 14px', fontFamily: FONTS.body, fontSize: 13,
            cursor: 'pointer', fontWeight: page === n.id ? 700 : 500, borderRadius: 24,
            transition: 'background .15s', whiteSpace: 'nowrap',
          }}>{n.label}</button>
        ))}
      </nav>
      <Stamp color={C.primary}>Spring 2026</Stamp>
    </header>
  );
}

// ───────── HOME ─────────
function Home({ setPage }) {
  const { C, D } = usePal();
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: FONTS.body, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: PAPER_BG, opacity: .4, pointerEvents: 'none' }} />

      {/* hero */}
      <section style={{ padding: `${D.pad}px ${D.pad}px 32px`, position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 40, alignItems: 'center', minHeight: 620 }}>
          <div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
              <Stamp color={C.primary} rotate={-4}>Now Showing — Italy</Stamp>
              <Hand size={26} rotate={-2}>↓ our latest</Hand>
            </div>
            <h1 style={{ fontFamily: FONTS.display, fontWeight: 400, fontSize: 104 * D.h1, lineHeight: 0.92, color: C.deep, margin: 0, letterSpacing: -1.2 }}>
              Greetings,<br/>from <span style={{ color: C.primary }}>Italy</span>.
            </h1>
            <Hand size={32} rotate={-1.5} style={{ marginTop: 14 }}>ten days, three cities.</Hand>
            <p style={{ fontSize: 15.5 * D.body, lineHeight: 1.7, color: C.ink, maxWidth: 480, margin: '14px 0 28px' }}>
              Florence, Venice and Rome. Renaissance art, Adriatic canals, ancient ruins and great pasta. Five nights in Florence, three in Venice, four smart day trips woven in.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setPage('detail')} style={{
                background: C.primary, color: C.cream, border: 'none', padding: '14px 28px',
                fontFamily: FONTS.body, fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 32,
                boxShadow: '0 4px 0 ' + C.primaryDk, transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '0 2px 0 ' + C.primaryDk; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 0 ' + C.primaryDk; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 0 ' + C.primaryDk; }}>
                Open the itinerary →
              </button>
              <button onClick={() => setPage('photography')} style={{ background: 'transparent', color: C.deep, border: `2px solid ${C.deep}`, padding: '12px 26px', fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 32 }}>
                See the photographs
              </button>
            </div>
          </div>

          {/* photo cluster */}
          <div style={{ position: 'relative', height: 600 }}>
            <div style={{ position: 'absolute', top: 30, left: 30 }}>
              <Polaroid id="hero-1" label="Florence, the Duomo" w={290} h={365} rotate={-6} captionInside="Florence, the Duomo" hand />
            </div>
            <div style={{ position: 'absolute', top: 0, right: 0 }}>
              <Polaroid id="hero-2" label="Pasta class" w={210} h={270} rotate={5} captionInside="Day 3 — pasta + gelato" hand stamp="♡" stampColor={C.primary} />
            </div>
            <div style={{ position: 'absolute', bottom: 10, right: 70 }}>
              <Polaroid id="hero-3" label="Burano blue" w={200} h={255} rotate={-3} captionInside="Burano, blue door" hand />
            </div>
            <div style={{ position: 'absolute', top: 140, right: 210, pointerEvents: 'none' }}>
              <Hand size={28} rotate={8} color={C.primary}>♥ day 7</Hand>
            </div>
            <div style={{ position: 'absolute', top: -6, left: 130 }}>
              <Stamp color={C.primary} rotate={-12} size={11} bg={C.cream}>
                <span style={{ display: 'block', textAlign: 'center', lineHeight: 1.1 }}>Posted from<br/>Italy · 2026</span>
              </Stamp>
            </div>
          </div>
        </div>
      </section>

      {/* ticket-stub stats */}
      <section style={{
        background: C.deep, color: C.cream, padding: '28px 48px', margin: '24px 24px', position: 'relative',
        clipPath: 'polygon(0 12px, 12px 0, calc(25% - 6px) 0, 25% 12px, calc(25% + 6px) 0, calc(50% - 6px) 0, 50% 12px, calc(50% + 6px) 0, calc(75% - 6px) 0, 75% 12px, calc(75% + 6px) 0, 100% 0, 100% calc(100% - 12px), calc(75% + 6px) 100%, 75% calc(100% - 12px), calc(75% - 6px) 100%, calc(50% + 6px) 100%, 50% calc(100% - 12px), calc(50% - 6px) 100%, calc(25% + 6px) 100%, 25% calc(100% - 12px), calc(25% - 6px) 100%, 0 100%)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {[['14', 'days'], ['5', 'cities'], ['68', 'meals'], ['31', 'gelati']].map(([n, l], i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontFamily: FONTS.display, borderRight: i < 3 ? `1px dashed ${C.accent}80` : 'none' }}>
              <div style={{ fontSize: 60, color: C.accent, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 18, color: C.cream, fontFamily: FONTS.body, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* postcard rack — more itineraries */}
      <section style={{ padding: `${D.sectionGap}px ${D.pad}px 32px` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: 48 * D.h1, color: C.deep, margin: 0, lineHeight: 1 }}>
            More postcards <Hand size={36} color={C.primary} style={{ marginLeft: 8 }}>recently sent</Hand>
          </h2>
          <button onClick={() => setPage('itineraries')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONTS.body, fontSize: 13, color: C.primary, fontWeight: 700, letterSpacing: 0.3 }}>
            See all 24 →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36 }}>
          {ITINERARIES.slice(1, 4).map((it, i) => {
            const rot = [-1.5, 1, -0.5][i];
            return (
              <article key={it.id} className="postcard-tilt"
                style={{ position: 'relative', cursor: 'pointer', transform: `rotate(${rot}deg)`, transition: 'transform .25s ease-out' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0) translateY(-8px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${rot}deg)`}>
                <div style={{ background: '#fff', padding: 12, boxShadow: '0 8px 24px rgba(42,31,21,.14), 0 0 0 1px rgba(42,31,21,.05)' }}>
                  <image-slot id={'home-it-' + it.id} placeholder={it.title} shape="rect" radius="2"
                    style={{ display: 'block', width: '100%', aspectRatio: '4/3', background: '#e6d8b8' }} />
                  <div style={{ paddingTop: 12, paddingLeft: 6, paddingBottom: 8 }}>
                    <Hand size={22}>from {it.country}</Hand>
                    <h3 style={{ fontFamily: FONTS.display, fontSize: 26, color: C.deep, margin: '2px 0 4px', lineHeight: 1.1 }}>{it.title}</h3>
                    <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, lineHeight: 1.45 }}>{it.blurb}</p>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 18, right: 18 }}>
                  <Stamp color={C.primary} rotate={4} size={10} bg="#fff">
                    <span style={{ display: 'block', textAlign: 'center', lineHeight: 1.1 }}>{it.days}<br/>days</span>
                  </Stamp>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* video promo */}
      <section style={{ padding: `${D.sectionGap}px ${D.pad}px`, background: C.paper, display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 48, alignItems: 'center', margin: `${D.pad}px 0`, borderTop: `2px dashed ${C.primary}`, borderBottom: `2px dashed ${C.primary}` }}>
        <div>
          <Stamp color={C.deep} rotate={-3} size={11}>Watch on YouTube</Stamp>
          <h2 style={{ fontFamily: FONTS.display, fontSize: 64 * D.h1, color: C.deep, margin: '14px 0 6px', lineHeight: 0.95 }}>
            The long version,<br/><span style={{ color: C.primary, fontStyle: 'italic' }}>uncut.</span>
          </h2>
          <Hand size={30} style={{ marginTop: 4 }}>24 unhurried minutes</Hand>
          <p style={{ fontSize: 15 * D.body, lineHeight: 1.65, color: C.ink, maxWidth: 380, margin: '14px 0 24px' }}>
            Rome to Venice, every train, every meal, every place we'd go back to. Subscribe — we drop one a month.
          </p>
          <button onClick={() => setPage('videos')} style={{ background: C.deep, color: C.cream, border: 'none', padding: '14px 26px', fontFamily: FONTS.body, fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 32, boxShadow: '0 4px 0 ' + C.deepDk }}>
            ▶ Watch · 24:08
          </button>
        </div>
        <div style={{ position: 'relative', transform: 'rotate(1.5deg)' }}>
          <div style={{ background: '#fff', padding: 14, boxShadow: '0 12px 36px rgba(42,31,21,.18)' }}>
            <div style={{ position: 'relative', aspectRatio: '16/9' }}>
              <image-slot id="home-vid" placeholder="Italy in 14 days · long version" shape="rect" radius="2"
                style={{ display: 'block', width: '100%', height: '100%', background: '#e6d8b8' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 84, height: 84, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.3)' }}>
                <div style={{ width: 0, height: 0, borderLeft: '24px solid ' + C.cream, borderTop: '15px solid transparent', borderBottom: '15px solid transparent', marginLeft: 6 }} />
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', top: -22, left: -22 }}><Stamp color={C.primary} rotate={-15} size={11} bg={C.paper}>● NEW</Stamp></div>
        </div>
      </section>

      {/* HappenUpon app strip */}
      <section style={{ padding: `${D.sectionGap}px ${D.pad}px`, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.cream, fontFamily: FONTS.display, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 ' + C.primaryDk }}>H</div>
            <div>
              <Stamp color={C.deep} rotate={-2} size={10}>Our App · iPhone</Stamp>
              <div style={{ fontFamily: FONTS.display, fontSize: 24, color: C.deep, marginTop: 2, lineHeight: 1 }}>HappenUpon</div>
            </div>
          </div>
          <h2 style={{ fontFamily: FONTS.display, fontSize: 56 * D.h1, color: C.deep, margin: '14px 0 4px', lineHeight: 0.95 }}>
            Every booking,<br/><span style={{ color: C.primary }}>day by day.</span>
          </h2>
          <Hand size={28} style={{ marginTop: 8 }}>the planner we built for ourselves</Hand>
          <p style={{ fontSize: 15 * D.body, lineHeight: 1.65, color: C.ink, maxWidth: 420, margin: '14px 0 22px' }}>
            Paste a confirmation email — HappenUpon pulls every flight, hotel, restaurant, and confirmation code into a clean day-by-day timeline.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setPage('app')} style={{ background: C.deep, color: C.cream, border: 'none', padding: '13px 22px', fontFamily: FONTS.body, fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 32, boxShadow: '0 4px 0 ' + C.deepDk }}>
               Get on iPhone
            </button>
            <Hand size={22}>free for 2 trips ♡</Hand>
          </div>
        </div>
        <div style={{ position: 'relative', height: 420, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 220, height: 420, background: C.deep, borderRadius: 32, padding: 8, transform: 'rotate(-4deg)', boxShadow: '0 18px 40px rgba(42,31,21,.2)' }}>
            <image-slot id="home-app" placeholder="HappenUpon · timeline" shape="rounded" radius="24"
              style={{ display: 'block', width: '100%', height: '100%', background: C.cream }} />
          </div>
          <div style={{ position: 'absolute', top: 40, right: 20 }}>
            <Stamp color={C.primary} rotate={-12} size={10} bg={C.cream}>v2.4 · NEW</Stamp>
          </div>
        </div>
      </section>

      <Reels />
      <Footer setPage={setPage} />
    </div>
  );
}

// ───────── BROWSE ─────────
function Browse({ setPage }) {
  const { C, D } = usePal();
  const [filter, setFilter] = React.useState('All');
  const visible = ITINERARIES.filter((it) => filter === 'All' || it.pace === filter);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: FONTS.body, position: 'relative' }}>
      <section style={{ padding: `${D.pad}px ${D.pad}px 32px`, background: C.paper, borderBottom: `2px dashed ${C.primary}` }}>
        <Stamp rotate={-3}>The Archive</Stamp>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 80 * D.h1, color: C.deep, margin: '14px 0 4px', lineHeight: 0.95 }}>
          24 postcards<br/>from <span style={{ color: C.primary }}>everywhere.</span>
        </h1>
        <Hand size={30} style={{ marginTop: 8 }}>filed by feeling, mostly</Hand>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 26, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: C.inkSoft, marginRight: 4, fontWeight: 600 }}>Pace:</span>
          {['All', 'Slow', 'Moderate', 'Active'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? C.primary : 'transparent',
              color: filter === f ? C.cream : C.deep,
              border: `2px solid ${filter === f ? C.primary : C.deep}`,
              padding: '6px 16px', fontFamily: FONTS.body, fontSize: 13, cursor: 'pointer',
              borderRadius: 24, fontWeight: 600,
            }}>{f}</button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>{visible.length} trips</span>
        </div>
      </section>
      <section style={{ padding: `${D.sectionGap}px ${D.pad}px`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36 }}>
        {visible.map((it, i) => {
          const rot = (i % 3 - 1) * 1.3;
          return (
            <article key={it.id} onClick={() => it.id === 'italy-14' && setPage('detail')}
              style={{ position: 'relative', cursor: it.id === 'italy-14' ? 'pointer' : 'default', transform: `rotate(${rot}deg)`, transition: 'transform .25s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0) translateY(-6px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${rot}deg)`}>
              <div style={{ background: '#fff', padding: 14, paddingBottom: 0, boxShadow: '0 6px 22px rgba(42,31,21,.12), 0 0 0 1px rgba(42,31,21,.05)' }}>
                <image-slot id={'br-' + it.id} placeholder={it.title} shape="rect" radius="2"
                  style={{ display: 'block', width: '100%', aspectRatio: '5/4', background: '#e6d8b8' }} />
                <div style={{ padding: '14px 4px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Hand size={22}>from {it.country}</Hand>
                    <Stamp color={C.deep} rotate={3} size={9} bg="#fff">№{String(ITINERARIES.indexOf(it) + 1).padStart(2, '0')}</Stamp>
                  </div>
                  <h3 style={{ fontFamily: FONTS.display, fontSize: 28, color: C.deep, margin: '2px 0 4px', lineHeight: 1.05 }}>{it.title}</h3>
                  <p style={{ fontSize: 13, color: C.inkSoft, margin: '0 0 12px', lineHeight: 1.5 }}>{it.blurb}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, fontFamily: FONTS.mono, color: C.primaryDk, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    <span style={{ background: C.paper, padding: '3px 8px', borderRadius: 10 }}>{it.days}d</span>
                    <span style={{ background: C.paper, padding: '3px 8px', borderRadius: 10 }}>{it.season}</span>
                    <span style={{ background: C.paper, padding: '3px 8px', borderRadius: 10 }}>{it.pace}</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
      <Footer setPage={setPage} />
    </div>
  );
}

// ───────── DETAIL ─────────
function Detail({ setPage }) {
  const { C, D } = usePal();
  const [openDay, setOpenDay] = React.useState(7);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: FONTS.body }}>
      {/* masthead */}
      <section style={{ padding: `${D.pad}px ${D.pad}px 24px`, position: 'relative' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          <Stamp color={C.primary} rotate={-6}>Itinerary 14</Stamp>
          <Stamp color={C.deep} rotate={4}>Italy · 14 Days</Stamp>
          <Hand size={26}>spring 2026</Hand>
        </div>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 128 * D.h1, color: C.deep, margin: 0, lineHeight: 0.88, letterSpacing: -2.2 }}>
          Florence,<br/>Venice <em>& Rome.</em>
        </h1>
        <Hand size={34} rotate={-1} style={{ marginTop: 14 }}>Florence → Venice → Rome — ten days ✈</Hand>
      </section>

      {/* cover + postcard back */}
      <section style={{ padding: `0 ${D.pad}px ${D.sectionGap}px`, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div style={{ background: '#fff', padding: 18, boxShadow: '0 14px 40px rgba(42,31,21,.18)', transform: 'rotate(-1deg)' }}>
          <image-slot id="dt-hero" placeholder="Tuscan hillside · cover photo" shape="rect" radius="2"
            style={{ display: 'block', width: '100%', aspectRatio: '5/3', background: '#e6d8b8' }} />
        </div>
        <div style={{ background: '#fff', padding: 28, boxShadow: '0 4px 16px rgba(42,31,21,.12)', position: 'relative', minHeight: 280 }}>
          {/* stamp corner */}
          <div style={{ position: 'absolute', top: 18, right: 18, width: 80, height: 96, border: `2px solid ${C.primary}`, padding: 8, transform: 'rotate(4deg)', background: C.paper }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 28, color: C.primary, textAlign: 'center', lineHeight: 1 }}>IT</div>
            <Hand size={14} color={C.deep} style={{ display: 'block', textAlign: 'center', marginTop: 6 }}>2026</Hand>
            <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: C.inkSoft, textAlign: 'center', marginTop: 6, letterSpacing: 1 }}>POSTA<br/>14d</div>
          </div>
          {/* address lines */}
          <div style={{ borderBottom: `1.5px solid ${C.inkSoft}`, width: 180, marginBottom: 16 }}>
            <Hand size={22}>Dear traveller,</Hand>
          </div>
          <p style={{ fontFamily: FONTS.hand, fontSize: 22, lineHeight: 1.4, color: C.ink, margin: 0, maxWidth: 340 }}>
            {ITALY.intro}
          </p>
          <div style={{ marginTop: 14 }}><Hand size={22}>— {SITE.authors}</Hand></div>
        </div>
      </section>

      {/* ROUTE MAP */}
      <section style={{ padding: `0 ${D.pad}px ${D.sectionGap}px` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: 40 * D.h1, color: C.deep, margin: 0 }}>The route <Hand size={28} color={C.primary}>— hand-drawn</Hand></h2>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1, color: C.inkSoft, textTransform: 'uppercase' }}>5 cities · 6 stops · 1,420 km</span>
        </div>
        <div style={{ background: C.paper, borderRadius: 8, padding: 32, boxShadow: '0 4px 16px rgba(42,31,21,.08)', position: 'relative', minHeight: 360 }}>
          <RouteMap />
        </div>
      </section>

      {/* meta strip — luggage tags */}
      <section style={{ padding: `0 ${D.pad}px ${D.sectionGap}px` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {Object.entries(ITALY.meta).map(([k, v], i) => (
            <div key={k} style={{ background: i % 2 ? C.paper : '#fff', padding: '10px 18px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 10, border: `1px dashed ${C.primary}` }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.primaryDk, letterSpacing: 1, textTransform: 'uppercase' }}>{k.replace(/([A-Z])/g, ' $1')}</div>
              <div style={{ fontFamily: FONTS.display, fontSize: 16, color: C.deep }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* day-by-day */}
      <section style={{ padding: `0 ${D.pad}px ${D.sectionGap}px` }}>
        <h2 style={{ fontFamily: FONTS.display, fontSize: 48 * D.h1, color: C.deep, margin: '0 0 6px', lineHeight: 1 }}>
          Day by day <Hand size={32} color={C.primary} style={{ marginLeft: 8 }}>click to open</Hand>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          {ITALY.days.map((d) => {
            const open = openDay === d.day;
            return <DayTicket key={d.day} d={d} open={open} onClick={() => setOpenDay(open ? -1 : d.day)} />;
          })}
        </div>
      </section>

      {/* tips */}
      <section style={{ background: C.paper, padding: `${D.sectionGap}px ${D.pad}px` }}>
        <Stamp rotate={-3}>What we'd tell you</Stamp>
        <h2 style={{ fontFamily: FONTS.display, fontSize: 56 * D.h1, color: C.deep, margin: '12px 0 28px', lineHeight: 0.95 }}>
          A few <span style={{ color: C.primary }}>hard-won</span> tips.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 22 }}>
          {ITALY.tips.map((t, i) => (
            <div key={i} style={{ background: '#fff', padding: 22, borderRadius: 4, boxShadow: '0 2px 10px rgba(42,31,21,.1)', borderLeft: `6px solid ${C.primary}`, transform: `rotate(${i % 2 ? 0.5 : -0.5}deg)` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                <span style={{ fontFamily: FONTS.display, fontSize: 34, color: C.accent, lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                <h4 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.deep, margin: 0 }}>{t.title}</h4>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: C.ink, margin: 0 }}>{t.body}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer setPage={setPage} />
    </div>
  );
}

function DayTicket({ d, open, onClick }) {
  const { C } = usePal();
  return (
    <div>
      <button onClick={onClick} style={{
        width: '100%', background: '#fff', border: 'none', cursor: 'pointer', padding: 0,
        fontFamily: 'inherit', color: 'inherit', boxShadow: open ? '0 4px 12px rgba(42,31,21,.12)' : '0 2px 8px rgba(42,31,21,.06)',
        position: 'relative', transition: 'box-shadow .15s',
        clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 140px 100px 60px', alignItems: 'center', gap: 18, padding: '16px 36px 16px 18px', textAlign: 'left' }}>
          <div style={{ background: C.primary, color: C.cream, padding: '8px 0', textAlign: 'center', borderRadius: 6, boxShadow: '0 2px 0 ' + C.primaryDk }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, opacity: .9 }}>DAY</div>
            <div style={{ fontFamily: FONTS.display, fontSize: 28, lineHeight: 1 }}>{String(d.day).padStart(2, '0')}</div>
          </div>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.primaryDk, letterSpacing: 1.2, textTransform: 'uppercase' }}>{d.city}</div>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, color: C.deep, marginTop: 2, lineHeight: 1.15 }}>{d.title}</div>
          </div>
          <Hand size={22}>{d.tag.toLowerCase()}</Hand>
          <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: C.inkSoft, letterSpacing: 0.5 }}>{d.date}</div>
          <div style={{ fontSize: 24, color: C.primary, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s', textAlign: 'center' }}>→</div>
        </div>
      </button>
      {open && (
        <div style={{ background: C.paper, padding: 24, marginTop: -4, borderRadius: 12, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'flex-start', border: `2px dashed ${C.primary}` }}>
          <Polaroid id={'dt-d' + d.day} label={`Day ${d.day} · ${d.city}`} w={200} h={250} rotate={-2} />
          <div>
            <Hand size={26} style={{ display: 'block', marginBottom: 12 }} rotate={0}>
              {d.body}
            </Hand>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.primaryDk, letterSpacing: 1, textTransform: 'uppercase' }}>Stayed</div>
                <div style={{ fontFamily: FONTS.display, fontSize: 17, color: C.deep, marginTop: 4 }}>{d.hotel}</div>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.primaryDk, letterSpacing: 1, textTransform: 'uppercase' }}>Ate</div>
                <div style={{ fontFamily: FONTS.display, fontSize: 17, color: C.deep, marginTop: 4 }}>{d.eat}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────── ROUTE MAP (hand-drawn Italy) ─────────
function RouteMap() {
  const { C } = usePal();
  // approximate coordinates within a 800x420 viewBox for Italian cities
  const stops = [
    { name: 'Florence', x: 410, y: 220, days: '1-5, 9' },
    { name: 'Pisa',     x: 380, y: 240, days: '4',     side: true },
    { name: 'Lucca',    x: 388, y: 220, days: '4',     side: true, offsetY: -18 },
    { name: 'Rome',     x: 420, y: 295, days: '5' },
    { name: 'Venice',   x: 480, y: 145, days: '6-8' },
    { name: 'Prosecco', x: 470, y: 170, days: '8',     side: true, offsetY: -16 },
  ];
  // a rough hand-drawn Italian peninsula path (simplified)
  const italyPath = "M 405 110 L 415 130 L 430 145 L 460 150 L 485 145 L 500 155 L 495 175 L 480 180 L 460 185 L 440 195 L 425 215 L 415 240 L 420 265 L 425 295 L 440 320 L 450 345 L 445 365 L 430 380 L 415 385 L 405 380 L 395 365 L 380 345 L 360 320 L 345 295 L 350 265 L 360 240 L 370 215 L 380 195 L 395 180 L 400 160 L 395 140 Z";

  return (
    <svg viewBox="0 0 800 420" style={{ width: '100%', height: 'auto', maxHeight: 460, display: 'block' }} fill="none">
      {/* compass rose */}
      <g transform="translate(80 80)">
        <circle r="32" fill={C.cream} stroke={C.primary} strokeWidth="1.5" />
        <path d="M 0 -28 L 4 0 L 0 28 L -4 0 Z" fill={C.primary} />
        <path d="M -28 0 L 0 -4 L 28 0 L 0 4 Z" fill={C.primary} opacity=".4" />
        <text x="0" y="-38" textAnchor="middle" fontFamily={FONTS.mono} fontSize="10" fill={C.primaryDk} letterSpacing="1">N</text>
      </g>

      {/* sea decoration */}
      <g opacity="0.35" stroke={C.deep} strokeWidth="1" fill="none">
        <path d="M 60 220 q 20 -8 40 0 t 40 0 t 40 0" />
        <path d="M 60 240 q 20 -8 40 0 t 40 0 t 40 0" />
        <path d="M 600 280 q 20 -8 40 0 t 40 0 t 40 0" />
        <path d="M 600 300 q 20 -8 40 0 t 40 0 t 40 0" />
      </g>

      {/* italy peninsula outline */}
      <path d={italyPath} fill={C.cream} stroke={C.primary} strokeWidth="2.2" strokeLinejoin="round" />
      {/* faux coastline shading */}
      <path d={italyPath} fill="none" stroke={C.primary} strokeWidth="0.6" strokeDasharray="2 3" transform="translate(2 2)" opacity=".4" />

      {/* sardinia hint */}
      <ellipse cx="305" cy="320" rx="22" ry="32" fill={C.cream} stroke={C.primary} strokeWidth="1.8" transform="rotate(-12 305 320)" />

      {/* dashed route between stops */}
      <g stroke={C.primary} strokeWidth="2.4" fill="none" strokeDasharray="3 6" strokeLinecap="round">
        {stops.slice(0, -1).map((s, i) => {
          const n = stops[i + 1];
          // curved control point between
          const cx = (s.x + n.x) / 2 + (i % 2 ? 16 : -16);
          const cy = (s.y + n.y) / 2 - 12;
          return <path key={i} d={`M ${s.x} ${s.y} Q ${cx} ${cy} ${n.x} ${n.y}`} />;
        })}
      </g>

      {/* stops */}
      {stops.map((s, i) => (
        <g key={s.name}>
          <circle cx={s.x} cy={s.y} r="7" fill={C.primary} stroke={C.cream} strokeWidth="2.5" />
          <text x={s.x + (s.side ? -14 : 14)} y={s.y + 4}
            textAnchor={s.side ? 'end' : 'start'}
            fontFamily={FONTS.display} fontSize="15" fill={C.deep}>{s.name}</text>
          <text x={s.x + (s.side ? -14 : 14)} y={s.y + 18}
            textAnchor={s.side ? 'end' : 'start'}
            fontFamily={FONTS.mono} fontSize="9" letterSpacing="1" fill={C.primaryDk}>DAY {s.days}</text>
        </g>
      ))}

      {/* hand-drawn flourish */}
      <g transform="translate(560 360)">
        <text fontFamily={FONTS.hand} fontSize="26" fill={C.primary}>here be gelato ♥</text>
        <path d="M 0 8 q 30 12 60 -2" stroke={C.primary} strokeWidth="1.6" fill="none" />
      </g>
    </svg>
  );
}

// ───────── PHOTOGRAPHY ─────────
function Photo({ setPage }) {
  const { C, D } = usePal();
  const [open, setOpen] = React.useState(null);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: FONTS.body, position: 'relative' }}>
      <section style={{ padding: `${D.pad}px ${D.pad}px 24px` }}>
        <Stamp rotate={-4}>Photo Album · Italy 2026</Stamp>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 88 * D.h1, color: C.deep, margin: '14px 0 0', lineHeight: 0.92 }}>
          The polaroid<br/><span style={{ color: C.primary }}>album.</span>
        </h1>
        <Hand size={30} style={{ marginTop: 12 }}>twelve frames, two weeks ♡</Hand>
      </section>
      <section style={{ padding: `24px ${D.pad}px ${D.sectionGap}px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }}>
          {PHOTOS.map((p, i) => {
            const rot = [-2, 1, -1, 2][i % 4];
            return (
              <button key={p.id} onClick={() => setOpen(p)} style={{
                background: '#fff', padding: '12px 12px 32px', border: 'none', cursor: 'pointer',
                boxShadow: '0 6px 22px rgba(42,31,21,.14), 0 0 0 1px rgba(42,31,21,.05)',
                transform: `rotate(${rot}deg)`, transition: 'transform .2s', position: 'relative',
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0) scale(1.04)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${rot}deg)`}>
                <image-slot id={'ph-' + p.id} placeholder={p.caption} shape="rect" radius="2"
                  style={{ display: 'block', width: '100%', aspectRatio: '4/5', background: '#e6d8b8' }} />
                <div style={{ paddingTop: 12, textAlign: 'center', lineHeight: 1.15 }}>
                  <Hand size={18}>{p.caption}</Hand>
                </div>
                {i % 5 === 0 && (
                  <div style={{ position: 'absolute', top: -10, right: -10 }}>
                    <Stamp color={C.primary} rotate={12} size={10} bg={C.cream}>♡</Stamp>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {open && <Lightbox photo={open} onClose={() => setOpen(null)} setOpen={setOpen} />}
      <Footer setPage={setPage} />
    </div>
  );
}

function Lightbox({ photo, onClose, setOpen }) {
  const { C } = usePal();
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

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,20,.94)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60,
    }}>
      <button onClick={(e) => { e.stopPropagation(); go(-1); }} style={navBtn(C, 'left')}>‹</button>
      <button onClick={(e) => { e.stopPropagation(); go(1); }} style={navBtn(C, 'right')}>›</button>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 20, paddingBottom: 70, position: 'relative', maxWidth: 700, transform: 'rotate(-1deg)' }}>
        <image-slot id={'ph-' + photo.id} placeholder={photo.caption} shape="rect" radius="2"
          style={{ display: 'block', width: '100%', aspectRatio: '4/5', background: '#e6d8b8' }} />
        <div style={{ padding: '18px 8px 0', textAlign: 'center' }}>
          <Hand size={32}>{photo.caption}</Hand>
        </div>
        <div style={{ marginTop: 10, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.5, color: C.primaryDk, textAlign: 'center', textTransform: 'uppercase' }}>
          {photo.location} · {idx + 1} / {PHOTOS.length}
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: -16, right: -16, width: 42, height: 42, borderRadius: '50%', background: C.primary, color: C.cream, border: 'none', cursor: 'pointer', fontSize: 18, boxShadow: '0 4px 0 ' + C.primaryDk }}>×</button>
      </div>
    </div>
  );
}
function navBtn(C, side) {
  return {
    position: 'fixed', top: '50%', [side]: 30, transform: 'translateY(-50%)',
    width: 52, height: 52, borderRadius: '50%', background: C.cream, color: C.deep,
    border: 'none', cursor: 'pointer', fontSize: 28, fontFamily: FONTS.display,
    boxShadow: '0 4px 16px rgba(0,0,0,.3)', zIndex: 110, display: 'flex',
    alignItems: 'center', justifyContent: 'center', lineHeight: 1, paddingBottom: 4,
  };
}

// ───────── VIDEOS ─────────
function Videos({ setPage }) {
  const { C, D } = usePal();
  const [active, setActive] = React.useState(VIDEOS[0]);
  const [playing, setPlaying] = React.useState(false);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: FONTS.body }}>
      <section style={{ padding: `${D.pad}px ${D.pad}px 24px`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Stamp rotate={-3}>YouTube · {SITE.youtube}</Stamp>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 88 * D.h1, color: C.deep, margin: '14px 0 0', lineHeight: 0.95 }}>
            Watch us <span style={{ color: C.primary }}>wander.</span>
          </h1>
        </div>
        <a href={SITE.youtubeUrl} target="_blank" rel="noopener" style={{ background: C.primary, color: C.cream, padding: '14px 24px', fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, textDecoration: 'none', borderRadius: 32, boxShadow: '0 4px 0 ' + C.primaryDk }}>
          Subscribe · 184K →
        </a>
      </section>
      <section style={{ padding: `0 ${D.pad}px ${D.sectionGap}px` }}>
        <div style={{ background: '#fff', padding: 16, boxShadow: '0 12px 40px rgba(42,31,21,.18)', transform: 'rotate(0.5deg)' }}>
          <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9', cursor: 'pointer' }} onClick={() => setPlaying(true)}>
            {playing ? (
              <iframe src={`https://www.youtube.com/embed/${active.id}?autoplay=1&rel=0`} title={active.title} allow="autoplay; encrypted-media" allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
            ) : (
              <>
                <image-slot id={'vid-feat-' + active.title.slice(0,6).replace(/\W/g,'')} placeholder={'Thumbnail · ' + active.title} shape="rect" radius="2"
                  style={{ display: 'block', width: '100%', height: '100%' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,.75))', display: 'flex', alignItems: 'flex-end', padding: 32 }}>
                  <div style={{ color: C.cream }}>
                    <Stamp color={C.accent} rotate={-3} bg="transparent">Featured</Stamp>
                    <h2 style={{ fontFamily: FONTS.display, fontSize: 38, margin: '10px 0 4px', lineHeight: 1.05, color: C.cream }}>{active.title}</h2>
                    <div style={{ fontSize: 12, fontFamily: FONTS.mono, letterSpacing: 1 }}>{active.dur} · {active.views} VIEWS · {active.date.toUpperCase()}</div>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 92, height: 92, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}>
                  <div style={{ width: 0, height: 0, borderLeft: '26px solid ' + C.cream, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', marginLeft: 6 }} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      <section style={{ padding: `0 ${D.pad}px ${D.sectionGap}px` }}>
        <h2 style={{ fontFamily: FONTS.display, fontSize: 36 * D.h1, color: C.deep, margin: '0 0 24px' }}>More from the channel</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
          {VIDEOS.slice(1).map((v, i) => {
            const rot = (i % 2 ? 0.6 : -0.6);
            return (
              <button key={i} onClick={() => { setActive(v); setPlaying(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 10, boxShadow: '0 4px 16px rgba(42,31,21,.1)', transform: `rotate(${rot}deg)`, transition: 'transform .2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0) translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${rot}deg)`}>
                <div style={{ position: 'relative' }}>
                  <image-slot id={'vid-' + i} placeholder={v.title} shape="rect" radius="2"
                    style={{ display: 'block', width: '100%', aspectRatio: '16/9' }} />
                  <div style={{ position: 'absolute', right: 8, bottom: 8, background: C.deep, color: C.cream, fontFamily: FONTS.mono, fontSize: 10, padding: '2px 6px', letterSpacing: 0.5 }}>{v.dur}</div>
                </div>
                <h4 style={{ fontFamily: FONTS.display, fontSize: 18, color: C.deep, margin: '10px 4px 4px', lineHeight: 1.15 }}>{v.title}</h4>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: C.primaryDk, textTransform: 'uppercase', padding: '0 4px' }}>{v.views} · {v.date}</div>
              </button>
            );
          })}
        </div>
      </section>
      <Reels />
      <Footer setPage={setPage} />
    </div>
  );
}

// ───────── REELS ─────────
function Reels() {
  const { C, D } = usePal();
  return (
    <section style={{ background: C.cream, padding: `${D.sectionGap}px ${D.pad}px`, borderTop: `2px dashed ${C.primary}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Stamp rotate={-3}>Instagram · {SITE.instagram}</Stamp>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 40 * D.h1, color: C.deep, margin: '12px 0 0', lineHeight: 1 }}>Reels, in passing.</h3>
        </div>
        <a href={SITE.instagramUrl} target="_blank" rel="noopener" style={{ fontFamily: FONTS.body, fontSize: 13, color: C.primary, fontWeight: 700, textDecoration: 'none', borderBottom: `2px dashed ${C.primary}`, paddingBottom: 3 }}>Follow us →</a>
      </div>
      <div style={{ display: 'flex', gap: 18, overflowX: 'auto', paddingBottom: 12, scrollSnapType: 'x mandatory' }}>
        {REELS.map((r, i) => {
          const rot = (i % 2 ? 1.2 : -1.2);
          return (
            <div key={r.id} style={{ flex: '0 0 200px', position: 'relative', cursor: 'pointer', transform: `rotate(${rot}deg)`, scrollSnapAlign: 'start' }}>
              <div style={{ background: '#fff', padding: 8, boxShadow: '0 6px 18px rgba(42,31,21,.14)' }}>
                <image-slot id={'reel-' + r.id} src={r.id === 'r01' ? 'assets/insta-bennett-lane.jpg' : r.id === 'r02' ? 'assets/insta-where-now.jpg' : undefined} placeholder={r.label} shape="rect" radius="2"
                  style={{ display: 'block', width: 184, height: 320, background: '#e6d8b8' }} />
              </div>
              <div style={{ position: 'absolute', top: 18, left: 18, background: C.primary, color: C.cream, fontFamily: FONTS.mono, fontSize: 9, padding: '3px 7px', letterSpacing: 1, fontWeight: 700, borderRadius: 3 }}>▶ REEL</div>
              <div style={{ position: 'absolute', bottom: 22, left: 16, right: 16, color: C.cream, textShadow: '0 1px 4px rgba(0,0,0,.5)' }}>
                <Hand size={20} color={C.cream}>{r.label}</Hand>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, marginTop: 4 }}>♥ {r.likes}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ───────── SHOP ─────────
function Shop({ setPage }) {
  const { C, D } = usePal();
  const cats = ['All', ...new Set(SHOP.map((s) => s.cat))];
  const [cat, setCat] = React.useState('All');
  const visible = SHOP.filter((s) => cat === 'All' || s.cat === cat);
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: FONTS.body }}>
      <section style={{ padding: `${D.pad}px ${D.pad}px 24px`, background: C.paper, borderBottom: `2px dashed ${C.primary}` }}>
        <Stamp rotate={-4}>The Shop · Affiliate</Stamp>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 80 * D.h1, color: C.deep, margin: '14px 0 4px', lineHeight: 0.95 }}>
          What's in <span style={{ color: C.primary }}>the suitcase.</span>
        </h1>
        <Hand size={26} style={{ marginTop: 8 }}>honest list. links earn us a small commission ♡</Hand>
        <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
          {cats.map((f) => (
            <button key={f} onClick={() => setCat(f)} style={{
              background: cat === f ? C.deep : 'transparent', color: cat === f ? C.cream : C.deep,
              border: `2px solid ${cat === f ? C.deep : C.deep}`, padding: '6px 14px', fontFamily: FONTS.body, fontSize: 12,
              cursor: 'pointer', borderRadius: 24, fontWeight: 600,
            }}>{f}</button>
          ))}
        </div>
      </section>
      <section style={{ padding: `${D.sectionGap}px ${D.pad}px`, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        {visible.map((s, i) => {
          const rot = (i % 2 ? 0.4 : -0.4);
          return (
            <article key={s.id} style={{ background: '#fff', padding: 18, boxShadow: '0 4px 16px rgba(42,31,21,.1)', display: 'grid', gridTemplateColumns: '150px 1fr', gap: 18, cursor: 'pointer', transform: `rotate(${rot}deg)`, transition: 'transform .2s', position: 'relative', borderLeft: `4px solid ${C.accent}` }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0) translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${rot}deg)`}>
              <image-slot id={'shop-' + s.id} placeholder={s.name} shape="rect" radius="2"
                style={{ display: 'block', width: 150, height: 180, background: '#e6d8b8' }} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.primaryDk, letterSpacing: 1.2, textTransform: 'uppercase' }}>{s.cat}</div>
                  <div style={{ fontFamily: FONTS.display, fontSize: 22, color: C.primary }}>{s.price}</div>
                </div>
                <h3 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.deep, margin: '4px 0 8px', lineHeight: 1.1 }}>{s.name}</h3>
                <Hand size={17} color={C.ink} style={{ lineHeight: 1.35, display: 'block', marginBottom: 14 }}>{s.why}</Hand>
                <span style={{ background: C.deep, color: C.cream, padding: '6px 14px', fontFamily: FONTS.body, fontSize: 12, fontWeight: 700, borderRadius: 24, boxShadow: '0 2px 0 ' + C.deepDk, display: 'inline-block' }}>Shop on Amazon →</span>
              </div>
            </article>
          );
        })}
      </section>
      <Footer setPage={setPage} />
    </div>
  );
}

// ───────── APP ─────────
function App({ setPage }) {
  const { C, D } = usePal();
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: FONTS.body, position: 'relative' }}>
      <section style={{ padding: `${D.pad}px ${D.pad}px 0`, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 40, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cream, fontFamily: FONTS.display, fontSize: 36, boxShadow: '0 4px 0 ' + C.primaryDk }}>H</div>
            <div>
              <Stamp color={C.deep} rotate={-3} size={11}>The App · iPhone</Stamp>
              <div style={{ fontFamily: FONTS.display, fontSize: 30, color: C.deep, marginTop: 4, lineHeight: 1 }}>HappenUpon</div>
            </div>
          </div>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 80 * D.h1, color: C.deep, margin: '14px 0 4px', lineHeight: 0.92, letterSpacing: -1.5 }}>
            Every booking,<br/><span style={{ color: C.primary }}>day by day.</span>
          </h1>
          <Hand size={30} style={{ marginTop: 8 }}>the travel planner we built for ourselves</Hand>
          <p style={{ fontSize: 15 * D.body, lineHeight: 1.65, color: C.ink, maxWidth: 460, margin: '14px 0 24px' }}>
            Flights, hotels, restaurants, activities, cruises — every detail organized into a clean timeline. Paste a confirmation email; HappenUpon does the typing.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="#" style={{ background: C.deep, color: C.cream, padding: '14px 24px', fontFamily: FONTS.body, fontSize: 14, fontWeight: 700, textDecoration: 'none', borderRadius: 32, boxShadow: '0 4px 0 ' + C.deepDk, display: 'flex', alignItems: 'center', gap: 10 }}>
               Download for iPhone
            </a>
            <Hand size={22}>free for 2 trips ♡</Hand>
          </div>
        </div>
        <div style={{ position: 'relative', height: 580 }}>
          <div style={{ position: 'absolute', top: 0, right: 60, transform: 'rotate(-6deg)' }}>
            <div style={{ width: 250, height: 520, background: C.deep, borderRadius: 36, padding: 10, boxShadow: '0 22px 50px rgba(42,31,21,.25)' }}>
              <image-slot id="app-1" placeholder="App · timeline" shape="rounded" radius="26"
                style={{ display: 'block', width: '100%', height: '100%', background: C.cream }} />
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: 0, transform: 'rotate(8deg)' }}>
            <div style={{ width: 200, height: 420, background: C.primary, borderRadius: 30, padding: 8, boxShadow: '0 16px 40px rgba(42,31,21,.22)' }}>
              <image-slot id="app-2" placeholder="App · day view" shape="rounded" radius="22"
                style={{ display: 'block', width: '100%', height: '100%', background: C.paper }} />
            </div>
          </div>
          <div style={{ position: 'absolute', top: 220, left: 230 }}><Stamp color={C.primary} rotate={-15} bg={C.cream}>● NEW IN v2.4</Stamp></div>
        </div>
      </section>

      <section style={{ padding: `${D.sectionGap}px ${D.pad}px`, background: C.paper }}>
        <Stamp rotate={-3}>What it does</Stamp>
        <h2 style={{ fontFamily: FONTS.display, fontSize: 52 * D.h1, color: C.deep, margin: '12px 0 32px', lineHeight: 0.95 }}>
          A planner you'll <span style={{ color: C.primary }}>actually open.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
          {[
            ['Email Auto-Parse', 'Paste a confirmation. AI extracts every detail in seconds.', C.primary],
            ['Secure Vault', 'Passport, Global Entry, loyalty numbers. iOS Keychain only.', C.deep],
            ['PDF Export', 'A beautiful shareable PDF for travel companions.', C.secondary],
            ['10 item types', 'Flights, hotels, cars, restaurants, activities, transport, cruises, places, notes, journals.', C.accent],
            ['Day-by-day', 'Every booking on one timeline. Tap for details. Swipe to delete.', C.primary],
            ['Backup & Restore', 'Export to iCloud Drive. Restore on a new device.', C.deep],
          ].map(([t, b, col], i) => (
            <div key={t} style={{ background: '#fff', padding: 22, borderRadius: 4, boxShadow: '0 2px 10px rgba(42,31,21,.08)', borderTop: `5px solid ${col}`, transform: `rotate(${(i % 2 ? 0.3 : -0.3)}deg)` }}>
              <div style={{ fontFamily: FONTS.display, fontSize: 22, color: col, lineHeight: 1, marginBottom: 4 }}>0{i + 1}</div>
              <h4 style={{ fontFamily: FONTS.display, fontSize: 22, color: C.deep, margin: '4px 0 8px' }}>{t}</h4>
              <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.55, margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: `${D.sectionGap}px ${D.pad}px`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <Hand size={32} style={{ marginBottom: 12 }}>free, mostly</Hand>
          <h2 style={{ fontFamily: FONTS.display, fontSize: 48 * D.h1, color: C.deep, margin: '0 0 16px', lineHeight: 0.95 }}>2 trips free. <span style={{ color: C.primary }}>$29/yr</span> for unlimited.</h2>
          <p style={{ fontSize: 15 * D.body, lineHeight: 1.65, color: C.ink, maxWidth: 440 }}>
            HappenUpon Pro unlocks unlimited trips and Email Auto-Parse, powered by our servers — no API keys, no setup.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            ['Free', '$0', ['2 active trips', 'All 10 item types', 'Secure Vault', 'PDF Export', 'Manual entry'], false],
            ['Pro',  '$29/yr', ['Unlimited trips', 'Email Auto-Parse', 'All Free features', 'Priority updates', 'Cloud sync'], true],
          ].map(([name, price, feats, hi]) => (
            <div key={name} style={{ background: hi ? C.deep : '#fff', color: hi ? C.cream : C.ink, padding: 22, borderRadius: 8, boxShadow: hi ? '0 6px 24px rgba(42,31,21,.25)' : '0 2px 8px rgba(42,31,21,.1)', position: 'relative', border: hi ? `2px solid ${C.accent}` : `1px solid ${C.paper}` }}>
              {hi && <div style={{ position: 'absolute', top: -14, right: 16 }}><Stamp color={C.accent} rotate={6} size={9} bg={C.deep}>RECOMMENDED</Stamp></div>}
              <div style={{ fontFamily: FONTS.display, fontSize: 32, color: hi ? C.accent : C.deep, lineHeight: 1 }}>{name}</div>
              <div style={{ fontFamily: FONTS.display, fontSize: 28, color: hi ? C.cream : C.primary, marginTop: 4 }}>{price}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', fontSize: 13.5, lineHeight: 1.8 }}>
                {feats.map((f) => <li key={f}>· {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <Footer setPage={setPage} />
    </div>
  );
}

// ───────── FOOTER ─────────
function Footer({ setPage }) {
  const { C, D } = usePal();
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  return (
    <footer style={{ background: C.deep, color: C.cream, padding: `${D.pad}px ${D.pad}px 22px`, fontFamily: FONTS.body, position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, paddingBottom: 30, borderBottom: `2px dashed ${C.accent}` }}>
        <div>
          <Stamp color={C.accent} rotate={-3} bg={C.deep}>Newsletter</Stamp>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 44 * D.h1, color: C.cream, margin: '12px 0 8px', lineHeight: 0.95 }}>
            Letters from the road, <span style={{ color: C.accent }}>monthly.</span>
          </h3>
          <Hand size={24} color={C.accent}>one email a month. wherever we are.</Hand>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (email) setSent(true); }} style={{ alignSelf: 'end' }}>
          {sent ? (
            <div style={{ background: C.accent, color: C.deep, padding: '14px 22px', fontFamily: FONTS.hand, fontSize: 26, borderRadius: 32, display: 'inline-block', transform: 'rotate(-2deg)', fontWeight: 600 }}>
              ♡ thanks — see you next month
            </div>
          ) : (
            <div style={{ background: C.cream, padding: 4, borderRadius: 32, display: 'flex' }}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                style={{ flex: 1, background: 'transparent', border: 'none', color: C.ink, fontFamily: FONTS.body, fontSize: 14, padding: '12px 18px', outline: 'none' }} />
              <button type="submit" style={{ background: C.primary, color: C.cream, border: 'none', padding: '0 24px', fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 32, boxShadow: '0 2px 0 ' + C.primaryDk }}>Subscribe →</button>
            </div>
          )}
        </form>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, fontFamily: FONTS.body, fontSize: 13, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ color: C.accent }}>© 2026 {SITE.brand} · with love by {SITE.authors}</div>
        <div style={{ display: 'flex', gap: 18, color: C.cream }}>
          <a href={SITE.youtubeUrl} target="_blank" rel="noopener" style={{ color: C.cream, textDecoration: 'none', borderBottom: `1.5px dashed ${C.accent}`, paddingBottom: 2 }}>YouTube</a>
          <a href={SITE.instagramUrl} target="_blank" rel="noopener" style={{ color: C.cream, textDecoration: 'none', borderBottom: `1.5px dashed ${C.accent}`, paddingBottom: 2 }}>Instagram</a>
          <button onClick={() => setPage('app')} style={{ background: 'none', border: 'none', color: C.cream, fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer', padding: 0, borderBottom: `1.5px dashed ${C.accent}`, paddingBottom: 2 }}>HappenUpon</button>
        </div>
      </div>
    </footer>
  );
}

// ───────── ROOT ─────────
function PostcardSite({ palette = 'tuscan', density = 'regular' }) {
  const [page, setPage] = React.useState('home');
  const value = React.useMemo(() => ({
    C: PALETTES[palette] || PALETTES.tuscan,
    F: FONTS,
    D: DENSITY[density] || DENSITY.regular,
  }), [palette, density]);
  const scrollerRef = React.useRef(null);
  React.useEffect(() => { if (scrollerRef.current) scrollerRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);
  const Page = { home: Home, itineraries: Browse, detail: Detail, photography: Photo, videos: Videos, shop: Shop, app: App }[page] || Home;
  return (
    <PalCtx.Provider value={value}>
      <div ref={scrollerRef} style={{ height: '100%', overflowY: 'auto', background: value.C.cream, position: 'relative' }}>
        <Nav page={page} setPage={setPage} />
        <Page setPage={setPage} />
      </div>
    </PalCtx.Provider>
  );
}

Object.assign(window, { PostcardSite, PALETTES });
