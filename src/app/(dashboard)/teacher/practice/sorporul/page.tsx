'use client';

/**
 * Teacher Sorporul Content Management Page
 * Manage word meaning questions: create, edit, import, AI-assist
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  isCorrect: boolean;
}

interface QuestionItem {
  id: string;
  questionText: string;
  status: 'draft' | 'published';
  metadata: {
    targetWord?: string;
    wordClass?: string;
    difficulty?: number;
    tags?: string[];
  };
  options: QuestionOption[];
  createdAt: string;
}

interface DistractorItem {
  text: string;
  rationale?: string;
}

const WORD_CLASSES = [
  { value: 'noun', label: 'Noun' },
  { value: 'verb', label: 'Verb' },
  { value: 'adjective', label: 'Adjective' },
  { value: 'adverb', label: 'Adverb' },
  { value: 'pronoun', label: 'Pronoun' },
  { value: 'other', label: 'Other' },
];

const DEFAULT_FORM = {
  targetWord: '',
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
  wordClass: '',
  difficulty: 3,
  status: 'draft' as 'draft' | 'published',
};

export default function TeacherSorporulPage() {
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');

  // Form state
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // AI generation state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDistractors, setAiDistractors] = useState<DistractorItem[]>([]);

  // CSV import state
  const [csvData, setCsvData] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/teacher/practice/sorporul?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions');
      }

      setQuestions(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handle form change
  const handleFormChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
    setFormSuccess(null);
  };

  // Reset form
  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setAiDistractors([]);
    setFormError(null);
    setFormSuccess(null);
  };

  // Edit question
  const handleEdit = (question: QuestionItem) => {
    const correctOption = question.options.find((o) => o.isCorrect);

    setForm({
      targetWord: question.metadata.targetWord || '',
      questionText: question.questionText,
      optionA: question.options.find((o) => o.label === 'A')?.text || '',
      optionB: question.options.find((o) => o.label === 'B')?.text || '',
      optionC: question.options.find((o) => o.label === 'C')?.text || '',
      optionD: question.options.find((o) => o.label === 'D')?.text || '',
      correctAnswer: correctOption?.label || 'A',
      wordClass: question.metadata.wordClass || '',
      difficulty: question.metadata.difficulty || 3,
      status: question.status,
    });
    setEditingId(question.id);
    setActiveTab('create');
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const options: QuestionOption[] = [
        { label: 'A', text: form.optionA, isCorrect: form.correctAnswer === 'A' },
        { label: 'B', text: form.optionB, isCorrect: form.correctAnswer === 'B' },
        { label: 'C', text: form.optionC, isCorrect: form.correctAnswer === 'C' },
        { label: 'D', text: form.optionD, isCorrect: form.correctAnswer === 'D' },
      ];

      const payload = {
        ...(editingId ? { id: editingId } : {}),
        targetWord: form.targetWord,
        questionText: form.questionText,
        options,
        metadata: {
          wordClass: form.wordClass || undefined,
          difficulty: form.difficulty,
        },
        status: form.status,
      };

      const response = await fetch('/api/teacher/practice/sorporul', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save question');
      }

      setFormSuccess(editingId ? 'Question updated successfully!' : 'Question created successfully!');
      resetForm();
      fetchQuestions();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete question
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/teacher/practice/sorporul?id=${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete question');
      }

      setDeleteId(null);
      fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
      setDeleteId(null);
    }
  };

  // Generate AI distractors
  const handleGenerateDistractors = async () => {
    if (!form.targetWord || !form.optionA) {
      setFormError('Enter the target word and correct meaning first');
      return;
    }

    setAiGenerating(true);
    setFormError(null);

    try {
      const response = await fetch('/api/teacher/practice/sorporul/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: form.targetWord,
          correctMeaning: form.optionA,
          count: 3,
          wordClass: form.wordClass || undefined,
          meaningLanguage: 'ta', // Generate Tamil distractors
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate distractors');
      }

      setAiDistractors(data.distractors);

      // Auto-fill options B, C, D
      if (data.distractors.length >= 1) {
        handleFormChange('optionB', data.distractors[0].text);
      }
      if (data.distractors.length >= 2) {
        handleFormChange('optionC', data.distractors[1].text);
      }
      if (data.distractors.length >= 3) {
        handleFormChange('optionD', data.distractors[2].text);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to generate distractors');
    } finally {
      setAiGenerating(false);
    }
  };

  // CSV Import
  const handleCsvImport = async () => {
    if (!csvData.trim()) {
      setFormError('Paste CSV data first');
      return;
    }

    setCsvImporting(true);
    setCsvResult(null);
    setFormError(null);

    try {
      // Parse CSV data (simple parser)
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map((h) => h.trim());

      const questions = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || '';
        });
        return row;
      });

      const response = await fetch('/api/teacher/practice/sorporul/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questions.map((q) => ({
            targetWord: q.targetWord || q.target_word,
            questionText: q.questionText || q.question_text || `"${q.targetWord || q.target_word}" இச்சொல்லின் பொருள் என்ன?`,
            optionA: q.optionA || q.option_a,
            optionB: q.optionB || q.option_b,
            optionC: q.optionC || q.option_c,
            optionD: q.optionD || q.option_d,
            correctAnswer: (q.correctAnswer || q.correct_answer || 'A').toUpperCase(),
            wordClass: q.wordClass || q.word_class,
            difficulty: q.difficulty ? parseInt(q.difficulty) : undefined,
          })),
          publishImmediately: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setCsvResult({
        total: data.total,
        successful: data.successful,
        failed: data.failed,
      });

      if (data.successful > 0) {
        fetchQuestions();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setCsvImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sorporul Content Management</h1>
        <p className="font-tamil text-orange-600">சொற்பொருள் உள்ளடக்க மேலாண்மை</p>
        <p className="mt-1 text-sm text-gray-500">
          Create, edit, and manage word meaning questions for students.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="create">
            {editingId ? 'Edit Question' : 'Create Question'}
          </TabsTrigger>
          <TabsTrigger value="import">CSV Import</TabsTrigger>
        </TabsList>

        {/* Questions List Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    {questions.length} question{questions.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button onClick={() => { resetForm(); setActiveTab('create'); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'draft' | 'published')}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchQuestions}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              {/* Loading */}
              {loading && (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
                </div>
              )}

              {/* Empty */}
              {!loading && questions.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  No questions found. Create one to get started.
                </div>
              )}

              {/* List */}
              {!loading && questions.length > 0 && (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-start justify-between rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-tamil text-lg font-semibold text-orange-700">
                            {q.metadata.targetWord}
                          </span>
                          <span
                            className={cn(
                              'rounded px-2 py-0.5 text-xs',
                              q.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {q.status}
                          </span>
                        </div>
                        <p className="font-tamil mt-1 text-sm text-gray-600">{q.questionText}</p>
                        <div className="mt-2 flex gap-2 text-xs text-gray-400">
                          <span>4 options</span>
                          {q.metadata.difficulty && <span>Difficulty: {q.metadata.difficulty}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(q)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setDeleteId(q.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create/Edit Question Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Question' : 'Create New Question'}</CardTitle>
              <CardDescription>
                {editingId ? 'Update the question details below.' : 'Fill in the form to create a new word meaning question.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error/Success messages */}
                {formError && (
                  <div className="rounded bg-red-50 p-3 text-sm text-red-600">{formError}</div>
                )}
                {formSuccess && (
                  <div className="rounded bg-green-50 p-3 text-sm text-green-600">{formSuccess}</div>
                )}

                {/* Target Word */}
                <div className="space-y-2">
                  <Label htmlFor="targetWord">Target Word *</Label>
                  <Input
                    id="targetWord"
                    value={form.targetWord}
                    onChange={(e) => handleFormChange('targetWord', e.target.value)}
                    placeholder="Enter Tamil word (e.g., வணக்கம்)"
                    className="font-tamil"
                    required
                  />
                </div>

                {/* Question Text */}
                <div className="space-y-2">
                  <Label htmlFor="questionText">Question Text *</Label>
                  <Input
                    id="questionText"
                    value={form.questionText}
                    onChange={(e) => handleFormChange('questionText', e.target.value)}
                    placeholder='e.g., "வணக்கம்" இச்சொல்லின் பொருள் என்ன?'
                    className="font-tamil"
                    required
                  />
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Answer Options *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDistractors}
                      disabled={aiGenerating || !form.targetWord || !form.optionA}
                    >
                      {aiGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      AI Generate Distractors
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {(['A', 'B', 'C', 'D'] as const).map((label) => (
                      <div key={label} className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                            form.correctAnswer === label
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {label}
                        </span>
                        <Input
                          value={form[`option${label}` as keyof typeof form] as string}
                          onChange={(e) => handleFormChange(`option${label}`, e.target.value)}
                          placeholder={label === 'A' ? 'Correct meaning' : `Distractor ${label}`}
                          className="font-tamil flex-1"
                          required
                        />
                        <Button
                          type="button"
                          variant={form.correctAnswer === label ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleFormChange('correctAnswer', label)}
                          className={cn(
                            form.correctAnswer === label && 'bg-green-600 hover:bg-green-700'
                          )}
                        >
                          {form.correctAnswer === label ? <Check className="h-4 w-4" /> : 'Set Correct'}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* AI Distractors Info */}
                  {aiDistractors.length > 0 && (
                    <div className="rounded bg-blue-50 p-3 text-sm">
                      <p className="font-medium text-blue-700">AI-generated distractors applied!</p>
                      <ul className="mt-1 text-xs text-blue-600">
                        {aiDistractors.map((d, i) => (
                          <li key={i}>
                            Option {String.fromCharCode(66 + i)}: {d.rationale || 'No rationale'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="wordClass">Word Class</Label>
                    <Select
                      value={form.wordClass}
                      onValueChange={(v) => handleFormChange('wordClass', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {WORD_CLASSES.map((wc) => (
                          <SelectItem key={wc.value} value={wc.value}>
                            {wc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                    <Select
                      value={String(form.difficulty)}
                      onValueChange={(v) => handleFormChange('difficulty', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => handleFormChange('status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button type="submit" disabled={formSubmitting} className="bg-orange-600 hover:bg-orange-700">
                    {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? 'Update Question' : 'Create Question'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Import Tab */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>CSV Import</CardTitle>
              <CardDescription>
                Bulk import questions from CSV data. Use the format below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CSV Format Info */}
              <div className="rounded bg-gray-50 p-4 text-sm">
                <p className="font-medium">CSV Format:</p>
                <code className="mt-1 block overflow-x-auto whitespace-pre text-xs">
                  targetWord,optionA,optionB,optionC,optionD,correctAnswer,wordClass,difficulty
                </code>
                <p className="mt-2 text-gray-600">
                  <strong>Required columns:</strong> targetWord, optionA, optionB, optionC, optionD, correctAnswer
                </p>
                <p className="text-gray-600">
                  <strong>Optional columns:</strong> questionText, wordClass, difficulty
                </p>
              </div>

              {/* Error/Result */}
              {formError && (
                <div className="rounded bg-red-50 p-3 text-sm text-red-600">{formError}</div>
              )}
              {csvResult && (
                <div className={cn(
                  'rounded p-3 text-sm',
                  csvResult.failed > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                )}>
                  Import complete: {csvResult.successful} of {csvResult.total} questions imported.
                  {csvResult.failed > 0 && ` ${csvResult.failed} failed.`}
                </div>
              )}

              {/* CSV Input */}
              <div className="space-y-2">
                <Label>Paste CSV Data</Label>
                <Textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste your CSV data here..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {/* Import Button */}
              <Button onClick={handleCsvImport} disabled={csvImporting || !csvData.trim()}>
                {csvImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Import Questions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
