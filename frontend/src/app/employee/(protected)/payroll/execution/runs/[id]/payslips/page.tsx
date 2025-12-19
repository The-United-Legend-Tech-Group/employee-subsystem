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
import { Input } from '@/payroll/components/ui/input';
import { Button } from '@/payroll/components/ui/button';
import { Badge } from '@/payroll/components/ui/badge';
import { Alert, AlertDescription } from '@/payroll/components/ui/alert';
import {
  Search,
  Download,
  Eye,
  Mail,
  Loader2,
  AlertCircle,
  Send,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/payroll/hooks/use-toast';
import {
  getPayrollPreview,
  getAllPayslipsForRun,
  generateAndDistributePayslips,
  getErrorMessage
} from '@/payroll/libs/api';
import type { PayrollRun, PaySlip, EmployeeInfo } from '@/payroll/libs/types';
import { getCookie } from '@/lib/auth-utils';
import { hasRole } from '@/lib/auth-utils';

function getAccessToken(): string {
  const token = getCookie('access_token');
  return token ? token.replace(/^Bearer\s+/i, '').trim() : '';
}

export default function PayrollPayslipsPage() {
  const params = useParams();
  const router = useRouter();
  const payrollId = params.id as string;

  const isSpecialist = hasRole('Payroll Specialist');
  const isManager = hasRole('Payroll Manager');

  const [searchTerm, setSearchTerm] = useState('');
  const [payroll, setPayroll] = useState<PayrollRun | null>(null);
  const [payslips, setPayslips] = useState<PaySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (payrollId) {
      fetchPayrollData();
    }
  }, [payrollId]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch payroll details
      const preview = await getPayrollPreview(payrollId);
      setPayroll(preview.payrollRun);

      // Fetch payslips
      const payslipsData = await getAllPayslipsForRun(payrollId);
      setPayslips(payslipsData || []);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayslips = async () => {
    if (!payroll) return;

    if (payroll.status !== 'approved') {
      toast({
        title: 'Cannot Generate',
        description: 'Payroll must be approved before generating payslips.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGenerating(true);
      await generateAndDistributePayslips(payrollId);
      toast({
        title: 'Success',
        description: 'Payslips generated and emails sent successfully.'
      });
      await fetchPayrollData();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const getEmployeeName = (
    employee: string | EmployeeInfo | undefined
  ): string => {
    if (!employee) return 'Unknown';
    if (typeof employee === 'string') return employee;
    return `${employee.firstName} ${employee.lastName}`;
  };

  const getEmployeeId = (
    employee: string | EmployeeInfo | undefined
  ): string => {
    if (!employee) return 'N/A';
    if (typeof employee === 'string') return employee;
    return employee.employeeId || 'N/A';
  };

  const filteredPayslips = payslips.filter((payslip) => {
    const employeeName = getEmployeeName(payslip.employeeId).toLowerCase();
    const employeeId = getEmployeeId(payslip.employeeId).toLowerCase();
    const search = searchTerm.toLowerCase();
    return employeeName.includes(search) || employeeId.includes(search);
  });

  const stats = {
    total: payslips.length,
    generated: payslips.filter((p) => p.paymentStatus === 'paid').length,
    pending: payslips.filter((p) => p.paymentStatus === 'pending').length
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

  if (error || !payroll) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Failed to load payroll data'}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/payroll/runs')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payroll Runs
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Action Button */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        {(isSpecialist || isManager) && payroll.status === 'approved' && (
          <Button
            onClick={handleGeneratePayslips}
            disabled={generating}
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {payslips.length === 0 ? 'Generating...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {payslips.length === 0
                  ? 'Generate & Email All'
                  : 'Send Emails'}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total payslips in this run
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid & Sent
            </CardTitle>
            <Mail className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.generated}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Payslips paid and emailed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payment
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payslips List */}
      {filteredPayslips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Payslips</CardTitle>
            <CardDescription>
              {payslips.length === 0
                ? 'Payslips have not been generated yet for this payroll run.'
                : 'No payslips match your search criteria.'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPayslips.map((payslip) => (
            <Card
              key={payslip._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {getEmployeeName(payslip.employeeId)}
                    </CardTitle>
                    <CardDescription>
                      ID: {getEmployeeId(payslip.employeeId)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      payslip.paymentStatus === 'paid' ? 'default' : 'secondary'
                    }
                  >
                    {payslip.paymentStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross Salary:</span>
                    <span className="font-medium">
                      ${payslip.totalGrossSalary?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deductions:</span>
                    <span className="font-medium text-red-600">
                      -${payslip.totaDeductions?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="font-semibold">Net Pay:</span>
                    <span className="font-bold text-green-600">
                      ${payslip.netPay?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      router.push(
                        `/employee/payroll/execution/runs/${payrollId}/payslips/${payslip._id}`
                      )
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function getAuthConfig() {
  const token = getAccessToken();

  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log('[PayrollPayslipsPage] No token found - relying on httpOnly cookies');
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as const;
}
