'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/payroll/libs/user-context';

export default function HomePage() {
  const router = useRouter();
  const { role } = useUser();

  useEffect(() => {
    // Redirect to appropriate dashboard based on role
    if (role === "Payroll Manager") {
      router.push(`execution/Manager`);
    } else if (role === "Payroll Specialist") {
      router.push(`execution/Specialist`);
    } else if (role === "Finance Staff") {
      router.push(`execution/Finance`);
    }
    // undefined or other roles (like System Admin) stay here or get handled by layout/middleware
  }, [role, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
