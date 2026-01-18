'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CSVImportPreview } from '@/components/csv-import-preview';
import { useToast } from '@/components/ui/use-toast';

export default function ImportQuestionsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleImport = async (questions: Record<string, unknown>[]) => {
    const response = await fetch('/api/admin/questions/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions, status: 'draft' }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Import failed');
    }

    toast({
      title: 'Import Complete',
      description: `${data.imported} questions imported successfully${data.failed > 0 ? `, ${data.failed} failed` : ''}`,
    });

    router.push('/admin/questions');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/questions"
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Questions
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Questions</h1>
        <p className="text-gray-600">Upload a CSV file to bulk import questions</p>
      </div>

      <CSVImportPreview onImport={handleImport} />
    </div>
  );
}
