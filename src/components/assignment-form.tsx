'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SECTIONS } from '@/components/section-picker';
import type { QuestionSection } from '@/types/database';

interface AssignmentFormProps {
  classId: string;
  onSuccess?: (assignmentId: string) => void;
}

export function AssignmentForm({ classId, onSuccess }: AssignmentFormProps) {
  const [title, setTitle] = useState('');
  const [selectedSections, setSelectedSections] = useState<QuestionSection[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSectionToggle = (sectionId: QuestionSection) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedSections.length === 0) {
      setError('Please select at least one section');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: classId,
          title,
          sections: selectedSections,
          question_count: questionCount,
          max_attempts: maxAttempts,
          due_date: dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create assignment');
      }

      if (onSuccess) {
        onSuccess(data.assignment.id);
      } else {
        router.push(`/teacher/classes/${classId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Assignment</CardTitle>
        <CardDescription>
          Assign practice to your students
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Week 3 Practice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Sections */}
          <div className="space-y-2">
            <Label>Sections</Label>
            <div className="grid grid-cols-2 gap-2">
              {SECTIONS.map((section) => (
                <label
                  key={section.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={() => handleSectionToggle(section.id)}
                  />
                  <div>
                    <div className="text-sm font-medium">{section.name}</div>
                    <div className="font-tamil text-xs text-gray-500">{section.tamil}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div className="space-y-2">
            <Label htmlFor="questionCount">Questions per Section</Label>
            <Input
              id="questionCount"
              type="number"
              min={1}
              max={20}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
          </div>

          {/* Max attempts */}
          <div className="space-y-2">
            <Label htmlFor="maxAttempts">Maximum Attempts</Label>
            <Input
              id="maxAttempts"
              type="number"
              min={1}
              max={3}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
            />
            <p className="text-xs text-gray-500">
              How many times a student can attempt this assignment (1-3)
            </p>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Assignment'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
