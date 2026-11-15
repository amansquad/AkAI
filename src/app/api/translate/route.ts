import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const CODES: Record<string, string> = { english: 'en', amharic: 'am' };
const code = (lang: string) => CODES[lang.trim().toLowerCase()] ?? lang.trim().toLowerCase();

const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** 1. Google Cloud Translation (best Amharic quality, free monthly allowance). */
async function viaGoogle(text: string, from: string, to: string): Promise<string | null> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const out = data?.data?.translations?.[0]?.translatedText;
  return typeof out === 'string' && out.trim() ? decodeEntities(out).trim() : null;
}

/** 2. OpenAI fallback. */
async function viaOpenAI(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator specializing in English and Amharic (አማርኛ) translation.
You translate text accurately while preserving meaning, tone, and context.
When translating to Amharic, use proper Ge'ez script.
When translating from Amharic to English, provide natural English translations.
Only return the translated text, nothing else. No explanations, no notes, just the translation.`,
      },
      { role: 'user', content: `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${text}` },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() || null;
}

/** 3. MyMemory, free and keyless (500-byte limit per query, daily cap). */
async function viaMyMemory(text: string, from: string, to: string): Promise<string | null> {
  if (new TextEncoder().encode(text).length > 500) return null;
  const email = process.env.MYMEMORY_EMAIL;
  const url =
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}` +
    (email ? `&de=${encodeURIComponent(email)}` : '');
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (data?.responseStatus !== 200 || typeof out !== 'string') return null;
  return out.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await request.json();

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text, sourceLang, targetLang' },
        { status: 400 }
      );
    }

    const from = code(sourceLang);
    const to = code(targetLang);

    const engines: Array<() => Promise<string | null>> = [
      () => viaGoogle(text, from, to),
      () => viaOpenAI(text, sourceLang, targetLang),
      () => viaMyMemory(text, from, to),
    ];

    for (const engine of engines) {
      try {
        const translation = await engine();
        if (translation) return NextResponse.json({ translation });
      } catch (err) {
        console.error('Translation engine failed:', err);
      }
    }

    return NextResponse.json({ error: 'Translation failed - no engine available' }, { status: 502 });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation service error' }, { status: 500 });
  }
}
