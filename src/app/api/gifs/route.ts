import { NextRequest, NextResponse } from 'next/server';

// Giphy API - using the public beta key as fallback
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'trending';
  const limit = searchParams.get('limit') || '20';
  const offset = searchParams.get('offset') || '0';
  const type = searchParams.get('type') || 'search'; // 'search', 'trending', 'random'

  try {
    let url: string;

    if (type === 'trending') {
      url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`;
    } else if (type === 'random') {
      url = `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${query}&rating=g`;
    } else {
      url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g`;
    }

    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // If Giphy API fails, return fallback data
      return NextResponse.json({
        data: generateFallbackGifs(query, parseInt(limit)),
        pagination: { total_count: 100, count: parseInt(limit), offset: parseInt(offset) },
        meta: { status: 200, msg: 'OK (fallback data)' },
        isFallback: true,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    // Return fallback data on error
    return NextResponse.json({
      data: generateFallbackGifs(query, parseInt(limit)),
      pagination: { total_count: 100, count: parseInt(limit), offset: parseInt(offset) },
      meta: { status: 200, msg: 'OK (fallback data)' },
      isFallback: true,
    });
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

  const items = categories[query] || categories.trending;
  return Array.from({ length: Math.min(limit, items.length * 2) }, (_, i) => ({
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
