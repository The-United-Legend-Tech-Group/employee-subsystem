export type EmployeePayroll = {
  id: string                 // Unique employee ID
  employeeName: string       // Full name
  baseSalary: number         // Base salary
  bonuses: number            // Signing bonuses or other extra payments
  netPay: number             // Final calculated salary
  hrEvents: string[]         // HR events affecting payroll (e.g., ["NEW_HIRE", "RESIGNED"])
  status: string             // Payroll draft status: "DRAFT", "APPROVED", etc.
  bankAccount: boolean       // Whether the employee has valid bank info
  deductions: {
    tax: number              // Tax amount
    insurance: number        // Insurance deduction
    refund: number           // Any refunds/adjustments
  }
}
