'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/payroll/components/ui/card';
import { Badge } from '@/payroll/components/ui/badge';
import { Alert, AlertDescription } from '@/payroll/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  Mail,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { useToast } from '@/payroll/hooks/use-toast';
import {
  getPayrollPreview,
  getAllPayslipsForRun,
  getErrorMessage
} from '@/payroll/libs/api';
import type { PaySlip, EmployeeInfo, PayrollRun } from '@/payroll/libs/types';

function getAccessToken(): string {
  const raw = localStorage.getItem('access_token') || '';
  return raw.replace(/^Bearer\s+/i, '').replace(/^"+|"+$/g, '').trim();
}

function getAuthConfig() {
  const token = getAccessToken();

  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log('[PayslipDetail] No localStorage token - relying on httpOnly cookies');
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as const;
}

export default function PayslipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const payrollId = params.id as string;
  const payslipId = params.payslipId as string;

  const [payslip, setPayslip] = useState<PaySlip | null>(null);
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayslipData();
  }, [payslipId, payrollId]);

  const fetchPayslipData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get payroll run details
      const preview = await getPayrollPreview(payrollId);
      setPayrollRun(preview.payrollRun);

      // Get all payslips for this run
      const payslips = await getAllPayslipsForRun(payrollId);
      const foundPayslip = payslips.find((p: PaySlip) => p._id === payslipId);

      if (!foundPayslip) {
        setError('Payslip not found');
        return;
      }

      setPayslip(foundPayslip);
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
    const emp = employee as any;
    return emp.fullName || `${employee.firstName} ${employee.lastName}`;
  };

  const getEmployeeEmail = (
    employee: string | EmployeeInfo | undefined
  ): string => {
    if (!employee) return 'N/A';
    if (typeof employee === 'string') return 'N/A';
    const emp = employee as any;
    return emp.workEmail || emp.personalEmail || 'N/A';
  };

  const getEmployeeNumber = (
    employee: string | EmployeeInfo | undefined
  ): string => {
    if (!employee) return 'N/A';
    if (typeof employee === 'string') return employee;
    const emp = employee as any;
    return emp.employeeNumber || employee._id;
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

  if (error || !payslip) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Payslip not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const employeeName = getEmployeeName(payslip.employeeId);
  const employeeEmail = getEmployeeEmail(payslip.employeeId);
  const employeeNumber = getEmployeeNumber(payslip.employeeId);

  // Calculate totals
  const totalEarnings =
    payslip.earningsDetails.baseSalary +
    (payslip.earningsDetails.allowances?.reduce(
      (sum, a) => sum + (a.amount || 0),
      0
    ) || 0) +
    (payslip.earningsDetails.bonuses?.reduce(
      (sum, b) => sum + (b.amount || 0),
      0
    ) || 0) +
    (payslip.earningsDetails.benefits?.reduce(
      (sum, b) => sum + (b.amount || 0),
      0
    ) || 0) +
    (payslip.earningsDetails.refunds?.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    ) || 0);

  // Tax calculation: rate% of baseSalary
  const totalTaxes =
    payslip.deductionsDetails.taxes?.reduce((sum, t) => {
      const taxData = t as any;
      return (
        sum + ((taxData.rate || 0) * payslip.earningsDetails.baseSalary) / 100
      );
    }, 0) || 0;

  // Insurance calculation: employeeRate% of baseSalary (not amount)
  // The 'amount' in insurance is the coverage amount, not the base for calculation
  const totalInsurance =
    payslip.deductionsDetails.insurances?.reduce((sum, i) => {
      const insuranceData = i as any;
      // Employee pays employeeRate% of their base salary
      return (
        sum +
        ((insuranceData.employeeRate || 0) *
          payslip.earningsDetails.baseSalary) /
        100
      );
    }, 0) || 0;

  const totalPenalties = payslip.deductionsDetails.penalties?.amount || 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payslip - {employeeName}</h1>
        <p className="text-muted-foreground mt-2">
          Payroll Run: {payrollRun?.runId || 'N/A'} | Period:{' '}
          {payrollRun?.payrollPeriod
            ? new Date(payrollRun.payrollPeriod).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            : 'N/A'}
        </p>
      </div>

      {/* Employee Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-semibold">{employeeName}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Employee Number
                </div>
                <div className="font-mono font-semibold">{employeeNumber}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-semibold text-sm">{employeeEmail}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Payment Status
                </div>
                <Badge
                  variant={
                    payslip.paymentStatus === 'paid' ? 'default' : 'secondary'
                  }
                >
                  {payslip.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              $
              {payslip.totalGrossSalary.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              -$
              {payslip.totaDeductions.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              $
              {payslip.netPay.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
            <CardDescription>
              Detailed breakdown of all earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="font-medium">Base Salary</span>
              <span className="font-semibold">
                $
                {payslip.earningsDetails.baseSalary.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            {payslip.earningsDetails.allowances &&
              payslip.earningsDetails.allowances.length > 0 && (
                <div>
                  <div className="font-medium mb-2 text-sm text-muted-foreground">
                    Allowances
                  </div>
                  {payslip.earningsDetails.allowances.map((allowance, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 pl-4"
                    >
                      <span className="text-sm">{allowance.name}</span>
                      <span className="text-sm font-semibold text-green-600">
                        +$
                        {(allowance.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {payslip.earningsDetails.bonuses &&
              payslip.earningsDetails.bonuses.length > 0 && (
                <div>
                  <div className="font-medium mb-2 text-sm text-muted-foreground">
                    Bonuses
                  </div>
                  {payslip.earningsDetails.bonuses.map((bonus, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 pl-4"
                    >
                      <span className="text-sm">
                        {(bonus as any).name || 'Bonus'}
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        +$
                        {(bonus.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {payslip.earningsDetails.benefits &&
              payslip.earningsDetails.benefits.length > 0 && (
                <div>
                  <div className="font-medium mb-2 text-sm text-muted-foreground">
                    Benefits
                  </div>
                  {payslip.earningsDetails.benefits.map((benefit, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 pl-4"
                    >
                      <span className="text-sm">
                        {(benefit as any).name || 'Benefit'}
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        +$
                        {(benefit.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {payslip.earningsDetails.refunds &&
              payslip.earningsDetails.refunds.length > 0 && (
                <div>
                  <div className="font-medium mb-2 text-sm text-muted-foreground">
                    Refunds
                  </div>
                  {payslip.earningsDetails.refunds.map((refund, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 pl-4"
                    >
                      <span className="text-sm">
                        {refund.reason || 'Refund'}
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        +$
                        {(refund.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            <div className="flex items-center justify-between py-3 border-t-2 border-primary">
              <span className="font-bold">Total Earnings</span>
              <span className="font-bold text-lg text-green-600">
                $
                {totalEarnings.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Deductions Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Deductions Breakdown</CardTitle>
            <CardDescription>
              Detailed breakdown of all deductions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payslip.deductionsDetails.taxes &&
              payslip.deductionsDetails.taxes.length > 0 && (
                <div>
                  <div className="font-medium mb-2 text-sm text-muted-foreground">
                    Taxes
                  </div>
                  {payslip.deductionsDetails.taxes.map((tax, idx) => {
                    const taxData = tax as any;
                    // rate% of baseSalary
                    const taxAmount =
                      ((taxData.rate || 0) *
                        payslip.earningsDetails.baseSalary) /
                      100;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 pl-4"
                      >
                        <span className="text-sm">
                          {taxData.name} ({taxData.rate}% of base salary)
                        </span>
                        <span className="text-sm font-semibold text-red-600">
                          -$
                          {taxAmount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between py-2 pl-4 border-t mt-2">
                    <span className="font-medium text-sm">Total Taxes</span>
                    <span className="font-semibold text-red-600">
                      -$
                      {totalTaxes.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              )}

            {payslip.deductionsDetails.insurances &&
              payslip.deductionsDetails.insurances.length > 0 && (
                <div>
                  <div className="font-medium mb-2 text-sm text-muted-foreground">
                    Insurance
                  </div>
                  {payslip.deductionsDetails.insurances.map(
                    (insurance, idx) => {
                      const insuranceData = insurance as any;
                      // Employee pays employeeRate% of their base salary
                      const insuranceAmount =
                        ((insuranceData.employeeRate || 0) *
                          payslip.earningsDetails.baseSalary) /
                        100;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-1 pl-4"
                        >
                          <span className="text-sm">
                            {insuranceData.name} ({insuranceData.employeeRate}%
                            of base salary)
                          </span>
                          <span className="text-sm font-semibold text-red-600">
                            -$
                            {insuranceAmount.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      );
                    }
                  )}
                  <div className="flex items-center justify-between py-2 pl-4 border-t mt-2">
                    <span className="font-medium text-sm">Total Insurance</span>
                    <span className="font-semibold text-red-600">
                      -$
                      {totalInsurance.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              )}

            {payslip.deductionsDetails.penalties && (
              <div>
                <div className="font-medium mb-2 text-sm text-muted-foreground">
                  Penalties
                </div>
                <div className="flex items-center justify-between py-1 pl-4">
                  <span className="text-sm">
                    {payslip.deductionsDetails.penalties.reason ||
                      'Employee Penalty'}
                  </span>
                  <span className="text-sm font-semibold text-red-600">
                    -$
                    {totalPenalties.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between py-3 border-t-2 border-primary">
              <span className="font-bold">Total Deductions</span>
              <span className="font-bold text-lg text-red-600">
                -$
                {payslip.totaDeductions.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
