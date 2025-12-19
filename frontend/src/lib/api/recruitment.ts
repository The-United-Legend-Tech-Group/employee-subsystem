import api from '@/lib/axios';

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

// =================== RECRUITMENT API ===================

export const recruitmentApi = {
  // =================== OFFER ENDPOINTS ===================

  createOffer: (data: CreateOfferDto) => {
    return api.post('/recruitment/offer/create', data);
  },

  // Get all offers
  getAllOffers: () => api.get('/recruitment/offers/all'),

  // Get my offers (candidate)
  getMyOffers: () => api.get('/recruitment/offers/my'),

  // Get offers for a specific candidate (legacy / explicit)
  getOffersByCandidateId: () => api.get(`/recruitment/offers/candidate/`),

  // Get offer by ID
  getOfferById: (offerId: string) => api.get(`/recruitment/offer/${offerId}`),

  // Get my pending approvals
  getMyApprovals: () => api.get('/recruitment/offer/approvals/my'),

  addOfferApprover: (data: AddOfferApproverDto) => {
    return api.post('/recruitment/offer/add-approver', data);
  },

  approveOffer: (data: ApproveOfferDto) => {
    return api.post('/recruitment/offer/approve', data);
  },

  sendOffer: (data: SendOfferDto) => {
    return api.post('/recruitment/offer/send', data);
  },

  candidateRespondOffer: (data: CandidateRespondOfferDto) => {
    return api.post('/recruitment/offer/candidate-respond', data);
  },

  // =================== CONTRACT ENDPOINTS ===================

  getAllContracts: () => {
    return api.get('/recruitment/contracts');
  },

  getMyContracts: () => {
    return api.get('/recruitment/contracts/my');
  },

  getContractsByCandidateId: (candidateId: string) => {
    return api.get(`/recruitment/contracts/candidate/${candidateId}`);
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
    return api.post('/recruitment/contract/sign', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  hrSignContract: (data: HrSignContractDto) => {
    return api.post('/recruitment/contract/hr-sign', data);
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
    return api.post('/recruitment/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getComplianceDocuments: (employeeId?: string) => {
    return api.get('/recruitment/documents', { params: { employeeId } });
  },

  // =================== ONBOARDING ENDPOINTS ===================

  createOnboardingChecklist: (data: CreateOnboardingChecklistDto) => {
    return api.post('/recruitment/onboarding/checklist', data);
  },

  createOnboardingWithDefaults: (data: CreateOnboardingWithDefaultsDto) => {
    return api.post('/recruitment/onboarding/checklist/defaults', data);
  },

  getAllOnboardingChecklists: () => {
    return api.get('/recruitment/onboarding/checklists/all');
  },

  getOnboardingChecklist: (data: GetOnboardingChecklistDto) => {
    return api.get('/recruitment/onboarding/checklist', { params: data });
  },

  sendOnboardingReminders: (data: SendOnboardingReminderDto) => {
    return api.post('/recruitment/onboarding/reminders', data);
  },

  sendAllOnboardingReminders: (daysBeforeDeadline?: number) => {
    return api.post('/recruitment/onboarding/reminders/all', {
      daysBeforeDeadline: daysBeforeDeadline || 1
    });
  },

  updateTaskStatus: (data: UpdateTaskStatusDto) => {
    return api.patch('/recruitment/onboarding/task/status', data);
  },

  cancelOnboarding: (data: CancelOnboardingDto) => {
    return api.post('/recruitment/onboarding/cancel', data);
  },



  // =================== JOB TEMPLATE ENDPOINTS ===================

  getAllJobTemplates: () => {
    return api.get('/recruitment/templates');
  },

  createJobTemplate: (data: CreateJobTemplateDto) => {
    return api.post('/recruitment/createTemplate', data);
  },

  // =================== JOB REQUISITION ENDPOINTS ===================

  createJobRequisition: (data: CreateJobRequisitionDto) => {
    return api.post('/recruitment/Requisition', data);
  },

  updateJobRequisition: (requisitionId: string, data: UpdateJobRequisitionDto) => {
    return api.patch(`/recruitment/Rrequisition/${requisitionId}`, data);
  },

  getAllPublishedRequisitions: () => {
    return api.get('/recruitment/Requisition/published');
  },

  getAllRequisitions: () => {
    return api.get('/recruitment/Requisitions/all');
  },

  // =================== DOCUMENT ENDPOINTS ===================

  viewDocument: (documentId: string) => {
    return api.get(`/recruitment/documents/${documentId}/view`, {
      responseType: 'blob'
    });
  },

  uploadCVDocument: (data: CreateCVDocumentDto, file: File) => {
    const formData = new FormData();
    formData.append('ownerId', data.candidateId); // Map candidateId to ownerId (DTO expects ownerId, frontend interface says candidateId)
    formData.append('type', data.documentType);
    if (data.fileUrl) formData.append('filePath', data.fileUrl); // Keep for compatibility if needed
    // fileName isn't strictly needed in body if file has name, but okay

    formData.append('file', file);

    return api.post('/recruitment/CVdocument', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // =================== APPLICATION ENDPOINTS ===================

  createApplication: (data: CreateApplicationDto) => {
    return api.post('/recruitment/Application', data);
  },

  getAllApplications: () => {
    return api.get('/recruitment/Applications/all');
  },

  getMyApplications: () => {
    return api.get('/recruitment/Application/my');
  },

  getApplicationsByRequisition: (requisitionId: string) => {
    return api.get(`/recruitment/Applications/requisition/${requisitionId}`);
  },

  getApplicationsByCandidate: (candidateId: string) => {
    return api.get(`/recruitment/Application/${candidateId}`);
  },

  getApplicationHistory: (applicationId: string) => {
    return api.get(`/recruitment/Application/${applicationId}/history`);
  },

  updateApplication: (applicationId: string, hrId: string, data: UpdateApplicationDto) => {
    return api.patch(`/recruitment/Application/${applicationId}/update/${hrId}`, data);
  },

  updateApplicationStatus: (applicationId: string, data: UpdateApplicationDto) => {
    return api.patch(`/recruitment/Application/${applicationId}/update`, data);
  },

  sendApplicationNotification: (applicationId: string, data?: SendNotificationDto) => {
    return api.post(`/recruitment/Application/${applicationId}/notify`, data);
  },

  // =================== INTERVIEW ENDPOINTS ===================

  createInterview: (data: CreateInterviewDto) => {
    return api.post('/recruitment/Interview', data);
  },

  getInterviewsByApplication: (applicationId: string) => {
    return api.get(`/recruitment/Interview/Application/${applicationId}`);
  },

  updateInterview: (interviewId: string, data: UpdateInterviewDto) => {
    return api.patch(`/recruitment/Interview/${interviewId}`, data);
  },

  // =================== REFERRAL ENDPOINTS ===================

  createReferral: (candidateId: string, data: CreateReferralDto) => {
    return api.post(`/recruitment/Application/referral/${candidateId}`, data);
  },

  // Get all referrals
  getAllReferrals: () => api.get('/recruitment/referrals/all'),

  // =================== ASSESSMENT ENDPOINTS ===================

  // Get assessments for current user (interviewer)
  getMyAssessments: () => {
    return api.get('/recruitment/Assessment/MyAssessments');
  },

  // Get all assessments (HR only)
  getAllAssessments: () => {
    return api.get('/recruitment/Assessment/All');
  },

  // Submit assessment (PATCH - update existing)
  submitAssessment: (assessmentId: string, data: CreateAssessmentDto) => {
    return api.patch(`/recruitment/Assessment/${assessmentId}`, data);
  },
};

export default recruitmentApi;
