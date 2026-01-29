/**
 * POST /api/teacher/practice/adaimozhi/import - CSV import with preview and confirm
 * Feature: 003-adaimozhi
 *
 * Two-phase import:
 * 1. POST with CSV file -> Returns preview with validation
 * 2. POST with { action: 'confirm', rows: [...] } -> Imports selected rows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CSVRowSchema,
  ConfirmImportRequestSchema,
  type ImportPreviewRow,
} from '@/lib/validators/adaimozhi';
import type { ProfileRow } from '@/types/adaimozhi';

/**
 * Parse CSV text into rows
 */
function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n');
  return lines.map((line) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check teacher role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: ProfileRow | null };

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Teacher access required' } },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    // Phase 2: Confirm import
    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (body.action === 'confirm') {
        return handleConfirmImport(supabase, user.id, body);
      }

      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Invalid action' } },
        { status: 400 }
      );
    }

    // Phase 1: CSV upload and preview
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'No file provided' } },
        { status: 400 }
      );
    }

    const text = await file.text();
    return handleCSVPreview(supabase, text);
  } catch (error) {
    console.error('[adaimozhi/import] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * Handle CSV preview phase
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCSVPreview(supabase: any, csvText: string) {
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    return NextResponse.json(
      { error: { code: 'CSV_PARSE_ERROR', message: 'CSV must have header row and at least one data row' } },
      { status: 400 }
    );
  }

  // Expected header: phrase_with_blank,missing_word,complete_phrase,meaning_ta,meaning_en
  const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z_]/g, ''));
  const expectedColumns = ['phrase_with_blank', 'missing_word', 'complete_phrase'];
  const missingColumns = expectedColumns.filter((col) => !header.includes(col));

  if (missingColumns.length > 0) {
    return NextResponse.json(
      {
        error: {
          code: 'CSV_PARSE_ERROR',
          message: `Missing required columns: ${missingColumns.join(', ')}`,
        },
      },
      { status: 400 }
    );
  }

  // Get column indices
  const indices = {
    phrase_with_blank: header.indexOf('phrase_with_blank'),
    missing_word: header.indexOf('missing_word'),
    complete_phrase: header.indexOf('complete_phrase'),
    meaning_ta: header.indexOf('meaning_ta'),
    meaning_en: header.indexOf('meaning_en'),
  };

  // Fetch existing entries for duplicate detection
  const { data: existing } = await supabase
    .from('adaimozhi')
    .select('missing_word, complete_phrase');

  const existingSet = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (existing || []).map((e: any) => `${e.missing_word}|||${e.complete_phrase}`)
  );

  // Process data rows
  const preview: ImportPreviewRow[] = [];
  let validCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue; // Skip empty rows

    const rowData = {
      phrase_with_blank: row[indices.phrase_with_blank] || '',
      missing_word: row[indices.missing_word] || '',
      complete_phrase: row[indices.complete_phrase] || '',
      meaning_ta: indices.meaning_ta >= 0 ? row[indices.meaning_ta] : undefined,
      meaning_en: indices.meaning_en >= 0 ? row[indices.meaning_en] : undefined,
    };

    const validation = CSVRowSchema.safeParse(rowData);
    const isDuplicate = existingSet.has(
      `${rowData.missing_word}|||${rowData.complete_phrase}`
    );

    let error: string | null = null;
    let valid = true;

    if (!validation.success) {
      error = validation.error.issues[0]?.message || 'Invalid data';
      valid = false;
      errorCount++;
    } else if (isDuplicate) {
      error = 'Duplicate entry exists';
      valid = false;
      duplicateCount++;
    } else {
      validCount++;
    }

    preview.push({
      row: i,
      phrase_text: rowData.phrase_with_blank,
      missing_word: rowData.missing_word,
      complete_phrase: rowData.complete_phrase,
      meaning_ta: rowData.meaning_ta || null,
      meaning_en: rowData.meaning_en || null,
      valid,
      error,
      isDuplicate,
    });
  }

  return NextResponse.json({
    preview,
    validCount,
    errorCount,
    duplicateCount,
  });
}

/**
 * Handle import confirmation phase
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleConfirmImport(supabase: any, userId: string, body: any) {
  const parseResult = ConfirmImportRequestSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: parseResult.error.message } },
      { status: 400 }
    );
  }

  const { rows: selectedRows } = parseResult.data;
  const previewData = body.previewData as ImportPreviewRow[] | undefined;

  if (!previewData || !Array.isArray(previewData)) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Preview data required' } },
      { status: 400 }
    );
  }

  // Filter to selected valid rows
  const rowsToImport = previewData.filter(
    (r) => selectedRows.includes(r.row) && r.valid
  );

  if (rowsToImport.length === 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'No valid rows selected' } },
      { status: 400 }
    );
  }

  // Insert entries
  const entries = rowsToImport.map((r) => ({
    phrase_text: r.phrase_text,
    missing_word: r.missing_word,
    complete_phrase: r.complete_phrase,
    meaning_ta: r.meaning_ta,
    meaning_en: r.meaning_en,
    status: 'draft',
    created_by: userId,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('adaimozhi')
    .insert(entries)
    .select();

  if (insertError) {
    console.error('[adaimozhi/import] Insert error:', insertError);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to import entries' } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    imported: inserted?.length || 0,
    skipped: selectedRows.length - (inserted?.length || 0),
    errors: [],
    entries: inserted || [],
  });
}
