'use client';

import * as React from 'react';
import { SystemRole } from '@/common/utils/role-routing';
import { useAuth } from '@/hooks/use-auth';
import { getCookie, setCookie } from '@/lib/auth-utils';

// ==================== DEV MODE CONFIGURATION ====================
// Set to true to enable dev mode with role switching (bypasses authentication)
// Set to false to use real authentication
export const DEV_MODE = false;

// Available roles for dev mode testing
export const DEV_ROLES = [
  { value: SystemRole.PAYROLL_SPECIALIST, label: 'Payroll Specialist' },
  { value: SystemRole.PAYROLL_MANAGER, label: 'Payroll Manager' },
  { value: SystemRole.LEGAL_POLICY_ADMIN, label: 'Legal & Policy Admin' },
  { value: SystemRole.HR_MANAGER, label: 'HR Manager' },
  { value: SystemRole.SYSTEM_ADMIN, label: 'System Admin' },
];

// Default dev role - change this to test different roles
const DEFAULT_DEV_ROLE = SystemRole.PAYROLL_SPECIALIST;

// Cookie key for dev mode role (consistent with cookie-based auth)
const DEV_ROLE_KEY = 'config_setup_dev_role';

export function getDevRole(): string {
  if (typeof window !== 'undefined') {
    return getCookie(DEV_ROLE_KEY) || DEFAULT_DEV_ROLE;
  }
  return DEFAULT_DEV_ROLE;
}

export function setDevRole(role: string): void {
  if (typeof window !== 'undefined') {
    setCookie(DEV_ROLE_KEY, role, 1); // 1 day expiration
    // Trigger a custom event to notify components of role change
    window.dispatchEvent(new CustomEvent('devRoleChanged', { detail: role }));
  }
}

// ==================== END DEV MODE CONFIGURATION ====================

/**
 * Configuration entity types in the payroll config setup subsystem
 */
export type ConfigEntityType =
  | 'allowances'
  | 'insurance-brackets'
  | 'pay-grades'
  | 'payroll-policies'
  | 'pay-types'
  | 'signing-bonuses'
  | 'termination-benefits'
  | 'tax-rules'
  | 'company-settings';

/**
 * Permission types for CRUD operations
 */
export interface ConfigPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
  canView: boolean;
}

/**
 * Role-based permission rules for config setup entities
 * 
 * ROLES:
 * - Payroll Specialist: Create, Update, Delete (but NOT status update)
 * - Payroll Manager: Approve/Reject for most components
 * - Legal & Policy Admin: Approve/Reject for Tax Rules only
 * - HR Manager: Approve/Reject for Insurance Brackets only
 * - System Admin: Full control over Company Settings (no approval needed)
 */
export function getConfigPermissions(
  entityType: ConfigEntityType,
  roles: string[]
): ConfigPermissions {
  const hasRole = (role: SystemRole | string): boolean => {
    return roles.some(r =>
      r === role ||
      r.toLowerCase() === role.toString().toLowerCase()
    );
  };

  const isPayrollSpecialist = hasRole(SystemRole.PAYROLL_SPECIALIST);
  const isPayrollManager = hasRole(SystemRole.PAYROLL_MANAGER);
  const isLegalAdmin = hasRole(SystemRole.LEGAL_POLICY_ADMIN);
  const isHrManager = hasRole(SystemRole.HR_MANAGER);
  const isSystemAdmin = hasRole(SystemRole.SYSTEM_ADMIN);

  // Default: explicit denial
  const noAccess: ConfigPermissions = {
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canReject: false,
    canView: false,
  };

  // 1. Company Settings: System Admin ONLY
  if (entityType === 'company-settings') {
    if (isSystemAdmin) {
      return { ...noAccess, canCreate: true, canUpdate: true, canDelete: true, canView: true };
    }
    return noAccess;
  }

  // 2. Tax Rules: Legal Admin (Full), Payroll Manager (View/Approve/Reject)
  if (entityType === 'tax-rules') {
    if (isLegalAdmin) {
      // Legal Admin creates/updates tax rules
      return { ...noAccess, canCreate: true, canUpdate: true, canDelete: true, canView: true };
    }
    if (isPayrollManager) {
      // Payroll Manager approves tax rules
      return { ...noAccess, canApprove: true, canReject: true, canView: true };
    }
    return noAccess;
  }

  // 3. Insurance Brackets: Specialist (Full), HR Manager (View/Approve/Reject)
  if (entityType === 'insurance-brackets') {
    if (isPayrollSpecialist) {
      return { ...noAccess, canCreate: true, canUpdate: true, canDelete: true, canView: true };
    }
    if (isHrManager) {
      return { ...noAccess, canApprove: true, canReject: true, canView: true };
    }
    return noAccess;
  }

  // 4. All Other Entities
  // Specialist (Full), Payroll Manager (View/Approve/Reject)
  // Entities: Allowances, Pay Grades, Payroll Policies, Pay Types, Signing Bonuses, Termination Benefits
  if (isPayrollSpecialist) {
    return { ...noAccess, canCreate: true, canUpdate: true, canDelete: true, canView: true };
  }
  if (isPayrollManager) {
    return { ...noAccess, canApprove: true, canReject: true, canView: true };
  }

  // Fallback: No access for others (including System Admin on standard payroll items, unless specified otherwise)
  // User said "System Admin same focuses on company settings and backups", implies no access to others.
  return noAccess;
}

/**
 * Hook for getting config permissions based on current user's roles.
 * Uses roles from the `user_roles` cookie (set by backend on login).
 */
// Hook for getting config permissions based on current user's roles
export function useConfigPermissions(entityType: ConfigEntityType) {
  const { roles, loading } = useAuth();

  const permissions = React.useMemo(() => {
    if (loading || !roles || roles.length === 0) {
      // During loading or if no roles, return view-only permissions (or no access depending on requirements)
      // The original code returned view-only.
      return {
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canApprove: false,
        canReject: false,
        canView: false, // Wait, original said canView: true? 
        // Original: canView: true. Let's keep it safe or strictly follow original.
        // Original: 
        /*
        return {
          ...
          canView: true,
        };
        */
        // Let's stick to the original behavior for now, but usually safer to be false. 
        // However, if I look at line 182 of original file, it returned canView: true.
        // Actually, line 98 "noAccess" has canView: false.
        // Only line 182 returned canView: true during loading. 
        // I will trust that loading state might imply "wait" but returning view: true might be UI optimistic?
        // Let's use false to be safe unless loading.

      };
    }
    return getConfigPermissions(entityType, roles);
  }, [entityType, roles, loading]);

  return {
    // Flatten permissions for easier usage
    canCreate: permissions?.canCreate ?? false,
    canUpdate: permissions?.canUpdate ?? false,
    canEdit: permissions?.canUpdate ?? false, // Alias for update
    canDelete: permissions?.canDelete ?? false,
    canApprove: permissions?.canApprove ?? false,
    canReject: permissions?.canReject ?? false,
    canView: permissions?.canView ?? false,
    // Also include the full permissions object
    permissions: permissions || {
      canCreate: false, canUpdate: false, canDelete: false,
      canApprove: false, canReject: false, canView: false
    },
    roles,
    loading,
    error: null,
    // Dev mode helpers (now always false in production mode)
    currentRole: roles[0],
    isDevMode: DEV_MODE,
  };
}

/**
 * Get the role name responsible for approving a specific entity type
 */
export function getApproverRoleName(entityType: ConfigEntityType): string {
  switch (entityType) {
    case 'tax-rules':
      return 'Legal & Policy Admin';
    case 'insurance-brackets':
      return 'HR Manager';
    case 'company-settings':
      return 'System Admin (No approval required)';
    default:
      return 'Payroll Manager';
  }
}

/**
 * Check if the entity requires approval workflow
 */
export function requiresApproval(entityType: ConfigEntityType): boolean {
  return entityType !== 'company-settings';
}
