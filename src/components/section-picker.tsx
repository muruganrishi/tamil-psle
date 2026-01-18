'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { QuestionSection } from '@/types/database';

export type Section = {
  id: QuestionSection;
  name: string;
  tamil: string;
  description: string;
  questionCount?: number;
};

export const SECTIONS: Section[] = [
  {
    id: 'vetrumai',
    name: 'Vetrumai',
    tamil: 'வேற்றுமை',
    description: 'Case markers and grammatical cases',
  },
  {
    id: 'seyyul_pazhamozhi',
    name: 'Poetry & Proverbs',
    tamil: 'செய்யுள்/பழமொழி',
    description: 'Classical poetry and traditional proverbs',
  },
  {
    id: 'adaimozhi_echcham',
    name: 'Adjectives & Participles',
    tamil: 'அடைமொழி/எச்சம்',
    description: 'Descriptive words and verb forms',
  },
  {
    id: 'comprehension',
    name: 'Comprehension',
    tamil: 'படிப்புணர்வு',
    description: 'Reading passages and understanding',
  },
  {
    id: 'sorporul',
    name: 'Word Meanings',
    tamil: 'சொற்பொருள்',
    description: 'Vocabulary and word definitions',
  },
  {
    id: 'oli_verupaadu',
    name: 'Sound Differentiation',
    tamil: 'ஒலி வேறுபாடு',
    description: 'Distinguishing similar sounding words',
  },
];

interface SectionPickerProps {
  questionCounts?: Record<string, number>;
  basePath?: string;
}

export function SectionPicker({ questionCounts, basePath = '/practice' }: SectionPickerProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SECTIONS.map((section) => {
        const count = questionCounts?.[section.id];
        const hasQuestions = count === undefined || count > 0;

        return (
          <Card
            key={section.id}
            className={`transition-shadow hover:shadow-md ${!hasQuestions ? 'opacity-60' : ''}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{section.name}</CardTitle>
              <CardDescription className="font-tamil text-base">{section.tamil}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-gray-600">{section.description}</p>
              {count !== undefined && (
                <p className="mb-3 text-xs text-gray-500">{count} questions available</p>
              )}
              <Link href={`${basePath}/${section.id}`}>
                <Button className="w-full" disabled={!hasQuestions}>
                  {hasQuestions ? 'Start Practice' : 'No Questions'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function getSectionById(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id);
}
