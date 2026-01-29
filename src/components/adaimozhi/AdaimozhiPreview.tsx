'use client';

/**
 * AdaimozhiPreview - Live preview of adaimozhi entry
 * Feature: 003-adaimozhi
 *
 * Shows how the entry will appear to students.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdaimozhiPreviewProps {
  /** Phrase with blank */
  phraseText: string;
  /** The missing word (correct answer) */
  missingWord: string;
  /** Complete phrase */
  completePhrase: string;
  /** Tamil meaning */
  meaningTa?: string | null;
  /** English meaning */
  meaningEn?: string | null;
  /** Additional CSS classes */
  className?: string;
}

export function AdaimozhiPreview({
  phraseText,
  missingWord,
  completePhrase,
  meaningTa,
  meaningEn,
  className = '',
}: AdaimozhiPreviewProps) {
  const hasContent = phraseText || missingWord;

  if (!hasContent) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">
            Fill in the form to see preview
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Student View Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Display */}
        <div className="rounded-lg bg-orange-50 p-4 text-center">
          <p className="font-tamil text-xl leading-relaxed">
            {phraseText || '_____ _____'}
          </p>
        </div>

        {/* Mock Options */}
        <div className="space-y-2">
          <p className="text-sm text-gray-500 text-center">
            கோடிட்ட இடத்தை நிரப்புக
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['A', 'B', 'C', 'D'].map((label, i) => (
              <div
                key={label}
                className={`rounded border p-2 text-center ${
                  i === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <span className="font-semibold mr-2">{label}.</span>
                <span className="font-tamil">
                  {i === 0 ? missingWord || '(answer)' : `Option ${label}`}
                </span>
                {i === 0 && (
                  <span className="ml-2 text-xs text-green-600">(correct)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Meaning Display (shown after answer) */}
        {(completePhrase || meaningTa || meaningEn) && (
          <div className="rounded-lg bg-blue-50 p-4 space-y-2">
            <p className="text-xs text-blue-600 uppercase font-medium">
              After answering:
            </p>

            {completePhrase && (
              <div>
                <p className="text-sm font-medium text-blue-800">Complete Phrase:</p>
                <p className="font-tamil text-blue-700">{completePhrase}</p>
              </div>
            )}

            {meaningTa && (
              <div>
                <p className="text-sm font-medium text-blue-800">பொருள்:</p>
                <p className="font-tamil text-blue-700">{meaningTa}</p>
              </div>
            )}

            {meaningEn && (
              <p className="text-sm text-blue-600 italic">{meaningEn}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdaimozhiPreview;
