'use client';

/**
 * Teacher Sorporul Questions Management Page
 * Feature: 005-sorporul
 *
 * Lists all sorporul questions created by the teacher.
 * Allows publishing/unpublishing and creating new questions.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Loader2, FileText, Check, X, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TeacherQuestion } from '@/types/sorporul';

export default function TeacherSorporulQuestionsPage() {
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/practice/sorporul/questions?status=${statusFilter}&limit=50`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions');
      }

      setQuestions(data.questions);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Toggle question status
  const handleToggleStatus = useCallback(
    async (question: TeacherQuestion) => {
      const newStatus = question.status === 'published' ? 'draft' : 'published';
      setUpdatingId(question.id);

      try {
        const response = await fetch(`/api/practice/sorporul/questions/${question.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update status');
        }

        // Update local state
        setQuestions((prev) =>
          prev.map((q) => (q.id === question.id ? { ...q, status: newStatus } : q))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update status');
      } finally {
        setUpdatingId(null);
      }
    },
    []
  );

  // Get correct answer text
  const getCorrectAnswerText = (question: TeacherQuestion) => {
    const correctOption = question.options.find((o) => o.label === question.correctAnswer);
    return correctOption?.text || '';
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Word Meanings Questions</h1>
          <p className="font-tamil text-orange-600">சொற்பொருள் வினாக்கள்</p>
          <p className="text-sm text-gray-500 mt-1">{total} questions</p>
        </div>
        <div className="flex gap-2">
          <Link href="/teacher/practice/sorporul/import">
            <Button variant="outline">Import CSV</Button>
          </Link>
          <Link href="/teacher/practice/sorporul/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Question
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">No questions yet</h2>
            <p className="mt-2 text-gray-600">
              Create your first word meaning question or import from CSV.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href="/teacher/practice/sorporul/import">
                <Button variant="outline">Import CSV</Button>
              </Link>
              <Link href="/teacher/practice/sorporul/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Question
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <Card
              key={question.id}
              className={updatingId === question.id ? 'opacity-50' : ''}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-tamil text-xl text-orange-600">
                    {question.targetWord}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        question.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {question.status === 'published' ? (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </span>
                    {/* Toggle button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(question)}
                      disabled={updatingId === question.id}
                    >
                      {updatingId === question.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : question.status === 'published' ? (
                        <>
                          <X className="mr-1 h-4 w-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          Publish
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Correct answer */}
                <div className="mb-3">
                  <span className="text-xs font-medium uppercase text-gray-400">
                    Correct Answer ({question.correctAnswer})
                  </span>
                  <p className="font-tamil text-sm text-green-700">
                    {getCorrectAnswerText(question)}
                  </p>
                </div>

                {/* All options */}
                <div className="grid grid-cols-2 gap-2">
                  {question.options.map((option) => (
                    <div
                      key={option.label}
                      className={`rounded p-2 text-sm ${
                        option.label === question.correctAnswer
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <span className="font-medium text-gray-500">{option.label}:</span>{' '}
                      <span className="font-tamil">{option.text}</span>
                    </div>
                  ))}
                </div>

                {/* Metadata */}
                <div className="mt-3 text-xs text-gray-400">
                  Created on {new Date(question.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
