'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SystemRole } from '@/types/auth';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: SystemRole[];
    fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, fallback = null }) => {
    const { hasRole, loading } = useAuth();

    // Optionally handle loading state
    if (loading) {
        return null;
    }

    if (!hasRole(allowedRoles)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
