'use client';

import { useState, useRef } from 'react';
import { Upload, Image, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Security: File upload validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

interface ImageUploadProps {
  onUpload: (dataUrl: string) => void;
  loading?: boolean;
}

interface ValidationError {
  message: string;
  type: 'size' | 'type' | 'extension';
}

function validateFile(file: File): ValidationError | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      type: 'size',
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      message: 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.',
      type: 'type',
    };
  }

  // Check file extension (defense in depth)
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      message: 'Invalid file extension. Please upload a JPG, PNG, GIF, or WebP image.',
      type: 'extension',
    };
  }

  return null;
}

export function ImageUpload({ onUpload, loading = false }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError.message);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (preview) {
      onUpload(preview);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 w-full rounded-lg border object-contain"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white p-0 shadow"
            onClick={handleClear}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragActive
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mb-2 h-8 w-8 text-gray-400" />
          <span className="text-sm text-gray-600">
            Drag and drop or click to upload
          </span>
          <span className="mt-1 text-xs text-gray-400">
            PNG, JPG up to 5MB
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </label>
      )}

      {preview && (
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Extract Question
            </>
          )}
        </Button>
      )}
    </div>
  );
}
