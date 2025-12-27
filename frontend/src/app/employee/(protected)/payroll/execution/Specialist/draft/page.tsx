'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getCookie } from '@/lib/auth-utils';

import { PageHeader } from '@/payroll/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/payroll/components/ui/card';
import { Button } from '@/payroll/components/ui/button';
import { PayrollDraftTable } from '@/payroll/components/tables/payroll-draft-table';
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

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

  // ✅ backend-owned fields (no frontend calculations / fallbacks)
  grossSalary: number;
  netSalary: number;
  netPay: number;

  bankStatus?: string | null;

  hrEvents: string[];

  // ✅ backend-owned (no parsing from strings)
  exceptionsFlags: PayrollFlag[];
  hasExceptions: boolean;

  status: string;
};

type PayrollDraft = {
  entity: string;
  payrollRunId: string;

  // "YYYY-MM-DD"
  payrollPeriod: string;

  employees: EmployeePayrollRow[];
};

type PayrollRunSummary = {
  employees?: number;
  exceptions?: number;
  totalnetpay?: number;
};

const ENTITY = 'Acme Corp';

/**
 * Read token at request-time to avoid stale/null in Next.js.
 * Uses withCredentials: true to prioritize httpOnly cookies.
 */
function getAccessToken(): string {
  const token = getCookie('access_token');
  return token ? token.replace(/^Bearer\s+/i, '').trim() : '';
}

function getAuthConfig() {
  const token = getAccessToken();

  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log('[Draft] No localStorage token - relying on httpOnly cookies');
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as const;
}

/**
 * ✅ No business logic here:
 * - No gross/net calculations
 * - No exception parsing/synthesis
 * Just map backend output into UI rows.
 */
function mapEmployeesToRows(employees: any[], fallbackRunId: string): EmployeePayrollRow[] {
  let raw: any[] = employees ?? [];
  if (!Array.isArray(raw)) raw = [raw];

  return raw.map((emp: any, index: number) => {
    const employeeId = String(emp?.employeeId ?? `EMP-${index + 1}`);
    const runId = String(emp?.payrollRunId ?? fallbackRunId ?? '');

    return {
      id: employeeId,
      payrollRunId: runId,
      employeeId,

      baseSalary: Number(emp?.baseSalary ?? 0),
      allowances: Number(emp?.allowances ?? 0),
      deductions: Number(emp?.deductions ?? 0),
      bonus: Number(emp?.bonus ?? 0),
      benefit: Number(emp?.benefit ?? 0),

      grossSalary: Number(emp?.grossSalary ?? 0),
      netSalary: Number(emp?.netSalary ?? 0),
      netPay: Number(emp?.netPay ?? 0),

      bankStatus: emp?.bankStatus ?? null,

      hrEvents: Array.isArray(emp?.hrEvents) ? emp.hrEvents : [],

      exceptionsFlags: Array.isArray(emp?.exceptionsFlags) ? emp.exceptionsFlags : [],
      hasExceptions: Boolean(emp?.hasExceptions ?? false),

      status: String(emp?.status ?? 'draft')
    };
  });
}

function formatDateYYYYMMDD(d: Date): string {
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dateToLocalMidnightISO(yyyyMMdd: string): string {
  const dt = new Date(`${yyyyMMdd}T00:00:00`);
  return dt.toISOString();
}

export default function PayrollDraftPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [approvedDate, setApprovedDate] = useState<string>('');

  const [payrollDraft, setPayrollDraft] = useState<PayrollDraft>({
    entity: ENTITY,
    payrollRunId: '',
    payrollPeriod: '',
    employees: []
  });

  // ✅ Backend summary (authoritative)
  const [runSummary, setRunSummary] = useState<PayrollRunSummary>({});

  const [hasDraft, setHasDraft] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = formatDateYYYYMMDD(new Date());
    setSelectedDate(today);
  }, []);

  const reloadRunEmployees = async (runId: string) => {
    const empRes = await axios.get(
      `${BACKEND_URL}/payroll/runs/${runId}/employees`,
      getAuthConfig()
    );

    const rows = mapEmployeesToRows(empRes?.data ?? [], runId);

    setPayrollDraft((prev) => ({
      ...prev,
      payrollRunId: runId,
      employees: rows
    }));
  };

  const reloadRunSummary = async (runId: string) => {
    const runRes = await axios.get(
      `${BACKEND_URL}/payroll/runs/${runId}`,
      getAuthConfig()
    );

    const run = runRes?.data ?? {};
    setRunSummary({
      employees: Number(run?.employees ?? 0),
      exceptions: Number(run?.exceptions ?? 0),
      totalnetpay: Number(run?.totalnetpay ?? 0)
    });
  };

  const approveDate = () => {
    if (!selectedDate) {
      setError('Please pick a date before approving.');
      return;
    }
    setError(null);
    setApprovedDate(selectedDate);

    setPayrollDraft((prev) => ({
      ...prev,
      payrollPeriod: selectedDate
    }));
  };

  const rejectDate = () => {
    setApprovedDate('');
    setError(null);

    setPayrollDraft((prev) => ({
      ...prev,
      payrollPeriod: ''
    }));
  };

  const createDraft = async () => {
    if (!approvedDate) {
      setError('Approve the payroll date first, then create the draft.');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const payrollPeriodTimestamp = dateToLocalMidnightISO(approvedDate);

      setPayrollDraft((prev) => ({
        ...prev,
        payrollPeriod: approvedDate
      }));

      const res = await axios.post(
        `${BACKEND_URL}/payroll/generate-draft`,
        {
          entity: ENTITY,
          payrollPeriod: approvedDate, // "YYYY-MM-DD"
          payrollPeriodTimestamp
        },
        getAuthConfig()
      );

      const runId = String(res?.data?.payrollRunId ?? '');
      if (!runId) throw new Error('No payrollRunId returned from backend');

      setPayrollDraft((prev) => ({
        ...prev,
        payrollRunId: runId
      }));

      setHasDraft(true);

      // Load both; UI will show fast fallbacks until backend summary arrives.
      await Promise.all([reloadRunEmployees(runId), reloadRunSummary(runId)]);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create draft');
    } finally {
      setCreating(false);
    }
  };

  // ---------------------------
  // Option A: UI smoothing
  // - backend is source of truth
  // - frontend provides display fallbacks derived from rows only
  // ---------------------------
  const totalEmployeesFallback = payrollDraft.employees.length;

  const totalGrossPayFallback = useMemo(
    () => payrollDraft.employees.reduce((sum, p) => sum + Number(p.grossSalary ?? 0), 0),
    [payrollDraft.employees]
  );

  const totalNetPayFallback = useMemo(
    () => payrollDraft.employees.reduce((sum, p) => sum + Number(p.netPay ?? 0), 0),
    [payrollDraft.employees]
  );

  const exceptionsCountFallback = useMemo(
    () => payrollDraft.employees.reduce((sum, p) => sum + (p.exceptionsFlags?.length ?? 0), 0),
    [payrollDraft.employees]
  );

  const displayedEmployees =
    runSummary.employees ?? totalEmployeesFallback;

  const displayedNetPay =
    runSummary.totalnetpay ?? totalNetPayFallback;

  const displayedExceptions =
    runSummary.exceptions ?? exceptionsCountFallback;

  const isApproved = Boolean(approvedDate) && approvedDate === selectedDate;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Payroll Initiation & Draft"
          description="Pick date → Approve/Reject → Create Draft (disabled until approved)."
        />

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={selectedDate}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedDate(v);

              // If user edits after approval, clear approval
              if (approvedDate && v !== approvedDate) {
                setApprovedDate('');
                setPayrollDraft((prev) => ({ ...prev, payrollPeriod: '' }));
              }
            }}
          />

          <Button
            type="button"
            variant="secondary"
            onClick={approveDate}
            disabled={!selectedDate || isApproved}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={rejectDate}
            disabled={!approvedDate}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>

          <Button onClick={createDraft} disabled={creating || !approvedDate}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Draft'
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {approvedDate ? (
          <>
            Approved payroll date:{' '}
            <span className="font-medium text-foreground">{approvedDate}</span>
            {selectedDate !== approvedDate && (
              <span className="ml-2 text-red-600">(edited — please approve again)</span>
            )}
          </>
        ) : (
          <>No approved payroll date yet.</>
        )}
      </div>

      {error && <div className="mt-4 p-4 text-sm text-red-600">{error}</div>}

      {!hasDraft ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No Draft Yet</CardTitle>
            <CardDescription>Select a payroll date, approve it, then click Create Draft.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(displayedEmployees)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${Number(totalGrossPayFallback).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${Number(displayedNetPay).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(displayedExceptions)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employee Payroll Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <PayrollDraftTable
                payrolls={payrollDraft.employees}
                payrollRunId={payrollDraft.payrollRunId}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
