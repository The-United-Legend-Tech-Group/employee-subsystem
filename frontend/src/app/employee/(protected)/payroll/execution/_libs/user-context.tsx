'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

export type Role = 'Payroll Specialist' | 'Finance Staff' | 'Payroll Manager';

interface UserContextType {
  role: Role | null;
  setRole: (role: Role) => void;
  userName: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { roles, loading } = useAuth();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!loading && roles.length > 0) {
      if (roles.includes('Payroll Manager' as any)) {
        setRole('Payroll Manager');
      } else if (roles.includes('Payroll Specialist' as any)) {
        setRole('Payroll Specialist');
      } else if (roles.includes('Finance Staff' as any)) {
        setRole('Finance Staff');
      }
    }
  }, [roles, loading]);

  return (
    <UserContext.Provider
      value={{ role, setRole, userName: 'Remove later (34an hamza)' }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
