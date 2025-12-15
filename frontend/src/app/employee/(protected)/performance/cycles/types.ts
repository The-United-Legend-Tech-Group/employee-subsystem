export enum AppraisalTemplateType {
    ANNUAL = 'ANNUAL',
    SEMI_ANNUAL = 'SEMI_ANNUAL',
    PROBATIONARY = 'PROBATIONARY',
    PROJECT = 'PROJECT',
    AD_HOC = 'AD_HOC',
}

export enum AppraisalCycleStatus {
    PLANNED = 'PLANNED',
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
    ARCHIVED = 'ARCHIVED',
}

export enum AppraisalAssignmentStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    SUBMITTED = 'SUBMITTED',
    PUBLISHED = 'PUBLISHED',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export interface AppraisalCycle {
    _id: string;
    name: string;
    description?: string;
    cycleType: AppraisalTemplateType;
    status: AppraisalCycleStatus;
    startDate: string;
    endDate: string;
    managerDueDate?: string;
    employeeAcknowledgementDueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAppraisalCycleDto {
    name: string;
    description?: string;
    cycleType: AppraisalTemplateType;
    startDate: string;
    endDate: string;
    managerDueDate?: string;
    employeeAcknowledgementDueDate?: string;
}

export type UpdateAppraisalCycleDto = Partial<CreateAppraisalCycleDto> & {
    status?: AppraisalCycleStatus;
};
