// Mock data for the payroll system

export type Role = "specialist" | "manager" | "finance"

export interface SigningBonus {
  id: string
  employeeName: string
  employeeId: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requestedDate: string
  reason: string
}

export interface TerminationBenefit {
  id: string
  employeeName: string
  employeeId: string
  amount: number
  status: "pending" | "approved" | "rejected"
  terminationType: "resignation" | "termination"
  lastWorkingDay: string
}

export interface PayrollPeriod {
  id: string
  startDate: string
  endDate: string
  status: "draft" | "processing" | "pending-approval" | "approved" | "finalized" | "locked"
  createdBy: string
  createdAt: string
}

export interface EmployeePayroll {
  id: string
  employeeName: string
  employeeId: string
  baseSalary: number
  bonuses: number
  deductions: {
    tax: number
    insurance: number
    refund: number
  }
  netPay: number
  hrEvents: string[]
  status: "draft" | "approved" | "finalized"
  bankAccount?: string
}

export interface Exception {
  id: string
  employeeName: string
  employeeId: string
  type: "salary-spike" | "missing-bank" | "negative-pay" | "calculation-error"
  severity: "high" | "medium" | "low"
  description: string
  status: "pending" | "resolved"
}

export interface ApprovalWorkflow {
  id: string
  payrollPeriodId: string
  status: "pending-specialist" | "pending-manager" | "pending-finance" | "approved" | "rejected"
  specialistApproval?: {
    approved: boolean
    date: string
    by: string
    comments?: string
  }
  managerApproval?: {
    approved: boolean
    date: string
    by: string
    comments?: string
  }
  financeApproval?: {
    approved: boolean
    date: string
    by: string
    comments?: string
  }
}

// Mock data generators
export const mockSigningBonuses: SigningBonus[] = [
  {
    id: "SB001",
    employeeName: "Sarah Johnson",
    employeeId: "EMP-2024-001",
    amount: 50000,
    status: "pending",
    requestedDate: "2024-01-15",
    reason: "New hire - Senior Software Engineer",
  },
  {
    id: "SB002",
    employeeName: "Michael Chen",
    employeeId: "EMP-2024-002",
    amount: 75000,
    status: "pending",
    requestedDate: "2024-01-16",
    reason: "New hire - Engineering Manager",
  },
  {
    id: "SB003",
    employeeName: "Emily Rodriguez",
    employeeId: "EMP-2024-003",
    amount: 30000,
    status: "approved",
    requestedDate: "2024-01-10",
    reason: "New hire - Product Designer",
  },
]

export const mockTerminationBenefits: TerminationBenefit[] = [
  {
    id: "TB001",
    employeeName: "David Kim",
    employeeId: "EMP-2023-045",
    amount: 120000,
    status: "pending",
    terminationType: "resignation",
    lastWorkingDay: "2024-02-15",
  },
  {
    id: "TB002",
    employeeName: "Lisa Anderson",
    employeeId: "EMP-2022-089",
    amount: 85000,
    status: "pending",
    terminationType: "termination",
    lastWorkingDay: "2024-01-31",
  },
]

export const mockPayrollPeriod: PayrollPeriod = {
  id: "PP-2024-01",
  startDate: "2024-01-01",
  endDate: "2024-01-31",
  status: "processing",
  createdBy: "Sarah Specialist",
  createdAt: "2024-01-25T10:00:00Z",
}

export const mockEmployeePayrolls: EmployeePayroll[] = [
  {
    id: "PAY-001",
    employeeName: "Sarah Johnson",
    employeeId: "EMP-2024-001",
    baseSalary: 120000,
    bonuses: 50000,
    deductions: {
      tax: 42000,
      insurance: 3000,
      refund: 0,
    },
    netPay: 125000,
    hrEvents: ["New Hire", "Signing Bonus"],
    status: "draft",
    bankAccount: "****1234",
  },
  {
    id: "PAY-002",
    employeeName: "Michael Chen",
    employeeId: "EMP-2024-002",
    baseSalary: 150000,
    bonuses: 75000,
    deductions: {
      tax: 56250,
      insurance: 3500,
      refund: 0,
    },
    netPay: 165250,
    hrEvents: ["New Hire", "Signing Bonus"],
    status: "draft",
    bankAccount: "****5678",
  },
  {
    id: "PAY-003",
    employeeName: "David Kim",
    employeeId: "EMP-2023-045",
    baseSalary: 95000,
    bonuses: 0,
    deductions: {
      tax: 19000,
      insurance: 0,
      refund: 120000,
    },
    netPay: -44000,
    hrEvents: ["Resignation", "Final Settlement"],
    status: "draft",
  },
  {
    id: "PAY-004",
    employeeName: "Jennifer Williams",
    employeeId: "EMP-2023-012",
    baseSalary: 110000,
    bonuses: 0,
    deductions: {
      tax: 27500,
      insurance: 2500,
      refund: 0,
    },
    netPay: 80000,
    hrEvents: [],
    status: "draft",
    bankAccount: "****9012",
  },
]

export const mockExceptions: Exception[] = [
  {
    id: "EXC-001",
    employeeName: "David Kim",
    employeeId: "EMP-2023-045",
    type: "negative-pay",
    severity: "high",
    description: "Net pay is negative due to resignation refund",
    status: "pending",
  },
  {
    id: "EXC-002",
    employeeName: "Michael Chen",
    employeeId: "EMP-2024-002",
    type: "salary-spike",
    severity: "medium",
    description: "Salary increased by 60% due to signing bonus",
    status: "pending",
  },
  {
    id: "EXC-003",
    employeeName: "Robert Taylor",
    employeeId: "EMP-2023-078",
    type: "missing-bank",
    severity: "high",
    description: "Bank account information not on file",
    status: "pending",
  },
]

export const mockApprovalWorkflow: ApprovalWorkflow = {
  id: "WF-2024-01",
  payrollPeriodId: "PP-2024-01",
  status: "pending-manager",
  specialistApproval: {
    approved: true,
    date: "2024-01-26T14:30:00Z",
    by: "Sarah Specialist",
    comments: "All pre-payroll reviews completed. 2 exceptions flagged for manager review.",
  },
}
