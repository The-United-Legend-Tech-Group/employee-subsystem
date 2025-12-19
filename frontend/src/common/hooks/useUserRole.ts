'use client';

import * as React from 'react';
import { SystemRole } from '../utils/role-routing';
import { decryptData } from '../utils/encryption';
import {
  getEmployeeIdFromCookie,
  getUserRolesFromCookie
} from '../../lib/auth-utils';

interface UseUserRoleOptions {
  employeeId?: string;
  systemRole?: string;
  autoFetch?: boolean;
}

interface EmployeeRoleData {
  systemRole?: {
    roles?: string[];
  };
  roles?: string[];
  employeeSystemRole?: {
    roles?: string[];
  };
}

/**
 * Custom hook for managing user roles and role-based authorization
 * 
 * @param options - Configuration options for the hook
 * @returns Object containing roles, role check functions, and convenience flags
 */
export function useUserRole(options: UseUserRoleOptions = {}) {
  const { employeeId, systemRole, autoFetch = true } = options;

  const [roles, setRoles] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(autoFetch);
  const [error, setError] = React.useState<string | null>(null);

  // Extract roles from employee data
  const extractRolesFromData = React.useCallback((data: any): string[] => {
    const extractedRoles: string[] = [];

    console.log('🔍 [useUserRole] Extracting roles from data:', data);

    // Backend returns: { profile: {...}, systemRole: { roles: [...] }, performance: {...} }
    // Check data.systemRole.roles (backend returns systemRole as an object with roles array)
    if (data.systemRole?.roles && Array.isArray(data.systemRole.roles)) {
      console.log('🔍 [useUserRole] Found roles in systemRole.roles:', data.systemRole.roles);
      extractedRoles.push(...data.systemRole.roles);
    }

    // Check if systemRole itself has roles directly (different API structure)
    if (data.systemRole && Array.isArray(data.systemRole)) {
      console.log('🔍 [useUserRole] Found systemRole as array:', data.systemRole);
      extractedRoles.push(...data.systemRole.filter((r: string) => !extractedRoles.includes(r)));
    }

    // Fallback: check data.roles if it exists
    if (data.roles && Array.isArray(data.roles)) {
      console.log('🔍 [useUserRole] Found roles at top level:', data.roles);
      extractedRoles.push(...data.roles.filter((r: string) => !extractedRoles.includes(r)));
    }

    // Fallback: check data.employeeSystemRole.roles
    if (data.employeeSystemRole?.roles && Array.isArray(data.employeeSystemRole.roles)) {
      console.log('🔍 [useUserRole] Found roles in employeeSystemRole.roles:', data.employeeSystemRole.roles);
      extractedRoles.push(...data.employeeSystemRole.roles.filter((r: string) => !extractedRoles.includes(r)));
    }

    // Check data.employeeSystemRoles (plural) - array of role objects
    if (data.employeeSystemRoles && Array.isArray(data.employeeSystemRoles)) {
      console.log('🔍 [useUserRole] Found employeeSystemRoles array:', data.employeeSystemRoles);
      // If it's an array of objects with roles property
      data.employeeSystemRoles.forEach((roleObj: any) => {
        if (roleObj?.roles && Array.isArray(roleObj.roles)) {
          extractedRoles.push(...roleObj.roles.filter((r: string) => !extractedRoles.includes(r)));
        } else if (typeof roleObj === 'string') {
          // If it's an array of role strings
          if (!extractedRoles.includes(roleObj)) {
            extractedRoles.push(roleObj);
          }
        }
      });
    }

    // Check if systemRole is an object that might have been transformed
    if (data.systemRole && typeof data.systemRole === 'object' && !Array.isArray(data.systemRole) && data.systemRole !== null) {
      // Check for roles array in the systemRole object
      if (data.systemRole.roles && Array.isArray(data.systemRole.roles)) {
        console.log('🔍 [useUserRole] Found roles in systemRole object:', data.systemRole.roles);
        extractedRoles.push(...data.systemRole.roles.filter((r: string) => !extractedRoles.includes(r)));
      }
      // Check if systemRole has a roles property that's a nested structure
      if (data.systemRole.employeeSystemRoles && Array.isArray(data.systemRole.employeeSystemRoles)) {
        console.log('🔍 [useUserRole] Found employeeSystemRoles in systemRole:', data.systemRole.employeeSystemRoles);
        data.systemRole.employeeSystemRoles.forEach((roleObj: any) => {
          if (roleObj?.roles && Array.isArray(roleObj.roles)) {
            extractedRoles.push(...roleObj.roles.filter((r: string) => !extractedRoles.includes(r)));
          }
        });
      }
    }

    // Check profile.systemRole if nested
    if (data.profile?.systemRole?.roles && Array.isArray(data.profile.systemRole.roles)) {
      console.log('🔍 [useUserRole] Found roles in profile.systemRole.roles:', data.profile.systemRole.roles);
      extractedRoles.push(...data.profile.systemRole.roles.filter((r: string) => !extractedRoles.includes(r)));
    }

    // Check profile.employeeSystemRoles if nested
    if (data.profile?.employeeSystemRoles && Array.isArray(data.profile.employeeSystemRoles)) {
      console.log('🔍 [useUserRole] Found employeeSystemRoles in profile:', data.profile.employeeSystemRoles);
      data.profile.employeeSystemRoles.forEach((roleObj: any) => {
        if (roleObj?.roles && Array.isArray(roleObj.roles)) {
          extractedRoles.push(...roleObj.roles.filter((r: string) => !extractedRoles.includes(r)));
        }
      });
    }

    console.log('🔍 [useUserRole] Final extracted roles:', extractedRoles);
    return extractedRoles;
  }, []);

  // Fetch roles from API
  const fetchRoles = React.useCallback(async () => {
    console.log('🔍 [useUserRole] fetchRoles called, autoFetch:', autoFetch);
    if (!autoFetch) {
      console.log('🔍 [useUserRole] AutoFetch disabled, skipping');
      return;
    }

    try {
      console.log('🔍 [useUserRole] Starting role fetch...');
      setLoading(true);
      setError(null);

      // Try cookie-based auth first (new approach)
      let resolvedEmployeeId = employeeId || getEmployeeIdFromCookie();

      // Try to get roles from cookie first (quick path)
      const cookieRoles = getUserRolesFromCookie();
      if (cookieRoles.length > 0 && !resolvedEmployeeId) {
        console.log('🔍 [useUserRole] Using roles from cookie:', cookieRoles);
        setRoles(cookieRoles);
        setLoading(false);
        return;
      }

      // Fallback to localStorage during migration
      if (!resolvedEmployeeId) {
        const token = localStorage.getItem('access_token');
        const encryptedEmployeeId = localStorage.getItem('employeeId');

        if (token && encryptedEmployeeId) {
          try {
            resolvedEmployeeId = await decryptData(encryptedEmployeeId, token);
          } catch {
            resolvedEmployeeId = null;
          }
        }
      }

      if (!resolvedEmployeeId) {
        console.warn('🔍 [useUserRole] No employeeId available');
        // Try to use cookie roles as fallback
        if (cookieRoles.length > 0) {
          setRoles(cookieRoles);
        } else {
          setError('No authentication found');
        }
        setLoading(false);
        return;
      }

      console.log('🔍 [useUserRole] Fetching employee data for:', resolvedEmployeeId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      const response = await fetch(`${apiUrl}/employee/${resolvedEmployeeId}`, {
        credentials: 'include', // Send httpOnly cookies
      });

      console.log('🔍 [useUserRole] API response status:', response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [useUserRole] Raw API response:', data);
        const extractedRoles = extractRolesFromData(data);
        console.log('🔍 [useUserRole] Extracted roles:', extractedRoles);
        setRoles(extractedRoles);
      } else {
        const errorText = await response.text();
        console.error('🔍 [useUserRole] API error:', response.status, errorText);
        setError(`Failed to fetch employee data: ${response.status}`);
      }
    } catch (err) {
      console.error('🔍 [useUserRole] Exception fetching roles:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      console.log('🔍 [useUserRole] Role fetch complete');
    }
  }, [autoFetch, employeeId, extractRolesFromData]);

  // Initialize roles from props if provided
  React.useEffect(() => {
    if (systemRole) {
      console.log('🔍 [useUserRole] Setting roles from prop:', systemRole);
      setRoles([systemRole]);
    }
  }, [systemRole]);

  // Auto-fetch roles on mount if enabled
  React.useEffect(() => {
    if (autoFetch && !systemRole) {
      fetchRoles();
    }
  }, [autoFetch, systemRole, fetchRoles]);

  /**
   * Check if user has a specific role
   */
  const hasRole = React.useCallback((role: SystemRole | string): boolean => {
    if (!roles || roles.length === 0) {
      console.log('🔍 [useUserRole] hasRole check - No roles available:', { role, roles });
      return false;
    }
    const hasMatch = roles.some(r =>
      r === role ||
      r.toLowerCase() === role.toString().toLowerCase()
    );
    const comparisons = roles.map(r => ({
      roleValue: r,
      checkingFor: role.toString(),
      exact: r === role,
      caseInsensitive: r.toLowerCase() === role.toString().toLowerCase(),
      trimmed: r.trim().toLowerCase() === role.toString().trim().toLowerCase()
    }));

    console.log('🔍 [useUserRole] hasRole check:', {
      role,
      roles,
      hasMatch,
      comparisons
    });

    if (!hasMatch) {
      console.warn('⚠️ [useUserRole] Role mismatch!', {
        lookingFor: role,
        foundRoles: roles,
        comparisons
      });
    }

    return hasMatch;
  }, [roles]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = React.useCallback((roleList: (SystemRole | string)[]): boolean => {
    if (!roles || roles.length === 0) return false;
    return roleList.some(role => hasRole(role));
  }, [roles, hasRole]);

  /**
   * Check if user has all of the specified roles
   */
  const hasAllRoles = React.useCallback((roleList: (SystemRole | string)[]): boolean => {
    if (!roles || roles.length === 0) return false;
    return roleList.every(role => hasRole(role));
  }, [roles, hasRole]);

  // Convenience flags for common roles
  const isPayrollManager = React.useMemo(() =>
    hasRole(SystemRole.PAYROLL_MANAGER),
    [hasRole]
  );

  const isPayrollSpecialist = React.useMemo(() =>
    hasRole(SystemRole.PAYROLL_SPECIALIST),
    [hasRole]
  );

  const isFinanceStaff = React.useMemo(() =>
    hasRole(SystemRole.FINANCE_STAFF),
    [hasRole]
  );

  const isHrManager = React.useMemo(() =>
    hasRole(SystemRole.HR_MANAGER),
    [hasRole]
  );

  const isSystemAdmin = React.useMemo(() =>
    hasRole(SystemRole.SYSTEM_ADMIN),
    [hasRole]
  );

  const hasPayrollRole = React.useMemo(() =>
    hasAnyRole([
      SystemRole.PAYROLL_MANAGER,
      SystemRole.PAYROLL_SPECIALIST,
      SystemRole.FINANCE_STAFF
    ]),
    [hasAnyRole]
  );

  return {
    roles,
    loading,
    error,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isPayrollManager,
    isPayrollSpecialist,
    isFinanceStaff,
    isHrManager,
    isSystemAdmin,
    hasPayrollRole,
    refetch: fetchRoles,
  };
}

