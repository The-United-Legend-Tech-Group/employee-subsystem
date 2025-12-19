'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { SystemRole } from '../types/auth';

interface AuthContextType {
    roles: SystemRole[];
    loading: boolean;
    hasRole: (requiredRoles: SystemRole | SystemRole[]) => boolean;
    hasAllRoles: (requiredRoles: SystemRole[]) => boolean;
    setRoles: (roles: SystemRole[]) => void;
    setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
    initialRoles?: SystemRole[];
    initialLoading?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
    children,
    initialRoles = [],
    initialLoading = false,
}) => {
    const [roles, setRoles] = useState<SystemRole[]>(initialRoles);
    const [loading, setLoading] = useState(initialLoading);

    // Sync state when props change (e.g., after async fetch in layout)
    useEffect(() => {
        setRoles(initialRoles);
    }, [initialRoles]);

    useEffect(() => {
        setLoading(initialLoading);
    }, [initialLoading]);

    const hasRole = useCallback((requiredRoles: SystemRole | SystemRole[]) => {
        if (loading) return false;
        const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        if (required.length === 0) return true;
        return required.some(role => roles.includes(role));
    }, [roles, loading]);

    const hasAllRoles = useCallback((requiredRoles: SystemRole[]) => {
        if (loading) return false;
        return requiredRoles.every(role => roles.includes(role));
    }, [roles, loading]);

    const value = useMemo(() => ({
        roles,
        loading,
        hasRole,
        hasAllRoles,
        setRoles,
        setLoading,
    }), [roles, loading, hasRole, hasAllRoles]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};

export { AuthContext };
