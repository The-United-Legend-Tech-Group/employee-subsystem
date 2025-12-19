import type React from 'react';
import { UserProvider } from '@/payroll/libs/user-context';

import './globals.css';

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <UserProvider>{children}</UserProvider>;
}
