'use client';

import { useState, useEffect } from 'react';
import { Trash2, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UserSavedWord } from '@/types/database';

export default function SavedWordsPage() {
  const [words, setWords] = useState<UserSavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (wordId: string) => {
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
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
            <p className="mt-4 text-gray-600">Loading saved words...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Words</h1>
        <p className="text-gray-600">Your personal vocabulary list</p>
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
              Click on any Tamil word while practicing to look up its meaning, then save it to your vocabulary list.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {words.map((word) => (
            <Card key={word.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-tamil text-xl text-orange-600">
                    {word.word}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(word.id)}
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
    </div>
  );
}
