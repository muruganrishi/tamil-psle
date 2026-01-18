/**
 * Gemini AI client wrapper for contextual word meaning
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface MeaningResult {
  meaning_en: string | null;
  meaning_ta: string | null;
}

/**
 * Get contextual meaning for a Tamil word using Gemini AI
 */
export async function getContextualMeaning(
  word: string,
  context: string,
  languageMode: 'en' | 'ta' | 'both'
): Promise<MeaningResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let prompt: string;

  if (languageMode === 'en') {
    prompt = `You are a Tamil language expert. Given the Tamil word "${word}" in the context "${context}", provide its English meaning in 1-2 words or a short phrase. Only return the meaning, nothing else.`;
  } else if (languageMode === 'ta') {
    prompt = `You are a Tamil language expert. Given the Tamil word "${word}" in the context "${context}", provide its Tamil meaning/synonym in 1-2 words or a short phrase. Only return the meaning in Tamil script, nothing else.`;
  } else {
    prompt = `You are a Tamil language expert. Given the Tamil word "${word}" in the context "${context}", provide:
1. English meaning (1-2 words or short phrase)
2. Tamil meaning/synonym (1-2 words in Tamil script)

Format your response exactly as:
EN: [english meaning]
TA: [tamil meaning]`;
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    if (languageMode === 'en') {
      return { meaning_en: text, meaning_ta: null };
    } else if (languageMode === 'ta') {
      return { meaning_en: null, meaning_ta: text };
    } else {
      // Parse both meanings
      const enMatch = text.match(/EN:\s*(.+)/i);
      const taMatch = text.match(/TA:\s*(.+)/i);

      return {
        meaning_en: enMatch ? enMatch[1].trim() : text.split('\n')[0],
        meaning_ta: taMatch ? taMatch[1].trim() : null,
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('AI_UNAVAILABLE');
  }
}
