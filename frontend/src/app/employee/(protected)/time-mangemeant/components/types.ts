import type { ReactNode } from "react";

export type SectionDefinition = {
  id: string;
  title: string;
  description: string;
  icon?: ReactNode;
};

export enum PunchType {
  IN = "IN",
  OUT = "OUT",
}

export enum PunchPolicy {
  MULTIPLE = "MULTIPLE",
  FIRST_LAST = "FIRST_LAST",
  ONLY_FIRST = "ONLY_FIRST",
}

export enum TimeExceptionType {
  MISSED_PUNCH = "MISSED_PUNCH",
  LATE = "LATE",
  EARLY_LEAVE = "EARLY_LEAVE",
  SHORT_TIME = "SHORT_TIME",
  OVERTIME_REQUEST = "OVERTIME_REQUEST",
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
}

export enum TimeExceptionStatus {
  OPEN = "OPEN",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ESCALATED = "ESCALATED",
  RESOLVED = "RESOLVED",
}

export enum CorrectionRequestStatus {
  SUBMITTED = "SUBMITTED",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ESCALATED = "ESCALATED",
}

export interface Punch {
  type: PunchType;
  time: string;
}

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  punches: Punch[];
  totalWorkMinutes: number;
  hasMissedPunch: boolean;
  exceptionIds: string[];
  finalisedForPayroll: boolean;
}

export interface TimeException {
  _id: string;
  employeeId: string;
  type: TimeExceptionType;
  attendanceRecordId: string;
  assignedTo: string;
  status: TimeExceptionStatus;
  reason?: string;
}

export interface ShiftType {
  _id: string;
  name: string;
  description?: string;
}

export interface ShiftDefinition {
  _id: string;
  name: string;
  shiftType?: string | ShiftType;
  startTime: string;
  endTime: string;
  punchPolicy?: PunchPolicy | string;
  graceInMinutes?: number;
  graceOutMinutes?: number;
  requiresApprovalForOvertime?: boolean;
  active?: boolean;
}

export enum ShiftAssignmentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface ShiftAssignment {
  _id: string;
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  shiftId: string;
  scheduleRuleId?: string;
  startDate: string;
  endDate?: string;
  status: ShiftAssignmentStatus | string;
}

export interface ScheduleRule {
  _id: string;
  name: string;
  active?: boolean;
  pattern?: string;
  shiftTypes?: string[];
  startDate?: string;
  endDate?: string;
}

export enum HolidayType {
  NATIONAL = "NATIONAL",
  ORGANIZATIONAL = "ORGANIZATIONAL",
  WEEKLY_REST = "WEEKLY_REST",
}

export interface HolidayDefinition {
  _id: string;
  type: HolidayType | string;
  startDate: string;
  endDate?: string;
  name?: string;
  active?: boolean;
  // Legacy fields for compatibility
  weeklyDays?: string[];
  description?: string;
}

export interface CorrectionRequest {
  _id: string;
  employeeId: string;
  attendanceRecord: AttendanceRecord | string;
  reason?: string;
  status: CorrectionRequestStatus | string;
  // Additional fields for ESS workflow
  lineManagerId?: string;
  decision?: string;
  durationMinutes?: number;
  correctionType?: string;
  appliesFromDate?: string;
  submittedAt?: string;
  rejectionReason?: string;
  appliedToPayroll?: boolean;
  approvalFlow?: Array<{
    role?: string;
    status?: string;
    decidedBy?: string;
    decidedAt?: string;
  }>;
}

// DTO Types matching backend
export interface SubmitCorrectionEssDto {
  employeeId: string;
  attendanceRecord: string;
  durationMinutes: number;
  reason: string;
  lineManagerId: string;
  appliesFromDate?: string;
  correctionType?: "ADD" | "DEDUCT";
}

export interface CreateAttendanceCorrectionDto {
  employeeId: string;
  attendanceRecord: string;
  punches?: Punch[];
  reason?: string;
  source?: "BIOMETRIC" | "WEB" | "MOBILE" | "MANUAL";
}

export interface ApproveRejectCorrectionDto {
  approverId: string;
  decision: "APPROVED" | "REJECTED";
  approverRole?: string;
  rejectionReason?: string;
  applyToPayroll?: boolean;
}

export interface ApproveAttendanceCorrectionDto {
  approverId: string;
}
