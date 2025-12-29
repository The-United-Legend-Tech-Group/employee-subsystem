'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/payroll/libs/utils';
import {
  FileText,
  Users,
  ArrowLeft,
  Lock as LockIcon,
  FileEdit,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/payroll/components/ui/button';
import { useUser } from '@/payroll/libs/user-context';

export default function PayrollRunLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useUser();
  const payrollId = params.id as string;
  const payslipId = params.payslipId as string;

  // Hide tabs when viewing payslip detail
  const isPayslipDetail = pathname?.includes('/payslips/') && payslipId;

  const allTabs = [
    {
      name: 'Draft',
      href: `/employee/payroll/execution/runs/${payrollId}/draft`,
      icon: FileEdit,
      current:
        pathname === `/employee/payroll/execution/runs/${payrollId}/draft`
    },
    {
      name: 'Exceptions',
      href: `/employee/payroll/execution/runs/${payrollId}/exceptions`,
      icon: AlertTriangle,
      current:
        pathname === `/employee/payroll/execution/runs/${payrollId}/exceptions`
    },
    {
      name: 'Review & Approval',
      href: `/employee/payroll/execution/runs/${payrollId}/review`,
      icon: FileText,
      current:
        pathname === `/employee/payroll/execution/runs/${payrollId}/review`
    },
    {
      name: 'Payslips',
      href: `/employee/payroll/execution/runs/${payrollId}/payslips`,
      icon: Users,
      current:
        pathname === `/employee/payroll/execution/runs/${payrollId}/payslips`,
      specialistOnly: false
    },
    {
      name: 'Controls',
      href: `/employee/payroll/execution/runs/${payrollId}/controls`,
      icon: LockIcon,
      current:
        pathname === `/employee/payroll/execution/runs/${payrollId}/controls`,
      managerOnly: true
    }
  ];

  // Filter tabs based on role
  const tabs = allTabs.filter((tab) => {
    if (tab.managerOnly && role !== 'Payroll Manager') return false;
    return true;
  });

  return (
    <div>
      {/* Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex items-center" aria-label="Tabs">
          {/* Back Arrow */}
          <button
            onClick={() => {
              if (isPayslipDetail) {
                router.push(
                  `/employee/payroll/execution/runs/${payrollId}/payslips`
                );
              } else {
                router.push('/employee/payroll/execution/runs');
              }
            }}
            className="flex items-center justify-center px-2 py-4 mr-6 hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>

          {/* Tabs - Hidden on payslip detail */}
          <div className="flex space-x-8">
            {!isPayslipDetail &&
              tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={cn(
                      tab.current
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                      'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors'
                    )}
                  >
                    <Icon
                      className={cn(
                        tab.current
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground',
                        '-ml-0.5 mr-2 h-5 w-5'
                      )}
                      aria-hidden="true"
                    />
                    <span>{tab.name}</span>
                  </Link>
                );
              })}
          </div>
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
