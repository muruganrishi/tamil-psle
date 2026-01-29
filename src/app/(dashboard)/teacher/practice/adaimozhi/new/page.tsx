'use client';

/**
 * Teacher Adaimozhi Create/Edit Page
 * Feature: 003-adaimozhi
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdaimozhiForm, AdaimozhiPreview } from '@/components/adaimozhi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AdaimozhiEntry, CreateEntryRequest } from '@/lib/validators/adaimozhi';

export default function TeacherAdaimozhiNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [entry, setEntry] = useState<AdaimozhiEntry | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview state (synced with form)
  const [previewData, setPreviewData] = useState({
    phraseText: '',
    missingWord: '',
    completePhrase: '',
    meaningTa: '',
    meaningEn: '',
  });

  // Fetch entry for editing
  useEffect(() => {
    if (!editId) return;

    async function fetchEntry() {
      try {
        const response = await fetch(`/api/teacher/practice/adaimozhi/${editId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to fetch entry');
        }

        setEntry(data.entry);
        setPreviewData({
          phraseText: data.entry.phrase_text,
          missingWord: data.entry.missing_word,
          completePhrase: data.entry.complete_phrase,
          meaningTa: data.entry.meaning_ta || '',
          meaningEn: data.entry.meaning_en || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    }

    fetchEntry();
  }, [editId]);

  const handleSubmit = async (data: CreateEntryRequest) => {
    setSaving(true);
    setError(null);

    try {
      const url = editId
        ? `/api/teacher/practice/adaimozhi/${editId}`
        : '/api/teacher/practice/adaimozhi';
      const method = editId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to save entry');
      }

      router.push('/teacher/practice/adaimozhi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-gray-600">Loading entry...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {editId ? 'Edit Adaimozhi Entry' : 'New Adaimozhi Entry'}
          </h1>
          <p className="text-gray-600 font-tamil">
            {editId ? 'அடைமொழி திருத்தம்' : 'புதிய அடைமொழி'}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/teacher/practice/adaimozhi')}>
          Back to List
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Form and Preview Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <AdaimozhiForm
              initialValues={entry || undefined}
              onSubmit={handleSubmit}
              isLoading={saving}
              submitText={editId ? 'Update Entry' : 'Create Entry'}
            />
          </CardContent>
        </Card>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <AdaimozhiPreview
            phraseText={previewData.phraseText}
            missingWord={previewData.missingWord}
            completePhrase={previewData.completePhrase}
            meaningTa={previewData.meaningTa}
            meaningEn={previewData.meaningEn}
          />
        </div>
      </div>
    </div>
  );
}
