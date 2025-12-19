'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/payroll/components/ui/card';
import { Button } from '@/payroll/components/ui/button';
import { Badge } from '@/payroll/components/ui/badge';
import { Alert, AlertDescription } from '@/payroll/components/ui/alert';
import { FreezeModal } from '@/payroll/components/modals/freeze-modal';
import type { PayrollRun, EmployeeInfo } from '@/payroll/libs/types';
import { useToast } from '@/payroll/hooks/use-toast';
import { getCookie, hasRole } from '@/lib/auth-utils';

import {
  Lock,
  Unlock,
  History,
  AlertTriangle,
  Loader2,
  AlertCircle
} from 'lucide-react';

import {
  getPayrollPreview,
  freezePayroll,
  unfreezePayroll,
  getErrorMessage
} from '@/payroll/libs/api';

/* =========================
   Auth helpers (FIXED)
========================= */

function getAccessToken(): string {
  const token = getCookie('accessToken');
  return token ? token.replace(/^Bearer\s+/i, '').trim() : '';
}

function getManagerId(
  managerId: string | { _id: string; [key: string]: any } | undefined
): string {
  if (!managerId) throw new Error('Manager ID is not available');
  if (typeof managerId === 'string') return managerId;
  return managerId._id;
}

/* ========================= */

type HistoryEntry = {
  action: string;
  by: string;
  reason?: string;
  timestamp: string;
};

export default function PayrollControlsPage() {
  const params = useParams();
  const payrollId = params.id as string;

  const [payroll, setPayroll] = useState<PayrollRun | null>(null);
  const [freezeModal, setFreezeModal] = useState<'freeze' | 'unfreeze' | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (payrollId) fetchPayrollData();
  }, [payrollId]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      setError(null);

      const preview = await getPayrollPreview(payrollId);
      setPayroll(preview.payrollRun);
      buildHistory(preview.payrollRun);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const buildHistory = (payroll: PayrollRun) => {
    const entries: HistoryEntry[] = [];

    entries.push({
      action: 'Payroll Created',
      by: getEmployeeName(payroll.payrollSpecialistId),
      timestamp: payroll.createdAt || new Date().toISOString()
    });

    if (payroll.managerApprovalDate) {
      entries.unshift({
        action: 'Manager Approved',
        by: getEmployeeName(payroll.payrollManagerId),
        timestamp: payroll.managerApprovalDate
      });
    }

    if (payroll.financeApprovalDate) {
      entries.unshift({
        action: 'Finance Approved',
        by: getEmployeeName(payroll.financeStaffId),
        timestamp: payroll.financeApprovalDate
      });
    }

    if (payroll.status === 'rejected' && payroll.rejectionReason) {
      entries.unshift({
        action: 'Payroll Rejected',
        by: 'Payroll Manager / Finance Staff',
        reason: payroll.rejectionReason,
        timestamp: new Date().toISOString()
      });
    }

    if (payroll.status === 'unlocked' && payroll.unlockReason) {
      entries.unshift({
        action: 'Payroll Unlocked',
        by: getEmployeeName(payroll.payrollManagerId),
        reason: payroll.unlockReason,
        timestamp: new Date().toISOString()
      });
    }

    if (payroll.status === 'locked') {
      entries.unshift({
        action: 'Payroll Locked',
        by: getEmployeeName(payroll.payrollManagerId),
        timestamp: new Date().toISOString()
      });
    }

    setHistory(entries);
  };

  const getEmployeeName = (
    employee: string | EmployeeInfo | undefined
  ): string => {
    if (!employee) return 'Unknown';
    if (typeof employee === 'string') return employee;
    return `${employee.firstName} ${employee.lastName}`;
  };

  const handleFreeze = async () => {
    if (!payroll) return;

    try {
      setSubmitting(true);
      const managerId = getManagerId(payroll.payrollManagerId);
      await freezePayroll(payroll._id, managerId);

      toast({
        title: 'Payroll Frozen',
        description: 'Payroll has been locked successfully.'
      });

      setFreezeModal(null);
      fetchPayrollData();
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnfreeze = async (reason: string) => {
    if (!payroll || !reason.trim()) return;

    try {
      setSubmitting(true);
      const managerId = getManagerId(payroll.payrollManagerId);
      await unfreezePayroll(payroll._id, managerId, reason);

      toast({
        title: 'Payroll Unfrozen',
        description: 'Payroll has been unlocked.'
      });

      setFreezeModal(null);
      fetchPayrollData();
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFrozen = payroll?.status === 'locked';
  const canFreeze = payroll?.status === 'approved';

  const isManager = hasRole('Payroll Manager');

  if (!isManager) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Only managers can access payroll controls.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!payroll) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Failed to load payroll'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle>Payroll Status</CardTitle>
              <CardDescription>Run ID: {payroll.runId}</CardDescription>
            </div>
            <Badge variant={isFrozen ? 'destructive' : 'default'}>
              {isFrozen ? 'Frozen' : 'Active'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Payroll Period</p>
              <p className="font-semibold">
                {payroll.payrollPeriod
                  ? new Date(payroll.payrollPeriod).toLocaleDateString()
                  : '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Entity</p>
              <p className="font-semibold">{payroll.entity}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <p className="font-semibold capitalize">
                {(payroll.status ?? 'unknown').replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            {!isFrozen && canFreeze ? (
              <Button
                variant="destructive"
                onClick={() => setFreezeModal('freeze')}
                disabled={submitting}
              >
                <Lock className="mr-2 h-4 w-4" />
                Freeze Payroll
              </Button>
            ) : isFrozen ? (
              <Button
                onClick={() => setFreezeModal('unfreeze')}
                disabled={submitting}
              >
                <Unlock className="mr-2 h-4 w-4" />
                Unfreeze Payroll
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Payroll must be approved before freezing
              </p>
            )}
          </div>

          {isFrozen && (
            <div className="flex gap-3 p-4 bg-destructive/10 border rounded">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Payroll is locked and cannot be modified until unfrozen by a manager.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <FreezeModal
        open={!!freezeModal}
        onClose={() => setFreezeModal(null)}
        onConfirm={freezeModal === 'freeze' ? handleFreeze : handleUnfreeze}
        action={freezeModal || 'freeze'}
      />
    </div>
  );
}
