'use client';

import React from 'react';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/payroll/components/ui/table';
import { Badge } from '@/payroll/components/ui/badge';
import { Button } from '@/payroll/components/ui/button';
import { cn } from '@/payroll/libs/utils';

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
  bonus: number;
  allowances: number;
  deductions: number;

  grossSalary: number;
  netSalary: number;
  netPay: number;

  bankStatus?: string | null;

  hrEvents: string[];
  exceptionsFlags: PayrollFlag[];
  hasExceptions: boolean;
  status: string;
};

interface PayrollDraftTableProps {
  payrolls: EmployeePayrollRow[];
  payrollRunId: string;
}

export function PayrollDraftTable({
  payrolls,
  payrollRunId
}: PayrollDraftTableProps) {
  const hasRunId = Boolean(
    payrollRunId && String(payrollRunId).trim().length > 0
  );

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Run:</span>
          {hasRunId ? (
            <Badge variant="outline" className="font-mono text-xs">
              {payrollRunId}
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Missing payrollRunId
            </Badge>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Employee ID</TableHead>
            <TableHead>Base Salary</TableHead>
            <TableHead>Bonuses</TableHead>
            <TableHead>Allowances</TableHead>
            <TableHead>Deductions</TableHead>
            <TableHead>Net Pay</TableHead>
            <TableHead>HR Events</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Exceptions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {payrolls.map((p, index) => {
            const hasNegativePay = Number(p.netPay ?? 0) < 0;
            const isBad = Boolean(p.hasExceptions) || hasNegativePay;

            return (
              <TableRow
                key={p.id ?? `EMP-${index}`}
                className={cn(
                  isBad && 'bg-destructive/10',
                  'transition-colors'
                )}
              >
                <TableCell className="font-mono text-sm">
                  {p.employeeId}
                </TableCell>

                <TableCell className="font-semibold">
                  ${Number(p.baseSalary ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-green-600">
                  ${Number(p.bonus ?? 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  ${Number(p.allowances ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-red-600">
                  -${Number(p.deductions ?? 0).toLocaleString()}
                </TableCell>

                <TableCell
                  className={cn(
                    'font-bold',
                    hasNegativePay && 'text-destructive'
                  )}
                >
                  ${Number(p.netPay ?? 0).toLocaleString()}
                </TableCell>

                <TableCell>
                  {p.hrEvents?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {p.hrEvents.map((ev, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {ev}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={p.status === 'approved' ? 'default' : 'secondary'}
                  >
                    {p.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  {p.exceptionsFlags?.length ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      disabled={!hasRunId}
                    >
                      <Link
                        href={
                          hasRunId
                            ? `/employee/payroll/execution/runs/${encodeURIComponent(
                                payrollRunId
                              )}/exceptions?employeeId=${encodeURIComponent(
                                p.employeeId
                              )}`
                            : '#'
                        }
                      >
                        View ({p.exceptionsFlags.length})
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">0</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
