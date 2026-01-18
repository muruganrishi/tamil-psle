import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SectionPicker } from '@/components/section-picker';
import type { Profile, Question } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user!.id)
    .single() as { data: Pick<Profile, 'role' | 'display_name'> | null };

  const role = profile?.role ?? 'student';
  const displayName = profile?.display_name ?? user!.email?.split('@')[0] ?? 'Student';

  // Get question counts per section for students
  let questionCounts: Record<string, number> = {};
  if (role === 'student') {
    const { data: counts } = await supabase
      .from('questions')
      .select('section')
      .eq('status', 'published') as { data: Pick<Question, 'section'>[] | null };

    if (counts) {
      questionCounts = counts.reduce(
        (acc, q) => {
          acc[q.section] = (acc[q.section] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }
  }

  // For students, show practice sections
  if (role === 'student') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {displayName}!
          </h1>
          <p className="text-gray-600">Choose a section to start practicing</p>
        </div>

        <SectionPicker questionCounts={questionCounts} />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Saved Words</CardTitle>
              <CardDescription>Review words you&apos;ve saved</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/words">
                <Button variant="outline">View Saved Words</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>View assignments from your classes</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/classes">
                <Button variant="outline">View Classes</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // For teachers
  if (role === 'teacher') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Manage your classes and assignments</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Manage your classes and students</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/teacher/classes">
                <Button>View Classes</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Create and manage assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/teacher/assignments">
                <Button>View Assignments</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // For admins
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage questions and users</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardDescription>Manage question bank</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/questions">
              <Button>Manage Questions</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button>Manage Users</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Import</CardTitle>
            <CardDescription>Bulk import questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/import">
              <Button>Import CSV</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
