// src/common/enums.ts
export enum ShiftStatus {
  Approved = 'Approved',
  Cancelled = 'Cancelled',
  Entered = 'Entered',
  Expired = 'Expired',
  Postponed = 'Postponed',
  Rejected = 'Rejected',
  Submitted = 'Submitted',
  Pending = 'Pending',
}

export enum PunchType {
  In = 'In',
  Out = 'Out',
}

export enum PunchMethod {
  Biometric = 'Biometric',
  Web = 'Web',
  Mobile = 'Mobile',
  Manual = 'Manual',
}

export enum AttendanceStatus {
  Present = 'Present',
  Absent = 'Absent',
  Late = 'Late',
  EarlyLeave = 'EarlyLeave',
  Leave = 'Leave',
  ShortTime = 'ShortTime',
  Overtime = 'Overtime',
  MissingPunch = 'MissingPunch',
  Holiday = 'Holiday',
  RestDay = 'RestDay',
}

export enum ExceptionType {
  MissedPunch = 'MissedPunch',
  Overtime = 'Overtime',
  ShortTime = 'ShortTime',
  Late = 'Late',
  EarlyLeave = 'EarlyLeave',
}

export enum RuleType {
  Lateness = 'Lateness',
  Overtime = 'Overtime',
  ShortTime = 'ShortTime',
  Permission = 'Permission',
  Holiday = 'Holiday',
  RestDay = 'RestDay',
}

export enum CalculationMethod {
  Fixed = 'Fixed',
  Percentage = 'Percentage',
  PolicyBased = 'PolicyBased',
}

export enum HolidayType {
  National = 'National',
  Organization = 'Organization',
}

export enum OvertimeType {
  Weekend = 'Weekend',
  Holiday = 'Holiday',
  PreApproved = 'PreApproved',
  AfterHours = 'AfterHours',
}

export enum CorrectionStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}
