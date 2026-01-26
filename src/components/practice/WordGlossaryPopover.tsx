'use client';

/**
 * WordGlossaryPopover - Displays word meaning on click/tap
 * READ-ONLY: Feature agents must not modify this file
 *
 * Shows contextual Tamil word meanings using AI lookup.
 * Includes option to save words to vocabulary bank.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SaveWordButton } from './SaveWordButton';
import type { LanguageMode } from '@/types/database';

export interface WordMeaning {
  meaningEn: string | null;
  meaningTa: string | null;
  cached: boolean;
}

export interface WordGlossaryPopoverProps {
  /** The Tamil word to look up */
  word: string;
  /** Context sentence containing the word */
  context: string;
  /** Language mode for meaning display */
  languageMode: LanguageMode;
  /** Position for the popover */
  position: { x: number; y: number };
  /** Callback to close the popover */
  onClose: () => void;
  /** Optional: callback for vocab lookup (override default fetch) */
  onLookup?: (word: string, context: string) => Promise<WordMeaning>;
  /** Optional: callback after saving word */
  onWordSaved?: (word: string) => void;
  /** Whether to show save button */
  showSaveButton?: boolean;
}

export function WordGlossaryPopover({
  word,
  context,
  languageMode,
  position,
  onClose,
  onLookup,
  onWordSaved,
  showSaveButton = true,
}: WordGlossaryPopoverProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meaning, setMeaning] = useState<WordMeaning | null>(null);
  const [saved, setSaved] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Fetch meaning
  useEffect(() => {
    async function fetchMeaning() {
      setLoading(true);
      setError(null);

      try {
        let result: WordMeaning;

        if (onLookup) {
          // Use custom lookup function
          result = await onLookup(word, context);
        } else {
          // Default: fetch from /api/meaning
          const response = await fetch('/api/meaning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              word,
              context,
              language_mode: languageMode,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            if (data.code === 'RATE_LIMITED') {
              setError('Too many requests. Please wait a moment.');
            } else if (data.code === 'AI_UNAVAILABLE') {
              setError('AI service is temporarily unavailable.');
            } else {
              setError(data.error || 'Failed to fetch meaning');
            }
            return;
          }

          const data = await response.json();
          result = {
            meaningEn: data.meaning_en,
            meaningTa: data.meaning_ta,
            cached: data.cached || false,
          };
        }

        setMeaning(result);
      } catch {
        setError('Failed to fetch meaning. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchMeaning();
  }, [word, context, languageMode, onLookup]);

  // Handle save success
  const handleSaveSuccess = useCallback(() => {
    setSaved(true);
    onWordSaved?.(word);
  }, [word, onWordSaved]);

  // Calculate position to keep popover in viewport
  const getPopoverStyle = (): React.CSSProperties => {
    return {
      position: 'fixed',
      zIndex: 50,
      top: position.y,
      left: position.x,
      transform: 'translateX(-50%)',
    };
  };

  return (
    <div
      ref={popoverRef}
      style={getPopoverStyle()}
      className="animate-in fade-in-0 zoom-in-95 min-w-[200px] max-w-[300px] rounded-lg border bg-white p-3 shadow-lg"
      role="dialog"
      aria-label={`Meaning of ${word}`}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <span className="font-tamil text-lg font-semibold text-orange-600">{word}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 -mt-1 -mr-1"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          <span className="ml-2 text-sm text-gray-500">Looking up meaning...</span>
        </div>
      ) : error ? (
        <div className="py-2 text-sm text-red-600">{error}</div>
      ) : meaning ? (
        <div className="space-y-2">
          {meaning.meaningEn && (
            <div>
              <span className="text-xs font-medium uppercase text-gray-400">English</span>
              <p className="text-sm text-gray-700">{meaning.meaningEn}</p>
            </div>
          )}
          {meaning.meaningTa && (
            <div>
              <span className="text-xs font-medium uppercase text-gray-400">Tamil</span>
              <p className="font-tamil text-sm text-gray-700">{meaning.meaningTa}</p>
            </div>
          )}
          {meaning.cached && <span className="text-xs text-gray-400">(cached)</span>}
        </div>
      ) : null}

      {/* Save button */}
      {showSaveButton && !loading && !error && meaning && (
        <div className="mt-3 border-t pt-2">
          <SaveWordButton
            word={word}
            context={context}
            meaningEn={meaning.meaningEn}
            meaningTa={meaning.meaningTa}
            saved={saved}
            onSaveSuccess={handleSaveSuccess}
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs"
          />
        </div>
      )}
    </div>
  );
}

export default WordGlossaryPopover;
