/**
 * API Route: Sorporul CSV Import
 * Feature: 005-sorporul
 *
 * POST - Preview and import sorporul questions from CSV
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, createUserRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import {
  SorporulCSVRowSchema,
  CSV_REQUIRED_COLUMNS,
  CSV_MAX_ROWS,
  type CSVPreviewRow,
  type CSVValidationError,
} from '@/lib/validators/sorporul';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

// In-memory store for upload previews (in production, use Redis or database)
const uploadPreviews = new Map<
  string,
  { rows: CSVPreviewRow[]; userId: string; expiresAt: number }
>();

// Cleanup expired previews periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of uploadPreviews.entries()) {
      if (now >= value.expiresAt) {
        uploadPreviews.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

/**
 * Parse CSV text into rows
 */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line) => {
    // Simple CSV parsing (handles basic cases)
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
}

/**
 * POST /api/practice/sorporul/import-csv
 *
 * Handles both preview and confirm actions.
 * - action=preview: Parse CSV and return preview with validation
 * - action=confirm: Import validated rows from previous preview
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitKey = createUserRateLimitKey(user.id, 'sorporul-csv-import');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString() },
        }
      );
    }

    // Check teacher/admin role
    const { data: profile } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: Pick<Profile, 'role'> | null };

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (CSV file upload for preview)
    if (contentType.includes('multipart/form-data')) {
      return handlePreview(request, user.id);
    }

    // Handle JSON (confirm import)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body.action === 'confirm' && body.uploadId) {
        return handleConfirm(body.uploadId, body.skipErrors, user.id, supabase);
      }
    }

    return NextResponse.json(
      { error: 'Invalid request format', code: 'INVALID_REQUEST' },
      { status: 400 }
    );
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Handle CSV preview - parse and validate
 */
async function handlePreview(request: Request, userId: string) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 1MB)', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have header row and at least one data row', code: 'EMPTY_FILE' },
        { status: 400 }
      );
    }

    // Validate header
    const header = rows[0].map((h) => h.toLowerCase().trim());
    const missingColumns = CSV_REQUIRED_COLUMNS.filter(
      (col) => !header.includes(col)
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required columns: ${missingColumns.join(', ')}`,
          code: 'MISSING_COLUMNS',
        },
        { status: 400 }
      );
    }

    // Get column indices
    const colIndices = {
      target_word: header.indexOf('target_word'),
      option_a: header.indexOf('option_a'),
      option_b: header.indexOf('option_b'),
      option_c: header.indexOf('option_c'),
      option_d: header.indexOf('option_d'),
      correct_answer: header.indexOf('correct_answer'),
    };

    // Parse and validate data rows
    const dataRows = rows.slice(1, CSV_MAX_ROWS + 1);
    const previewRows: CSVPreviewRow[] = [];
    const validationErrors: CSVValidationError[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // 1-indexed, after header

      const rowData = {
        target_word: row[colIndices.target_word] || '',
        option_a: row[colIndices.option_a] || '',
        option_b: row[colIndices.option_b] || '',
        option_c: row[colIndices.option_c] || '',
        option_d: row[colIndices.option_d] || '',
        correct_answer: row[colIndices.correct_answer]?.toUpperCase() || '',
      };

      const parseResult = SorporulCSVRowSchema.safeParse(rowData);

      if (parseResult.success) {
        previewRows.push({
          row: rowNum,
          targetWord: parseResult.data.target_word,
          options: {
            A: parseResult.data.option_a,
            B: parseResult.data.option_b,
            C: parseResult.data.option_c,
            D: parseResult.data.option_d,
          },
          correctAnswer: parseResult.data.correct_answer,
          valid: true,
        });
      } else {
        const errors = parseResult.error.errors.map((e) => e.message);
        previewRows.push({
          row: rowNum,
          targetWord: rowData.target_word || '(empty)',
          options: {
            A: rowData.option_a,
            B: rowData.option_b,
            C: rowData.option_c,
            D: rowData.option_d,
          },
          correctAnswer: rowData.correct_answer as 'A' | 'B' | 'C' | 'D',
          valid: false,
          errors,
        });

        parseResult.error.errors.forEach((e) => {
          validationErrors.push({
            row: rowNum,
            column: e.path[0]?.toString(),
            error: e.message,
          });
        });
      }
    }

    // Generate upload ID and store preview
    const uploadId = crypto.randomUUID();
    uploadPreviews.set(uploadId, {
      rows: previewRows.filter((r) => r.valid),
      userId,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    const validCount = previewRows.filter((r) => r.valid).length;
    const errorCount = previewRows.filter((r) => !r.valid).length;

    return NextResponse.json({
      rows: previewRows,
      totalRows: previewRows.length,
      validRows: validCount,
      errorRows: errorCount,
      errors: validationErrors.slice(0, 20), // Limit errors
      uploadId,
    });
  } catch (error) {
    console.error('CSV preview error:', error);
    return NextResponse.json(
      { error: 'Failed to parse CSV file', code: 'PARSE_ERROR' },
      { status: 400 }
    );
  }
}

/**
 * Handle import confirmation
 */
async function handleConfirm(
  uploadId: string,
  skipErrors: boolean = true,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const preview = uploadPreviews.get(uploadId);

  if (!preview) {
    return NextResponse.json(
      { error: 'Upload session expired. Please re-upload the file.', code: 'SESSION_EXPIRED' },
      { status: 400 }
    );
  }

  if (preview.userId !== userId) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 403 }
    );
  }

  // Clean up preview
  uploadPreviews.delete(uploadId);

  const rowsToImport = preview.rows;
  let imported = 0;
  let skipped = 0;

  for (const row of rowsToImport) {
    try {
      // Create question
      const { data: question, error: questionError } = (await supabase
        .from('questions')
        .insert({
          section: 'sorporul',
          question_text: row.targetWord,
          status: 'draft',
          created_by: userId,
        } as never)
        .select()
        .single()) as { data: Question | null; error: unknown };

      if (questionError || !question) {
        skipped++;
        continue;
      }

      // Create options
      const optionsData = (['A', 'B', 'C', 'D'] as const).map((label) => ({
        question_id: question.id,
        option_label: label,
        option_text: row.options[label],
        is_correct: label === row.correctAnswer,
      }));

      const { error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsData as never);

      if (optionsError) {
        // Clean up question
        await supabase.from('questions').delete().eq('id', question.id);
        skipped++;
        continue;
      }

      imported++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({
    imported,
    skipped,
    status: 'draft' as const,
  });
}
