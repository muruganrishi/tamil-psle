'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AssignmentForm } from '@/components/assignment-form';

export default function NewAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const handleSuccess = () => {
    router.push(`/teacher/classes/${classId}`);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/teacher/classes/${classId}`}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Class
      </Link>

      <AssignmentForm classId={classId} onSuccess={handleSuccess} />
    </div>
  );
}
