import { apiClient, ApiResponse } from '../../common/utils/api/client';

// =================== TYPES ===================
export interface CreateOfferDto {
  applicationId: string;
  candidateId: string;
  hrEmployeeId?: string;
  role: string;
  benefits?: string[];
  conditions?: string;
  insurances?: string;
  content?: string;
  deadline?: string;
}

export interface AddOfferApproverDto {
  offerId: string;
  employeeId: string;
  role: string;
}

export interface ApproveOfferDto {
  offerId: string;
  status: 'approved' | 'rejected';
  comment?: string;
}

export interface SendOfferDto {
  offerId: string;
}

export interface CandidateRespondOfferDto {
  offerId: string;
  response: 'accepted' | 'rejected' | 'negotiating';
  notes?: string;
}

export interface UploadSignedContractDto {
  contractId: string;
  candidateId?: string;
}

export interface HrSignContractDto {
  contractId: string;
  signedAt?: string;
  notes?: string;
  useCustomEmployeeData?: boolean;
  // Custom employee data fields
  customFirstName?: string;
  customLastName?: string;
  customNationalId?: string;
  customEmployeeNumber?: string;
  customWorkEmail?: string;
  customPersonalEmail?: string;
  customStatus?: string;
  customContractType?: string;
  customWorkType?: string;
}

export interface UploadComplianceDocumentsDto {
  employeeId?: string;
  documentTypes: string[];
  notes?: string;
}

export interface OnboardingTaskDto {
  name: string;
  department?: string;
  deadline?: string;
  notes?: string;
}

export interface CreateOnboardingChecklistDto {
  employeeId: string;
  contractId?: string;
  tasks: OnboardingTaskDto[];
  notes?: string;
}

export interface CreateOnboardingWithDefaultsDto {
  employeeId: string;
  contractId: string;
  startDate: string;
  includeITTasks?: boolean;
  includeAdminTasks?: boolean;
  includeHRTasks?: boolean;
}

export interface GetOnboardingChecklistDto {
  employeeId: string;
}

export interface SendOnboardingReminderDto {
  employeeId: string;
  daysBeforeDeadline?: number;
}

export interface UpdateTaskStatusDto {
  employeeId: string;
  taskName: string;
  status: string;
  documentId?: string;
}

export interface CancelOnboardingDto {
  checklistId: string;
  reason: string;
}

export interface CreateJobTemplateDto {
  title: string;
  department: string;
  qualifications: string[];
  skills: string[];
  description?: string;
}

export interface CreateJobRequisitionDto {
  requisitionId: string;
  templateId: string;
  openings: number;
  location: string;
  hiringManagerId?: string;
  publishStatus?: string;
  postingDate?: string;
  expiryDate?: string;
}

export interface UpdateJobRequisitionDto {
  templateId?: string;
  openings?: number;
  location?: string;
  publishStatus?: string;
  postingDate?: string;
  expiryDate?: string;
}

export interface CreateCVDocumentDto {
  candidateId: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
}

export interface CreateApplicationDto {
  requisitionId: string;
  candidateId?: string;
  assignedHr?: string;
  currentStage?: string;
  status?: string;
}

export interface UpdateApplicationDto {
  status?: string;
  currentStage?: string;
  notes?: string;
}

export interface CreateInterviewDto {
  applicationId: string;
  hrId?: string;
  stage: 'department_interview' | 'hr_interview';
  scheduledDate: string;
  method: 'onsite' | 'video' | 'phone';
  panel: string[];
  calendarEventId?: string;
  videoLink?: string;
  status?: string;
}

export interface UpdateInterviewDto {
  scheduledDate?: string;
  status?: string;
  feedback?: string;
  rating?: number;
  notes?: string;
}

export interface SendNotificationDto {
  candidateId?: string;
  hrId?: string;
  customMessage?: string;
}

export interface CreateReferralDto {
  referringEmployeeId?: string;
  candidateId: string;
  role?: string;
  level?: string;
}

export interface CreateAssessmentDto {
  score: number;
  comments?: string;
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

// =================== RECRUITMENT API ===================

export const recruitmentApi = {
  // =================== OFFER ENDPOINTS ===================

  createOffer: (data: CreateOfferDto) => {
    return handleResponse(apiClient.post('/recruitment/offer/create', data));
  },

  // Get all offers
  getAllOffers: () => handleResponse(apiClient.get<any[]>('/recruitment/offers/all')),

  // Get my offers (candidate)
  getMyOffers: () => handleResponse(apiClient.get<any[]>('/recruitment/offers/my')),

  // Get offers for a specific candidate (legacy / explicit)
  getOffersByCandidateId: () => handleResponse(apiClient.get<any[]>(`/recruitment/offers/candidate/`)),

  // Get offer by ID
  getOfferById: (offerId: string) => handleResponse(apiClient.get<any>(`/recruitment/offer/${offerId}`)),

  // Get my pending approvals
  getMyApprovals: () => handleResponse(apiClient.get<any[]>('/recruitment/offer/approvals/my')),

  addOfferApprover: (data: AddOfferApproverDto) => {
    return handleResponse(apiClient.post('/recruitment/offer/add-approver', data));
  },

  approveOffer: (data: ApproveOfferDto) => {
    return handleResponse(apiClient.post('/recruitment/offer/approve', data));
  },

  sendOffer: (data: SendOfferDto) => {
    return handleResponse(apiClient.post('/recruitment/offer/send', data));
  },

  candidateRespondOffer: (data: CandidateRespondOfferDto) => {
    return handleResponse(apiClient.post('/recruitment/offer/candidate-respond', data));
  },

  // =================== CONTRACT ENDPOINTS ===================

  getAllContracts: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/contracts'));
  },

  getMyContracts: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/contracts/my'));
  },

  getContractsByCandidateId: (candidateId: string) => {
    return handleResponse(apiClient.get<any[]>(`/recruitment/contracts/candidate/${candidateId}`));
  },

  signContract: (data: UploadSignedContractDto, files: File[]) => {
    const formData = new FormData();
    formData.append('contractId', data.contractId);
    if (data.candidateId) {
      formData.append('candidateId', data.candidateId);
    }
    files.forEach((file) => {
      formData.append('files', file);
    });
    return handleResponse(apiClient.postFormData('/recruitment/contract/sign', formData));
  },

  hrSignContract: (data: HrSignContractDto) => {
    return handleResponse(apiClient.post('/recruitment/contract/hr-sign', data));
  },

  uploadComplianceDocuments: (data: UploadComplianceDocumentsDto, files: File[]) => {
    const formData = new FormData();
    if (data.employeeId) {
      formData.append('employeeId', data.employeeId);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    if (data.documentTypes) {
      data.documentTypes.forEach((type) => {
        formData.append('documentTypes', type);
      });
    }
    files.forEach((file) => {
      formData.append('files', file);
    });
    return handleResponse(apiClient.postFormData('/recruitment/documents/upload', formData));
  },

  getComplianceDocuments: (employeeId?: string) => {
    return handleResponse(apiClient.get<any[]>('/recruitment/documents', { params: { employeeId } }));
  },

  // =================== ONBOARDING ENDPOINTS ===================

  createOnboardingChecklist: (data: CreateOnboardingChecklistDto) => {
    return handleResponse(apiClient.post('/recruitment/onboarding/checklist', data));
  },

  createOnboardingWithDefaults: (data: CreateOnboardingWithDefaultsDto) => {
    return handleResponse(apiClient.post('/recruitment/onboarding/checklist/defaults', data));
  },

  getAllOnboardingChecklists: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/onboarding/checklists/all'));
  },

  getOnboardingChecklist: (data: GetOnboardingChecklistDto) => {
    return handleResponse(apiClient.get<any>('/recruitment/onboarding/checklist', { params: data }));
  },

  sendOnboardingReminders: (data: SendOnboardingReminderDto) => {
    return handleResponse(apiClient.post('/recruitment/onboarding/reminders', data));
  },

  sendAllOnboardingReminders: (daysBeforeDeadline?: number) => {
    return handleResponse(apiClient.post('/recruitment/onboarding/reminders/all', {
      daysBeforeDeadline: daysBeforeDeadline || 1
    }));
  },

  updateTaskStatus: (data: UpdateTaskStatusDto) => {
    return handleResponse(apiClient.patch('/recruitment/onboarding/task/status', data));
  },

  cancelOnboarding: (data: CancelOnboardingDto) => {
    return handleResponse(apiClient.post('/recruitment/onboarding/cancel', data));
  },



  // =================== JOB TEMPLATE ENDPOINTS ===================

  getAllJobTemplates: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/templates'));
  },

  createJobTemplate: (data: CreateJobTemplateDto) => {
    return handleResponse(apiClient.post('/recruitment/createTemplate', data));
  },

  // =================== JOB REQUISITION ENDPOINTS ===================

  createJobRequisition: (data: CreateJobRequisitionDto) => {
    return handleResponse(apiClient.post('/recruitment/Requisition', data));
  },

  updateJobRequisition: (requisitionId: string, data: UpdateJobRequisitionDto) => {
    return handleResponse(apiClient.patch(`/recruitment/Rrequisition/${requisitionId}`, data));
  },

  getAllPublishedRequisitions: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/Requisition/published'));
  },

  getAllRequisitions: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/Requisitions/all'));
  },

  // =================== DOCUMENT ENDPOINTS ===================

  viewDocument: (documentId: string) => {
    // Note: apiClient.get returns JSON by default. For blobs, we might need a custom approach or handle it in handleResponse.
    // However, fetch with responseType: 'blob' is not standard fetch.
    // I'll use a direct fetch approach for this one if needed, or assume apiClient handles it (it doesn't yet).
    // Let's keep it consistent for now.
    return handleResponse(apiClient.get<Blob>(`/recruitment/documents/${documentId}/view`));
  },

  uploadCVDocument: (data: CreateCVDocumentDto, file: File) => {
    const formData = new FormData();
    formData.append('ownerId', data.candidateId); // Map candidateId to ownerId (DTO expects ownerId, frontend interface says candidateId)
    formData.append('type', data.documentType);
    if (data.fileUrl) formData.append('filePath', data.fileUrl); // Keep for compatibility if needed
    // fileName isn't strictly needed in body if file has name, but okay

    formData.append('file', file);

    return handleResponse(apiClient.postFormData('/recruitment/CVdocument', formData));
  },

  // =================== APPLICATION ENDPOINTS ===================

  createApplication: (data: CreateApplicationDto) => {
    return handleResponse(apiClient.post('/recruitment/Application', data));
  },

  getAllApplications: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/Applications/all'));
  },

  getMyApplications: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/Application/my'));
  },

  getApplicationsByRequisition: (requisitionId: string) => {
    return handleResponse(apiClient.get<any[]>(`/recruitment/Applications/requisition/${requisitionId}`));
  },

  getApplicationsByCandidate: (candidateId: string) => {
    return handleResponse(apiClient.get<any[]>(`/recruitment/Application/${candidateId}`));
  },

  getApplicationHistory: (applicationId: string) => {
    return handleResponse(apiClient.get<any[]>(`/recruitment/Application/${applicationId}/history`));
  },

  updateApplication: (applicationId: string, hrId: string, data: UpdateApplicationDto) => {
    return handleResponse(apiClient.patch(`/recruitment/Application/${applicationId}/update/${hrId}`, data));
  },

  updateApplicationStatus: (applicationId: string, data: UpdateApplicationDto) => {
    return handleResponse(apiClient.patch(`/recruitment/Application/${applicationId}/update`, data));
  },

  sendApplicationNotification: (applicationId: string, data?: SendNotificationDto) => {
    return handleResponse(apiClient.post(`/recruitment/Application/${applicationId}/notify`, data));
  },

  // =================== INTERVIEW ENDPOINTS ===================

  createInterview: (data: CreateInterviewDto) => {
    return handleResponse(apiClient.post('/recruitment/Interview', data));
  },

  getInterviewsByApplication: (applicationId: string) => {
    return handleResponse(apiClient.get<any[]>(`/recruitment/Interview/Application/${applicationId}`));
  },

  updateInterview: (interviewId: string, data: UpdateInterviewDto) => {
    return handleResponse(apiClient.patch(`/recruitment/Interview/${interviewId}`, data));
  },

  // =================== REFERRAL ENDPOINTS ===================

  createReferral: (candidateId: string, data: CreateReferralDto) => {
    return handleResponse(apiClient.post(`/recruitment/Application/referral/${candidateId}`, data));
  },

  // Get all referrals
  getAllReferrals: () => handleResponse(apiClient.get<any[]>('/recruitment/referrals/all')),

  // =================== ASSESSMENT ENDPOINTS ===================

  // Get assessments for current user (interviewer)
  getMyAssessments: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/Assessment/MyAssessments'));
  },

  // Get all assessments (HR only)
  getAllAssessments: () => {
    return handleResponse(apiClient.get<any[]>('/recruitment/Assessment/All'));
  },

  // Submit assessment (PATCH - update existing)
  submitAssessment: (assessmentId: string, data: CreateAssessmentDto) => {
    return handleResponse(apiClient.patch(`/recruitment/Assessment/${assessmentId}`, data));
  },
};

export default recruitmentApi;
