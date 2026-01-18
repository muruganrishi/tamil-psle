'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SECTIONS } from '@/components/section-picker';
import type { QuestionSection } from '@/types/database';

interface QuestionFormData {
  section: QuestionSection;
  question_text: string;
  options: { label: 'A' | 'B' | 'C' | 'D'; text: string; is_correct: boolean }[];
  passage_id?: string | null;
  status: 'draft' | 'published';
}

interface QuestionFormProps {
  initialData?: Partial<QuestionFormData>;
  passages?: { id: string; title: string }[];
  onSubmit?: (data: QuestionFormData) => Promise<void>;
  onSuccess?: (questionId: string) => void;
  isEditing?: boolean;
}

const DEFAULT_OPTIONS: QuestionFormData['options'] = [
  { label: 'A', text: '', is_correct: true },
  { label: 'B', text: '', is_correct: false },
  { label: 'C', text: '', is_correct: false },
  { label: 'D', text: '', is_correct: false },
];

export function QuestionForm({
  initialData,
  passages = [],
  onSubmit,
  onSuccess,
  isEditing = false,
}: QuestionFormProps) {
  const router = useRouter();
  const [section, setSection] = useState<QuestionSection>(initialData?.section || 'vetrumai');
  const [questionText, setQuestionText] = useState(initialData?.question_text || '');
  const [options, setOptions] = useState(initialData?.options || DEFAULT_OPTIONS);
  const [passageId, setPassageId] = useState<string | null>(initialData?.passage_id || null);
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOptionTextChange = (index: number, text: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, text } : opt))
    );
  };

  const handleCorrectOptionChange = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, is_correct: i === index }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }

    const filledOptions = options.filter((opt) => opt.text.trim());
    if (filledOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    const hasCorrect = options.some((opt) => opt.is_correct && opt.text.trim());
    if (!hasCorrect) {
      setError('Please mark one option as correct');
      return;
    }

    setLoading(true);

    try {
      const data: QuestionFormData = {
        section,
        question_text: questionText,
        options: options.filter((opt) => opt.text.trim()),
        passage_id: section === 'comprehension' ? passageId : null,
        status,
      };

      if (onSubmit) {
        await onSubmit(data);
      } else {
        const response = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to save question');
        }

        if (onSuccess) {
          onSuccess(result.question.id);
        } else {
          router.push('/admin/questions');
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Question' : 'Create Question'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update the question details' : 'Add a new question to the question bank'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Section */}
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={section} onValueChange={(v) => setSection(v as QuestionSection)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.tamil})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Passage (for comprehension) */}
          {section === 'comprehension' && (
            <div className="space-y-2">
              <Label>Passage (Optional)</Label>
              <Select
                value={passageId || 'none'}
                onValueChange={(v) => setPassageId(v === 'none' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a passage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No passage</SelectItem>
                  {passages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Question text */}
          <div className="space-y-2">
            <Label htmlFor="questionText">Question Text</Label>
            <Textarea
              id="questionText"
              placeholder="Enter the question in Tamil..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              className="font-tamil"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={option.label} className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    option.is_correct
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {option.label}
                </div>
                <Input
                  placeholder={`Option ${option.label}`}
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(index, e.target.value)}
                  className="font-tamil flex-1"
                />
                <Button
                  type="button"
                  variant={option.is_correct ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCorrectOptionChange(index)}
                  className={option.is_correct ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  {option.is_correct ? 'Correct' : 'Mark Correct'}
                </Button>
              </div>
            ))}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'published')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Only published questions appear in practice sessions
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : isEditing ? 'Update Question' : 'Create Question'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
