/**
 * Practice section types
 * READ-ONLY: Feature agents must not modify this file
 */

/**
 * The six Tamil PSLE practice sections
 */
export type PracticeSection =
  | 'vetrumai'
  | 'pazhamozhi'
  | 'adaimozhi'
  | 'munnunarvu'
  | 'sorporul'
  | 'oli-verupaadu';

/**
 * Array of all valid practice sections for iteration
 */
export const PRACTICE_SECTIONS: readonly PracticeSection[] = [
  'vetrumai',
  'pazhamozhi',
  'adaimozhi',
  'munnunarvu',
  'sorporul',
  'oli-verupaadu',
] as const;

/**
 * Human-readable labels for each section (English)
 */
export const SECTION_LABELS_EN: Record<PracticeSection, string> = {
  vetrumai: 'Vetrumai Uruppugal',
  pazhamozhi: 'Pazhamozhi & Seyyul',
  adaimozhi: 'Adaimozhi & Echcham',
  munnunarvu: 'Reading Comprehension',
  sorporul: 'Word Meaning',
  'oli-verupaadu': 'Phonetic Distinctions',
};

/**
 * Human-readable labels for each section (Tamil)
 */
export const SECTION_LABELS_TA: Record<PracticeSection, string> = {
  vetrumai: 'வேற்றுமை உருபுகள்',
  pazhamozhi: 'பழமொழி & செய்யுள்',
  adaimozhi: 'அடைமொழி & எச்சம்',
  munnunarvu: 'முன்னுணர்வு படிப்பு',
  sorporul: 'சொற்பொருள்',
  'oli-verupaadu': 'ஒலி வேறுபாடு',
};

/**
 * Check if a string is a valid practice section
 */
export function isPracticeSection(value: unknown): value is PracticeSection {
  return (
    typeof value === 'string' &&
    PRACTICE_SECTIONS.includes(value as PracticeSection)
  );
}
