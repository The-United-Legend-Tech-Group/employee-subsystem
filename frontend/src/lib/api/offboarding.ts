import { apiClient, ApiResponse } from '../../common/utils/api/client';

// =================== TYPES ===================

export interface InitiateTerminationReviewDto {
  employeeNumber: string;
  reason: string;
  initiator: string;
  terminationDate: string;
  employeeComments?: string;
  hrComments?: string;
}

export interface InitiateOffboardingChecklistDto {
  terminationId: string;
  comments?: string;
}

export interface ClearanceChecklist {
  _id: string;
  terminationId: string;
  items: Array<{
    department: string;
    status: string;
    comments?: string;
    updatedBy?: string;
    updatedAt?: Date;
  }>;
  equipmentList: Array<{
    equipmentId?: string;
    name: string;
    returned: boolean;
    condition?: string;
  }>;
  cardReturned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevokeSystemAccessDto {
  terminationRequestId: string;
  revocationReason?: string;
}

export interface SubmitResignationDto {
  employeeId: string;
  contractId: string;
  reason: string;
  employeeComments?: string;
  proposedLastWorkingDay?: string;
}

export interface TrackResignationStatusDto {
  employeeId: string;
}

export interface DepartmentClearanceSignOffDto {
  clearanceChecklistId: string;
  department: string;
  approverId?: string;
  // Uses TerminationStatus enum values instead of ApprovalStatus
  status: 'approved' | 'rejected' | 'pending' | 'under_review';
  comments?: string;
}

export interface ApproveTerminationDto {
  terminationRequestId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  hrComments?: string;
}

export interface UpdateEquipmentReturnDto {
  clearanceChecklistId: string;
  equipmentName: string;
  returned: boolean;
  updatedById: string;
}

// Helper to maintain compatibility with existing UI (axios-like behavior)
async function handleResponse<T>(promise: Promise<ApiResponse<T>>) {
  const response = await promise;
  if (response.error) {
    const error: any = new Error(response.error);
    error.response = { data: { message: response.error } };
    throw error;
  }
  return response as { data: T };
}

// =================== OFFBOARDING API ===================

export const offboardingApi = {
  // =================== TERMINATION ENDPOINTS ===================

  initiateTerminationReview: (data: InitiateTerminationReviewDto) => {
    return handleResponse(apiClient.post('/offboarding/initiate-termination-review', data));
  },

  approveTermination: (data: ApproveTerminationDto) => {
    return handleResponse(apiClient.patch('/offboarding/approve-termination', data));
  },

  getAllTerminationRequests: () => {
    return handleResponse(apiClient.get<any[]>('/offboarding/termination-requests/all'));
  },

  // =================== OFFBOARDING CHECKLIST ENDPOINTS ===================

  initiateOffboardingChecklist: (data: InitiateOffboardingChecklistDto) => {
    return handleResponse(apiClient.post('/offboarding/initiate-checklist', data));
  },

  getChecklistByTerminationId: (terminationId: string) => {
    return handleResponse(apiClient.get<any>(`/offboarding/checklist/${terminationId}`, {
      params: { terminationId }
    }));
  },

  getAllOffboardingChecklists: () => {
    return handleResponse(apiClient.get<any[]>('/offboarding/checklists/all'));
  },

  processDepartmentSignOff: (data: DepartmentClearanceSignOffDto) => {
    return handleResponse(apiClient.post('/offboarding/department-signoff', data));
  },

  updateEquipmentReturn: (data: UpdateEquipmentReturnDto) => {
    return handleResponse(apiClient.post('/offboarding/update-equipment-return', data));
  },

  updateAccessCardReturn: (data: { clearanceChecklistId: string; cardReturned: boolean }) => {
    return handleResponse(apiClient.post('/offboarding/update-access-card-return', data));
  },

  // =================== SYSTEM ACCESS REVOCATION ===================

  revokeSystemAccess: (data: RevokeSystemAccessDto) => {
    return handleResponse(apiClient.post('/offboarding/revoke-access', data));
  },

  getEmployeesReadyForRevocation: () => {
    return handleResponse(apiClient.get<any[]>('/offboarding/employees-ready-for-revocation'));
  },

  // =================== RESIGNATION ENDPOINTS ===================

  submitResignation: (data: SubmitResignationDto) => {
    return handleResponse(apiClient.post('/offboarding/submit-resignation', data));
  },

  trackResignationStatus: (params: TrackResignationStatusDto) => {
    return handleResponse(apiClient.get<any>('/offboarding/track-resignation-status', { params }));
  },

  // =================== REMINDER & EXPIRY ENDPOINTS ===================

  sendOffboardingReminder: (terminationRequestId: string) => {
    return handleResponse(apiClient.post<any>(`/offboarding/send-reminder/${terminationRequestId}`, { terminationRequestId }));
  },

  checkExpiryWarnings: () => {
    return handleResponse(apiClient.post('/offboarding/check-expiry-warnings'));
  },
};

export default offboardingApi;
