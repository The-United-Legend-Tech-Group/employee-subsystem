import type React from 'react';
import { AppSidebar } from '@/payroll/components/layout/app-sidebar';

export default function SpecialistLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-8 bg-background">{children}</main>
    </div>
  );
}
