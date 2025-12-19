'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getCookie } from '@/lib/auth-utils';

function getAccessToken(): string {
  const token = getCookie('access_token');
  return token ? token.replace(/^Bearer\s+/i, '').trim() : '';
}

function getAuthConfig() {
  const token = getAccessToken();
  
  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log('[RunExceptions] No localStorage token - relying on httpOnly cookies');
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as const;
}

import { PageHeader } from '@/payroll/components/layout/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/payroll/components/ui/card';
import { ExceptionsTable } from '@/payroll/components/tables/exceptions-table';
import { Button } from '@/payroll/components/ui/button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Exception } from '@/payroll/libs/types';
import { useToast } from '@/payroll/hooks/use-toast';
import { cn } from '@/payroll/libs/utils';

type Priority = 'high' | 'medium' | 'low';

const classifyType = (msg: string): Exception['type'] => {
  const m = (msg || '').toLowerCase();
  if (m.includes('bank')) return 'missing-bank';
  if (m.includes('negative')) return 'negative-pay';
  if (m.includes('spike')) return 'salary-spike';
  return 'calculation-error';
};

const computePriority = (msg: string): Priority => {
  const m = (msg || '').toLowerCase();
  if (
    m.includes('missing bank') ||
    m.includes('bank details') ||
    m.includes('bank account') ||
    m.includes('negative') ||
    m.includes('exceeds gross')
  )
    return 'high';

  if (
    m.includes('exceeds net') ||
    m.includes('irregular') ||
    m.includes('calculation') ||
    m.includes('pay grade')
  )
    return 'medium';

  return 'low';
};

export default function ExceptionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const payrollRunId = params.id as string;

  const employeeIdFilter = searchParams?.get('employeeId') || null;
  const isEmployeeFiltered = Boolean(employeeIdFilter);

  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const fetchExceptions = async () => {
      try {
        setLoading(true);
        setError(null);

        const BACKEND_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:50000';

        // GET /payroll/exceptions?payrollRunId=...&employeeId=...
        const res = await axios.get(
          `${BACKEND_URL}/payroll/exceptions`,
          {
            ...getAuthConfig(),
            params: {
              payrollRunId,
              employeeId: employeeIdFilter || undefined
            }
          }
        );

        const list: any[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.exceptions)
          ? res.data.exceptions
          : [];

        const flat: Exception[] = list.map((x: any, idx: number) => {
          const description = String(
            x?.description ?? x?.message ?? 'Payroll exception detected'
          );
          const priority = computePriority(description);

          return {
            id: String(x?.id ?? `${x?.employeeId ?? 'emp'}-${idx}`),
            employeeId: String(x?.employeeId ?? ''),
            type: classifyType(description),
            severity: priority, // UI priority
            description,
            status: 'pending'
          };
        });

        setExceptions(flat);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load exceptions');
      } finally {
        setLoading(false);
      }
    };

    fetchExceptions();
  }, [payrollRunId, employeeIdFilter, router]);

  const handleResolve = async (id: string) => {
    try {
      const exception = exceptions.find((exc) => exc.id === id);
      if (!exception) return;

      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:50000';

      // Call API to clear the exceptions field for this employee
      await axios.patch(
        `${BACKEND_URL}/payroll/execution/employee/${exception.employeeId}/clear-exceptions`,
        {
          payrollRunId
        },
        getAuthConfig()
      );

      // Update local state to reflect resolved status
      setExceptions((prev) =>
        prev.map((exc) =>
          exc.id === id ? { ...exc, status: 'resolved' as const } : exc
        )
      );

      toast({
        title: 'Exception Resolved',
        description: 'Exception has been cleared for this employee.'
      });
    } catch (err: any) {
      console.error('Failed to resolve exception:', err);
      toast({
        title: 'Error',
        description:
          err?.response?.data?.message || 'Failed to resolve exception',
        variant: 'destructive'
      });
    }
  };

  const pendingScoped = useMemo(() => {
    let list = exceptions.filter((e) => e.status === 'pending');
    if (employeeIdFilter) {
      list = list.filter(
        (e) => String(e.employeeId) === String(employeeIdFilter)
      );
    }
    return list;
  }, [exceptions, employeeIdFilter]);

  const highPriority = pendingScoped.filter(
    (e) => e.severity === 'high'
  ).length;
  const mediumPriority = pendingScoped.filter(
    (e) => e.severity === 'medium'
  ).length;
  const lowPriority = pendingScoped.filter((e) => e.severity === 'low').length;

  const visible = useMemo(() => {
    let list = pendingScoped;
    if (priorityFilter)
      list = list.filter((e) => e.severity === priorityFilter);
    return list;
  }, [pendingScoped, priorityFilter]);

  if (loading)
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading exceptions…
      </div>
    );

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div>
      <PageHeader
        title="Payroll Exceptions"
        description="Review and resolve irregularities in the payroll data"
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {priorityFilter && (
          <Button variant="secondary" onClick={() => setPriorityFilter(null)}>
            Clear Priority Filter
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => setPriorityFilter('high')}
          className={cn(
            'cursor-pointer transition hover:shadow-md',
            priorityFilter === 'high' && 'ring-2 ring-destructive'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriority}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => setPriorityFilter('medium')}
          className={cn(
            'cursor-pointer transition hover:shadow-md',
            priorityFilter === 'medium' && 'ring-2 ring-primary'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Medium Priority
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediumPriority}</div>
            <p className="text-xs text-muted-foreground">Should be reviewed</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => setPriorityFilter('low')}
          className={cn(
            'cursor-pointer transition hover:shadow-md',
            priorityFilter === 'low' && 'ring-2 ring-muted-foreground'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Priority</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowPriority}</div>
            <p className="text-xs text-muted-foreground">For information</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exception List</CardTitle>
          <CardDescription>
            {employeeIdFilter
              ? `Pending exceptions for Employee: ${employeeIdFilter}`
              : 'All pending exceptions'}
            {priorityFilter ? ` • Priority: ${priorityFilter}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExceptionsTable exceptions={visible} onResolve={handleResolve} />
        </CardContent>
      </Card>
    </div>
  );
}
