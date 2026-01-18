'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Loader2, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JoinClassForm } from '@/components/join-class-form';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

interface StudentClass {
  id: string;
  name: string;
  teacher_name: string | null;
  joined_at: string;
}

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/student/classes');
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await response.json();
      setClasses(data.classes);
    } catch {
      setError('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleLeaveClass = async (classId: string) => {
    if (!confirm('Are you sure you want to leave this class?')) return;

    setLeaving(classId);
    try {
      const response = await fetch(`/api/student/classes/${classId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to leave class');
      }

      setClasses((prev) => prev.filter((c) => c.id !== classId));
    } catch {
      setError('Failed to leave class');
    } finally {
      setLeaving(null);
    }
  };

  const handleClassJoined = () => {
    setDialogOpen(false);
    fetchClasses();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
            <p className="mt-4 text-gray-600">Loading your classes...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600">Classes you&apos;re enrolled in</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Join Class</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <JoinClassForm onSuccess={handleClassJoined} />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">No classes yet</h2>
            <p className="mt-2 text-gray-600">
              Join a class using the code provided by your teacher.
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              Join Your First Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{cls.name}</CardTitle>
                    <CardDescription>
                      {cls.teacher_name ? `Teacher: ${cls.teacher_name}` : 'Teacher'}
                      {' • '}Joined {new Date(cls.joined_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => handleLeaveClass(cls.id)}
                    disabled={leaving === cls.id}
                  >
                    {leaving === cls.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    <span className="ml-1 sr-only">Leave class</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
