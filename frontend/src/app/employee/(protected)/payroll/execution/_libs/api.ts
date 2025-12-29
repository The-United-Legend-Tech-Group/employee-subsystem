import axios, { AxiosError } from 'axios';
import type { PayrollRun } from './types';
import { isAuthenticated } from '../../../../../../lib/auth-utils';

// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Primary auth: httpOnly cookies sent automatically
});

// Add request interceptor for auth tokens if needed
// NOTE: With withCredentials: true, httpOnly cookies are sent automatically.
// The localStorage lookup below is a FALLBACK during migration only.
apiClient.interceptors.request.use(
  (config) => {
    // Skip adding Authorization header if authenticated via cookies
    // This fallback is only for migration period
    if (!isAuthenticated()) {
      const token =
        localStorage.getItem('access_token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        '';
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${String(token).replace(
          /^Bearer\s+/i,
          ''
        )}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access');
    } else if (error.response?.status === 403) {
      // Handle forbidden
      console.error('Forbidden access');
    }
    return Promise.reject(error);
  }
);

// ==================== PHASE 3: REVIEW & APPROVAL API ====================

/**
 * Get all payroll runs ordered by creation date (newest first)
 * Returns an array of all payrolls
 */
export async function getPayrollsForReview(): Promise<PayrollRun[]> {
  try {
    const response = await apiClient.get('/payroll/execution/review/payrolls');
    return response.data;
  } catch (error) {
    console.error('Error fetching payrolls for review:', error);
    throw error;
  }
}

/**
 * Get detailed preview of a specific payroll run by ID
 * Includes payroll run details, all payslips, and summary statistics
 */
export async function getPayrollPreview(payrollRunId: string) {
  try {
    const response = await apiClient.get(
      `/payroll/execution/review/${payrollRunId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll preview:', error);
    throw error;
  }
}

/**
 * Payroll Specialist publishes payroll for Manager and Finance approval
 * Changes status from UNDER_REVIEW to ready for manager approval
 */
export async function publishPayrollForApproval(payrollRunId: string) {
  try {
    const response = await apiClient.post('/payroll/execution/publish', {
      payrollRunId
    });
    return response.data;
  } catch (error) {
    console.error('Error publishing payroll for approval:', error);
    throw error;
  }
}

/**
 * Payroll Manager approves payroll
 * Changes status from UNDER_REVIEW to PENDING_FINANCE_APPROVAL
 */
export async function approvePayrollByManager(payrollRunId: string) {
  try {
    const response = await apiClient.post(
      '/payroll/execution/approve/manager',
      {
        payrollRunId
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error approving payroll by manager:', error);
    throw error;
  }
}

/**
 * Payroll Manager or Finance Staff rejects payroll
 * Changes status to REJECTED with rejection reason
 */
export async function rejectPayroll(
  payrollRunId: string,
  rejectionReason: string
) {
  try {
    const response = await apiClient.post('/payroll/execution/reject', {
      payrollRunId,
      rejectionReason
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting payroll:', error);
    throw error;
  }
}

/**
 * Finance Staff approves payroll for disbursement
 * Changes status to APPROVED and payment status to PAID
 */
export async function approvePayrollByFinance(payrollRunId: string) {
  try {
    const response = await apiClient.post(
      '/payroll/execution/approve/finance',
      {
        payrollRunId
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error approving payroll by finance:', error);
    throw error;
  }
}

/**
 * Payroll Manager locks/freezes finalized payroll
 * Changes status to LOCKED (only for APPROVED payrolls with PAID status)
 */
export async function freezePayroll(payrollRunId: string, managerId: string) {
  try {
    const response = await apiClient.post('/payroll/execution/freeze', {
      payrollRunId,
      managerId
    });
    return response.data;
  } catch (error) {
    console.error('Error freezing payroll:', error);
    throw error;
  }
}

/**
 * Payroll Manager unfreezes payroll with justification
 * Changes status from LOCKED to UNLOCKED
 */
export async function unfreezePayroll(
  payrollRunId: string,
  managerId: string,
  unlockReason: string
) {
  try {
    const response = await apiClient.post('/payroll/execution/unfreeze', {
      payrollRunId,
      managerId,
      unlockReason
    });
    return response.data;
  } catch (error) {
    console.error('Error unfreezing payroll:', error);
    throw error;
  }
}

// ==================== PHASE 4: PAYSLIP GENERATION API ====================

/**
 * Generate and distribute payslips after approval
 * Automatically triggered after finance approval and manager lock
 * Sends payslip emails to all employees
 */
export async function generateAndDistributePayslips(payrollRunId: string) {
  try {
    const response = await apiClient.post(
      '/payroll/execution/payslips/generate',
      {
        payrollRunId
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error generating and distributing payslips:', error);
    throw error;
  }
}

/**
 * Get payslip for a specific employee in a payroll run
 */
export async function getEmployeePayslip(
  payrollRunId: string,
  employeeId: string
) {
  try {
    const response = await apiClient.get(
      `/payroll/execution/payslips/${payrollRunId}/employee/${employeeId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching employee payslip:', error);
    throw error;
  }
}

/**
 * Get all payslips for a payroll run
 * Used by managers and specialists to review all generated payslips
 */
export async function getAllPayslipsForRun(payrollRunId: string) {
  try {
    const response = await apiClient.get(
      `/payroll/execution/payslips/${payrollRunId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching all payslips for run:', error);
    throw error;
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generic error handler for API calls
 * Extracts meaningful error messages from different error formats
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return (
      axiosError.response?.data?.message ||
      axiosError.message ||
      'An error occurred'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Check if error is due to authorization/authentication
 */
export function isAuthError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
}

/**
 * Check if error is due to validation failure
 */
export function isValidationError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 400;
  }
  return false;
}

export default apiClient;
