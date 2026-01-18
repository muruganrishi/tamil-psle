'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { QuestionSection } from '@/types/database';

interface Assignment {
  id: string;
  title: string;
  sections: QuestionSection[];
  question_count: number;
  created_at: string;
}

interface StudentResult {
  student_id: string;
  student_name: string;
  attempts_count: number;
  best_score: number | null;
  last_attempt_at: string | null;
  completed: boolean;
}

interface ResultsSummary {
  total_students: number;
  completed: number;
  average_score: number;
}

export default function ClassResultsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assignments
  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch(`/api/assignments?class_id=${classId}`);
        if (!response.ok) throw new Error('Failed to fetch assignments');
        const data = await response.json();
        setAssignments(data.assignments);
        if (data.assignments.length > 0) {
          setSelectedAssignment(data.assignments[0].id);
        }
      } catch {
        setError('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, [classId]);

  // Fetch results when assignment changes
  useEffect(() => {
    if (!selectedAssignment) return;

    async function fetchResults() {
      setLoadingResults(true);
      try {
        const response = await fetch(`/api/assignments/${selectedAssignment}/results`);
        if (!response.ok) throw new Error('Failed to fetch results');
        const data = await response.json();
        setResults(data.results);
        setSummary(data.summary);
      } catch {
        setError('Failed to load results');
      } finally {
        setLoadingResults(false);
      }
    }

    fetchResults();
  }, [selectedAssignment]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
            <p className="mt-4 text-gray-600">Loading results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <Button className="mt-4" onClick={() => router.push(`/teacher/classes/${classId}`)}>
              Back to Class
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/teacher/classes/${classId}`}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Class
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Class Results</h1>
        <p className="text-gray-600">View student performance on assignments</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No assignments created yet.</p>
            <Link href={`/teacher/classes/${classId}/assignments/new`}>
              <Button className="mt-4">Create First Assignment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Assignment selector */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedAssignment || ''}
                onValueChange={setSelectedAssignment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an assignment" />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title} ({new Date(a.created_at).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Summary */}
          {summary && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="py-4 text-center">
                  <Users className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-2 text-2xl font-bold">{summary.total_students}</p>
                  <p className="text-xs text-gray-500">Total Students</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-green-500" />
                  <p className="mt-2 text-2xl font-bold">{summary.completed}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <div className="mx-auto h-6 w-6 rounded-full bg-orange-100 text-center text-sm font-bold leading-6 text-orange-600">
                    %
                  </div>
                  <p className="mt-2 text-2xl font-bold">
                    {summary.total_students > 0
                      ? Math.round((summary.average_score / (assignments.find((a) => a.id === selectedAssignment)?.question_count || 1)) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Avg Score</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
              <CardDescription>
                Best scores out of {assignments.find((a) => a.id === selectedAssignment)?.question_count || 0} questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingResults ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-gray-600">
                  No students in this class yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Attempts</TableHead>
                      <TableHead className="text-center">Best Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.student_id}>
                        <TableCell className="font-medium">{result.student_name}</TableCell>
                        <TableCell className="text-center">
                          {result.completed ? (
                            <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="mx-auto h-5 w-5 text-gray-300" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">{result.attempts_count}</TableCell>
                        <TableCell className="text-center">
                          {result.best_score !== null ? (
                            <span className="font-medium">
                              {result.best_score}/{assignments.find((a) => a.id === selectedAssignment)?.question_count || 0}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
