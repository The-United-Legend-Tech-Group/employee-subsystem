// Export all API modules
export { apiClient } from '../../common/utils/api/client';
export { recruitmentApi } from './recruitment';
export { offboardingApi } from './offboarding';
export { employeeApi, candidateApi, notificationApi, organizationApi } from './employee_subsystem';

// Re-export everything (including types) from the API modules
export * from './recruitment';
export * from './offboarding';
export * from './employee_subsystem';

// Re-export axios instance if needed
export { default as api } from '../axios';
