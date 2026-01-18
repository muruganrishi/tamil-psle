'use client';

import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSectionById } from '@/components/section-picker';
import type { QuestionSection } from '@/types/database';

interface AssignmentCardProps {
  assignment: {
    id: string;
    title: string;
    sections: QuestionSection[];
    question_count: number;
    max_attempts: number;
    due_date: string | null;
    created_at: string;
    attempts_used?: number;
    best_score?: number | null;
  };
  showStartButton?: boolean;
}

export function AssignmentCard({ assignment, showStartButton = true }: AssignmentCardProps) {
  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
  const attemptsRemaining = assignment.max_attempts - (assignment.attempts_used || 0);
  const canAttempt = attemptsRemaining > 0 && !isOverdue;

  const sectionNames = assignment.sections
    .map((s) => getSectionById(s)?.name || s)
    .join(', ');

  return (
    <Card className={isOverdue && attemptsRemaining > 0 ? 'border-red-200 bg-red-50/50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <CardDescription className="mt-1">
              {sectionNames}
            </CardDescription>
          </div>
          {assignment.best_score !== undefined && assignment.best_score !== null && (
            <div className="text-right">
              <span className="text-2xl font-bold text-orange-600">
                {Math.round((assignment.best_score / assignment.question_count) * 100)}%
              </span>
              <div className="text-xs text-gray-500">
                {assignment.best_score}/{assignment.question_count}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            {canAttempt ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
          </div>
          {assignment.due_date && (
            <div className="flex items-center gap-1">
              <Clock className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
              {isOverdue ? 'Overdue' : `Due ${new Date(assignment.due_date).toLocaleDateString()}`}
            </div>
          )}
        </div>

        {showStartButton && canAttempt && (
          <div className="mt-4">
            <Link href={`/practice/${assignment.sections[0]}?assignment=${assignment.id}`}>
              <Button className="w-full">
                {assignment.attempts_used && assignment.attempts_used > 0 ? 'Retry' : 'Start'}
              </Button>
            </Link>
          </div>
        )}

        {!canAttempt && (
          <div className="mt-4 rounded-md bg-gray-100 p-2 text-center text-sm text-gray-600">
            {isOverdue ? 'This assignment is overdue' : 'No attempts remaining'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
