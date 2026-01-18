'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Upload, Loader2, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SECTIONS } from '@/components/section-picker';
import type { QuestionSection } from '@/types/database';

interface Question {
  id: string;
  section: QuestionSection;
  question_text: string;
  status: 'draft' | 'published';
  created_at: string;
  question_options: { option_label: string; is_correct: boolean }[];
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sectionFilter !== 'all') params.set('section', sectionFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/admin/questions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setTotal(data.total);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [sectionFilter, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setTotal((prev) => prev - 1);
      }
    } catch {
      // Handle error
    } finally {
      setDeleting(null);
    }
  };

  const getSectionName = (sectionId: QuestionSection) => {
    return SECTIONS.find((s) => s.id === sectionId)?.name || sectionId;
  };

  const getCorrectOption = (options: Question['question_options']) => {
    return options.find((o) => o.is_correct)?.option_label || '-';
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600">{total} questions</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/questions/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </Link>
          <Link href="/admin/questions/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Section:</span>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {SECTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600">No questions found</p>
              <Link href="/admin/questions/new">
                <Button className="mt-4">Create First Question</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead className="max-w-md">Question</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="text-xs">{getSectionName(q.section)}</TableCell>
                    <TableCell className="max-w-md truncate font-tamil text-sm">
                      {q.question_text}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getCorrectOption(q.question_options)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          q.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {q.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(q.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/admin/questions/${q.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(q.id)}
                          disabled={deleting === q.id}
                        >
                          {deleting === q.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
