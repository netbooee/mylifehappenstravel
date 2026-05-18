// Real content scraped from mylifehappens.com and mlkitaly.netlify.app

const SITE = {
  brand: 'My Life Happens Travel',
  tagline: 'Life is made for Exploring',
  blurb: 'Real travel guides, honest gear picks, and photos from the road — because your life happens everywhere.',
  youtube: '@MyLifeHappensTravel',
  youtubeUrl: 'https://www.youtube.com/@MyLifeHappensTravel',
  instagram: '@mylifehappenstravel',
  instagramUrl: 'https://www.instagram.com/mylifehappenstravel',
  homeUrl: 'https://mylifehappens.com',
  authors: 'My Life Happens Travel',
};

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'itineraries', label: 'Guides' },
  { id: 'detail', label: 'Italy · 10d' },
  { id: 'photography', label: 'Photography' },
  { id: 'videos', label: 'Videos' },
  { id: 'shop', label: 'Shop' },
  { id: 'app', label: 'The App' },
];

// The real Italy guide: Florence, Venice & Rome — 10 days
const ITALY = {
  id: 'italy-10',
  title: 'Florence, Venice & Rome',
  subtitle: 'Ten days in Italy — Renaissance art, Adriatic canals, ancient ruins & great pasta',
  guideUrl: 'https://mlkitaly.netlify.app',
  hero: 'Florence skyline, golden hour over the Duomo',
  meta: {
    duration: '10 days',
    travel:   'Apr 2 — Apr 12',
    baseCities: 'Florence + Venice',
    dayTrips: 'Pisa · Lucca · Rome · Prosecco',
    pace:     'Moderate · pre-booked tours',
    bestFor:  'First-time Italy, art lovers, food obsessives',
  },
  intro:
    'Built around three of Italy\u2019s most storied cities with smart day trips woven in. Five nights in Florence give you time to breathe \u2014 Uffizi, the Duomo, a day trip to Rome, a morning in Pisa, an afternoon cycling through Lucca. Three nights in Venice layer in the islands of Murano and Burano, a full-day Prosecco Hills tour, and evenings getting deliberately lost in the calli. The final night returns to Florence for a clean departure.',
  days: [
    { day: 1,  date: '4/3',  city: 'Florence', title: 'Landing in Florence & first aperitivo',           tag: 'Arrival',  hotel: 'L\u2019Orologio Firenze',      eat: 'L\u2019Osteria di Giovanni',
      body: 'Tony at the SJG lot by 2:20 PM, then Newark. Land in Florence around 4 PM, drop bags at L\u2019Orologio on Piazza Santa Maria Novella, and let the jet lag dissolve into a Negroni. Dinner at L\u2019Osteria di Giovanni \u2014 the perfect first Florentine trattoria.' },
    { day: 2,  date: '4/4',  city: 'Florence', title: 'Uffizi, the Duomo & the Bell Tower',              tag: 'Culture',  hotel: 'L\u2019Orologio Firenze',      eat: 'Osteria Lucignolo',
      body: 'Breakfast at 7:15, meet the Viator guide on Via Guelfa for the Uffizi + Accademia + Duomo walking tour. Sandwich on the move, Santa Croce by 3:45, Campanile climb (in line by 2:05 \u2014 strict, and no big bags). Sunset at Piazzale Michelangelo or San Miniato al Monte.' },
    { day: 3,  date: '4/5',  city: 'Florence', title: 'Explosion of the Cart, Pitti Palace & pasta class', tag: 'Easter', hotel: 'L\u2019Orologio Firenze',      eat: 'Cooking class \u00b7 pasta + gelato',
      body: 'Scoppio del Carro at the Duomo \u2014 the Renaissance Easter fireworks-on-a-cart tradition, once a year. Bardini Gardens at 12, Palazzo Pitti Royal Apartments at 1, then a 3 PM pasta + gelato cooking class with Towns of Italy. You eat what you make.' },
    { day: 4,  date: '4/6',  city: 'Pisa & Lucca', title: 'Leaning Tower & cycling the Lucca walls',     tag: 'Day trip', hotel: 'L\u2019Orologio Firenze',      eat: 'Osteria Pastella \u00b7 cheese-wheel pasta',
      body: 'Regionale Veloce 4015 to Pisa Centrale at 7:28. Tower climb at 9:45, train to Lucca, a small lunch, then the Lucca Bikes & Bites tour cycling the tree-lined Renaissance walls with food + wine tastings. Back to Florence for the cheese-wheel pasta you\u2019ve been waiting for.' },
    { day: 5,  date: '4/7',  city: 'Rome',     title: 'Colosseum, Pantheon & the Vatican',               tag: 'Day trip', hotel: 'L\u2019Orologio Firenze',      eat: 'Pasqualino Al Colosseo',
      body: 'Frecciarossa 9591 at 7:05 from Firenze SMN to Roma Termini. Colosseum + Forum + Palatine guided tour at 9:45. Pantheon at 2. Free Now app to the Vatican \u2014 check in at 4 PM sharp for the 4:30 tour. Spanish Steps, Trevi Fountain, late train back at 21:10.' },
    { day: 6,  date: '4/8',  city: 'Venice',   title: 'Florence to Venice & first evening on the canals', tag: 'Travel',   hotel: 'Palazzo Veneziano',           eat: 'Impronta Restaurant Venice',
      body: 'Frecciarossa 9414 at 11:20 \u2014 Florence to Venezia S. Lucia in two hours. Water taxi to Palazzo Veneziano. Wander without a plan, get pleasantly lost in the calli, cicchetti and an early aperitivo at a bacaro. St. Mark\u2019s lit at night before the crowds arrive.' },
    { day: 7,  date: '4/9',  city: 'Venice',   title: 'St. Mark\u2019s, Doge\u2019s Palace & the islands', tag: 'Islands',  hotel: 'Palazzo Veneziano',           eat: 'San Silvestro Restaurant',
      body: 'Walks of Italy \u2014 Legendary Venice tour at 9:30 (meet at Correr Museum, look for the green sign). St. Mark\u2019s Basilica including the Terraces, then the full Doge\u2019s Palace. Afternoon vaporetto Line 4.1 to Murano for glass, on to Burano for colour and lace.' },
    { day: 8,  date: '4/10', city: 'Prosecco', title: 'Prosecco Hills full-day vineyard tour',           tag: 'Day trip', hotel: 'Palazzo Veneziano',           eat: 'Late dinner near hotel',
      body: 'Train ticket provided by the tour \u2014 8:15 walk to Venezia S. Lucia. Full day in the Conegliano Valdobbiadene UNESCO wine region. Rolling hills, historic estates, tastings of Italy\u2019s most celebrated sparkling wine in the place it was born.' },
    { day: 9,  date: '4/11', city: 'Florence', title: 'Venice to Florence & a final night',              tag: 'Travel',   hotel: 'Grand Hotel Cavour',          eat: 'Last dinner \u2014 your pick',
      body: 'Check out of Palazzo Veneziano by 11. Walk to Piazzale Roma, train to Mestre, FlixBus 466 at 12:10 to Florence Villa Costanza, arriving 3:40. Tram or taxi to the Grand Hotel Cavour, centrally located \u2014 most of the city is walkable. One free evening to make count.' },
    { day: 10, date: '4/12', city: 'Depart',   title: 'Arrivederci \u2014 safe travels home',             tag: 'Depart',   hotel: '\u2014',                       eat: '\u2014',
      body: 'Car at 4:30 AM. 7 AM flight \u2014 check bags, they\u2019ll be heavier than they were on the way out. Ten days done. Arrivederci, Italia.' },
  ],
  tips: [
    { title: 'Book it all in Wallet',  body: 'Train tickets in Google Wallet. Tour tickets in Apple Wallet. Screenshot every confirmation before you leave home — signal is unreliable.' },
    { title: 'Be in line at 2:05',     body: 'Giotto\u2019s Campanile timed entry is strict — and no backpacks. The dome view is one of the best in Europe; don\u2019t miss the slot.' },
    { title: 'Aperitivo is sacred',    body: '6\u20138 PM. A Negroni or Aperol Spritz with snacks. The Italian transition from day to dinner — plan around it, not through it.' },
    { title: 'Carry small cash',       body: 'Cards work almost everywhere, but cafés and markets are smoother with a few euros. \u20ac100 across the trip is plenty.' },
  ],
};

const ITINERARIES = [
  { id: 'italy-10',   title: 'Florence, Venice & Rome',    country: 'Italy',      days: 10, season: 'Spring', pace: 'Moderate', featured: true,
    blurb: 'Ten days, three cities, four day trips.', emoji: '🇮🇹', url: 'https://mlkitaly.netlify.app' },
  { id: 'ireland',    title: 'Ireland',                    country: 'Ireland',    days: 9,  season: 'Summer', pace: 'Slow',
    blurb: 'Wild Atlantic Way, pints, and pubs that mean it.', emoji: '🍀', url: 'https://mlhireland.netlify.app' },
  { id: 'vegas',      title: 'Las Vegas',                  country: 'Nevada, US', days: 4,  season: 'Year-round', pace: 'Active',
    blurb: 'Strip, shows, and the only desert worth visiting twice.', emoji: '🎰', url: 'https://mlhvegas.netlify.app' },
  { id: 'california', title: 'California',                 country: 'California, US', days: 12, season: 'Spring', pace: 'Moderate',
    blurb: 'San Francisco to Big Sur to the wine country.', emoji: '🌁', url: 'https://mlhcalifornia.netlify.app' },
];

const PHOTOS = [
  { id: 'p01', caption: 'Florence, the Duomo at dawn',     location: 'Florence, IT',     w: 4, h: 5 },
  { id: 'p02', caption: 'Ponte Vecchio reflections',       location: 'Florence, IT',     w: 3, h: 4 },
  { id: 'p03', caption: 'Tuscan road, cypress alley',      location: 'Tuscany, IT',      w: 5, h: 3 },
  { id: 'p04', caption: 'Pisa, the Leaning Tower',         location: 'Pisa, IT',         w: 4, h: 5 },
  { id: 'p05', caption: 'Cicchetti at a Venetian bacaro',  location: 'Venice, IT',       w: 1, h: 1 },
  { id: 'p06', caption: 'Colosseum, before the crowds',    location: 'Rome, IT',         w: 5, h: 3 },
  { id: 'p07', caption: 'Burano, blue door',               location: 'Burano, IT',       w: 4, h: 5 },
  { id: 'p08', caption: 'Pasta class, hand-rolled',        location: 'Florence, IT',     w: 1, h: 1 },
  { id: 'p09', caption: 'Lucca walls by bike',             location: 'Lucca, IT',        w: 3, h: 4 },
  { id: 'p10', caption: 'Prosecco hills, golden hour',     location: 'Valdobbiadene, IT', w: 4, h: 3 },
  { id: 'p11', caption: 'Vatican corridor',                location: 'Vatican City',     w: 3, h: 5 },
  { id: 'p12', caption: 'Murano glass at dusk',            location: 'Murano, IT',       w: 4, h: 3 },
];

const VIDEOS = [
  { id: 'dQw4w9WgXcQ', title: 'Florence, Venice & Rome — 10 days, done right', dur: '24:08', views: '184K', date: '3 weeks ago', featured: true },
  { id: 'dQw4w9WgXcQ', title: 'How we plan a 10-day Italy trip in one evening', dur: '11:42', views: '67K',  date: '2 months ago' },
  { id: 'dQw4w9WgXcQ', title: 'Pisa + Lucca bike tour — the perfect day trip',  dur: '6:18',  views: '212K', date: '5 months ago' },
  { id: 'dQw4w9WgXcQ', title: 'Venice islands · Murano + Burano',               dur: '14:02', views: '94K',  date: '7 months ago' },
  { id: 'dQw4w9WgXcQ', title: 'Camera bag & travel kit, 2026 edition',          dur: '9:24',  views: '41K',  date: '8 months ago' },
  { id: 'dQw4w9WgXcQ', title: 'Rome in a day · Colosseum to Trevi',             dur: '18:30', views: '156K', date: '11 months ago' },
];

const REELS = [
  { id: 'r01', label: 'Bennett Lane, Calistoga', likes: '24.1K' },
  { id: 'r02', label: 'Where am I going now?',   likes: '88.4K' },
  { id: 'r03', label: 'Pasta, by hand',          likes: '142K'  },
  { id: 'r04', label: 'Frecciarossa window',     likes: '12.8K' },
  { id: 'r05', label: 'Gelato, of course',       likes: '36.2K' },
  { id: 'r06', label: 'Venice at sunrise',       likes: '64.7K' },
];

// Real affiliate product from the site, plus realistic travel gear we'd actually link
const SHOP = [
  { id: 's01', cat: 'Sleep',    name: 'Airplane Head Strap with Eye Mask',  price: '$29',   why: '360\u00b0 hug-your-head support instead of chin-on-shoulder. The reason we slept on the overnight to Florence.', link: 'https://amzn.to/4s5lhJ9' },
  { id: 's02', cat: 'Camera',   name: 'Fujifilm X100VI',                    price: '$1,599', why: 'What we shoot 80% of these photos on. Fixed 35mm, leaf shutter, jacket-pocket. The Duomo at dawn — this camera.' },
  { id: 's03', cat: 'Bags',     name: 'Peak Design Everyday Backpack 20L',   price: '$280',   why: 'Survived four countries and a vespa. Top-loaders, side access, hard not to love.' },
  { id: 's04', cat: 'Luggage',  name: 'Away · The Bigger Carry-On',          price: '$295',   why: 'Fits two weeks if you pack like we do. Wheels survived Florentine cobblestones.' },
  { id: 's05', cat: 'Footwear', name: 'Veja V-10 Sneakers',                  price: '$150',   why: 'The only shoes in the suitcase. 200km across Italy. Still presentable for a Negroni.' },
  { id: 's06', cat: 'Tech',     name: 'Anker 25,000mAh Power Bank',          price: '$110',   why: 'Charges a laptop. We used it on a 9-hour FlixBus.' },
  { id: 's07', cat: 'Tech',     name: 'Sony WF-1000XM5 Earbuds',             price: '$300',   why: 'The reason we slept on the overnight train.' },
  { id: 's08', cat: 'Travel',   name: 'Bellroy Travel Wallet',               price: '$120',   why: 'Passport, cards, boarding pass, pen. One pocket. Survives 10 days of in-and-out at TSA.' },
];

Object.assign(window, { SITE, NAV, ITALY, ITINERARIES, PHOTOS, VIDEOS, REELS, SHOP });
