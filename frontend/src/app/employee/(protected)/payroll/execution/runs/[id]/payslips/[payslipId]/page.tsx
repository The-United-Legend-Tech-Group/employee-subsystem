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
import { getCookie } from '@/lib/auth-utils';

function getAccessToken(): string {
  const token = getCookie('access_token');
  return token ? token.replace(/^Bearer\s+/i, '').trim() : '';
}

function getAuthConfig() {
  const token = getAccessToken();

  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log(
      '[PayslipDetail] No localStorage token - relying on httpOnly cookies'
    );
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  } as const;
}

export default function PayslipDetailPage() {
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

  console.log(payslip);
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
    return emp.employeeNumber || emp.employeeId || emp._id || 'N/A';
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
    (payslip.earningsDetails?.baseSalary || 0) +
    (payslip.earningsDetails?.allowances?.reduce(
      (sum, a) => sum + (a.amount || 0),
      0
    ) || 0) +
    (payslip.earningsDetails?.bonuses?.reduce(
      (sum, b) => sum + (b.amount || 0),
      0
    ) || 0) +
    (payslip.earningsDetails?.benefits?.reduce(
      (sum, b) => sum + (b.amount || 0),
      0
    ) || 0) +
    (payslip.earningsDetails?.refunds?.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    ) || 0);

  // Tax calculation: rate% of baseSalary
  const totalTaxes =
    payslip.deductionsDetails?.taxes?.reduce((sum, t) => {
      const taxData = t as any;
      return (
        sum +
        ((taxData.rate || 0) * (payslip.earningsDetails?.baseSalary || 0)) / 100
      );
    }, 0) || 0;

  // Insurance calculation: employeeRate% of baseSalary (not amount)
  // The 'amount' in insurance is the coverage amount, not the base for calculation
  const totalInsurance =
    payslip.deductionsDetails?.insurances?.reduce((sum, i) => {
      const insuranceData = i as any;
      // Employee pays employeeRate% of their base salary
      return (
        sum +
        ((insuranceData.employeeRate || 0) *
          (payslip.earningsDetails?.baseSalary || 0)) /
          100
      );
    }, 0) || 0;

  const totalPenalties =
    payslip.deductionsDetails?.penalties?.penalties?.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    ) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{employeeName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {payrollRun?.runId || 'N/A'} •{' '}
          {payrollRun?.payrollPeriod
            ? new Date(payrollRun.payrollPeriod).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })
            : 'N/A'}
        </p>
      </div>

      {/* Employee Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Employee Number
              </div>
              <div className="font-mono font-medium">{employeeNumber}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Email</div>
              <div className="font-medium">{employeeEmail}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
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
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground mb-1">
              Gross Salary
            </div>
            <div className="text-2xl font-bold">
              $
              {(payslip.totalGrossSalary || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground mb-1">Deductions</div>
            <div className="text-2xl font-bold text-red-600">
              -$
              {(payslip.totaDeductions || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground mb-1">Net Pay</div>
            <div className="text-2xl font-bold text-green-600">
              $
              {(payslip.netPay || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Earnings Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm">Base Salary</span>
              <span className="font-semibold">
                $
                {(payslip.earningsDetails?.baseSalary || 0).toLocaleString(
                  'en-US',
                  { minimumFractionDigits: 2 }
                )}
              </span>
            </div>

            {payslip.earningsDetails?.allowances &&
              payslip.earningsDetails.allowances.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Allowances
                  </div>
                  {payslip.earningsDetails.allowances.map((allowance, idx) => (
                    <div key={idx} className="flex justify-between py-1 pl-3">
                      <span className="text-sm">{allowance.name}</span>
                      <span className="text-sm text-green-600">
                        +$
                        {(allowance.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {payslip.earningsDetails?.bonuses &&
              payslip.earningsDetails.bonuses.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Bonuses
                  </div>
                  {payslip.earningsDetails.bonuses.map((bonus, idx) => {
                    const bonusData = bonus as any;
                    return (
                      <div key={idx} className="flex justify-between py-1 pl-3">
                        <span className="text-sm">
                          {bonusData.positionName || bonusData.name || 'Bonus'}
                        </span>
                        <span className="text-sm text-green-600">
                          +$
                          {(bonus.amount || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

            {payslip.earningsDetails?.benefits &&
              payslip.earningsDetails.benefits.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Benefits
                  </div>
                  {payslip.earningsDetails.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex justify-between py-1 pl-3">
                      <span className="text-sm">
                        {(benefit as any).name || 'Benefit'}
                      </span>
                      <span className="text-sm text-green-600">
                        +$
                        {(benefit.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {payslip.earningsDetails?.refunds &&
              payslip.earningsDetails.refunds.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Refunds
                  </div>
                  {payslip.earningsDetails.refunds.map((refund, idx) => (
                    <div key={idx} className="flex justify-between py-1 pl-3">
                      <span className="text-sm">
                        {refund.description || 'Refund'}
                      </span>
                      <span className="text-sm text-green-600">
                        +$
                        {(refund.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            <div className="flex justify-between pt-3 border-t-2">
              <span className="font-bold text-sm">Total Earnings</span>
              <span className="font-bold text-green-600">
                $
                {totalEarnings.toLocaleString('en-US', {
                  minimumFractionDigits: 2
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Deductions Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Deductions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payslip.deductionsDetails?.taxes &&
              payslip.deductionsDetails.taxes.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Taxes
                  </div>
                  {payslip.deductionsDetails?.taxes?.map((tax, idx) => {
                    const taxData = tax as any;
                    const taxAmount =
                      ((taxData.rate || 0) *
                        (payslip.earningsDetails?.baseSalary || 0)) /
                      100;
                    return (
                      <div key={idx} className="flex justify-between py-1 pl-3">
                        <span className="text-sm">
                          {taxData.name} ({taxData.rate}%)
                        </span>
                        <span className="text-sm text-red-600">
                          -$
                          {taxAmount.toLocaleString('en-US', {
                            minimumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between py-1 pl-3 border-t">
                    <span className="text-xs font-medium">Subtotal</span>
                    <span className="text-sm font-semibold text-red-600">
                      -$
                      {totalTaxes.toLocaleString('en-US', {
                        minimumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              )}

            {payslip.deductionsDetails?.insurances &&
              payslip.deductionsDetails.insurances.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Insurance
                  </div>
                  {payslip.deductionsDetails?.insurances?.map(
                    (insurance, idx) => {
                      const insuranceData = insurance as any;
                      const insuranceAmount =
                        ((insuranceData.employeeRate || 0) *
                          (payslip.earningsDetails?.baseSalary || 0)) /
                        100;
                      return (
                        <div
                          key={idx}
                          className="flex justify-between py-1 pl-3"
                        >
                          <span className="text-sm">
                            {insuranceData.name} ({insuranceData.employeeRate}%)
                          </span>
                          <span className="text-sm text-red-600">
                            -$
                            {insuranceAmount.toLocaleString('en-US', {
                              minimumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      );
                    }
                  )}
                  <div className="flex justify-between py-1 pl-3 border-t">
                    <span className="text-xs font-medium">Subtotal</span>
                    <span className="text-sm font-semibold text-red-600">
                      -$
                      {totalInsurance.toLocaleString('en-US', {
                        minimumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              )}

            {payslip.deductionsDetails?.penalties?.penalties &&
              payslip.deductionsDetails.penalties.penalties.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Penalties
                  </div>
                  {payslip.deductionsDetails.penalties?.penalties?.map(
                    (penalty, index) => (
                      <div
                        key={index}
                        className="flex justify-between py-1 pl-3"
                      >
                        <span className="text-sm">
                          {penalty.reason || 'Penalty'}
                        </span>
                        <span className="text-sm text-red-600">
                          -$
                          {(penalty.amount || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}

            <div className="flex justify-between pt-3 border-t-2">
              <span className="font-bold text-sm">Total Deductions</span>
              <span className="font-bold text-red-600">
                -$
                {(payslip.totaDeductions || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
