'use client';

import { useAuthContext } from '@/context/AuthContext';

/**
 * Hook for accessing authentication state and role-checking utilities.
 * Must be used within a component wrapped by AuthProvider.
 */
export const useAuth = () => {
    const { roles, loading, hasRole, hasAllRoles } = useAuthContext();
    return { roles, loading, hasRole, hasAllRoles };
};
