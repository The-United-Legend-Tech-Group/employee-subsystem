'use client';

import * as React from 'react';
import { SystemRole } from '../../utils/role-routing';
import { useUserRole } from '../../hooks/useUserRole';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

interface RoleGuardProps {
  /**
   * Single role required to access the content
   */
  requiredRole?: SystemRole | string;
  
  /**
   * Multiple roles - user must have at least one
   */
  requiredAnyRole?: (SystemRole | string)[];
  
  /**
   * Multiple roles - user must have all
   */
  requiredAllRoles?: (SystemRole | string)[];
  
  /**
   * Content to render when user has required role(s)
   */
  children: React.ReactNode;
  
  /**
   * Custom component to show when user doesn't have required role
   * If not provided, shows nothing (null)
   */
  fallback?: React.ReactNode;
  
  /**
   * Show loading state while checking roles
   */
  showLoading?: boolean;
  
  /**
   * Show error state if role check fails
   */
  showError?: boolean;
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Custom error component
   */
  errorComponent?: React.ReactNode;
  
  /**
   * Pass employeeId and systemRole to hook if needed
   */
  employeeId?: string;
  systemRole?: string;
}

/**
 * RoleGuard Component
 * 
 * A declarative component for role-based authorization.
 * Only renders children if user has the required role(s).
 * 
 * @example
 * ```tsx
 * <RoleGuard requiredRole={SystemRole.PAYROLL_MANAGER}>
 *   <ManagerSection />
 * </RoleGuard>
 * 
 * <RoleGuard requiredAnyRole={[SystemRole.PAYROLL_MANAGER, SystemRole.PAYROLL_SPECIALIST]}>
 *   <PayrollTools />
 * </RoleGuard>
 * ```
 */
export default function RoleGuard({
  requiredRole,
  requiredAnyRole,
  requiredAllRoles,
  children,
  fallback = null,
  showLoading = false,
  showError = false,
  loadingComponent,
  errorComponent,
  employeeId,
  systemRole,
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, hasAllRoles, loading, error, roles } = useUserRole({
    employeeId,
    systemRole,
    autoFetch: true,
  });

  // Log role info for debugging
  React.useEffect(() => {
    console.log('🔒 [RoleGuard] Role state:', { roles, loading, error, requiredRole });
  }, [roles, loading, error, requiredRole]);

  // Determine if user has access
  const hasAccess = React.useMemo(() => {
    let access = false;
    if (requiredRole) {
      access = hasRole(requiredRole);
      console.log('🔒 [RoleGuard] Checking access:', { requiredRole, access, loading, error });
    } else if (requiredAnyRole && requiredAnyRole.length > 0) {
      access = hasAnyRole(requiredAnyRole);
      console.log('🔒 [RoleGuard] Checking access (any):', { requiredAnyRole, access, loading, error });
    } else if (requiredAllRoles && requiredAllRoles.length > 0) {
      access = hasAllRoles(requiredAllRoles);
      console.log('🔒 [RoleGuard] Checking access (all):', { requiredAllRoles, access, loading, error });
    } else {
      // If no requirements specified, allow access
      access = true;
    }
    return access;
  }, [requiredRole, requiredAnyRole, requiredAllRoles, hasRole, hasAnyRole, hasAllRoles, loading, error]);

  // Show loading state
  if (loading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Show error state
  if (error && showError) {
    console.warn('🔒 [RoleGuard] Error state:', error);
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="body2">
          Error checking authorization: {error}
        </Typography>
      </Alert>
    );
  }

  // If still loading and we don't have confirmed access, wait
  // But if we have confirmed access, show immediately (don't wait)
  if (loading) {
    // If access is already confirmed (e.g., from props), show immediately
    if (hasAccess && systemRole) {
      console.log('🔒 [RoleGuard] Access confirmed from props, rendering immediately');
      return <>{children}</>;
    }
    // Otherwise, wait for loading to complete
    console.log('🔒 [RoleGuard] Waiting for role check to complete...');
    return null;
  }

  // Render children if user has access, otherwise show fallback
  console.log('🔒 [RoleGuard] Final render decision:', { hasAccess, loading, error, requiredRole, roles: 'check hook' });
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

