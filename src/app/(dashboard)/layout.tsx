import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

// Disable caching for this layout to ensure fresh auth state
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single() as { data: { role: 'student' | 'teacher' | 'admin'; display_name: string | null } | null };

  const role = profile?.role ?? 'student';
  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-orange-600">TamilPSLE</span>
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              {role === 'student' && (
                <>
                  <Link href="/practice" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Practice
                  </Link>
                  <Link href="/saved-words" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Saved Words
                  </Link>
                  <Link href="/classes" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    My Classes
                  </Link>
                </>
              )}
              {role === 'teacher' && (
                <>
                  <Link href="/teacher/classes" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Classes
                  </Link>
                  <Link href="/teacher/assignments" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Assignments
                  </Link>
                </>
              )}
              {role === 'admin' && (
                <>
                  <Link href="/admin/questions" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Questions
                  </Link>
                  <Link href="/admin/users" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Users
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {displayName}
              <span className="ml-1 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-600">
                {role}
              </span>
            </span>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
