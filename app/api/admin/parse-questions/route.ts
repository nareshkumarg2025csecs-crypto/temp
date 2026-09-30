import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json({ error: 'Please provide raw question text to parse.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6JldCmiQgQVs4bhjbhlu9M-X5FuWLc44-OpapIJjFuKqQ';

    const prompt = `Parse the following list of multiple-choice safety-training questions into a JSON array. Each item must have exactly this shape:
{ "question": string, "options": string[], "correct_option": number }
where correct_option is the zero-based index into options matching the marked correct answer. Preserve the exact question and option wording from the input — do not rephrase or add explanation. Return ONLY the JSON array, no markdown fences, no commentary.

Input:
${rawText}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Gemini API Error:', res.status, errorText);

      // Attempt fallback with gemini-flash-latest endpoint
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!fallbackRes.ok) {
        return NextResponse.json(
          { error: `Gemini API returned error: ${fallbackRes.statusText}` },
          { status: 502 }
        );
      }

      const fbData = await fallbackRes.json();
      const fbRaw = fbData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const questions = cleanAndParseJson(fbRaw);
      return NextResponse.json({ questions });
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const questions = cleanAndParseJson(candidateText);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('Error in parse-questions route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while parsing questions.' },
      { status: 500 }
    );
  }
}

function cleanAndParseJson(text: string): any[] {
  let cleaned = text.trim();
  // Remove markdown code fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => ({
        question: String(item.question || `Question ${idx + 1}`),
        options: Array.isArray(item.options) ? item.options.map(String) : ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_option: typeof item.correct_option === 'number' ? item.correct_option : 0,
      }));
    }
    throw new Error('Parsed output is not an array');
  } catch (e) {
    console.warn('JSON parse error on text:', cleaned);
    throw new Error('Failed to parse Gemini output as a valid JSON array.');
  }
}
