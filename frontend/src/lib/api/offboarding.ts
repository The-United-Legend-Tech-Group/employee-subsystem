import api from '@/lib/axios';

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

// =================== OFFBOARDING API ===================

export const offboardingApi = {
  // =================== TERMINATION ENDPOINTS ===================

  initiateTerminationReview: (data: InitiateTerminationReviewDto) => {
    return api.post('/offboarding/initiate-termination-review', data);
  },

  approveTermination: (data: ApproveTerminationDto) => {
    return api.patch('/offboarding/approve-termination', data);
  },

  getAllTerminationRequests: () => {
    return api.get('/offboarding/termination-requests/all');
  },

  // =================== OFFBOARDING CHECKLIST ENDPOINTS ===================

  initiateOffboardingChecklist: (data: InitiateOffboardingChecklistDto) => {
    return api.post('/offboarding/initiate-checklist', data);
  },

  getChecklistByTerminationId: (terminationId: string) => {
    return api.get(`/offboarding/checklist/${terminationId}`, {
      params: { terminationId }
    });
  },

  getAllOffboardingChecklists: () => {
    return api.get('/offboarding/checklists/all');
  },

  processDepartmentSignOff: (data: DepartmentClearanceSignOffDto) => {
    return api.post('/offboarding/department-signoff', data);
  },

  updateEquipmentReturn: (data: UpdateEquipmentReturnDto) => {
    return api.post('/offboarding/update-equipment-return', data);
  },

  updateAccessCardReturn: (data: { clearanceChecklistId: string; cardReturned: boolean }) => {
    return api.post('/offboarding/update-access-card-return', data);
  },

  // =================== SYSTEM ACCESS REVOCATION ===================

  revokeSystemAccess: (data: RevokeSystemAccessDto) => {
    return api.post('/offboarding/revoke-access', data);
  },

  getEmployeesReadyForRevocation: () => {
    return api.get('/offboarding/employees-ready-for-revocation');
  },

  // =================== RESIGNATION ENDPOINTS ===================

  submitResignation: (data: SubmitResignationDto) => {
    return api.post('/offboarding/submit-resignation', data);
  },

  trackResignationStatus: (params: TrackResignationStatusDto) => {
    return api.get('/offboarding/track-resignation-status', { params });
  },

  // =================== REMINDER & EXPIRY ENDPOINTS ===================

  sendOffboardingReminder: (terminationRequestId: string) => {
    return api.post('/offboarding/send-reminder/:terminationRequestId', { terminationRequestId });
  },

  checkExpiryWarnings: () => {
    return api.post('/offboarding/check-expiry-warnings');
  },
};

export default offboardingApi;
