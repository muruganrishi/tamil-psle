'use client';

/**
 * Vocabulary Bank - List Page
 * Shows saved words with search and navigation to review
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useVocabBank } from '@/hooks/vocab/useVocabBank';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  BookOpen,
  Trash2,
  Loader2,
  RefreshCw,
  BookMarked,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VocabBankPage() {
  const vocab = useVocabBank();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteWordId, setDeleteWordId] = useState<string | null>(null);
  const [deleteWordText, setDeleteWordText] = useState<string>('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load words on mount and when search changes
  useEffect(() => {
    vocab.loadWords({ reset: true, search: debouncedSearch || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((wordId: string, wordText: string) => {
    setDeleteWordId(wordId);
    setDeleteWordText(wordText);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteWordId) {
      await vocab.deleteWord(deleteWordId);
      setDeleteWordId(null);
      setDeleteWordText('');
    }
  }, [deleteWordId, vocab]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteWordId(null);
    setDeleteWordText('');
  }, []);

  // Load more words
  const handleLoadMore = useCallback(() => {
    if (vocab.hasMore && !vocab.isLoading) {
      vocab.loadWords({ reset: false, search: debouncedSearch || undefined });
    }
  }, [vocab, debouncedSearch]);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary Bank</h1>
          <p className="font-tamil text-orange-600">சொல் வங்கி</p>
          <p className="mt-1 text-sm text-gray-500">
            Words you&apos;ve saved while practicing. Review them to strengthen your vocabulary.
          </p>
        </div>
        <Link href="/vocab/review">
          <Button className="bg-orange-600 hover:bg-orange-700">
            <BookOpen className="mr-2 h-4 w-4" />
            Start Review
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search saved words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {vocab.error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-sm text-red-600">{vocab.error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => vocab.loadWords({ reset: true })}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state (initial) */}
      {vocab.isLoading && vocab.words.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-500" />
            <p className="text-gray-600">Loading your vocabulary...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!vocab.isLoading && vocab.words.length === 0 && !vocab.error && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookMarked className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-700">No saved words yet</h3>
            <p className="mb-4 text-sm text-gray-500">
              {searchQuery
                ? 'No words match your search.'
                : 'Save words while practicing by tapping on Tamil words and clicking "Save to vocabulary".'}
            </p>
            <Link href="/practice/sorporul">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Start Practicing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Words list */}
      {vocab.words.length > 0 && (
        <div className="space-y-3">
          {vocab.words.map((word) => (
            <Card key={word.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-tamil text-xl text-orange-700">
                      {word.word}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Saved {new Date(word.savedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => handleDeleteClick(word.id, word.word)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {word.meaningEn && (
                    <div>
                      <span className="text-xs font-medium uppercase text-gray-400">English</span>
                      <p className="text-sm text-gray-700">{word.meaningEn}</p>
                    </div>
                  )}
                  {word.meaningTa && (
                    <div>
                      <span className="text-xs font-medium uppercase text-gray-400">Tamil</span>
                      <p className="font-tamil text-sm text-gray-700">{word.meaningTa}</p>
                    </div>
                  )}
                  {word.context && (
                    <div className="mt-2 rounded bg-gray-50 p-2">
                      <span className="text-xs font-medium uppercase text-gray-400">Context</span>
                      <p className="font-tamil text-xs text-gray-600">{word.context}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load more button */}
          {vocab.hasMore && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={vocab.isLoading}
                className={cn(vocab.isLoading && 'opacity-60')}
              >
                {vocab.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteWordId} onOpenChange={() => handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved word?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-tamil font-semibold">{deleteWordText}</span> from your
              vocabulary bank? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
