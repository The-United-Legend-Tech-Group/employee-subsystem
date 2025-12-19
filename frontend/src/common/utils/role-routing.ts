// Role-based routing utilities

export enum SystemRole {
  DEPARTMENT_EMPLOYEE = 'department employee',
  DEPARTMENT_HEAD = 'department head',
  HR_MANAGER = 'HR Manager',
  HR_EMPLOYEE = 'HR Employee',
  PAYROLL_SPECIALIST = 'Payroll Specialist',
  SYSTEM_ADMIN = 'System Admin',
  LEGAL_POLICY_ADMIN = 'Legal & Policy Admin',
  RECRUITER = 'Recruiter',
  FINANCE_STAFF = 'Finance Staff',
  JOB_CANDIDATE = 'Job Candidate',
  HR_ADMIN = 'HR Admin',
  PAYROLL_MANAGER = 'Payroll Manager',
}

/**
 * Determines the appropriate dashboard route based on user roles
 * Priority order: System Admin > Payroll Manager > HR Admin > HR Manager > 
 * Payroll Specialist > Finance Staff > Department Head > HR Employee > 
 * Legal Policy Admin > Recruiter > Department Employee > Job Candidate
 * 
 * @param roles - Array of system roles assigned to the employee
 * @returns The dashboard route path
 */
export function getDashboardRoute(roles: string[]): string {
  if (!roles || roles.length === 0) {
    return '/department-employee';
  }

  // Check for payroll-related roles in priority order
  if (roles.includes(SystemRole.PAYROLL_MANAGER)) {
    return '/payroll-manager';
  }

  if (roles.includes(SystemRole.PAYROLL_SPECIALIST)) {
    return '/payroll-specialist';
  }

  if (roles.includes(SystemRole.FINANCE_STAFF)) {
    return '/finance-staff';
  }

  // Check for other roles in priority order
  if (roles.includes(SystemRole.SYSTEM_ADMIN)) {
    return '/system-admin';
  }

  if (roles.includes(SystemRole.HR_ADMIN)) {
    return '/hr-admin';
  }

  if (roles.includes(SystemRole.HR_MANAGER)) {
    return '/hr-manager';
  }

  if (roles.includes(SystemRole.DEPARTMENT_HEAD)) {
    return '/department-head';
  }

  if (roles.includes(SystemRole.HR_EMPLOYEE)) {
    return '/hr-employee';
  }

  if (roles.includes(SystemRole.LEGAL_POLICY_ADMIN)) {
    return '/legal-policy-admin';
  }

  if (roles.includes(SystemRole.RECRUITER)) {
    return '/recruiter';
  }

  if (roles.includes(SystemRole.JOB_CANDIDATE)) {
    return '/job-candidate';
  }

  if (roles.includes(SystemRole.DEPARTMENT_EMPLOYEE)) {
    return '/department-employee';
  }

  // Default to department-employee
  return '/department-employee';
}

/**
 * Checks if user has any payroll-related role
 * 
 * @param roles - Array of system roles assigned to the employee
 * @returns True if user has payroll-related role
 */
export function hasPayrollRole(roles: string[]): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }

  return (
    roles.includes(SystemRole.PAYROLL_MANAGER) ||
    roles.includes(SystemRole.PAYROLL_SPECIALIST) ||
    roles.includes(SystemRole.FINANCE_STAFF)
  );
}

/**
 * Extracts the role prefix from the current pathname
 * Examples:
 *   /department-employee -> department-employee
 *   /hr-manager/analytics -> hr-manager
 *   /payroll-specialist -> payroll-specialist
 *   /payroll-manager -> payroll-manager
 *   /finance-staff -> finance-staff
 *   /employee -> employee (fallback)
 * 
 * @param pathname - Current pathname from usePathname()
 * @returns The role prefix (e.g., 'department-employee', 'hr-manager', 'payroll-specialist')
 */
export function getRolePrefixFromPath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return 'employee'; // Default fallback
  }

  // Remove leading slash and split
  const parts = pathname.split('/').filter(Boolean);
  
  // Check if first part is a role prefix
  const rolePrefixes = [
    'department-employee',
    'department-head',
    'hr-manager',
    'hr-employee',
    'hr-admin',
    'payroll-manager',
    'payroll-specialist',
    'finance-staff',
    'system-admin',
    'legal-policy-admin',
    'recruiter',
    'job-candidate',
  ];

  // Check if first part matches a role prefix
  if (parts.length > 0 && rolePrefixes.includes(parts[0])) {
    return parts[0];
  }

  // Fallback to 'employee' for legacy routes
  return 'employee';
}

