'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResultsSummaryProps {
  score: number;
  total: number;
  sectionName: string;
  sectionTamil: string;
  attemptId?: string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function ResultsSummary({
  score,
  total,
  sectionName,
  sectionTamil,
  attemptId,
  onRetry,
  showDetails = true,
}: ResultsSummaryProps) {
  const percentage = Math.round((score / total) * 100);
  const grade = getGrade(percentage);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Practice Complete!</CardTitle>
        <CardDescription>
          {sectionName} <span className="font-tamil">({sectionTamil})</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Circle */}
        <div className="flex justify-center">
          <div
            className={cn(
              'flex h-32 w-32 flex-col items-center justify-center rounded-full',
              grade.bgColor
            )}
          >
            <span className={cn('text-4xl font-bold', grade.textColor)}>{score}</span>
            <span className="text-sm text-gray-500">out of {total}</span>
          </div>
        </div>

        {/* Percentage and Grade */}
        <div className="text-center">
          <p className="text-3xl font-semibold">{percentage}%</p>
          <p className={cn('text-lg font-medium', grade.textColor)}>{grade.label}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Correct: {score}</span>
            <span>Wrong: {total - score}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn('h-full transition-all', grade.barColor)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {showDetails && attemptId && (
            <Link href={`/results/${attemptId}`}>
              <Button variant="outline" className="w-full">
                View Detailed Results
              </Button>
            </Link>
          )}
          {onRetry && (
            <Button onClick={onRetry} className="w-full bg-orange-600 hover:bg-orange-700">
              Try Again
            </Button>
          )}
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function getGrade(percentage: number) {
  if (percentage >= 90) {
    return {
      label: 'Excellent!',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      barColor: 'bg-green-500',
    };
  }
  if (percentage >= 75) {
    return {
      label: 'Great Job!',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      barColor: 'bg-blue-500',
    };
  }
  if (percentage >= 60) {
    return {
      label: 'Good Effort',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      barColor: 'bg-yellow-500',
    };
  }
  if (percentage >= 40) {
    return {
      label: 'Keep Practicing',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      barColor: 'bg-orange-500',
    };
  }
  return {
    label: 'Needs Improvement',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    barColor: 'bg-red-500',
  };
}

interface AttemptHistoryProps {
  attempts: {
    id: string;
    score: number;
    total: number;
    completedAt: string;
  }[];
}

export function AttemptHistory({ attempts }: AttemptHistoryProps) {
  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No practice attempts yet. Start practicing to see your history!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Attempts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attempts.map((attempt, index) => {
            const percentage = Math.round((attempt.score / attempt.total) * 100);
            const grade = getGrade(percentage);

            return (
              <Link
                key={attempt.id}
                href={`/results/${attempt.id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">Attempt #{attempts.length - index}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(attempt.completedAt).toLocaleDateString('en-SG', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('font-semibold', grade.textColor)}>
                    {attempt.score}/{attempt.total}
                  </p>
                  <p className="text-sm text-gray-500">{percentage}%</p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
