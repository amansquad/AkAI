import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { image, language } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Missing required field: image' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

    const langInstruction = language === 'amharic'
      ? `The user is writing in Amharic using Ge'ez script (ፊደል). Identify what they wrote. Provide suggestions as both individual characters (ፊደላት) and complete words (ቃላት) in Amharic. Common Amharic words include: ሰላም (hello), አመሰግናለሁ (thank you), እንዴት ነህ (how are you), ደህና (fine/okay), ምን (what), የት (where), እሺ (okay), አይ (no), አዎ (yes).`
      : `The user is writing in English/Latin script. Identify what they wrote. Provide suggestions as both individual letters and complete words.`;

    const systemPrompt = `You are an expert handwriting recognition AI specialized in recognizing handwritten text from canvas drawings. ${langInstruction}

Analyze the handwritten content in the image and provide recognition results.

You MUST respond with a valid JSON object in this exact format (no markdown, no code fences):
{
  "characters": ["char1", "char2", "char3", "char4", "char5"],
  "words": ["word1", "word2", "word3"],
  "sentences": ["sentence1"],
  "confidence": 0.8
}

Rules:
- "characters": Array of 5-8 individual characters/letters that most closely match what was drawn
- "words": Array of 3-5 word suggestions that could be what was written (even partial)
- "sentences": Array of 1-3 sentence suggestions if enough content was drawn
- "confidence": A number between 0 and 1 indicating recognition confidence
- If only a single character appears drawn, focus on characters array with 5-8 alternatives
- If a word appears drawn, include it in words array with similar-looking alternatives
- If multiple words or a sentence appears, include it in sentences array
- Always provide at least 3-5 character suggestions and 2-3 word suggestions
- For Amharic, include both the base character (e.g., ሀ) and its vowel forms (e.g., ሁ, ሂ, ሃ)
- Return ONLY the JSON object, no other text`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please recognize the handwritten content in this image and provide suggestions.',
            },
            {
              type: 'image_url',
              image_url: { url: image },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const rawContent = completion.choices[0]?.message?.content?.trim();

    if (!rawContent) {
      return NextResponse.json(
        { error: 'Recognition failed - empty response' },
        { status: 500 }
      );
    }

    // Parse the JSON response - handle potential markdown code fences
    let parsed;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, return the raw content as a character suggestion
      parsed = {
        characters: [rawContent.substring(0, 1)],
        words: [rawContent.substring(0, 10)],
        sentences: [],
        confidence: 0.3,
      };
    }

    return NextResponse.json({
      characters: parsed.characters || [],
      words: parsed.words || [],
      sentences: parsed.sentences || [],
      confidence: parsed.confidence || 0.5,
    });
  } catch (error) {
    console.error('Handwriting recognition error:', error);
    return NextResponse.json(
      { error: 'Handwriting recognition service error' },
      { status: 500 }
    );
  }
}
