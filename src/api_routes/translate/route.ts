import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await request.json();

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text, sourceLang, targetLang' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

    const systemPrompt = `You are a professional translator specializing in English and Amharic (አማርኛ) translation. 
You translate text accurately while preserving meaning, tone, and context.
When translating to Amharic, use proper Ge'ez script.
When translating from Amharic to English, provide natural English translations.
Only return the translated text, nothing else. No explanations, no notes, just the translation.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        {
          role: 'user',
          content: `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${text}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const translation = completion.choices[0]?.message?.content?.trim();

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation failed - empty response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation service error' },
      { status: 500 }
    );
  }
}
