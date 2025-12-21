import { apiClient, type ApiResponse } from '@/common/utils/api/client';

// ==================== Common Types ====================
export interface UpdateStatusDto {
  status: 'draft' | 'approved' | 'rejected';
}

export interface BaseConfigResponse {
  _id: string;
  status?: 'draft' | 'approved' | 'rejected';
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ConfigStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// ==================== Allowances ====================
export interface CreateAllowanceDto {
  name: string;
  amount: number;
  status?: 'draft' | 'approved' | 'rejected';
}

export interface UpdateAllowanceDto {
  name?: string;
  amount?: number;
}

export interface AllowanceResponse extends BaseConfigResponse {
  name: string;
  amount: number;
}

// ==================== Insurance Brackets ====================
export interface CreateInsuranceBracketDto {
  name: string;
  minSalary: number;
  maxSalary?: number;
  employeeRate: number;
  employerRate: number;
}

export interface UpdateInsuranceBracketDto {
  name?: string;
  minSalary?: number;
  maxSalary?: number;
  employeeRate?: number;
  employerRate?: number;
}

export interface InsuranceBracketResponse extends BaseConfigResponse {
  name: string;
  minSalary: number;
  maxSalary?: number;
  employeeRate: number;
  employerRate: number;
}

// ==================== Pay Grades ====================
export interface CreatePayGradeDto {
  grade: string;
  baseSalary: number;
  grossSalary: number;
}

export interface UpdatePayGradeDto {
  grade?: string;
  baseSalary?: number;
  grossSalary?: number;
}

export interface PayGradeResponse extends BaseConfigResponse {
  grade: string;
  baseSalary: number;
  grossSalary: number;
}

// ==================== Payroll Policies ====================
export enum PolicyType {
  DEDUCTION = "Deduction",
  ALLOWANCE = "Allowance",
  BENEFIT = "Benefit",
  MISCONDUCT = "Misconduct",
  LEAVE = "Leave",
}

export enum Applicability {
  ALL_EMPLOYEES = "All Employees",
  FULL_TIME = "Full Time Employees",
  PART_TIME = "Part Time Employees",
  CONTRACTORS = "Contractors",
}

export interface RuleDefinitionDto {
  percentage: number;
  fixedAmount: number;
  thresholdAmount: number;
}

export interface CreatePayrollPolicyDto {
  policyName: string;
  policyType: PolicyType;
  description: string;
  effectiveDate: string;
  ruleDefinition: RuleDefinitionDto;
  applicability: Applicability;
}

export interface UpdatePayrollPolicyDto extends Partial<CreatePayrollPolicyDto> {
  approvedBy?: string;
  approvedAt?: string;
}

export interface PayrollPolicyResponse extends BaseConfigResponse {
  policyName: string;
  policyType: PolicyType;
  description: string;
  effectiveDate: string;
  ruleDefinition: RuleDefinitionDto;
  applicability: Applicability;
}

// ==================== Pay Types ====================
export interface CreatePayTypeDto {
  type: string;
  amount: number;
}

export interface UpdatePayTypeDto {
  type?: string;
  amount?: number;
}

export interface PayTypeResponse extends BaseConfigResponse {
  type: string;
  amount: number;
}

// ==================== Signing Bonuses ====================
export interface CreateSigningBonusDto {
  positionName: string;
  amount: number;
}

export interface UpdateSigningBonusDto {
  positionName?: string;
  amount?: number;
}

export interface SigningBonusResponse extends BaseConfigResponse {
  positionName: string;
  amount: number;
}

// ==================== Termination Benefits ====================
export interface CreateTerminationBenefitDto {
  name: string;
  amount: number;
  terms?: string;
}

export interface UpdateTerminationBenefitDto {
  name?: string;
  amount?: number;
  terms?: string;
}

export interface TerminationBenefitResponse extends BaseConfigResponse {
  name: string;
  amount: number;
  terms?: string;
}

// ==================== Company Settings ====================
export interface CreateCompanySettingsDto {
  payDate: string;
  timeZone: string;
  currency?: string;
}

export interface UpdateCompanySettingsDto {
  payDate?: string;
  timeZone?: string;
  currency?: string;
}

export interface CompanySettingsResponse extends BaseConfigResponse {
  payDate: string;
  timeZone: string;
  currency?: string;
}

// ==================== Tax Rules ====================
export interface CreateTaxRuleDto {
  name: string;
  description?: string;
  rate: number;
}

export interface UpdateTaxRuleDto {
  name?: string;
  description?: string;
  rate?: number;
}

export interface TaxRuleResponse extends BaseConfigResponse {
  name: string;
  description?: string;
  rate: number;
}

// ==================== Pagination & Query ====================
export interface PaginationQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: ConfigStatus;
  [key: string]: any;
}

export interface InsuranceBracketPaginationDto extends PaginationQueryDto {
  minSalary?: number;
  maxSalary?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

// ==================== Pending Approvals ====================
export interface PendingApprovalsResponse {
  allowances: number;
  insuranceBrackets: number;
  payGrades: number;
  payrollPolicies: number;
  payTypes: number;
  signingBonuses: number;
  taxRules: number;
  terminationBenefits: number;
  total: number;
}

export const configSetupApi = {
  getPendingApprovals: (): Promise<ApiResponse<PendingApprovalsResponse>> => {
    return apiClient.get<PendingApprovalsResponse>('/config-setup/pending-approvals');
  },
};

// ==================== API Functions ====================

export const allowancesApi = {
  findAll: (query?: PaginationQueryDto): Promise<ApiResponse<PaginatedResponse<AllowanceResponse>>> => {
    return apiClient.get<PaginatedResponse<AllowanceResponse>>('/config-setup/allowances', { params: query });
  },
  findOne: (id: string): Promise<ApiResponse<AllowanceResponse>> => {
    return apiClient.get<AllowanceResponse>(`/config-setup/allowances/${id}`);
  },
  create: (dto: CreateAllowanceDto): Promise<ApiResponse<AllowanceResponse>> => {
    return apiClient.post<AllowanceResponse>('/config-setup/allowances', dto);
  },
  update: (id: string, dto: UpdateAllowanceDto): Promise<ApiResponse<AllowanceResponse>> => {
    return apiClient.patch<AllowanceResponse>(`/config-setup/allowances/${id}`, dto);
  },
  updateStatus: (id: string, dto: UpdateStatusDto): Promise<ApiResponse<AllowanceResponse>> => {
    return apiClient.patch<AllowanceResponse>(`/config-setup/allowances/${id}/status`, dto);
  },
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/config-setup/allowances/${id}`);
  },
};

export const insuranceBracketsApi = {
  findAll: (query?: InsuranceBracketPaginationDto): Promise<ApiResponse<PaginatedResponse<InsuranceBracketResponse>>> => {
    return apiClient.get<PaginatedResponse<InsuranceBracketResponse>>('/config-setup/insurance-brackets', { params: query });
  },
  findOne: (id: string): Promise<ApiResponse<InsuranceBracketResponse>> => {
    return apiClient.get<InsuranceBracketResponse>(`/config-setup/insurance-brackets/${id}`);
  },
  findBySalary: (salary: number): Promise<ApiResponse<InsuranceBracketResponse>> => {
    return apiClient.get<InsuranceBracketResponse>(`/config-setup/insurance-brackets/by-salary/${salary}`);
  },
  create: (dto: CreateInsuranceBracketDto): Promise<ApiResponse<InsuranceBracketResponse>> => {
    return apiClient.post<InsuranceBracketResponse>('/config-setup/insurance-brackets', dto);
  },
  update: (id: string, dto: UpdateInsuranceBracketDto): Promise<ApiResponse<InsuranceBracketResponse>> => {
    return apiClient.patch<InsuranceBracketResponse>(`/config-setup/insurance-brackets/${id}`, dto);
  },
  updateStatus: (id: string, dto: UpdateStatusDto): Promise<ApiResponse<InsuranceBracketResponse>> => {
    return apiClient.patch<InsuranceBracketResponse>(`/config-setup/insurance-brackets/${id}/status`, dto);
  },
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/config-setup/insurance-brackets/${id}`);
  },
};

export const payGradesApi = {
  findAll: (query?: PaginationQueryDto): Promise<ApiResponse<PaginatedResponse<PayGradeResponse>>> => {
    return apiClient.get<PaginatedResponse<PayGradeResponse>>('/config-setup/pay-grades', { params: query });
  },
  findOne: (id: string): Promise<ApiResponse<PayGradeResponse>> => {
    return apiClient.get<PayGradeResponse>(`/config-setup/pay-grades/${id}`);
  },
  findByName: (grade: string): Promise<ApiResponse<PayGradeResponse>> => {
    return apiClient.get<PayGradeResponse>(`/config-setup/pay-grades/by-name/${grade}`);
  },
  create: (dto: CreatePayGradeDto): Promise<ApiResponse<PayGradeResponse>> => {
    return apiClient.post<PayGradeResponse>('/config-setup/pay-grades', dto);
  },
  update: (id: string, dto: UpdatePayGradeDto): Promise<ApiResponse<PayGradeResponse>> => {
    return apiClient.patch<PayGradeResponse>(`/config-setup/pay-grades/${id}`, dto);
  },
  updateStatus: (id: string, dto: UpdateStatusDto): Promise<ApiResponse<PayGradeResponse>> => {
    return apiClient.patch<PayGradeResponse>(`/config-setup/pay-grades/${id}/status`, dto);
  },
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/config-setup/pay-grades/${id}`);
  },
};

export const payrollPoliciesApi = {
  findAll: (query?: PaginationQueryDto): Promise<ApiResponse<PaginatedResponse<PayrollPolicyResponse>>> => {
    return apiClient.get<PaginatedResponse<PayrollPolicyResponse>>('/config-setup/payroll-policies', { params: query });
  },
  findOne: (id: string): Promise<ApiResponse<PayrollPolicyResponse>> => {
    return apiClient.get<PayrollPolicyResponse>(`/config-setup/payroll-policies/${id}`);
  },
  findByType: (type: string): Promise<ApiResponse<PayrollPolicyResponse[]>> => {
    return apiClient.get<PayrollPolicyResponse[]>(`/config-setup/payroll-policies/by-type/${type}`);
  },
  findByApplicability: (applicability: string): Promise<ApiResponse<PayrollPolicyResponse[]>> => {
    return apiClient.get<PayrollPolicyResponse[]>(`/config-setup/payroll-policies/by-applicability/${applicability}`);
  },
  create: (dto: CreatePayrollPolicyDto): Promise<ApiResponse<PayrollPolicyResponse>> => {
    return apiClient.post<PayrollPolicyResponse>('/config-setup/payroll-policies', dto);
  },
  update: (id: string, dto: UpdatePayrollPolicyDto): Promise<ApiResponse<PayrollPolicyResponse>> => {
    return apiClient.patch<PayrollPolicyResponse>(`/config-setup/payroll-policies/${id}`, dto);
  },
  updateStatus: (id: string, dto: UpdateStatusDto): Promise<ApiResponse<PayrollPolicyResponse>> => {
    return apiClient.patch<PayrollPolicyResponse>(`/config-setup/payroll-policies/${id}/status`, dto);
  },
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/config-setup/payroll-policies/${id}`);
  },
};

export const payTypesApi = {
  findAll: (query?: PaginationQueryDto): Promise<ApiResponse<PaginatedResponse<PayTypeResponse>>> => {
    return apiClient.get<PaginatedResponse<PayTypeResponse>>('/config-setup/pay-types', { params: query });
  },
  findOne: (id: string): Promise<ApiResponse<PayTypeResponse>> => {
    return apiClient.get<PayTypeResponse>(`/config-setup/pay-types/${id}`);
  },
  create: (dto: CreatePayTypeDto): Promise<ApiResponse<PayTypeResponse>> => {
    return apiClient.post<PayTypeResponse>('/config-setup/pay-types', dto);
  },
  update: (id: string, dto: UpdatePayTypeDto): Promise<ApiResponse<PayTypeResponse>> => {
    return apiClient.patch<PayTypeResponse>(`/config-setup/pay-types/${id}`, dto);
  },
  updateStatus: (id: string, dto: UpdateStatusDto): Promise<ApiResponse<PayTypeResponse>> => {
    return apiClient.patch<PayTypeResponse>(`/config-setup/pay-types/${id}/status`, dto);
  },
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/config-setup/pay-types/${id}`);
  },
};

export const signingBonusesApi = {
  findAll: (query?: PaginationQueryDto): Promise<ApiResponse<PaginatedResponse<SigningBonusResponse>>> => {
    return apiClient.get<PaginatedResponse<SigningBonusResponse>>('/config-setup/signing-bonuses', { params: query });
  },
  findOne: (id: string): Promise<ApiResponse<SigningBonusResponse>> => {
    return apiClient.get<SigningBonusResponse>(`/config-setup/signing-bonuses/${id}`);
  },
  create: (dto: CreateSigningBonusDto): Promise<ApiResponse<SigningBonusResponse>> => {
    return apiClient.post<SigningBonusResponse>('/config-setup/signing-bonuses', dto);
  },
  update: (id: string, dto: UpdateSigningBonusDto): Promise<ApiResponse<SigningBonusResponse>> => {
    return apiClient.patch<SigningBonusResponse>(`/config-setup/signing-bonuses/${id}`, dto);
  },
  updateStatus: (id: string, dto: UpdateStatusDto): Promise<ApiResponse<SigningBonusResponse>> => {
    return apiClient.patch<SigningBonusResponse>(`/config-setup/signing-bonuses/${id}/status`, dto);
  },
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/config-setup/signing-bonuses/${id}`);
  },
};

export const terminationBenefitsApi = {
  findAll: (query?: PaginationQueryDto): Promise<ApiResponse<PaginatedResponse<TerminationBenefitResponse>>> => {
    return apiClient.get<PaginatedResponse<TerminationBenefitResponse>>('/config-setup/termination-benefits', { params: query });
  },
  findOne: (id: string): Promise<ApiResponse<TerminationBenefitResponse>> => {
    return apiClient.get<TerminationBenefitResponse>(`/config-setup/termination-benefits/${id}`);
  },
  create: (dto: CreateTerminationBenefitDto): Promise<ApiResponse<TerminationBenefitResponse>> => {
    return apiClient.post<TerminationBenefitResponse>('/config-setup/termination-benefits', dto);
  },
  update: (id: string, dto: UpdateTerminationBenefitDto): Promise<ApiResponse<TerminationBenefitResponse>> => {
    return apiClient.patch<TerminationBenefitResponse>(`/config-setup/termination-benefits/${id}`, dto);
  },
  updateStatus: (id: string, dto: UpdateStatusDto): Promise<ApiResponse<TerminationBenefitResponse>> => {
    return apiClient.patch<TerminationBenefitResponse>(`/config-setup/termination-benefits/${id}/status`, dto);
  },
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/config-setup/termination-benefits/${id}`);
  },
};

export const companySettingsApi = {
  findAll: (): Promise<ApiResponse<CompanySettingsResponse[]>> => {
    return apiClient.get<CompanySettingsResponse[]>('/config-setup/company-settings');
  },
  findOne: (id: string): Promise<ApiResponse<CompanySettingsResponse>> => {
    return apiClient.get<CompanySettingsResponse>(`/config-setup/company-settings/${id}`);
  },
  create: (dto: CreateCompanySettingsDto): Promise<ApiResponse<CompanySettingsResponse>> => {
    return apiClient.post<CompanySettingsResponse>('/config-setup/company-settings', dto);
  },
  update: (id: string, dto: UpdateCompanySettingsDto): Promise<ApiResponse<CompanySettingsResponse>> => {
    return apiClient.patch<CompanySettingsResponse>(`/config-setup/company-settings/${id}`, dto);
  },
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/config-setup/company-settings/${id}`);
  },
};

export const taxRulesApi = {
  findAll: (query?: PaginationQueryDto): Promise<ApiResponse<PaginatedResponse<TaxRuleResponse>>> => {
    return apiClient.get<PaginatedResponse<TaxRuleResponse>>('/config-setup/tax-rules', { params: query });
  },
  findOne: (id: string): Promise<ApiResponse<TaxRuleResponse>> => {
    return apiClient.get<TaxRuleResponse>(`/config-setup/tax-rules/${id}`);
  },
  create: (dto: CreateTaxRuleDto): Promise<ApiResponse<TaxRuleResponse>> => {
    return apiClient.post<TaxRuleResponse>('/config-setup/tax-rules', dto);
  },
  update: (id: string, dto: UpdateTaxRuleDto): Promise<ApiResponse<TaxRuleResponse>> => {
    return apiClient.patch<TaxRuleResponse>(`/config-setup/tax-rules/${id}`, dto);
  },
  updateStatus: (id: string, dto: UpdateStatusDto): Promise<ApiResponse<TaxRuleResponse>> => {
    return apiClient.patch<TaxRuleResponse>(`/config-setup/tax-rules/${id}/status`, dto);
  },
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/config-setup/tax-rules/${id}`);
  },
};

export const backupApi = {
  triggerBackup: (): Promise<ApiResponse<{ message: string; timestamp: string }>> => {
    return apiClient.post<{ message: string; timestamp: string }>('/config-setup/backup/trigger', {});
  },
  listBackups: (): Promise<ApiResponse<{ backups: string[] }>> => {
    return apiClient.get<{ backups: string[] }>('/config-setup/backup/list');
  },
  restoreBackup: (backupName: string): Promise<ApiResponse<{ message: string; timestamp: string }>> => {
    return apiClient.post<{ message: string; timestamp: string }>(`/config-setup/backup/restore/${backupName}`, {});
  },
  downloadBackup: async (backupName: string): Promise<void> => {
    // Use apiClient.getBlob to properly handle authentication
    // window.open doesn't send Authorization headers or cookies correctly in all cases
    const endpoint = `/config-setup/backup/download/${backupName}`;
    console.log('[Backup Download] Attempting to download:', {
      endpoint,
      backupName,
    });

    const response = await apiClient.getBlob(endpoint);
    console.log('[Backup Download] Response:', {
      hasError: !!response.error,
      error: response.error,
      hasData: !!response.data,
    });

    if (response.error) {
      console.error('Failed to download backup:', response.error);
      throw new Error(response.error);
    }

    if (response.data) {
      // Create a temporary blob URL and trigger download
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${backupName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  },
};

