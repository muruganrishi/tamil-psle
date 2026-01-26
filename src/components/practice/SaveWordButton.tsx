'use client';

/**
 * SaveWordButton - Button to save a word to vocabulary bank
 * READ-ONLY: Feature agents must not modify this file
 *
 * Handles the save action with loading state and success feedback.
 */

import { useState, useCallback } from 'react';
import { BookmarkPlus, BookmarkCheck, Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SaveWordButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** The word to save */
  word: string;
  /** Context where the word was found */
  context: string;
  /** English meaning (optional) */
  meaningEn?: string | null;
  /** Tamil meaning (optional) */
  meaningTa?: string | null;
  /** Whether the word is already saved */
  saved?: boolean;
  /** Callback on successful save */
  onSaveSuccess?: () => void;
  /** Callback on save error */
  onSaveError?: (error: string) => void;
  /** Custom save function (override default API call) */
  onSave?: (data: {
    word: string;
    context: string;
    meaningEn: string | null;
    meaningTa: string | null;
  }) => Promise<void>;
  /** Show text label */
  showLabel?: boolean;
}

export function SaveWordButton({
  word,
  context,
  meaningEn = null,
  meaningTa = null,
  saved: initialSaved = false,
  onSaveSuccess,
  onSaveError,
  onSave,
  showLabel = true,
  className,
  variant = 'ghost',
  size = 'sm',
  disabled,
  ...props
}: SaveWordButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (saved || saving) return;

    setSaving(true);
    setError(null);

    try {
      if (onSave) {
        // Use custom save function
        await onSave({ word, context, meaningEn, meaningTa });
      } else {
        // Default: POST to /api/saved-words
        const response = await fetch('/api/saved-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word,
            context,
            meaning_en: meaningEn,
            meaning_ta: meaningTa,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 409) {
            // Word already saved - treat as success
            setSaved(true);
            onSaveSuccess?.();
            return;
          }
          throw new Error(data.error || 'Failed to save word');
        }
      }

      setSaved(true);
      onSaveSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save word';
      setError(message);
      onSaveError?.(message);
    } finally {
      setSaving(false);
    }
  }, [word, context, meaningEn, meaningTa, saved, saving, onSave, onSaveSuccess, onSaveError]);

  // Determine button content
  const renderContent = () => {
    if (saving) {
      return (
        <>
          <Loader2 className={cn('h-4 w-4 animate-spin', showLabel && 'mr-1')} />
          {showLabel && 'Saving...'}
        </>
      );
    }

    if (saved) {
      return (
        <>
          <BookmarkCheck className={cn('h-4 w-4', showLabel && 'mr-1')} />
          {showLabel && 'Saved'}
        </>
      );
    }

    return (
      <>
        <BookmarkPlus className={cn('h-4 w-4', showLabel && 'mr-1')} />
        {showLabel && 'Save to vocabulary'}
      </>
    );
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        saved && 'text-green-600 hover:text-green-700',
        error && 'text-red-600 hover:text-red-700',
        className
      )}
      onClick={handleSave}
      disabled={disabled || saving || saved}
      title={error || (saved ? 'Word saved' : 'Save to vocabulary bank')}
      {...props}
    >
      {renderContent()}
    </Button>
  );
}

export default SaveWordButton;
