// Type definitions for the payroll system

export type Role = 'Payroll Specialist' | 'Finance Staff' | 'Payroll Manager';

// ==================== BACKEND ENUMS ====================

/**
 * Backend PayRollStatus enum - matches backend execution enums
 */
export enum PayRollStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under review', // when specialist publishes for manager approval
  PENDING_FINANCE_APPROVAL = 'pending finance approval',
  REJECTED = 'rejected',
  APPROVED = 'approved',
  LOCKED = 'locked',
  UNLOCKED = 'unlocked'
}

/**
 * Backend PayRollPaymentStatus enum
 */
export enum PayRollPaymentStatus {
  PAID = 'paid',
  PENDING = 'pending'
}

/**
 * Backend PaySlipPaymentStatus enum
 */
export enum PaySlipPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid'
}

/**
 * Bank account status for employees
 */
export enum BankStatus {
  VALID = 'valid',
  MISSING = 'missing'
}

/**
 * Status for signing bonuses
 */
export enum BonusStatus {
  PENDING = 'pending',
  PAID = 'paid',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Status for termination benefits
 */
export enum BenefitStatus {
  PENDING = 'pending',
  PAID = 'paid',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface SigningBonus {
  _id: string;
  employeeId:
    | {
        _id: string;
        [key: string]: any;
      }
    | string;
  signingBonusId: string;
  givenAmount: number;
  paymentDate?: Date;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface TerminationBenefit {
  _id: string;
  employeeId: string | { _id: string; [key: string]: any };
  benefitId: string;
  terminationId: string;
  status: 'pending' | 'approved' | 'rejected';
  givenAmount: number;
}

export interface PayrollPeriod {
  id: string;
  startDate: string;
  endDate: string;
  status:
    | 'draft'
    | 'processing'
    | 'pending-approval'
    | 'approved'
    | 'finalized'
    | 'locked';
  createdBy: string;
  createdAt: string;
}

export interface Exception {
  id: string;
  employeeId: string;
  type: 'salary-spike' | 'missing-bank' | 'negative-pay' | 'calculation-error';
  severity: 'high' | 'medium' | 'low';
  description: string;
  status: 'pending' | 'resolved';
}

export interface ApprovalWorkflow {
  id: string;
  payrollPeriodId: string;
  status:
    | 'pending-specialist'
    | 'pending-manager'
    | 'pending-finance'
    | 'approved'
    | 'rejected';
  specialistApproval?: {
    approved: boolean;
    date: string;
    by: string;
    comments?: string;
  };
  managerApproval?: {
    approved: boolean;
    date: string;
    by: string;
    comments?: string;
  };
  financeApproval?: {
    approved: boolean;
    date: string;
    by: string;
    comments?: string;
  };
}

export type PayrollExceptionFlag = {
  code: string;
  message: string;
  field?: string;
  severity: 'warn' | 'error';
};

export type EmployeePayroll = {
  id: string;
  employeeName: string;
  employeeId: string;

  payGradeId?: string | null;

  baseSalary?: number | null;
  grossSalary?: number | null;
  netSalary?: number | null;
  netPay?: number | null;

  bonuses?: number | null;

  deductions?: {
    tax: number;
    insurance: number;
    refund: number;
  };

  hrEvents?: any[];
  status?: string;

  bankAccount?: any;

  exceptions?: PayrollExceptionFlag[];
};

// ==================== BACKEND SCHEMA TYPES ====================

/**
 * Employee basic info (populated from backend)
 */
export interface EmployeeInfo {
  _id: string;
  firstName: string;
  lastName: string;
  workEmail?: string;
  personalEmail?: string;
  employeeId?: string;
}

/**
 * Allowance structure
 */
export interface Allowance {
  name: string;
  amount: number;
  taxable?: boolean;
}

/**
 * Signing bonus structure
 */
export interface SigningBonusDetail {
  amount: number;
  status: BonusStatus;
  approvedDate?: Date;
}

/**
 * Termination/Resignation benefit structure
 */
export interface TerminationBenefitDetail {
  amount: number;
  status: BenefitStatus;
  terminationType: 'resignation' | 'termination';
  lastWorkingDay: Date;
}

/**
 * Refund details
 */
export interface RefundDetail {
  amount: number;
  description: string;
}

/**
 * Tax rule structure
 */
export interface TaxRule {
  taxBracket: number;
  taxRate: number;
  taxAmount: number;
}

/**
 * Insurance bracket structure
 */
export interface InsuranceBracket {
  insuranceType: string;
  insuranceAmount: number;
  employeeContribution: number;
}

/**
 * Employee penalty (matches backend penalty schema)
 */
export interface EmployeePenalty {
  reason: string;
  amount: number;
}

/**
 * Employee penalties structure (matches backend employeePenalties schema)
 */
export interface EmployeePenalties {
  employeeId?: string;
  penalties?: EmployeePenalty[];
}

/**
 * Earnings details in payslip
 */
export interface EarningsDetails {
  baseSalary: number;
  allowances: Allowance[];
  bonuses?: SigningBonusDetail[];
  benefits?: TerminationBenefitDetail[];
  refunds?: RefundDetail[];
}

/**
 * Deductions details in payslip
 */
export interface DeductionsDetails {
  taxes: TaxRule[];
  insurances?: InsuranceBracket[];
  penalties?: EmployeePenalties; // Matches backend: employeePenalties schema with penalties array
}

/**
 * PaySlip interface matching backend schema
 */
export interface PaySlip {
  _id: string;
  employeeId: string | EmployeeInfo; // Can be populated
  payrollRunId: string;
  earningsDetails: EarningsDetails;
  deductionsDetails: DeductionsDetails;
  totalGrossSalary: number;
  totaDeductions: number;
  netPay: number;
  paymentStatus: PaySlipPaymentStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * PayrollRun interface matching backend schema
 */
export interface PayrollRun {
  _id: string;
  runId: string; // Display ID like PR-2025-0001
  payrollPeriod: string; // ISO date string
  status: PayRollStatus;
  entity: string; // Company name
  employees: number; // Total employee count
  exceptions: number; // Exception count
  totalnetpay: number; // Total net pay amount
  payrollSpecialistId: string | EmployeeInfo; // Can be populated
  paymentStatus: PayRollPaymentStatus;
  payrollManagerId?: string | EmployeeInfo; // Can be populated
  financeStaffId?: string | EmployeeInfo; // Can be populated
  rejectionReason?: string;
  unlockReason?: string;
  managerApprovalDate?: string;
  financeApprovalDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payroll preview response (from getPayrollPreview API)
 */
export interface PayrollPreview {
  payrollRun: PayrollRun;
  payslips: PaySlip[];
  summary: {
    totalEmployees: number;
    totalExceptions: number;
    totalNetPay: number;
    status: PayRollStatus;
    paymentStatus: PayRollPaymentStatus;
  };
}

/**
 * Generate payslips response
 */
export interface GeneratePayslipsResponse {
  message: string;
  payrollRunId: string;
  totalPayslips: number;
  emailDistribution: {
    successful: number;
    failed: number;
  };
  payslips: Array<{
    employeeId: string;
    netPay: number;
    paymentStatus: PaySlipPaymentStatus;
  }>;
}
