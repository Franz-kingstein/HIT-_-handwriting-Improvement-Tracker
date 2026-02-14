
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, HandwritingStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TEXT_MODEL = 'gemini-2.0-flash';
const VISION_MODEL = 'gemini-2.0-flash';

/**
 * Generates a fresh, dynamic prompt based on mode.
 */
export const generateDynamicPrompt = async (mode: 'sentence' | 'paragraph', focusLetters?: string[]): Promise<string> => {
  const promptText = mode === 'sentence' 
    ? "Generate a single, elegant, and inspirational sentence for cursive handwriting practice (approx 15-20 words)."
    : "Generate a sophisticated, substantial paragraph (approx 180-250 words) about art, history, or philosophy for deep handwriting practice. Ensure the vocabulary is varied and elegant.";

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ 
        parts: [{ 
          text: `${promptText} ${focusLetters ? `Try to include words with these letters: ${focusLetters.join(', ')}.` : ''} Return ONLY the text of the prompt without any introductory remarks.` 
        }] 
      }],
    });

    return response.text.trim();
  } catch (error: any) {
    console.error("Prompt generation failed:", error);
    return mode === 'sentence'
      ? "The quick brown fox jumps over the lazy dog near the riverbank."
      : "Handwriting is a timeless skill that connects the mind and the body in perfect harmony. It is a craft that requires a steady hand and a calm mind to execute effectively.";
  }
};

export const analyzeHandwriting = async (
  base64Image: string, 
  timeTakenSeconds: number, 
  wordCount: number,
  isSpeedMode: boolean
): Promise<AnalysisResult> => {
  const wpm = Math.round((wordCount / (timeTakenSeconds / 60)) || 0);

  // Strip the data URL prefix to get raw base64
  const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // Check image size — if over 4MB base64, it's likely too large
  if (rawBase64.length > 4 * 1024 * 1024) {
    throw new Error("Image is too large. Please try a lower resolution photo.");
  }

  const response = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: rawBase64,
          },
        },
        {
          text: `Analyze this image of handwriting ${isSpeedMode ? '(Speed Writing Mode)' : ''}.
          Metrics: Total Time ${timeTakenSeconds}s, Speed: ${wpm} WPM.
          
          Strict Evaluation Criteria:
          1. Letter Clarity (label: "Clarity"): Closed tops of 'a' and 'o', distinct loops.
          2. Consistency (label: "Consistency"): Baseline alignment and size uniformity.
          3. Spacing (label: "Spacing"): Tangle prevention between lines.
          4. Slant (label: "Slant"): 5-15 degrees consistency.
          
          Return JSON with these exact fields. Use metric labels exactly as: "Clarity", "Consistency", "Spacing", "Slant".
          Scores should be 0-100. Provide specific actionable feedback for each metric.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          styleDetected: { type: Type.STRING },
          transcription: { type: Type.STRING },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                score: { type: Type.NUMBER },
                feedback: { type: Type.STRING }
              },
              required: ["label", "score", "feedback"]
            }
          },
          suggestedExercises: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["overallScore", "styleDetected", "metrics", "suggestedExercises", "transcription"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return { ...data, wpm, timeTakenSeconds } as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", response.text, error);
    throw new Error("Invalid analysis data returned from AI.");
  }
};

export const generateDictation = async (text: string, speed: 'normal' | 'fast'): Promise<Uint8Array> => {
  const prompt = speed === 'fast' 
    ? `Speak clearly but quickly, like a fast dictation: ${text}`
    : `Speak clearly at a steady pace for handwriting practice: ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio.");

  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}
