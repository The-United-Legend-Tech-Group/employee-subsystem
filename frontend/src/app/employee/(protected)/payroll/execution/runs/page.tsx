'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/payroll/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/payroll/components/ui/card';
import { Badge } from '@/payroll/components/ui/badge';
import { Alert, AlertDescription } from '@/payroll/components/ui/alert';
import { Loader2, AlertCircle, Calendar, Building2, Users } from 'lucide-react';
import { useToast } from '@/payroll/hooks/use-toast';
import { getPayrollsForReview, getErrorMessage } from '@/payroll/libs/api';
import type { PayrollRun, EmployeeInfo } from '@/payroll/libs/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/payroll/components/ui/table';
import { getCookie } from '@/lib/auth-utils';

export default function PayrollRunsPage() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPayrollsForReview();
      setPayrolls(data || []);
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

  const getEmployeeName = (
    employee: string | EmployeeInfo | undefined
  ): string => {
    if (!employee) return 'Unknown';
    if (typeof employee === 'string') return employee;
    return "${employee.firstName} ${employee.lastName}";
  };

  const getStatusVariant = (
    status?: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const s = (status ?? '').toLowerCase();

    switch (s) {
      case 'approved':
      case 'locked':
        return 'default';
      case 'published':
      case 'pending finance approval':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatStatusLabel = (status?: string) =>
    (status ?? 'unknown').replace(/_/g, ' ');

  const handleRowClick = (payrollId: string) => {
  router.push(`/employee/payroll/execution/runs/${payrollId}/draft`);
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Payroll Runs"
          description="View and manage all payroll runs"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Payroll Runs"
          description="View and manage all payroll runs"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (payrolls.length === 0) {
    return (
      <div>
        <PageHeader
          title="Payroll Runs"
          description="View and manage all payroll runs"
        />
        <Card>
          <CardHeader>
            <CardTitle>No Payroll Runs</CardTitle>
            <CardDescription>
              There are currently no payroll runs available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Payroll Runs"
        description="View and manage all payroll runs"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrolls.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrolls.filter((p) => p.status === 'under review').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrolls.filter((p) => p.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
            {payrolls.reduce((sum, p) => {
  const employees = typeof p.employees === 'number' ? p.employees : 0;
  return sum + employees;
}, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payroll Runs</CardTitle>
          <CardDescription>
            Click on a row to view details and manage payslips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run ID</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Total Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.map((payroll) => (
                <TableRow
                  key={payroll._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(payroll._id)}
                >
                  <TableCell className="font-medium">{payroll.runId}</TableCell>

                  <TableCell>
                    {payroll.payrollPeriod &&
                      new Date(payroll.payrollPeriod).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          year: 'numeric'
                        }
                      )}
                  </TableCell>

                  <TableCell>{payroll.entity}</TableCell>

                  <TableCell>{payroll.employees}</TableCell>

                  <TableCell>${payroll.totalnetpay?.toLocaleString() || '0'}</TableCell>

                  <TableCell>
                    <Badge variant={getStatusVariant(payroll.status)}>
                      {formatStatusLabel(payroll.status)}
                    </Badge>
                  </TableCell>

                  <TableCell>{getEmployeeName(payroll.payrollSpecialistId)}</TableCell>

                  <TableCell>
                    {payroll.createdAt &&
                      new Date(payroll.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}