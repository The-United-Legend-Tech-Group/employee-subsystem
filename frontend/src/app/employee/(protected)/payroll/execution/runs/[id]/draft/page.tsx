'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { getCookie } from '@/lib/auth-utils';

function getAccessToken(): string {
  const token = getCookie('access_token');
  return token ? token.replace(/^Bearer\s+/i, '').trim() : '';
}

function getAuthConfig() {
  const token = getAccessToken();

  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log('[RunDraft] No localStorage token - relying on httpOnly cookies');
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as const;
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/payroll/components/ui/card';
import { PayrollDraftTable } from '@/payroll/components/tables/payroll-draft-table';
import { Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

type PayrollFlag = {
  code: string;
  message: string;
  field?: string;
  severity: 'warn' | 'error';
};

type EmployeePayrollRow = {
  id: string;
  payrollRunId: string;
  employeeId: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  bonus: number;
  benefit: number;
  grossSalary: number;
  netSalary: number;
  netPay: number;
  bankStatus?: string | null;
  hrEvents: string[];
  exceptionsFlags: PayrollFlag[];
  hasExceptions: boolean;
  status: string;
};

function exceptionsStringToFlags(ex: unknown): PayrollFlag[] {
  const raw = String(ex ?? '').trim();
  if (!raw) return [];
  return raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((message) => ({
      code: 'EXCEPTION',
      message,
      severity: 'warn' as const
    }));
}

function mapEmployeesToRows(
  employees: any[],
  runId: string
): EmployeePayrollRow[] {
  let rawEmployees: any[] = employees ?? [];
  if (!Array.isArray(rawEmployees)) rawEmployees = [rawEmployees];

  return rawEmployees.map((emp: any, index: number) => {
    const employeeId = String(emp?.employeeId ?? `EMP-${index + 1}`);

    const baseSalary = Number(emp?.baseSalary ?? 0);
    const allowances = Number(emp?.allowances ?? 0);
    const deductions = Number(emp?.deductions ?? 0);
    const bonus = Number(emp?.bonus ?? 0);
    const benefit = Number(emp?.benefit ?? 0);

    const grossSalary = Number(
      emp?.grossSalary ?? baseSalary + allowances + bonus + benefit
    );
    const netSalary = Number(emp?.netSalary ?? 0);
    const netPay = Number(emp?.netPay ?? 0);

    const exceptionsFlags: PayrollFlag[] = Array.isArray(emp?.exceptionsFlags)
      ? emp.exceptionsFlags
      : exceptionsStringToFlags(emp?.exceptions);

    const hasExceptions = Boolean(
      emp?.hasExceptions ?? exceptionsFlags.length > 0
    );

    return {
      id: employeeId,
      payrollRunId: String(emp?.payrollRunId ?? runId),
      employeeId,

      baseSalary,
      allowances,
      deductions,
      bonus,
      benefit,

      grossSalary,
      netSalary,
      netPay,

      bankStatus: emp?.bankStatus ?? null,

      // If backend doesn't send hrEvents here, keep empty array
      hrEvents: Array.isArray(emp?.hrEvents) ? emp.hrEvents : [],
      exceptionsFlags,
      hasExceptions,
      status: emp?.status ?? (hasExceptions ? 'under review' : 'draft')
    };
  });
}

export default function PayrollDraftPage() {
  const params = useParams();
  const payrollRunId = params.id as string;

  const [payrolls, setPayrolls] = useState<EmployeePayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  useEffect(() => {
    const fetchRunDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Pure view: get employees for this run
        // Adjust route if your controller differs
        const empRes = await axios.get(
          `${BACKEND_URL}/payroll/runs/${payrollRunId}/employees`,
          getAuthConfig()
        );

        const employees = empRes?.data ?? [];
        setPayrolls(mapEmployeesToRows(employees, payrollRunId));
      } catch (err: any) {
        console.error('Fetching payroll run details failed', err);
        const message =
          err?.response?.data?.message ||
          'Failed to retrieve payroll run details';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (payrollRunId) fetchRunDetails();
  }, [BACKEND_URL, payrollRunId]);

  const totalEmployees = payrolls.length;
  const totalGrossPay = useMemo(
    () => payrolls.reduce((sum, p) => sum + Number(p.grossSalary ?? 0), 0),
    [payrolls]
  );
  const totalNetPay = useMemo(
    () => payrolls.reduce((sum, p) => sum + Number(p.netPay ?? 0), 0),
    [payrolls]
  );
  const exceptionsCount = useMemo(
    () =>
      payrolls.reduce((sum, p) => sum + (p.exceptionsFlags?.length ?? 0), 0),
    [payrolls]
  );

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading payroll run details…
      </div>
    );
  }

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Included in run</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalGrossPay.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Before deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalNetPay.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Final payable amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exceptionsCount}</div>
            <p className="text-xs text-muted-foreground">Require review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Breakdown</CardTitle>
          <CardDescription>Payroll details for this run</CardDescription>
        </CardHeader>
        <CardContent>
          <PayrollDraftTable payrolls={payrolls} payrollRunId={payrollRunId} />
        </CardContent>
      </Card>
    </div>
  );
}
