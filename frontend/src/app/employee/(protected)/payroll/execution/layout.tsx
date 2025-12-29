import type React from 'react';
import { UserProvider } from '@/payroll/libs/user-context';

import './globals.css';
import { Toaster } from './_components/ui/toaster';

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      {children}
      <Toaster />
    </UserProvider>
  );
}