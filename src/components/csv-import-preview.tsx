'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SECTIONS } from '@/components/section-picker';
import type { QuestionSection } from '@/types/database';

export interface ParsedQuestion {
  row: number;
  section: QuestionSection;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  valid: boolean;
  errors: string[];
}

interface CSVImportPreviewProps {
  onImport: (questions: ParsedQuestion[]) => Promise<void>;
}

const EXPECTED_HEADERS = [
  'section',
  'question_text',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_option',
];

const VALID_SECTIONS = SECTIONS.map((s) => s.id);

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });

  return { headers, rows };
}

function validateQuestion(row: string[], rowIndex: number): ParsedQuestion {
  const errors: string[] = [];

  const section = row[0]?.toLowerCase() as QuestionSection;
  const questionText = row[1] || '';
  const optionA = row[2] || '';
  const optionB = row[3] || '';
  const optionC = row[4] || '';
  const optionD = row[5] || '';
  const correctOption = (row[6]?.toUpperCase() || '') as 'A' | 'B' | 'C' | 'D';

  if (!VALID_SECTIONS.includes(section)) {
    errors.push(`Invalid section: ${section}`);
  }

  if (!questionText) {
    errors.push('Question text is required');
  }

  if (!optionA || !optionB) {
    errors.push('At least options A and B are required');
  }

  if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
    errors.push('Correct option must be A, B, C, or D');
  }

  return {
    row: rowIndex + 2, // +2 for 1-based index and header row
    section,
    question_text: questionText,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
    correct_option: correctOption,
    valid: errors.length === 0,
    errors,
  };
}

export function CSVImportPreview({ onImport }: CSVImportPreviewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setHeaderError(null);
    setError(null);

    try {
      const content = await selectedFile.text();
      const { headers, rows } = parseCSV(content);

      // Validate headers
      const missingHeaders = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setHeaderError(`Missing columns: ${missingHeaders.join(', ')}`);
        setQuestions([]);
        return;
      }

      // Parse and validate each row
      const parsed = rows.map((row, index) => validateQuestion(row, index));
      setQuestions(parsed);
    } catch {
      setError('Failed to parse CSV file');
    }
  };

  const handleImport = async () => {
    const validQuestions = questions.filter((q) => q.valid);
    if (validQuestions.length === 0) {
      setError('No valid questions to import');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      await onImport(validQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const validCount = questions.filter((q) => q.valid).length;
  const invalidCount = questions.filter((q) => !q.valid).length;

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file with questions. Required columns: section, question_text, option_a, option_b, option_c, option_d, correct_option
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 hover:border-orange-400 hover:bg-orange-50">
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-600">
              {file ? file.name : 'Click to select CSV file'}
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {headerError && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {headerError}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview ({questions.length} questions)</CardTitle>
                <CardDescription>
                  <span className="text-green-600">{validCount} valid</span>
                  {invalidCount > 0 && (
                    <span className="text-red-600"> • {invalidCount} with errors</span>
                  )}
                </CardDescription>
              </div>
              <Button onClick={handleImport} disabled={importing || validCount === 0}>
                {importing ? 'Importing...' : `Import ${validCount} Questions`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Correct</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q, i) => (
                    <TableRow key={i} className={!q.valid ? 'bg-red-50' : ''}>
                      <TableCell>{q.row}</TableCell>
                      <TableCell>
                        {q.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{q.section}</TableCell>
                      <TableCell className="max-w-xs truncate font-tamil text-sm">
                        {q.question_text}
                      </TableCell>
                      <TableCell>{q.correct_option}</TableCell>
                      <TableCell className="text-xs text-red-600">
                        {q.errors.join(', ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template download */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV Template</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
{`section,question_text,option_a,option_b,option_c,option_d,correct_option
vetrumai,இந்த வாக்கியத்தில் வேற்றுமை உருபு எது?,ஐ,இல்,கு,உம்,A
sorporul,சொல்லின் பொருள் என்ன?,மகிழ்ச்சி,துக்கம்,கோபம்,பயம்,A`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
