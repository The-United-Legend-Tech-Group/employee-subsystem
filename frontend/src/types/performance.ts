export enum AppraisalAssignmentStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    SUBMITTED = 'SUBMITTED',
    PUBLISHED = 'PUBLISHED',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export interface EmployeeProfileShort {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

export interface NameIdShort {
    _id: string;
    name: string;
}

export interface AppraisalAssignment {
    _id: string;
    cycleId: string | NameIdShort;
    templateId: string | NameIdShort;
    employeeProfileId: string | EmployeeProfileShort;
    managerProfileId: string | EmployeeProfileShort;
    departmentId?: string;
    positionId?: string;
    status: AppraisalAssignmentStatus;
    assignedAt: string;
    dueDate?: string;
    submittedAt?: string;
    publishedAt?: string;
    latestAppraisalId?: string;
}

export interface RatingEntry {
    key: string;
    title: string;
    ratingValue: number;
    ratingLabel?: string;
    weightedScore?: number;
    comments?: string;
}

export interface AppraisalRecord {
    _id?: string;
    assignmentId: string;
    cycleId: string;
    cycleName?: string;
    templateId: string;
    employeeProfileId: string;
    managerProfileId: string;
    ratings: RatingEntry[];
    totalScore?: number;
    overallRatingLabel?: string;
    managerSummary?: string;
    strengths?: string;
    improvementAreas?: string;
    status: string;
}

export interface CreateRatingEntryDto {
    key: string;
    ratingValue: number;
    comments?: string;
}

export interface CreateAppraisalRecordDto {
    assignmentId: string;
    cycleId: string;
    templateId: string;
    employeeProfileId: string;
    managerProfileId: string;
    ratings: CreateRatingEntryDto[];
    managerSummary?: string;
    strengths?: string;
    improvementAreas?: string;
}

export interface UpdateRatingEntryDto {
    key: string;
    ratingValue: number;
    comments?: string;
}

export interface UpdateAppraisalRecordDto {
    ratings: UpdateRatingEntryDto[];
    managerSummary?: string;
    strengths?: string;
    improvementAreas?: string;
}

export enum AppraisalRatingScaleType {
    NUMERIC_1_5 = 'NUMERIC_1_5',
    NUMERIC_1_10 = 'NUMERIC_1_10',
    LIKERT_5 = 'LIKERT_5',
    CUSTOM = 'CUSTOM'
}

export interface RatingScaleDefinition {
    type: AppraisalRatingScaleType;
    min: number;
    max: number;
    step?: number;
    labels?: string[];
}

export interface EvaluationCriterion {
    key: string;
    title: string;
    details?: string;
    weight?: number;
    maxScore?: number;
    required: boolean;
}

export interface AppraisalTemplate {
    _id: string;
    name: string;
    description?: string;
    templateType: string;
    ratingScale: RatingScaleDefinition;
    criteria: EvaluationCriterion[];
    instructions?: string;
    isActive: boolean;
}
