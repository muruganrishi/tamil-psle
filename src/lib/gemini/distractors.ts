/**
 * Gemini AI client for generating MCQ distractors
 * Feature: 005-sorporul
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface DistractorResult {
  distractors: [string, string, string];
}

/**
 * Generate plausible but incorrect Tamil definitions for MCQ distractors
 *
 * @param targetWord - The Tamil word to generate distractors for
 * @param correctDefinition - The correct Tamil definition
 * @returns Three plausible distractor definitions
 * @throws Error with code 'AI_UNAVAILABLE' if Gemini API fails
 */
export async function generateDistractors(
  targetWord: string,
  correctDefinition: string
): Promise<DistractorResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a Tamil language expert creating MCQ distractors for PSLE students (ages 10-12).

Given a Tamil word and its correct definition, generate 3 plausible but INCORRECT Tamil definitions that:
- Are grammatically similar to the correct definition
- Are plausible enough to challenge students
- Are clearly wrong upon careful reading
- Use vocabulary appropriate for primary school

Word: ${targetWord}
Correct Definition: ${correctDefinition}

Respond in this exact JSON format only, with no additional text:
{
  "distractors": ["<distractor_1>", "<distractor_2>", "<distractor_3>"]
}

Rules:
- All distractors must be in Tamil script
- Do not include the correct definition
- Make distractors similar in length to the correct definition
- Avoid obviously wrong or silly answers`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse JSON response
    // Handle potential markdown code blocks
    let jsonText = text;
    if (text.startsWith('```')) {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
    }

    const parsed = JSON.parse(jsonText);

    if (
      !parsed.distractors ||
      !Array.isArray(parsed.distractors) ||
      parsed.distractors.length !== 3
    ) {
      throw new Error('Invalid response format');
    }

    // Validate all distractors are non-empty strings
    for (const distractor of parsed.distractors) {
      if (typeof distractor !== 'string' || distractor.trim().length === 0) {
        throw new Error('Invalid distractor in response');
      }
    }

    return {
      distractors: parsed.distractors as [string, string, string],
    };
  } catch (error) {
    console.error('Gemini distractor generation error:', error);
    throw new Error('AI_UNAVAILABLE');
  }
}
