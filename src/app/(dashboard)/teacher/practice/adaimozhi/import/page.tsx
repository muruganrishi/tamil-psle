'use client';

/**
 * Teacher Adaimozhi CSV Import Page
 * Feature: 003-adaimozhi
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CSVImportPreview } from '@/components/adaimozhi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ImportPreviewResponse } from '@/lib/validators/adaimozhi';

type ImportState = 'upload' | 'preview' | 'success';

export default function TeacherAdaimozhiImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ImportState>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/teacher/practice/adaimozhi/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to parse CSV');
      }

      setPreviewData(data);
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async (selectedRows: number[]) => {
    if (!previewData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teacher/practice/adaimozhi/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          rows: selectedRows,
          previewData: previewData.preview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to import');
      }

      setImportedCount(data.imported);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setState('upload');
    setPreviewData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import Adaimozhi</h1>
          <p className="text-gray-600">Upload a CSV file to bulk import entries</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/teacher/practice/adaimozhi')}>
          Back to List
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Upload State */}
      {state === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CSV Format Instructions */}
            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
              <p className="font-medium">CSV Format Requirements:</p>
              <p className="text-sm text-gray-600">
                Required columns: <code>phrase_with_blank</code>, <code>missing_word</code>, <code>complete_phrase</code>
              </p>
              <p className="text-sm text-gray-600">
                Optional columns: <code>meaning_ta</code>, <code>meaning_en</code>
              </p>
              <pre className="text-xs bg-white p-2 rounded border mt-2 overflow-x-auto">
{`phrase_with_blank,missing_word,complete_phrase,meaning_ta,meaning_en
தாமரை _____,கண்கள்,தாமரை கண்கள்,தாமரை போன்ற அழகிய கண்கள்,Beautiful eyes like lotus
வெண்ணிலா _____,முகம்,வெண்ணிலா முகம்,நிலவு போன்ற ஒளிரும் முகம்,Face glowing like moon`}
              </pre>
            </div>

            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="csvFile">Select CSV File</Label>
              <Input
                ref={fileInputRef}
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-4">
                <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                <p className="text-gray-600">Processing CSV...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview State */}
      {state === 'preview' && previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
          </CardHeader>
          <CardContent>
            <CSVImportPreview
              preview={previewData.preview}
              validCount={previewData.validCount}
              errorCount={previewData.errorCount}
              duplicateCount={previewData.duplicateCount}
              onConfirm={handleConfirmImport}
              onCancel={handleCancel}
              isImporting={loading}
            />
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {state === 'success' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Import Complete!</h2>
            <p className="text-gray-600 mb-6">
              Successfully imported {importedCount} entries as drafts.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleCancel}>
                Import More
              </Button>
              <Button onClick={() => router.push('/teacher/practice/adaimozhi')}>
                View Entries
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
