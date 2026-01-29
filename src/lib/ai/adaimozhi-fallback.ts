/**
 * Adaimozhi AI fallback distractor generator
 * Feature: 003-adaimozhi
 *
 * Uses Gemini to generate plausible distractors when insufficient DB entries exist.
 * This is a fallback mechanism - DB-sourced distractors are preferred.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-1.5-flash';

/**
 * Generate fallback distractors using Gemini AI.
 *
 * @param phraseText - The phrase with blank (e.g., "தாமரை _____")
 * @param correctWord - The correct answer to exclude
 * @param count - Number of distractors needed
 * @param exclude - Additional words to exclude
 * @returns Array of distractor words
 */
export async function generateFallbackDistractors(
  phraseText: string,
  correctWord: string,
  count: number,
  exclude: string[] = []
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[adaimozhi-fallback] GOOGLE_GEMINI_API_KEY not configured');
    return generateHardcodedFallbacks(count, [correctWord, ...exclude]);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const excludeList = [correctWord, ...exclude].join(', ');

    const prompt = `You are a Tamil language expert helping create practice questions for PSLE Tamil (Primary 6).

Given this Tamil epithet/compound phrase with a blank: "${phraseText}"
The correct answer is: "${correctWord}"
Words to exclude: ${excludeList}

Generate exactly ${count} plausible but INCORRECT Tamil words that could fill the blank. These should be:
1. Real Tamil words commonly used in epithets/compound phrases
2. Grammatically plausible for this blank position
3. Different from the correct answer and excluded words
4. Similar in style/category to create a good MCQ challenge

Return ONLY a JSON array of ${count} Tamil words, no explanation.
Example format: ["கண்கள்", "முகம்", "கைகள்"]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[adaimozhi-fallback] Failed to parse AI response:', text);
      return generateHardcodedFallbacks(count, [correctWord, ...exclude]);
    }

    const distractors: string[] = JSON.parse(jsonMatch[0]);

    // Filter out any that match excluded words
    const filtered = distractors.filter(
      (d) => d !== correctWord && !exclude.includes(d) && d.trim().length > 0
    );

    // Log AI usage for admin monitoring
    logAIFallbackUsage(phraseText, correctWord, filtered.length);

    // If AI didn't give enough, pad with hardcoded fallbacks
    if (filtered.length < count) {
      const hardcoded = generateHardcodedFallbacks(count - filtered.length, [
        correctWord,
        ...exclude,
        ...filtered,
      ]);
      return [...filtered, ...hardcoded].slice(0, count);
    }

    return filtered.slice(0, count);
  } catch (error) {
    console.error('[adaimozhi-fallback] AI generation error:', error);
    return generateHardcodedFallbacks(count, [correctWord, ...exclude]);
  }
}

/**
 * Hardcoded Tamil epithet words as ultimate fallback.
 * These are common words used in Tamil compound phrases.
 */
const FALLBACK_WORDS = [
  'கண்கள்',
  'முகம்',
  'மொழி',
  'கைகள்',
  'நடை',
  'பாதம்',
  'விழி',
  'நகை',
  'குரல்',
  'இதழ்',
  'நிறம்',
  'மேனி',
  'புன்னகை',
  'இடை',
  'கூந்தல்',
  'நெஞ்சம்',
  'உள்ளம்',
  'வாய்',
  'மூச்சு',
  'நடை',
];

/**
 * Generate hardcoded fallbacks when AI fails.
 */
function generateHardcodedFallbacks(count: number, exclude: string[]): string[] {
  const available = FALLBACK_WORDS.filter((w) => !exclude.includes(w));
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Log AI fallback usage for admin monitoring.
 * This is logged to console for now; can be extended to a logging service.
 */
function logAIFallbackUsage(phraseText: string, correctWord: string, generatedCount: number): void {
  console.log('[adaimozhi-ai-fallback]', {
    timestamp: new Date().toISOString(),
    phraseText,
    correctWord,
    generatedCount,
    event: 'distractor_generation',
  });
}
