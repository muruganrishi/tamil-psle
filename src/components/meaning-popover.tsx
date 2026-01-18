'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MeaningResponse } from '@/lib/validators/meaning';

interface MeaningPopoverProps {
  word: string;
  context: string;
  languageMode: 'en' | 'ta' | 'both';
  position: { x: number; y: number };
  onClose: () => void;
  onSave?: (word: string, meaning: MeaningResponse) => void;
}

export function MeaningPopover({
  word,
  context,
  languageMode,
  position,
  onClose,
  onSave,
}: MeaningPopoverProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meaning, setMeaning] = useState<MeaningResponse | null>(null);
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
        const response = await fetch('/api/meaning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, context, language_mode: languageMode }),
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

        const data: MeaningResponse = await response.json();
        setMeaning(data);
      } catch {
        setError('Failed to fetch meaning. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchMeaning();
  }, [word, context, languageMode]);

  // Calculate position to keep popover in viewport
  const getPopoverStyle = () => {
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 50,
    };

    // Position below the word, centered
    style.top = position.y;
    style.left = position.x;
    style.transform = 'translateX(-50%)';

    return style;
  };

  const handleSave = () => {
    if (meaning && onSave) {
      onSave(word, meaning);
      setSaved(true);
    }
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
        <span className="text-lg font-semibold text-orange-600">{word}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
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
          {meaning.meaning_en && (
            <div>
              <span className="text-xs font-medium uppercase text-gray-400">English</span>
              <p className="text-sm text-gray-700">{meaning.meaning_en}</p>
            </div>
          )}
          {meaning.meaning_ta && (
            <div>
              <span className="text-xs font-medium uppercase text-gray-400">Tamil</span>
              <p className="text-sm text-gray-700">{meaning.meaning_ta}</p>
            </div>
          )}
          {meaning.cached && (
            <span className="text-xs text-gray-400">(cached)</span>
          )}
        </div>
      ) : null}

      {/* Save button (for US3) */}
      {!loading && !error && meaning && onSave && (
        <div className="mt-3 border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs"
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? (
              <>
                <BookmarkCheck className="mr-1 h-3 w-3" />
                Saved
              </>
            ) : (
              <>
                <BookmarkPlus className="mr-1 h-3 w-3" />
                Save to vocabulary
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
