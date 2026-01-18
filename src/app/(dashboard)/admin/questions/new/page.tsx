'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera } from 'lucide-react';
import { QuestionForm } from '@/components/question-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/image-upload';
import { OCRPreview } from '@/components/ocr-preview';

interface Passage {
  id: string;
  title: string;
}

interface OCRResult {
  section: string;
  question_text: string;
  options: { label: string; text: string; is_correct: boolean }[];
}

export default function NewQuestionPage() {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    async function fetchPassages() {
      try {
        const response = await fetch('/api/admin/passages');
        if (response.ok) {
          const data = await response.json();
          setPassages(data.passages || []);
        }
      } catch {
        // Passages are optional
      }
    }

    fetchPassages();
  }, []);

  const handleOCRComplete = (result: OCRResult) => {
    setOcrResult(result);
    setOcrDialogOpen(false);
    setFormKey((prev) => prev + 1); // Reset form with new data
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin/questions"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Questions
        </Link>

        <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              OCR Assist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>OCR Assist</DialogTitle>
              <DialogDescription>
                Upload an image of a question to extract text automatically
              </DialogDescription>
            </DialogHeader>
            <OCRAssistFlow onComplete={handleOCRComplete} />
          </DialogContent>
        </Dialog>
      </div>

      <QuestionForm
        key={formKey}
        passages={passages}
        initialData={
          ocrResult
            ? {
                section: ocrResult.section as 'vetrumai' | 'seiyul' | 'adaimozhi' | 'padipunarthal' | 'sorporul' | 'oli-verupattu',
                question_text: ocrResult.question_text,
                options: ocrResult.options,
              }
            : undefined
        }
      />
    </div>
  );
}

function OCRAssistFlow({ onComplete }: { onComplete: (result: OCRResult) => void }) {
  const [, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);

  const handleImageUpload = async (dataUrl: string) => {
    setImageData(dataUrl);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ocr-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OCR failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <OCRPreview
        result={result}
        onConfirm={() => onComplete(result)}
        onRetry={() => {
          setResult(null);
          setImageData(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ImageUpload onUpload={handleImageUpload} loading={loading} />
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}
