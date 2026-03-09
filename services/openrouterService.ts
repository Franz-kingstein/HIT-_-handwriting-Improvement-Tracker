import { AnalysisResult } from '../types';

// Use the public openrouter.ai host (works from browser). api.openrouter.ai may not resolve in some networks.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Use the exact OpenRouter model identifier provided
// Change this line in your code
const MODEL_NAME = 'google/gemma-3-27b-it:free';
// Prompt cache to reduce duplicate prompt generation calls (TTL: 5 minutes)
const PROMPT_CACHE = new Map<string, { text: string; ts: number }>();
const PROMPT_TTL_MS = 5 * 60 * 1000;
const INFLIGHT_PROMPT_PROMISES = new Map<string, Promise<string>>();

// Very simple client-side rate limiter to avoid spamming OpenRouter from the browser.
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 20;
function ensureWithinFreeLimit() {
  const now = Date.now();
  while (requestTimestamps.length && now - requestTimestamps[0] > 60_000) requestTimestamps.shift();
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.ceil((60_000 - (now - requestTimestamps[0])) / 1000);
    throw new Error(`Local OpenRouter client limit reached. Try again in ${retryAfter}s`);
  }
  requestTimestamps.push(now);
}
async function callOpenRouter(messages: any[]) {
  // Read the Vite-exposed variable from import.meta.env in the browser build
  // Use a loose cast to avoid TypeScript build issues in this small helper.
  const apiKey = (import.meta as any).env?.VITE_OPENROUTER_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_OPENROUTER_KEY not set in .env. Add it to .env and restart the dev server.');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      // Use the documented custom header; avoid trying to set the Referer header.
      'X-OpenRouter-Title': (typeof window !== 'undefined' ? window.location.hostname : 'HIT App'),
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages,
      route: 'fallback'
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${t}`);
  }
  return res.json();
}

export async function pingOpenRouter(): Promise<any> {
  const apiKey = (import.meta as any).env?.VITE_OPENROUTER_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_OPENROUTER_KEY not set in .env. Add it to .env and restart the dev server.');
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL_NAME, messages: [{ role: 'system', content: 'ping' }, { role: 'user', content: 'ping' }] }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`OpenRouter ping failed: ${res.status} ${txt}`);
  return txt;
}

if (typeof window !== 'undefined') (window as any).pingOpenRouter = pingOpenRouter;

export async function generateDynamicPrompt(mode: 'sentence' | 'paragraph', focusLetters?: string[]) {
  const prompt = mode === 'sentence'
    ? 'Generate a single, elegant, and inspirational sentence for cursive handwriting practice (approx 15-20 words).'
    : 'Generate a sophisticated, substantial paragraph (approx 180-250 words) about art, history, or philosophy for deep handwriting practice. Ensure the vocabulary is varied and elegant.';

  const userPrompt = `${prompt} ${focusLetters ? `Try to include words with these letters: ${focusLetters.join(', ')}.` : ''} Return ONLY the text of the prompt without any introductory remarks.`;

  const cacheKey = `${mode}:${(focusLetters || []).join(',')}`;
  // return cached prompt if fresh
  const cached = PROMPT_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < PROMPT_TTL_MS) return cached.text;

  // dedupe in-flight requests
  const existing = INFLIGHT_PROMPT_PROMISES.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      ensureWithinFreeLimit();
      const data = await callOpenRouter([
        { role: 'system', content: 'You are a helpful assistant for handwriting practice.' },
        { role: 'user', content: userPrompt }
      ]);
      const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.message || '';
      PROMPT_CACHE.set(cacheKey, { text, ts: Date.now() });
      return text;
    } catch (e: any) {
      let msg = 'OpenRouter (Gemma) is currently rate-limited or unavailable. Please try again later.';
      if (e?.message && e.message.includes('429')) {
        msg = 'Gemma model is rate-limited on OpenRouter. Please try again later or add your own OpenRouter API key for higher limits.';
      } else if (e?.message) {
        msg += `\nDetails: ${e.message}`;
      }
      throw new Error(msg);
    } finally {
      INFLIGHT_PROMPT_PROMISES.delete(cacheKey);
    }
  })();

  INFLIGHT_PROMPT_PROMISES.set(cacheKey, promise);
  return promise;
}

export async function analyzeHandwriting(base64Image: string, timeTakenSeconds: number, wordCount: number, isSpeedMode: boolean): Promise<AnalysisResult> {
  const wpm = Math.round((wordCount / (timeTakenSeconds / 60)) || 0);
  const prompt = `Analyze this image of handwriting ${isSpeedMode ? '(Speed Writing Mode)' : ''}.\nMetrics: Total Time ${timeTakenSeconds}s, Speed: ${wpm} WPM.\n\nStrict Evaluation Criteria:\n1. Letter Clarity (label: "Clarity"): Closed tops of 'a' and 'o', distinct loops.\n2. Consistency (label: "Consistency"): Baseline alignment and size uniformity.\n3. Spacing (label: "Spacing"): Tangle prevention between lines.\n4. Slant (label: "Slant"): 5-15 degrees consistency.\n\nReturn JSON with these exact fields. Use metric labels exactly as: "Clarity", "Consistency", "Spacing", "Slant".\nScores should be 0-100. Provide specific actionable feedback for each metric.`;

  // Prevent sending very large base64 payloads from the browser to OpenRouter.
  const base64Only = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const padding = base64Only.endsWith('==') ? 2 : (base64Only.endsWith('=') ? 1 : 0);
  const sizeBytes = Math.floor((base64Only.length * 3) / 4) - padding;
  const MAX_BYTES = 1_000_000; // 1 MB
  if (sizeBytes > MAX_BYTES) {
    throw new Error(`Image too large for OpenRouter (${Math.round(sizeBytes / 1024)} KB). Please use a smaller image.`);
  }

  try {
    const data = await callOpenRouter([
      { role: 'system', content: 'You are a handwriting analysis expert. You will receive a base64-encoded image and analysis instructions.' },
      { role: 'user', content: `Image (base64, JPEG): ${base64Image}\n${prompt}` }
    ]);

    const raw = data?.choices?.[0]?.message?.content ?? '';
    // Try to extract trailing JSON object robustly (handles extra explanatory text).
    let json: any;
    const jsonMatch = raw.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
      json = JSON.parse(jsonMatch[0]);
    } else {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start >= 0 && end > start) json = JSON.parse(raw.slice(start, end + 1));
      else throw new Error('Unable to extract JSON from OpenRouter response');
    }

    return { ...json, wpm, timeTakenSeconds };
  } catch (e: any) {
    let msg = 'OpenRouter (Gemma) is currently rate-limited or unavailable. Please try again later.';
    if (e?.message && e.message.includes('429')) {
      msg = 'Gemma model is rate-limited on OpenRouter. Please try again later or add your own OpenRouter API key for higher limits.';
    } else if (e?.message) {
      msg += `\nDetails: ${e.message}`;
    }
    throw new Error(msg);
  }
}
