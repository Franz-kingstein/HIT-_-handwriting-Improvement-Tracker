import { GoogleGenAI } from '@google/genai';
import { AnalysisResult } from '../types';

const getApiKey = () => {
  try { return (import.meta as any).env?.VITE_GEMINI_API_KEY; } catch (e) { }
  try { return (process.env as any).GEMINI_API_KEY; } catch (e) { }
  try { return (process.env as any).API_KEY; } catch (e) { }
  return undefined;
};
const apiKey = getApiKey();

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function generateDynamicPrompt(mode: 'sentence' | 'paragraph', focusLetters?: string[]): Promise<string> {
  if (!ai) throw new Error("VITE_GEMINI_API_KEY is not defined in .env. Setup your api key in Netlify environment variables.");

  const prompt = mode === 'sentence'
    ? 'Generate a single, elegant, and inspirational sentence for cursive handwriting practice (approx 15-20 words).'
    : 'Generate a sophisticated, substantial paragraph (approx 180-250 words) about art, history, or philosophy for deep handwriting practice. Ensure the vocabulary is varied and elegant.';

  const userPrompt = `${prompt} ${focusLetters ? `Try to include words with these letters: ${focusLetters.join(', ')}.` : ''} Return ONLY the text of the prompt without any introductory remarks.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
    });
    return response.text || '';
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate prompt from Google Gemini");
  }
}

export async function analyzeHandwriting(base64Image: string, timeTakenSeconds: number, wordCount: number, isSpeedMode: boolean): Promise<AnalysisResult> {
  if (!ai) throw new Error("VITE_GEMINI_API_KEY is not defined in .env. Setup your api key in Netlify environment variables.");

  const wpm = Math.round((wordCount / (timeTakenSeconds / 60)) || 0);
  const prompt = `Analyze this image of handwriting ${isSpeedMode ? '(Speed Writing Mode)' : ''}.
Metrics: Total Time ${timeTakenSeconds}s, Speed: ${wpm} WPM.

Strict Evaluation Criteria:
1. Letter Clarity (label: "Clarity"): Closed tops of 'a' and 'o', distinct loops.
2. Consistency (label: "Consistency"): Baseline alignment and size uniformity.
3. Spacing (label: "Spacing"): Tangle prevention between lines.
4. Slant (label: "Slant"): 5-15 degrees consistency.

Return JSON with these exact fields:
- overallScore (0-100)
- styleDetected (string)
- metrics: array of objects { label: strictly one of "Clarity", "Consistency", "Spacing", "Slant", score (0-100), feedback (string) }
- suggestedExercises: array of strings
- transcription: string (the text you can read)

Return ONLY JSON. Do not include markdown blocks like \`\`\`json.`;

  const base64Only = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Only,
            mimeType: 'image/jpeg'
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const rawText = response.text || "{}";
    let json = JSON.parse(rawText);
    return { ...json, wpm, timeTakenSeconds } as AnalysisResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to analyze handwriting with Google Gemini");
  }
}

export async function generateDictation(text: string, speed: 'normal' | 'fast'): Promise<Uint8Array> {
  const dictation = await generateDynamicPrompt('sentence');
  return new TextEncoder().encode(dictation);
}
