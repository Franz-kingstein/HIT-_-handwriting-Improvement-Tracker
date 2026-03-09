import { AnalysisResult } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const LLAMA_MODEL = "llama3-70b-8192"; // Llama 3.2 model name for Groq

const apiKey = process.env.VITE_GROQ_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GROQ_API_KEY is not set in the environment. Add VITE_GROQ_API_KEY=your_key to .env and restart the dev server.");
}

async function callGroq(messages: any[]): Promise<any> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: LLAMA_MODEL,
      messages,
      stream: false
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }
  return response.json();
}

export async function generateDynamicPrompt(mode: 'sentence' | 'paragraph', focusLetters?: string[]): Promise<string> {
  const promptText = mode === 'sentence'
    ? "Generate a single, elegant, and inspirational sentence for cursive handwriting practice (approx 15-20 words)."
    : "Generate a sophisticated, substantial paragraph (approx 180-250 words) about art, history, or philosophy for deep handwriting practice. Ensure the vocabulary is varied and elegant.";

  const userPrompt = `${promptText} ${focusLetters ? `Try to include words with these letters: ${focusLetters.join(', ')}.` : ''} Return ONLY the text of the prompt without any introductory remarks.`;

  const data = await callGroq([
    { role: "system", content: "You are a helpful assistant for handwriting practice." },
    { role: "user", content: userPrompt }
  ]);
  return data.choices[0].message.content.trim();
}

export async function analyzeHandwriting(
  base64Image: string,
  timeTakenSeconds: number,
  wordCount: number,
  isSpeedMode: boolean
): Promise<AnalysisResult> {
  const wpm = Math.round((wordCount / (timeTakenSeconds / 60)) || 0);
  const prompt = `Analyze this image of handwriting ${isSpeedMode ? '(Speed Writing Mode)' : ''}.
Metrics: Total Time ${timeTakenSeconds}s, Speed: ${wpm} WPM.

Strict Evaluation Criteria:
1. Letter Clarity (label: "Clarity"): Closed tops of 'a' and 'o', distinct loops.
2. Consistency (label: "Consistency"): Baseline alignment and size uniformity.
3. Spacing (label: "Spacing"): Tangle prevention between lines.
4. Slant (label: "Slant"): 5-15 degrees consistency.

Return JSON with these exact fields. Use metric labels exactly as: "Clarity", "Consistency", "Spacing", "Slant".
Scores should be 0-100. Provide specific actionable feedback for each metric.`;

  const data = await callGroq([
    { role: "system", content: "You are a handwriting analysis expert. You will receive a base64-encoded image and analysis instructions." },
    { role: "user", content: `Image (base64, JPEG): ${base64Image}\n${prompt}` }
  ]);
  try {
    const jsonStart = data.choices[0].message.content.indexOf('{');
    const json = JSON.parse(data.choices[0].message.content.slice(jsonStart));
    return { ...json, wpm, timeTakenSeconds };
  } catch (e) {
    throw new Error("Invalid analysis data returned from Llama 3.2.");
  }
}
