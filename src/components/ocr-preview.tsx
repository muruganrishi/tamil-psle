'use client';

import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SECTIONS } from '@/components/section-picker';

interface OCRResult {
  section: string;
  question_text: string;
  options: { label: string; text: string; is_correct: boolean }[];
}

interface OCRPreviewProps {
  result: OCRResult;
  onConfirm: () => void;
  onRetry: () => void;
}

export function OCRPreview({ result, onConfirm, onRetry }: OCRPreviewProps) {
  const sectionName = SECTIONS.find((s) => s.id === result.section)?.name || result.section;
  const correctOption = result.options.find((o) => o.is_correct);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Extracted Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Section */}
          <div>
            <span className="text-xs font-medium uppercase text-gray-400">Section</span>
            <p className="text-sm">{sectionName}</p>
          </div>

          {/* Question */}
          <div>
            <span className="text-xs font-medium uppercase text-gray-400">Question</span>
            <p className="font-tamil text-sm">{result.question_text}</p>
          </div>

          {/* Options */}
          <div>
            <span className="text-xs font-medium uppercase text-gray-400">Options</span>
            <div className="mt-1 space-y-1">
              {result.options.map((option) => (
                <div
                  key={option.label}
                  className={`flex items-center gap-2 rounded p-2 text-sm ${
                    option.is_correct ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      option.is_correct
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="font-tamil">{option.text}</span>
                  {option.is_correct && (
                    <span className="ml-auto text-xs text-green-600">Correct</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!correctOption && (
            <div className="rounded-md bg-yellow-50 p-2 text-xs text-yellow-700">
              No correct answer detected. You can set it in the form.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry} className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button onClick={onConfirm} className="flex-1">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Use This
        </Button>
      </div>
    </div>
  );
}
