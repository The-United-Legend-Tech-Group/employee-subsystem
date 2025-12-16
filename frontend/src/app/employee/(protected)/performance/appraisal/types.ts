import { AppraisalAssignmentStatus } from '../cycles/types';

export interface RatingEntry {
    key: string;
    title: string;
    ratingValue: number;
    ratingLabel?: string;
    weightedScore?: number;
    comments?: string;
}

export interface AppraisalRecord {
    _id: string;
    assignmentId: string;
    cycleId: string;
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
    managerSubmittedAt?: string;
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

export interface CreateAppraisalRecordDto {
    assignmentId: string;
    cycleId: string;
    templateId: string;
    employeeProfileId: string;
    managerProfileId: string;
    ratings: UpdateRatingEntryDto[];
    managerSummary?: string;
    strengths?: string;
    improvementAreas?: string;
}
