'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenizedText } from '@/components/tokenized-text';
import type { LanguageMode } from '@/types/database';

interface PassageDisplayProps {
  title: string;
  content: string;
  languageMode?: LanguageMode;
  showWordMeaning?: boolean;
}

export function PassageDisplay({
  title,
  content,
  languageMode = 'both',
  showWordMeaning = true,
}: PassageDisplayProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-orange-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-tamil whitespace-pre-wrap leading-relaxed text-gray-800">
          {showWordMeaning ? (
            <TokenizedText
              text={content}
              languageMode={languageMode}
              showSaveButton={true}
            />
          ) : (
            content
          )}
        </div>
      </CardContent>
    </Card>
  );
}
