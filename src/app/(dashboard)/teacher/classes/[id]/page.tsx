'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Users, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ClassMember {
  id: string;
  student_id: string;
  joined_at: string;
  profile: {
    display_name: string | null;
  } | null;
}

interface ClassDetails {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function fetchClassDetails() {
      try {
        const response = await fetch(`/api/classes/${classId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Class not found');
          } else {
            throw new Error('Failed to fetch class details');
          }
          return;
        }
        const data = await response.json();
        setClassDetails(data.class);
        setMembers(data.members);
      } catch {
        setError('Failed to load class details');
      } finally {
        setLoading(false);
      }
    }

    fetchClassDetails();
  }, [classId]);

  const handleCopyCode = async () => {
    if (classDetails) {
      await navigator.clipboard.writeText(classDetails.join_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
            <p className="mt-4 text-gray-600">Loading class details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !classDetails) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error || 'Class not found'}</p>
            <Button className="mt-4" onClick={() => router.push('/teacher')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back button */}
      <Link
        href="/teacher"
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Classes
      </Link>

      {/* Class header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{classDetails.name}</CardTitle>
              <CardDescription>
                Created {new Date(classDetails.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Join Code</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold tracking-wider text-orange-600">
                  {classDetails.join_code}
                </span>
                <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Link href={`/teacher/classes/${classId}/assignments/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </Link>
            <Link href={`/teacher/classes/${classId}/results`}>
              <Button variant="outline">View Results</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Student roster */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-600">No students have joined yet.</p>
              <p className="mt-1 text-sm text-gray-500">
                Share the join code <strong>{classDetails.join_code}</strong> with your students.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.profile?.display_name || `Student ${member.student_id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
