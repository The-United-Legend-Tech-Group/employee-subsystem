'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/payroll/components/ui/card';
import { Button } from '@/payroll/components/ui/button';
import { useToast } from '@/payroll/hooks/use-toast';
import { useUser } from '@/payroll/libs/user-context';
import {
  Send,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react';
import { Textarea } from '@/payroll/components/ui/textarea';
import { Label } from '@/payroll/components/ui/label';
import { Alert, AlertDescription } from '@/payroll/components/ui/alert';
import {
  getPayrollPreview,
  publishPayrollForApproval,
  approvePayrollByManager,
  approvePayrollByFinance,
  rejectPayroll,
  getErrorMessage
} from '@/payroll/libs/api';
import type {
  PayrollRun,
  PayrollPreview,
  EmployeeInfo
} from '@/payroll/libs/types';

export default function PayrollReviewPage() {
  const params = useParams();
  const router = useRouter();
  const payrollId = params.id as string;
  const { role } = useUser();

  const [payrollPreview, setPayrollPreview] = useState<PayrollPreview | null>(
    null
  );
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (payrollId) {
      fetchPayrollPreview();
    }
  }, [payrollId]);

  const fetchPayrollPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const preview = await getPayrollPreview(payrollId);
      setPayrollPreview(preview);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast({
        title: 'Error Loading Preview',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSubmitting(true);
      await publishPayrollForApproval(payrollId);
      toast({
        title: 'Sent for Approval',
        description: 'Payroll has been sent to the manager for review.'
      });
      setComments('');
      await fetchPayrollPreview();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleManagerApprove = async () => {
    try {
      setSubmitting(true);
      await approvePayrollByManager(payrollId);
      toast({
        title: 'Payroll Approved',
        description:
          'Payroll has been approved and sent to finance for final review.'
      });
      setComments('');
      await fetchPayrollPreview();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinanceApprove = async () => {
    try {
      setSubmitting(true);
      await approvePayrollByFinance(payrollId);
      toast({
        title: 'Payroll Finalized',
        description: 'Payroll has been approved and is ready for processing.'
      });
      setComments('');
      await fetchPayrollPreview();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting the payroll.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      await rejectPayroll(payrollId, comments);
      toast({
        title: 'Payroll Rejected',
        description: 'Payroll has been rejected and returned for revision.',
        variant: 'destructive'
      });
      setComments('');
      await fetchPayrollPreview();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getEmployeeName = (
    employee: string | EmployeeInfo | undefined
  ): string => {
    if (!employee) return 'Unknown';
    if (typeof employee === 'string') return employee;
    return `${employee.firstName} ${employee.lastName}`;
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !payrollPreview) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Failed to load payroll data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const payroll = payrollPreview.payrollRun;

  const canPublish =
    role === 'Payroll Specialist' && payroll.status === 'draft';
  const canManagerApprove =
    role === 'Payroll Manager' && payroll.status === 'under review';
  const canFinanceApprove =
    role === 'Finance Staff' && payroll.status === 'pending finance approval';
  const canReject =
    (role === 'Payroll Manager' && payroll.status === 'under review') ||
    (role === 'Finance Staff' && payroll.status === 'pending finance approval');

  const showActions = true; // Always show the form for the user's role
  const hasActiveActions =
    canPublish || canManagerApprove || canFinanceApprove || canReject;

  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>
            {payroll.runId || 'Loading...'} - {payroll.entity}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Period</div>
              <p className="font-semibold">
                {payroll.payrollPeriod &&
                  new Date(payroll.payrollPeriod).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {role === 'Finance Staff'
                  ? 'Manager Approved By'
                  : 'Created By'}
              </div>
              <p className="font-semibold">
                {role === 'Finance Staff'
                  ? getEmployeeName(payroll.payrollManagerId)
                  : getEmployeeName(payroll.payrollSpecialistId)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-border">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {role === 'Finance Staff' && <DollarSign className="h-4 w-4" />}
                <span>Total Employees</span>
              </div>
              <p className="text-2xl font-bold">{payroll.employees || 0}</p>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Exceptions</div>
              <p className="text-2xl font-bold">{payroll.exceptions || 0}</p>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {role === 'Finance Staff' ? 'Net Payout' : 'Net Payroll'}
              </div>
              <p
                className={`text-2xl font-bold ${role === 'Finance Staff' ? 'text-green-600' : ''
                  }`}
              >
                $
                {payroll.totalnetpay
                  ? payroll.totalnetpay.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                  : '0.00'}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-semibold">Payroll Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${payroll.status === 'under review' ||
                    payroll.status === 'pending finance approval'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                    }`}
                />
                <span className="text-sm capitalize">
                  {payroll.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${payroll.paymentStatus === 'pending'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                    }`}
                />
                <span className="text-sm">
                  Payment: {payroll.paymentStatus}
                </span>
              </div>
              {!!payroll.exceptions && payroll.exceptions > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {payroll.exceptions} exception(s) require attention
                  </span>
                </div>
              )}
              {payrollPreview && (
                <div className="text-sm text-muted-foreground">
                  Total Payslips: {payrollPreview.payslips?.length || 0}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-based Action Form - Always show for the user's role */}
      <Card>
        <CardHeader>
          <CardTitle>
            {role === 'Payroll Specialist' && 'Send for Approval'}
            {role === 'Payroll Manager' && 'Manager Decision'}
            {role === 'Finance Staff' && 'Final Approval'}
          </CardTitle>
          <CardDescription>
            {role === 'Payroll Specialist' &&
              'Submit payroll to manager and finance for final approval'}
            {role === 'Payroll Manager' && 'Approve or reject this payroll run'}
            {role === 'Finance Staff' &&
              'Approve or reject this payroll for processing'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasActiveActions && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {role === 'Payroll Specialist' &&
                  payroll.status !== 'under review' &&
                  `Payroll is currently at "${payroll.status}" stage. You can only send for approval when the status is "under review".`}
                {role === 'Payroll Manager' &&
                  payroll.status !== 'under review' &&
                  `Payroll is currently at "${payroll.status}" stage. You can only approve or reject when the status is "under review".`}
                {role === 'Finance Staff' &&
                  payroll.status !== 'pending finance approval' &&
                  `Payroll is currently at "${payroll.status}" stage. You can only approve or reject when the status is "pending finance approval".`}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="comments">
              Comments {canReject && '(Required for rejection)'}
            </Label>
            <Textarea
              id="comments"
              placeholder={
                canPublish
                  ? 'Add any notes or comments for the approvers...'
                  : canReject
                    ? 'Add your review comments (required for rejection)...'
                    : 'Add your financial review comments (required for rejection)...'
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              disabled={submitting}
            />
          </div>
          <div className="flex gap-3">
            {role === 'Payroll Specialist' && (
              <>
                <Button
                  onClick={handlePublish}
                  className="flex-1"
                  disabled={submitting || !canPublish}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send for Approval
                    </>
                  )}
                </Button>
              </>
            )}

            {role === 'Payroll Manager' && (
              <>
                <Button
                  onClick={handleManagerApprove}
                  className="flex-1"
                  disabled={submitting || !canManagerApprove}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve & Send to Finance
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  className="flex-1"
                  disabled={submitting || !canReject}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </Button>
              </>
            )}

            {role === 'Finance Staff' && (
              <>
                <Button
                  onClick={handleFinanceApprove}
                  className="flex-1"
                  disabled={submitting || !canFinanceApprove}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve & Finalize
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  className="flex-1"
                  disabled={submitting || !canReject}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Timeline - Show below the action form */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {payroll.status === 'rejected'
              ? 'Payroll Rejected'
              : payroll.status === 'under review'
                ? role === 'Payroll Specialist'
                  ? 'Payroll Under Review - Awaiting Manager Approval'
                  : 'Awaiting Manager Approval'
                : payroll.status === 'pending finance approval'
                  ? role === 'Payroll Specialist' || role === 'Payroll Manager'
                    ? 'Awaiting Finance Approval'
                    : 'Pending Finance Approval'
                  : payroll.status === 'approved'
                    ? 'Payroll Approved'
                    : payroll.status === 'locked'
                      ? 'Payroll Locked'
                      : 'Payroll Status'}
          </CardTitle>
          <CardDescription>
            {payroll.status === 'rejected' && payroll.rejectionReason
              ? payroll.rejectionReason
              : payroll.status === 'under review'
                ? role === 'Payroll Specialist'
                  ? 'Payroll has been submitted and is now awaiting manager review and approval'
                  : role === 'Finance Staff'
                    ? 'Payroll is awaiting manager approval'
                    : 'This payroll is awaiting your approval'
                : payroll.status === 'pending finance approval'
                  ? role === 'Payroll Specialist'
                    ? 'Manager has approved. Now waiting for finance department approval'
                    : role === 'Payroll Manager'
                      ? 'You have approved this payroll. Now awaiting finance department approval'
                      : 'This payroll is awaiting your approval'
                  : payroll.status === 'approved'
                    ? 'Payroll has been approved by both manager and finance'
                    : payroll.status === 'locked'
                      ? 'Payroll has been finalized and locked. No further changes can be made'
                      : 'Track the progress of this payroll'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${payroll.status !== 'draft'
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {payroll.status !== 'draft' ? '✓' : '1'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Created by Specialist</p>
                  <p className="text-xs text-muted-foreground">
                    {payroll.createdAt &&
                      new Date(payroll.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="ml-4 h-8 w-0.5 bg-border" />

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${payroll.managerApprovalDate
                    ? 'bg-green-500 text-white'
                    : payroll.status === 'under review'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {payroll.managerApprovalDate
                    ? '✓'
                    : payroll.status === 'under review'
                      ? '⋯'
                      : '2'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Manager Approval</p>
                  <p className="text-xs text-muted-foreground">
                    {payroll.managerApprovalDate
                      ? new Date(payroll.managerApprovalDate).toLocaleString()
                      : payroll.status === 'under review'
                        ? 'In progress...'
                        : 'Pending'}
                  </p>
                </div>
              </div>

              <div className="ml-4 h-8 w-0.5 bg-border" />

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${payroll.financeApprovalDate
                    ? 'bg-green-500 text-white'
                    : payroll.status === 'pending finance approval'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {payroll.financeApprovalDate
                    ? '✓'
                    : payroll.status === 'pending finance approval'
                      ? '⋯'
                      : '3'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Finance Approval</p>
                  <p className="text-xs text-muted-foreground">
                    {payroll.financeApprovalDate
                      ? new Date(payroll.financeApprovalDate).toLocaleString()
                      : payroll.status === 'pending finance approval'
                        ? 'In progress...'
                        : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Current Status:</strong>{' '}
                <span className="capitalize">
                  {payroll.status.replace(/_/g, ' ')}
                </span>
              </p>
              {payroll.rejectionReason && (
                <p className="text-sm text-destructive mt-2">
                  <strong>Rejection Reason:</strong> {payroll.rejectionReason}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
