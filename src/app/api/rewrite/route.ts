import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/** What each keyboard rewrite mode asks for. The text always stays in its own language and script. */
const STYLES: Record<string, string> = {
  fix: 'Fix spelling, grammar and punctuation only. Change as little as possible.',
  formal: 'Rewrite it in a polite, formal register suitable for work or official messages.',
  friendly: 'Rewrite it in a warm, friendly, casual register suitable for friends and family.',
  shorter: 'Make it shorter and clearer while keeping every important point.',
  voice:
    'This is dictated speech. Add punctuation and capitals, and remove filler words (um, uh, like, እ, እንትን) and false starts. Otherwise keep the speaker\'s own words.',
};

const MAX_CHARS = 1500;

export async function POST(request: NextRequest) {
  let body: { text?: unknown; style?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const style = typeof body.style === 'string' ? body.style : '';
  if (!text || !STYLES[style]) {
    return NextResponse.json({ error: 'Need text and a style: fix, formal, friendly, shorter or voice' }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `Text is longer than ${MAX_CHARS} characters` }, { status: 413 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Rewriting is not set up on this server' }, { status: 503 });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: style === 'fix' ? 0 : 0.4,
      messages: [
        {
          role: 'system',
          content: `You edit text typed on a phone keyboard. The text may be Amharic (Ge'ez script), English, or a mix.
${STYLES[style]}
Keep the same language and script as the input: never translate, and never turn Ge'ez script into Latin letters or the reverse.
Keep names, numbers, links and emoji as they are.
Return only the edited text, with no quotes, notes or explanations.`,
        },
        { role: 'user', content: text },
      ],
    });
    const out = completion.choices[0]?.message?.content?.trim();
    if (!out) return NextResponse.json({ error: 'No result' }, { status: 502 });
    return NextResponse.json({ text: out });
  } catch (error) {
    console.error('Rewrite failed:', error);
    return NextResponse.json({ error: 'Rewrite failed' }, { status: 502 });
  }
}
