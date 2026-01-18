'use client';

import { useState, useCallback } from 'react';
import { MeaningPopover } from './meaning-popover';
import type { MeaningResponse } from '@/lib/validators/meaning';

interface TokenizedTextProps {
  /** The Tamil text to tokenize */
  text: string;
  /** User's preferred language mode for meanings */
  languageMode: 'en' | 'ta' | 'both';
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to show save button in popover */
  showSaveButton?: boolean;
}

interface Token {
  text: string;
  isTamil: boolean;
  index: number;
}

/**
 * Regex to detect Tamil Unicode characters
 * Tamil Unicode block: U+0B80 to U+0BFF
 */
const TAMIL_CHAR_REGEX = /[\u0B80-\u0BFF]/;

/**
 * Regex to match Tamil words (sequence of Tamil characters)
 */
const TAMIL_WORD_REGEX = /[\u0B80-\u0BFF]+/g;

/**
 * Tokenize text into Tamil words and non-Tamil segments
 */
function tokenizeText(text: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;

  // Find all Tamil word matches
  const matches = text.matchAll(TAMIL_WORD_REGEX);

  for (const match of matches) {
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;

    // Add non-Tamil segment before this match
    if (matchStart > lastIndex) {
      tokens.push({
        text: text.slice(lastIndex, matchStart),
        isTamil: false,
        index: tokenIndex++,
      });
    }

    // Add Tamil word
    tokens.push({
      text: match[0],
      isTamil: true,
      index: tokenIndex++,
    });

    lastIndex = matchEnd;
  }

  // Add remaining non-Tamil text
  if (lastIndex < text.length) {
    tokens.push({
      text: text.slice(lastIndex),
      isTamil: false,
      index: tokenIndex++,
    });
  }

  return tokens;
}

/**
 * Get surrounding context for a word (returns full text for short question text)
 */
function getContext(text: string): string {
  return text;
}

/**
 * Check if text contains any Tamil characters
 */
export function containsTamil(text: string): boolean {
  return TAMIL_CHAR_REGEX.test(text);
}

export function TokenizedText({ text, languageMode, className = '', showSaveButton = true }: TokenizedTextProps) {
  const [selectedWord, setSelectedWord] = useState<{ word: string; context: string } | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  const tokens = tokenizeText(text);

  const handleWordClick = useCallback(
    (word: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setPopoverPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 4 });
      setSelectedWord({ word, context: getContext(text) });
    },
    [text]
  );

  const handleClosePopover = useCallback(() => {
    setSelectedWord(null);
    setPopoverPosition(null);
  }, []);

  const handleSaveWord = useCallback(async (word: string, meaning: MeaningResponse) => {
    try {
      await fetch('/api/saved-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          context: selectedWord?.context || text,
          meaning_en: meaning.meaning_en,
          meaning_ta: meaning.meaning_ta,
        }),
      });
    } catch (error) {
      console.error('Failed to save word:', error);
    }
  }, [selectedWord, text]);

  return (
    <span className={className}>
      {tokens.map((token) =>
        token.isTamil ? (
          <span
            key={token.index}
            onClick={(e) => handleWordClick(token.text, e)}
            className="cursor-pointer rounded px-0.5 transition-colors hover:bg-orange-100 hover:text-orange-700"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setPopoverPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 4 });
                setSelectedWord({ word: token.text, context: getContext(text) });
              }
            }}
          >
            {token.text}
          </span>
        ) : (
          <span key={token.index}>{token.text}</span>
        )
      )}

      {selectedWord && popoverPosition && (
        <MeaningPopover
          word={selectedWord.word}
          context={selectedWord.context}
          languageMode={languageMode}
          position={popoverPosition}
          onClose={handleClosePopover}
          onSave={showSaveButton ? handleSaveWord : undefined}
        />
      )}
    </span>
  );
}
