'use client';

/**
 * Vocabulary Bank Page - Student's saved words with search
 * Feature: 005-sorporul
 *
 * Displays saved vocabulary with debounced search filtering
 * and word deletion functionality.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, BookOpen, Loader2, Search, X, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UserSavedWord } from '@/types/database';

export default function VocabPage() {
  const router = useRouter();
  const [words, setWords] = useState<UserSavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<UserSavedWord | null>(null);

  // Fetch saved words
  useEffect(() => {
    async function fetchSavedWords() {
      try {
        const response = await fetch('/api/saved-words');
        if (!response.ok) {
          throw new Error('Failed to fetch saved words');
        }
        const data = await response.json();
        setWords(data.words);
      } catch {
        setError('Failed to load saved words');
      } finally {
        setLoading(false);
      }
    }

    fetchSavedWords();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter words based on search
  const filteredWords = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return words;
    }

    const query = debouncedSearch.toLowerCase();
    return words.filter(
      (word) =>
        word.word.toLowerCase().includes(query) ||
        (word.meaning_en && word.meaning_en.toLowerCase().includes(query)) ||
        (word.meaning_ta && word.meaning_ta.toLowerCase().includes(query)) ||
        word.context.toLowerCase().includes(query)
    );
  }, [words, debouncedSearch]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((word: UserSavedWord) => {
    setDeleteConfirm(word);
  }, []);

  // Handle delete confirmed
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;

    const wordId = deleteConfirm.id;
    setDeleteConfirm(null);
    setDeleting(wordId);

    try {
      const response = await fetch(`/api/saved-words?id=${wordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete word');
      }

      setWords((prev) => prev.filter((w) => w.id !== wordId));
    } catch {
      setError('Failed to delete word');
    } finally {
      setDeleting(null);
    }
  }, [deleteConfirm]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Navigate to flashcard review
  const handleStartReview = useCallback(() => {
    router.push('/vocab/review');
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
            <p className="mt-4 text-gray-600">Loading vocabulary...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary Bank</h1>
          <p className="font-tamil text-orange-600">சொற்களஞ்சியம்</p>
          <p className="text-sm text-gray-500 mt-1">
            {words.length} word{words.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        {words.length > 0 && (
          <Button onClick={handleStartReview} className="bg-orange-600 hover:bg-orange-700">
            <GraduationCap className="mr-2 h-4 w-4" />
            Review Flashcards
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {words.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">No saved words yet</h2>
            <p className="mt-2 text-gray-600">
              Click on any Tamil word while practicing to look up its meaning, then save it to your vocabulary bank.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/practice/sorporul')}
            >
              Start Practicing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search Bar */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search words, meanings, or context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </button>
            )}
          </div>

          {/* Search Results Count */}
          {debouncedSearch && (
            <p className="mb-4 text-sm text-gray-500">
              Found {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''} matching &quot;{debouncedSearch}&quot;
            </p>
          )}

          {/* Word List */}
          {filteredWords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">No words match your search.</p>
                <Button variant="link" onClick={handleClearSearch}>
                  Clear search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredWords.map((word) => (
                <Card key={word.id} className={deleting === word.id ? 'opacity-50' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-tamil text-xl text-orange-600">
                        {word.word}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(word)}
                        disabled={deleting === word.id}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      >
                        {deleting === word.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                    <CardDescription className="font-tamil text-sm">
                      Context: {word.context.length > 60 ? word.context.slice(0, 60) + '...' : word.context}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {word.meaning_en && (
                      <div className="flex gap-2">
                        <span className="text-xs font-medium uppercase text-gray-400 w-12">EN</span>
                        <span className="text-sm text-gray-700">{word.meaning_en}</span>
                      </div>
                    )}
                    {word.meaning_ta && (
                      <div className="flex gap-2">
                        <span className="text-xs font-medium uppercase text-gray-400 w-12">TA</span>
                        <span className="font-tamil text-sm text-gray-700">{word.meaning_ta}</span>
                      </div>
                    )}
                    <div className="pt-2 text-xs text-gray-400">
                      Saved on {new Date(word.saved_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete word?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-tamil font-semibold text-orange-600">
                {deleteConfirm?.word}
              </span>{' '}
              from your vocabulary bank? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
