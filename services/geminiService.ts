
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, HandwritingStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a fresh, dynamic prompt based on mode.
 */
export const generateDynamicPrompt = async (mode: 'sentence' | 'paragraph', focusLetters?: string[]): Promise<string> => {
  const promptText = mode === 'sentence' 
    ? "Generate a single, elegant, and inspirational sentence for cursive handwriting practice (approx 15-20 words)."
    : "Generate a sophisticated, substantial paragraph (approx 180-250 words) about art, history, or philosophy for deep handwriting practice. Ensure the vocabulary is varied and elegant.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ 
      parts: [{ 
        text: `${promptText} ${focusLetters ? `Try to include words with these letters: ${focusLetters.join(', ')}.` : ''} Return ONLY the text of the prompt without any introductory remarks.` 
      }] 
    }],
  });

  return response.text.trim();
};

export const analyzeHandwriting = async (
  base64Image: string, 
  timeTakenSeconds: number, 
  wordCount: number,
  isSpeedMode: boolean
): Promise<AnalysisResult> => {
  const wpm = Math.round((wordCount / (timeTakenSeconds / 60)) || 0);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: `Analyze this image of handwriting ${isSpeedMode ? '(Speed Writing Mode)' : ''}.
          Metrics: Total Time ${timeTakenSeconds}s, Speed: ${wpm} WPM.
          
          Strict Evaluation Criteria:
          1. Letter Clarity: Closed tops of 'a' and 'o', distinct loops.
          2. Consistency: Baseline alignment and size uniformity.
          3. Spacing: Tangle prevention between lines.
          4. Slant: 5-15 degrees consistency.
          
          Return JSON format with specific corrective feedback.`
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
    console.error("Failed to parse Gemini response:", error);
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
