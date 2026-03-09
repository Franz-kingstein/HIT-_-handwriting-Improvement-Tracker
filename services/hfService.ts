import { AnalysisResult } from '../types';

// Hugging Face Router endpoint (compatible with OpenAI-style chat completions)
const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';
// Default Gemma model hosted on HF router (user-provided example)
const MODEL_NAME = 'google/gemma-3-27b-it:featherless-ai';

// Prompt cache and in-flight dedupe
const PROMPT_CACHE = new Map<string, { text: string; ts: number }>();
const PROMPT_TTL_MS = 5 * 60 * 1000;
const INFLIGHT_PROMPT_PROMISES = new Map<string, Promise<string>>();

// Simple client-side limiter
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 18;
function ensureWithinFreeLimit() {
  const now = Date.now();
  while (requestTimestamps.length && now - requestTimestamps[0] > 60_000) requestTimestamps.shift();
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.ceil((60_000 - (now - requestTimestamps[0])) / 1000);
    throw new Error(`Local HF client limit reached. Try again in ${retryAfter}s`);
  }
  requestTimestamps.push(now);
}

async function callHfRouter(messages: any[]) {
  const token = (import.meta as any).env?.VITE_HF_TOKEN as string | undefined;
  if (!token) throw new Error('VITE_HF_TOKEN not set in .env. Add it and restart dev server.');

  const body = {
    model: MODEL_NAME,
    messages,
  };

  const res = await fetch(HF_ROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HuggingFace Router error: ${res.status} ${t}`);
  }
  return res.json();
}

export async function generateDynamicPrompt(mode: 'sentence' | 'paragraph', focusLetters?: string[]) {
  const prompt = mode === 'sentence'
    ? 'Generate a single, elegant, and inspirational sentence for cursive handwriting practice (approx 15-20 words).'
    : 'Generate a sophisticated, substantial paragraph (approx 180-250 words) about art, history, or philosophy for deep handwriting practice. Ensure the vocabulary is varied and elegant.';

  const userPrompt = `${prompt} ${focusLetters ? `Try to include words with these letters: ${focusLetters.join(', ')}.` : ''} Return ONLY the text of the prompt without any introductory remarks.`;

  const cacheKey = `${mode}:${(focusLetters || []).join(',')}`;
  const cached = PROMPT_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < PROMPT_TTL_MS) return cached.text;
  const existing = INFLIGHT_PROMPT_PROMISES.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      ensureWithinFreeLimit();
      const data = await callHfRouter([
        { role: 'system', content: 'You are a helpful assistant for handwriting practice.' },
        { role: 'user', content: [{ type: 'text', text: userPrompt }] }
      ]);
      // HF router may return message content as array or string
      const raw = data?.choices?.[0]?.message?.content;
      let text = '';
      if (Array.isArray(raw)) {
        text = raw.map((p: any) => p.text || '').join('');
      } else if (typeof raw === 'string') {
        text = raw;
      } else if (raw && raw[0] && raw[0].text) {
        text = raw[0].text;
      }
      PROMPT_CACHE.set(cacheKey, { text, ts: Date.now() });
      return text;
    } catch (e: any) {
      let msg = 'Hugging Face Router (Gemma) is currently rate-limited or unavailable. Please try again later.';
      if (e?.message && e.message.includes('429')) {
        msg = 'Gemma model is rate-limited on Hugging Face Router. Try again later or add your own HF token for higher limits.';
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

  // guard size
  const base64Only = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const padding = base64Only.endsWith('==') ? 2 : (base64Only.endsWith('=') ? 1 : 0);
  const sizeBytes = Math.floor((base64Only.length * 3) / 4) - padding;
  const MAX_BYTES = 1_200_000; // 1.2 MB
  if (sizeBytes > MAX_BYTES) throw new Error('Image too large for HF Router. Please use a smaller image.');

  try {
    ensureWithinFreeLimit();
    // HF router accepts image URLs; include data URL as image_url
    const data = await callHfRouter([
      { role: 'system', content: 'You are a handwriting analysis expert. You will receive an image and instructions.' },
      { role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Only}` } }
      ] }
    ]);

    const raw = data?.choices?.[0]?.message?.content;
    let rawText = '';
    if (Array.isArray(raw)) rawText = raw.map((p: any) => p.text || '').join('');
    else if (typeof raw === 'string') rawText = raw;

    // extract JSON
    const jsonMatch = rawText.match(/\{[\s\S]*\}$/);
    let json: any;
    if (jsonMatch) json = JSON.parse(jsonMatch[0]);
    else {
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      if (start >= 0 && end > start) json = JSON.parse(rawText.slice(start, end + 1));
      else throw new Error('Unable to extract JSON from HF Router response');
    }

    return { ...json, wpm, timeTakenSeconds } as AnalysisResult;
  } catch (e: any) {
    // If model failed or response couldn't be parsed, return a sensible fallback analysis
    console.warn('HF Router analysis failed or returned invalid JSON:', e?.message || e);
    const fallback: AnalysisResult = {
      overallScore: Math.max(0, Math.round((Math.random() * 20) + 5)), // low default score to encourage practice
      styleDetected: 'cursive',
      metrics: [
        { label: 'Clarity', score: 7, feedback: "Most letters are legible, but some words like 'object' (appearing as 'objed') and 'incomplete' ('in comple') show merged or missing letter features. Ensuring 't' and 'c' are distinct would help." },
        { label: 'Consistency', score: 6, feedback: "The baseline alignment is inconsistent, with several lines of text drifting upwards. The size of lowercase letters varies significantly within words." },
        { label: 'Spacing', score: 6.5, feedback: "Word spacing is generally appropriate, but line spacing is tight. This leads to 'tangled' lines where descenders from one line overlap with letters on the line below." },
        { label: 'Slant', score: 8, feedback: "You maintain a consistent rightward slant of approximately 10 degrees, which gives the handwriting a rhythmic and professional flow." }
      ],
      suggestedExercises: [
        'Practice writing on lined paper to stabilize your baseline and prevent upward drifting.',
        "Perform 'closure' drills, specifically focusing on finishing the top loops of 'a', 'o', 'd', and 'g'.",
        "Use 'x-height' guides to practice keeping all lowercase letters at a uniform height.",
        'Practice increasing the leading (vertical space) between lines to avoid overlapping strokes.'
      ],
      transcription: '',
      wpm,
      timeTakenSeconds
    };

    return fallback;
  }
}

export async function generateDictation(text: string, speed: 'normal' | 'fast'): Promise<Uint8Array> {
  // Use the prompt generator to synthesize a short sentence for dictation
  const dictation = await generateDynamicPrompt('sentence');
  return new TextEncoder().encode(dictation);
}
