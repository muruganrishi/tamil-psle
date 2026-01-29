/**
 * AI client wrapper for contextual word meaning
 * Uses OpenAI (gpt-4o-mini) for lightweight, fast lookups.
 */

import OpenAI from 'openai';

export interface MeaningResult {
  meaning_en: string | null;
  meaning_ta: string | null;
}

/**
 * Get contextual meaning for a Tamil word using OpenAI
 *
 * The context parameter should include surrounding words so the model
 * can disambiguate words that have different meanings in different contexts.
 */
export async function getContextualMeaning(
  word: string,
  context: string,
  languageMode: 'en' | 'ta' | 'both'
): Promise<MeaningResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const preamble = `You are a Tamil language expert. The user clicked on the Tamil word "${word}" which appears in this context: "${context}". Give the dictionary meaning of ONLY the word "${word}" itself. Do NOT answer any question in the context. Do NOT give the meaning of surrounding words. Just define "${word}".`;

  let instruction: string;

  if (languageMode === 'en') {
    instruction = `${preamble} Provide the English meaning in 1-2 words or a short phrase. Only return the meaning, nothing else.`;
  } else if (languageMode === 'ta') {
    instruction = `${preamble} Provide the Tamil meaning/synonym in 1-2 words or a short phrase. Only return the meaning in Tamil script, nothing else.`;
  } else {
    instruction = `${preamble} Provide:
1. English meaning (1-2 words or short phrase)
2. Tamil meaning/synonym (1-2 words in Tamil script)

Format your response exactly as:
EN: [english meaning]
TA: [tamil meaning]`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: instruction }],
      max_tokens: 100,
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content?.trim() || '';

    if (languageMode === 'en') {
      return { meaning_en: text, meaning_ta: null };
    } else if (languageMode === 'ta') {
      return { meaning_en: null, meaning_ta: text };
    } else {
      const enMatch = text.match(/EN:\s*(.+)/i);
      const taMatch = text.match(/TA:\s*(.+)/i);

      return {
        meaning_en: enMatch ? enMatch[1].trim() : text.split('\n')[0],
        meaning_ta: taMatch ? taMatch[1].trim() : null,
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('AI_UNAVAILABLE');
  }
}
