'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Users, Upload, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Stats {
  total_questions: number;
  published_questions: number;
  draft_questions: number;
  total_users: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch {
        // Stats are optional, fail silently
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage questions, users, and content</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.total_questions}</p>
              <p className="text-xs text-gray-500">Total Questions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.published_questions}</p>
              <p className="text-xs text-gray-500">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.draft_questions}</p>
              <p className="text-xs text-gray-500">Drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total_users}</p>
              <p className="text-xs text-gray-500">Users</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/questions">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Question Bank</CardTitle>
                  <CardDescription>View and manage all questions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Link href="/admin/questions/new">
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Add Question
                  </Button>
                </Link>
                <Link href="/admin/questions/import">
                  <Button size="sm" variant="outline">
                    <Upload className="mr-1 h-4 w-4" />
                    Import CSV
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Promote students to teachers, manage admin access
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
