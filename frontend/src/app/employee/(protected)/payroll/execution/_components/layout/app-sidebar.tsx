'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/payroll/libs/utils';
import { hasRole } from '@/lib/auth-utils';
import {
  LayoutDashboard,
  FileCheck,
  Play,
  FileText,
  AlertTriangle,
  FolderKanban,
  UserCircle
} from 'lucide-react';
import ArcanaLogo from '@/common/material-ui/shared-theme/ArcanaLogo';
import Box from '@mui/material/Box';
import { useUser } from '@/payroll/libs/user-context';

const isPayrollManager = hasRole('Payroll Manager');
const isPayrollSpecialist = hasRole('Payroll Specialist');
const isFinanceStaff = hasRole('Finance Staff');

type NavItem = {
  label: string;
  href: string;
  icon: any;
  roles: string[];
};

const navItems: NavItem[] = [
  {
    label: 'Profile',
    href: '/employee/dashboard/',
    icon: UserCircle,
    roles: ['Payroll Specialist', 'Payroll Manager', 'Finance Staff']
  },
  {
    label: 'Dashboard',
    href: '/employee/payroll/execution/Specialist',
    icon: LayoutDashboard,
    roles: ['Payroll Specialist']
  },
  {
    label: 'Dashboard',
    href: '/employee/payroll/execution/Manager',
    icon: LayoutDashboard,
    roles: ['Payroll Manager']
  },
  {
    label: 'Dashboard',
    href: '/employee/payroll/execution/Finance',
    icon: LayoutDashboard,
    roles: ['Finance Staff']
  },
  {
    label: 'Pre-Payroll Review',
    href: '/employee/payroll/execution/Specialist/pre-payroll',
    icon: FileCheck,
    roles: ['Payroll Specialist']
  },
   {
    label: 'Payroll Draft',
    href: '/employee/payroll/execution/Specialist/draft',
    icon: FileText,
    roles: ['Payroll Specialist']
  },
  {
    label: 'Payroll Runs',
    href: '/employee/payroll/execution/runs',
    icon: FolderKanban,
    roles: ['Payroll Specialist', 'Payroll Manager', 'Finance Staff']
  },
  {
    label: 'Escalated Issues',
    href: '/employee/payroll/execution/Manager/escalations',
    icon: AlertTriangle,
    roles: ['Payroll Manager']
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useUser();

  // Filter navigation items based on current role
  const visibleNavItems = navItems.filter((item) => item.roles.some(role => hasRole(role)));

  return (
    <aside className="fixed left-0 top-0 z-[40] h-screen w-64 border-r border-sidebar-border bg-sidebar transition-all">
      <div className="flex h-full flex-col mt-7">
        {/* Logo and Header */}

        <Box
          sx={{
            display: 'flex',
            mt: 'calc(var(--template-frame-height, 0px) + 4px)',
            p: 1.5
          }}
        >
          <ArcanaLogo />
        </Box>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/40">© 2025 Arcana</p>
        </div>
      </div>
    </aside>
  );
}
