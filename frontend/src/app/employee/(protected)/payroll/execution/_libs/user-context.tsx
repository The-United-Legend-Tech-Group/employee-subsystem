'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getUserRolesFromCookie } from '@/lib/auth-utils';

export type Role = 'Payroll Specialist' | 'Finance Staff' | 'Payroll Manager';

interface UserContextType {
  role: Role | null;
  setRole: (role: Role) => void;
  userName: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const roles = getUserRolesFromCookie();
    if (roles.length > 0) {
      if (roles.includes('Payroll Manager')) {
        setRole('Payroll Manager');
      } else if (roles.includes('Payroll Specialist')) {
        setRole('Payroll Specialist');
      } else if (roles.includes('Finance Staff')) {
        setRole('Finance Staff');
      }
    }
  }, []);

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
