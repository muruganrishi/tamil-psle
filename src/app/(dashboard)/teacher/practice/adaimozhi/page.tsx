'use client';

/**
 * Teacher Adaimozhi List Page - Manage adaimozhi entries
 * Feature: 003-adaimozhi
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AdaimozhiEntry, AdaimozhiStatus } from '@/lib/validators/adaimozhi';

type StatusFilter = AdaimozhiStatus | 'all';

export default function TeacherAdaimozhiListPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AdaimozhiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/teacher/practice/adaimozhi?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch entries');
      }

      setEntries(data.entries);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/practice/adaimozhi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to publish');
      }

      fetchEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/practice/adaimozhi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to unpublish');
      }

      fetchEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unpublish');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`/api/teacher/practice/adaimozhi/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete');
      }

      fetchEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Adaimozhi Content</h1>
          <p className="text-gray-600 font-tamil">அடைமொழி உள்ளடக்கம்</p>
        </div>
        <Button onClick={() => router.push('/teacher/practice/adaimozhi/new')}>
          + Add New Entry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 items-center">
            {/* Status Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'draft', 'published'] as StatusFilter[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search phrases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <p className="text-sm text-gray-500">{total} entries</p>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchEntries} className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-gray-600">Loading entries...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">No entries found</p>
            <Button onClick={() => router.push('/teacher/practice/adaimozhi/new')}>
              Create your first entry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Entries Table */}
      {!loading && !error && entries.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phrase</TableHead>
                  <TableHead>Missing Word</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-tamil">{entry.phrase_text}</TableCell>
                    <TableCell className="font-tamil">{entry.missing_word}</TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.status === 'published' ? 'default' : 'secondary'}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(entry.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/teacher/practice/adaimozhi/new?edit=${entry.id}`)
                          }
                        >
                          Edit
                        </Button>
                        {entry.status === 'draft' ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePublish(entry.id)}
                          >
                            Publish
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnpublish(entry.id)}
                          >
                            Unpublish
                          </Button>
                        )}
                        {entry.status === 'draft' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
