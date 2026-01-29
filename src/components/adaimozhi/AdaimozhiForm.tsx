'use client';

/**
 * AdaimozhiForm - Form for creating/editing adaimozhi entries
 * Feature: 003-adaimozhi
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AdaimozhiEntry, CreateEntryRequest } from '@/lib/validators/adaimozhi';

interface AdaimozhiFormProps {
  /** Initial values for editing */
  initialValues?: Partial<AdaimozhiEntry>;
  /** Callback when form is submitted */
  onSubmit: (data: CreateEntryRequest) => Promise<void>;
  /** Loading state */
  isLoading?: boolean;
  /** Submit button text */
  submitText?: string;
}

export function AdaimozhiForm({
  initialValues,
  onSubmit,
  isLoading = false,
  submitText = 'Save Entry',
}: AdaimozhiFormProps) {
  const [phraseText, setPhraseText] = useState(initialValues?.phrase_text || '');
  const [missingWord, setMissingWord] = useState(initialValues?.missing_word || '');
  const [completePhrase, setCompletePhrase] = useState(initialValues?.complete_phrase || '');
  const [meaningTa, setMeaningTa] = useState(initialValues?.meaning_ta || '');
  const [meaningEn, setMeaningEn] = useState(initialValues?.meaning_en || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate phrase_text when complete_phrase and missing_word change
  useEffect(() => {
    if (completePhrase && missingWord && completePhrase.includes(missingWord)) {
      const generated = completePhrase.replace(missingWord, '_____');
      if (generated !== phraseText) {
        setPhraseText(generated);
      }
    }
  }, [completePhrase, missingWord]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!phraseText.trim()) {
      newErrors.phraseText = 'Phrase text is required';
    } else if (!phraseText.includes('_____')) {
      newErrors.phraseText = 'Phrase must contain blank marker (_____) ';
    }

    if (!missingWord.trim()) {
      newErrors.missingWord = 'Missing word is required';
    }

    if (!completePhrase.trim()) {
      newErrors.completePhrase = 'Complete phrase is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      phrase_text: phraseText.trim(),
      missing_word: missingWord.trim(),
      complete_phrase: completePhrase.trim(),
      meaning_ta: meaningTa.trim() || undefined,
      meaning_en: meaningEn.trim() || undefined,
      status: 'draft',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Complete Phrase (enter this first) */}
      <div className="space-y-2">
        <Label htmlFor="completePhrase">
          Complete Phrase <span className="text-red-500">*</span>
        </Label>
        <Input
          id="completePhrase"
          value={completePhrase}
          onChange={(e) => setCompletePhrase(e.target.value)}
          placeholder="e.g., தாமரை கண்கள்"
          className="font-tamil"
        />
        {errors.completePhrase && (
          <p className="text-sm text-red-500">{errors.completePhrase}</p>
        )}
        <p className="text-xs text-gray-500">
          Enter the full phrase first (e.g., &quot;தாமரை கண்கள்&quot;)
        </p>
      </div>

      {/* Missing Word */}
      <div className="space-y-2">
        <Label htmlFor="missingWord">
          Missing Word <span className="text-red-500">*</span>
        </Label>
        <Input
          id="missingWord"
          value={missingWord}
          onChange={(e) => setMissingWord(e.target.value)}
          placeholder="e.g., கண்கள்"
          className="font-tamil"
        />
        {errors.missingWord && <p className="text-sm text-red-500">{errors.missingWord}</p>}
        <p className="text-xs text-gray-500">
          The word that will be blanked out (e.g., &quot;கண்கள்&quot;)
        </p>
      </div>

      {/* Phrase with Blank (auto-generated or manual) */}
      <div className="space-y-2">
        <Label htmlFor="phraseText">
          Phrase with Blank <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phraseText"
          value={phraseText}
          onChange={(e) => setPhraseText(e.target.value)}
          placeholder="e.g., தாமரை _____"
          className="font-tamil"
        />
        {errors.phraseText && <p className="text-sm text-red-500">{errors.phraseText}</p>}
        <p className="text-xs text-gray-500">
          Auto-generated from above. Use exactly 5 underscores: _____
        </p>
      </div>

      {/* Tamil Meaning */}
      <div className="space-y-2">
        <Label htmlFor="meaningTa">Tamil Meaning (பொருள்)</Label>
        <Textarea
          id="meaningTa"
          value={meaningTa}
          onChange={(e) => setMeaningTa(e.target.value)}
          placeholder="e.g., தாமரை போன்ற அழகிய கண்கள்"
          className="font-tamil"
          rows={2}
        />
        <p className="text-xs text-gray-500">
          Explanation of the epithet in Tamil
        </p>
      </div>

      {/* English Meaning */}
      <div className="space-y-2">
        <Label htmlFor="meaningEn">English Meaning</Label>
        <Textarea
          id="meaningEn"
          value={meaningEn}
          onChange={(e) => setMeaningEn(e.target.value)}
          placeholder="e.g., Beautiful eyes like lotus"
          rows={2}
        />
        <p className="text-xs text-gray-500">
          English translation for bilingual support
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitText}
        </Button>
      </div>
    </form>
  );
}

export default AdaimozhiForm;
