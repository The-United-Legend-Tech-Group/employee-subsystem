import { AppraisalAssignmentStatus } from '../cycles/types';

export interface AppraisalCycleShort {
    _id: string;
    name: string;
    endDate?: string;
    managerDueDate?: string;
}

export interface AppraisalAssignment {
    _id: string;
    cycleId: string | AppraisalCycleShort;
    templateId: string;
    employeeProfileId: string;
    managerProfileId: string;
    departmentId?: string;
    positionId?: string;
    status: AppraisalAssignmentStatus;
    assignedAt: string;
    dueDate?: string;
    submittedAt?: string;
    publishedAt?: string;
    latestAppraisalId?: string;
}

export interface BulkAssignItemDto {
    employeeProfileId: string;
    managerProfileId: string;
    positionId?: string;
    departmentId?: string;
    dueDate?: string;
}

export interface BulkAssignDto {
    cycleId: string;
    templateId: string;
    items: BulkAssignItemDto[];
}

export interface Employee {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    position?: {
        title: string;
    };
    department?: {
        name: string;
    };
    primaryPositionId?: {
        _id: string;
        title: string;
    };
    primaryDepartmentId?: {
        _id: string;
        name: string;
    };
}
