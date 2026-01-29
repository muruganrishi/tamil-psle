'use client';

/**
 * Teacher Sorporul Question Creation Page
 * Feature: 005-sorporul
 *
 * Form for creating new word meaning questions.
 * Includes AI distractor generation integration.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Wand2, Save, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { OptionLabel } from '@/types/sorporul';

export default function NewSorporulQuestionPage() {
  const router = useRouter();

  // Form state
  const [targetWord, setTargetWord] = useState('');
  const [correctDefinition, setCorrectDefinition] = useState('');
  const [distractors, setDistractors] = useState(['', '', '']);
  const [correctPosition, setCorrectPosition] = useState<OptionLabel>('A');

  // UI state
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update distractor at index
  const updateDistractor = useCallback((index: number, value: string) => {
    setDistractors((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  // Generate distractors using AI
  const handleGenerateDistractors = useCallback(async () => {
    if (!targetWord.trim() || !correctDefinition.trim()) {
      setError('Please enter the target word and correct definition first');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/practice/sorporul/generate-distractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: targetWord.trim(),
          correctDefinition: correctDefinition.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        }
        throw new Error(data.error || 'Failed to generate distractors');
      }

      setDistractors(data.distractors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate distractors');
    } finally {
      setGenerating(false);
    }
  }, [targetWord, correctDefinition]);

  // Validate form
  const isFormValid = useCallback(() => {
    if (!targetWord.trim()) return false;
    if (!correctDefinition.trim()) return false;
    if (distractors.some((d) => !d.trim())) return false;
    return true;
  }, [targetWord, correctDefinition, distractors]);

  // Save question
  const handleSave = useCallback(
    async (status: 'draft' | 'published') => {
      if (!isFormValid()) {
        setError('Please fill in all fields');
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch('/api/practice/sorporul/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetWord: targetWord.trim(),
            correctDefinition: correctDefinition.trim(),
            distractors: distractors.map((d) => d.trim()) as [string, string, string],
            correctPosition,
            status,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to save question');
        }

        setSuccess(`Question ${status === 'published' ? 'published' : 'saved as draft'}!`);

        // Clear form or redirect
        setTimeout(() => {
          router.push('/teacher/practice/sorporul');
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save question');
      } finally {
        setSaving(false);
      }
    },
    [targetWord, correctDefinition, distractors, correctPosition, isFormValid, router]
  );

  // Preview options as they would appear
  const previewOptions = useCallback(() => {
    const positions: OptionLabel[] = ['A', 'B', 'C', 'D'];
    const correctIndex = positions.indexOf(correctPosition);
    const options: { label: OptionLabel; text: string; isCorrect: boolean }[] = [];

    let distractorIndex = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctIndex) {
        options.push({
          label: positions[i],
          text: correctDefinition || '(correct definition)',
          isCorrect: true,
        });
      } else {
        options.push({
          label: positions[i],
          text: distractors[distractorIndex] || `(distractor ${distractorIndex + 1})`,
          isCorrect: false,
        });
        distractorIndex++;
      }
    }

    return options;
  }, [correctDefinition, distractors, correctPosition]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/teacher/practice/sorporul')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create Word Meaning Question</h1>
        <p className="font-tamil text-orange-600">புதிய சொற்பொருள் வினா</p>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>
            Enter the Tamil word and its correct definition. You can manually enter distractors
            or use AI to generate them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Word */}
          <div className="space-y-2">
            <Label htmlFor="targetWord">Target Word (Tamil)</Label>
            <Input
              id="targetWord"
              value={targetWord}
              onChange={(e) => setTargetWord(e.target.value)}
              placeholder="e.g., அழகு"
              className="font-tamil text-lg"
              disabled={saving}
            />
          </div>

          {/* Correct Definition */}
          <div className="space-y-2">
            <Label htmlFor="correctDefinition">Correct Definition (Tamil)</Label>
            <Textarea
              id="correctDefinition"
              value={correctDefinition}
              onChange={(e) => setCorrectDefinition(e.target.value)}
              placeholder="The correct Tamil definition for this word"
              className="font-tamil"
              rows={2}
              disabled={saving}
            />
          </div>

          {/* AI Generate Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleGenerateDistractors}
              disabled={generating || saving || !targetWord.trim() || !correctDefinition.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Distractors with AI
                </>
              )}
            </Button>
          </div>

          {/* Distractors */}
          <div className="space-y-4">
            <Label>Distractor Definitions (Tamil)</Label>
            <p className="text-sm text-gray-500">
              Three plausible but incorrect definitions
            </p>
            {distractors.map((distractor, index) => (
              <div key={index} className="space-y-1">
                <Label htmlFor={`distractor-${index}`} className="text-sm text-gray-500">
                  Distractor {index + 1}
                </Label>
                <Textarea
                  id={`distractor-${index}`}
                  value={distractor}
                  onChange={(e) => updateDistractor(index, e.target.value)}
                  placeholder={`Incorrect definition ${index + 1}`}
                  className="font-tamil"
                  rows={2}
                  disabled={saving}
                />
              </div>
            ))}
          </div>

          {/* Correct Answer Position */}
          <div className="space-y-2">
            <Label htmlFor="correctPosition">Correct Answer Position</Label>
            <div className="flex gap-2">
              {(['A', 'B', 'C', 'D'] as OptionLabel[]).map((pos) => (
                <Button
                  key={pos}
                  variant={correctPosition === pos ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCorrectPosition(pos)}
                  disabled={saving}
                  className={correctPosition === pos ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  {pos}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Position where the correct answer will appear
            </p>
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h3 className="mb-3 font-medium text-gray-900">Preview</h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="mb-3 text-sm text-gray-600">
                Select the correct meaning for:{' '}
                <span className="font-tamil text-lg font-semibold text-orange-600">
                  {targetWord || '(word)'}
                </span>
              </p>
              <div className="space-y-2">
                {previewOptions().map((opt) => (
                  <div
                    key={opt.label}
                    className={`rounded p-2 text-sm ${
                      opt.isCorrect
                        ? 'bg-green-100 border border-green-300'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <span className="font-medium">{opt.label}:</span>{' '}
                    <span className="font-tamil">{opt.text}</span>
                    {opt.isCorrect && (
                      <span className="ml-2 text-xs text-green-600">(correct)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={saving || !isFormValid()}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={saving || !isFormValid()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
