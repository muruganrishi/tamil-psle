'use client';

/**
 * Teacher Sorporul CSV Import Page
 * Feature: 005-sorporul
 *
 * Upload CSV to bulk import word meaning questions.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CSVImportPreview } from '@/components/sorporul/CSVImportPreview';
import type { CSVPreviewResponse, CSVImportResponse } from '@/types/sorporul';

type UploadState = 'idle' | 'uploading' | 'preview' | 'importing' | 'success';

export default function ImportSorporulCSVPage() {
  const router = useRouter();

  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CSVPreviewResponse | null>(null);
  const [result, setResult] = useState<CSVImportResponse | null>(null);

  // Handle file selection
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setState('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/practice/sorporul/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse CSV');
      }

      setPreview(data);
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setState('idle');
    }
  }, []);

  // Handle import confirmation
  const handleConfirm = useCallback(async (skipErrors: boolean) => {
    if (!preview?.uploadId) return;

    setState('importing');
    setError(null);

    try {
      const response = await fetch('/api/practice/sorporul/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          uploadId: preview.uploadId,
          skipErrors,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import');
      }

      setResult(data);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import');
      setState('preview');
    }
  }, [preview?.uploadId]);

  // Cancel and reset
  const handleCancel = useCallback(() => {
    setState('idle');
    setPreview(null);
    setError(null);
  }, []);

  // Download template CSV
  const handleDownloadTemplate = useCallback(() => {
    const template = `target_word,option_a,option_b,option_c,option_d,correct_answer
அழகு,எழில்,உணவு,நீர்,தீ,A
கல்வி,படிப்பு,விளையாட்டு,தூக்கம்,சாப்பாடு,A
நிலா,சந்திரன்,சூரியன்,விண்மீன்,மேகம்,A`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sorporul_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/teacher/practice/sorporul')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Import Questions from CSV</h1>
        <p className="font-tamil text-orange-600">CSV கோப்பிலிருந்து இறக்குமதி</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Success State */}
      {state === 'success' && result && (
        <Card className="border-green-200">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Import Complete!</h2>
            <p className="mt-2 text-gray-600">
              Successfully imported {result.imported} question{result.imported !== 1 ? 's' : ''}.
              {result.skipped > 0 && ` (${result.skipped} skipped due to errors)`}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Questions are saved as drafts. Review and publish them when ready.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Import More
              </Button>
              <Button onClick={() => router.push('/teacher/practice/sorporul')}>
                View Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview State */}
      {(state === 'preview' || state === 'importing') && preview && (
        <CSVImportPreview
          rows={preview.rows}
          totalRows={preview.totalRows}
          validRows={preview.validRows}
          errorRows={preview.errorRows}
          errors={preview.errors}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          importing={state === 'importing'}
        />
      )}

      {/* Idle/Upload State */}
      {(state === 'idle' || state === 'uploading') && (
        <>
          {/* CSV Format Guide */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>CSV Format</CardTitle>
              <CardDescription>
                Your CSV file must have these exact column headers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-2 text-left font-medium">Column</th>
                      <th className="p-2 text-left font-medium">Description</th>
                      <th className="p-2 text-left font-medium">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-mono text-orange-600">target_word</td>
                      <td className="p-2">The Tamil word (question)</td>
                      <td className="p-2 font-tamil">அழகு</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono text-orange-600">option_a</td>
                      <td className="p-2">Definition for option A</td>
                      <td className="p-2 font-tamil">எழில்</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono text-orange-600">option_b</td>
                      <td className="p-2">Definition for option B</td>
                      <td className="p-2 font-tamil">உணவு</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono text-orange-600">option_c</td>
                      <td className="p-2">Definition for option C</td>
                      <td className="p-2 font-tamil">நீர்</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono text-orange-600">option_d</td>
                      <td className="p-2">Definition for option D</td>
                      <td className="p-2 font-tamil">தீ</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-orange-600">correct_answer</td>
                      <td className="p-2">Correct option (A, B, C, or D)</td>
                      <td className="p-2">A</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Select a CSV file to preview before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                {state === 'uploading' ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                    <p className="mt-4 text-gray-600">Parsing CSV file...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-600">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Maximum 1000 rows, 1MB file size
                    </p>
                    <div className="mt-4">
                      <Label htmlFor="csv-upload" className="sr-only">
                        Choose file
                      </Label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
