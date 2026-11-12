import { NextRequest, NextResponse } from 'next/server';

// One shared Giphy key for every keyboard and the website, kept server-side
// (set GIPHY_API_KEY in Vercel) so it never ships inside the APK.
//
// Many people share this key, so the route works hard not to spend it:
//  - The query is normalised ("Cat ", "cat") so equal searches share a cache entry.
//  - Real answers carry s-maxage, so Vercel's CDN serves repeats without
//    running this function or calling Giphy at all.
//  - fetch() also keeps a 5-minute data cache behind the CDN.
//  - A per-IP limit stops one client from draining the quota. It is
//    per-instance memory, so it's a brake, not a guarantee.
// Without a key, or when Giphy fails, it answers with isFallback: true and
// the clients use their built-in GIF catalogue.

const GIPHY_API_KEY = process.env.GIPHY_API_KEY?.trim() || '';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;
const hits = new Map<string, { start: number; count: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.start > RATE_WINDOW_MS) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  h.count++;
  return h.count > RATE_MAX;
}

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = parseInt(value ?? '', 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function fallback(query: string, limit: number, offset: number, status = 200) {
  return NextResponse.json(
    {
      data: generateFallbackGifs(query || 'trending', limit),
      pagination: { total_count: 100, count: limit, offset },
      meta: { status: 200, msg: 'OK (fallback data)' },
      isFallback: true,
    },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get('q') || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 50);
  const limit = clampInt(searchParams.get('limit'), 24, 1, 50);
  const offset = clampInt(searchParams.get('offset'), 0, 0, 4999);
  const type = query && searchParams.get('type') !== 'trending' ? 'search' : 'trending';

  if (!GIPHY_API_KEY) return fallback(query, limit, offset);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(ip)) return fallback(query, limit, offset, 429);

  const params = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    limit: String(limit),
    offset: String(offset),
    rating: 'g',
  });
  if (type === 'search') params.set('q', query);

  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/${type}?${params}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      console.error(`Giphy ${type} failed: ${response.status}`);
      return fallback(query, limit, offset);
    }

    const data = await response.json();
    if (!Array.isArray(data?.data) || data.data.length === 0) return fallback(query, limit, offset);

    // Trending changes through the day; a search's results barely do.
    const maxAge = type === 'trending' ? 600 : 3600;
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, max-age=60, s-maxage=${maxAge}, stale-while-revalidate=86400`,
      },
    });
  } catch (error) {
    console.error('Giphy request error:', error);
    return fallback(query, limit, offset);
  }
}

function generateFallbackGifs(query: string, limit: number) {
  const categories: Record<string, { emoji: string; label: string }[]> = {
    hello: [
      { emoji: '👋', label: 'Hey!' }, { emoji: '🤗', label: 'Hi there!' },
      { emoji: '✨', label: 'Hello!' }, { emoji: '🙌', label: 'Yo!' },
      { emoji: '🫶', label: 'Hi love!' }, { emoji: '😊', label: 'Hi!' },
    ],
    thanks: [
      { emoji: '🙏', label: 'Thank you!' }, { emoji: '💕', label: 'Thanks!' },
      { emoji: '✨', label: 'Appreciate it!' }, { emoji: '🤝', label: 'Much obliged!' },
    ],
    love: [
      { emoji: '❤️', label: 'Love you!' }, { emoji: '😘', label: 'Muah!' },
      { emoji: '💕', label: 'So much!' }, { emoji: '🥰', label: 'My love!' },
    ],
    laugh: [
      { emoji: '😂', label: 'LMAO!' }, { emoji: '🤣', label: 'Haha!' },
      { emoji: '😆', label: 'LOL!' }, { emoji: '😹', label: 'Too funny!' },
    ],
    celebrate: [
      { emoji: '🎉', label: 'Party!' }, { emoji: '🎊', label: 'Yay!' },
      { emoji: '🥳', label: 'Woohoo!' }, { emoji: '🍾', label: 'Cheers!' },
    ],
    sad: [
      { emoji: '😢', label: 'So sad' }, { emoji: '😭', label: 'Crying!' },
      { emoji: '💔', label: 'Heartbroken' }, { emoji: '🥺', label: 'Please!' },
    ],
    cool: [
      { emoji: '😎', label: 'Cool!' }, { emoji: '🔥', label: 'Fire!' },
      { emoji: '💪', label: 'Strong!' }, { emoji: '💯', label: '100!' },
    ],
    fire: [
      { emoji: '🔥', label: 'Lit!' }, { emoji: '💥', label: 'Boom!' },
      { emoji: '⚡', label: 'Electric!' }, { emoji: '🌟', label: 'Star!' },
    ],
    trending: [
      { emoji: '🔥', label: 'Hot' }, { emoji: '⭐', label: 'Top' },
      { emoji: '🚀', label: 'Rocket' }, { emoji: '💎', label: 'Diamond' },
      { emoji: '🎉', label: 'Party' }, { emoji: '❤️', label: 'Love' },
      { emoji: '😂', label: 'Funny' }, { emoji: '✨', label: 'Magic' },
    ],
  };

  const items = categories[query.toLowerCase()] || categories.trending;
  return Array.from({ length: Math.min(limit, items.length * 3) }, (_, i) => ({
    id: `fallback-${query}-${i}`,
    type: 'gif',
    slug: `${query}-fallback-${i}`,
    url: '#',
    title: items[i % items.length].label,
    images: {
      fixed_height_small: {
        url: `https://media.giphy.com/media/3o7btNa0RUYa5E7ihq/100.gif`,
        width: '100',
        height: '100',
      },
      fixed_height: {
        url: `https://media.giphy.com/media/3o7btNa0RUYa5E7ihq/200.gif`,
        width: '200',
        height: '200',
      },
      original: {
        url: `https://media.giphy.com/media/3o7btNa0RUYa5E7ihq/giphy.gif`,
        width: '480',
        height: '480',
      },
    },
    _fallback: { emoji: items[i % items.length].emoji, label: items[i % items.length].label },
  }));
}
