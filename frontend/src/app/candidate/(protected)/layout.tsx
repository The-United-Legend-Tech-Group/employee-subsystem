'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Header from '../../../common/material-ui/dashboard/components/Header';
import SideMenu from '../../../common/material-ui/dashboard/components/SideMenu';
import AppNavbar from '../../../common/material-ui/dashboard/components/AppNavbar';
import AppTheme from '../../../common/material-ui/shared-theme/AppTheme';
import {
    chartsCustomizations,
    dataGridCustomizations,
    datePickersCustomizations,
    treeViewCustomizations,
} from '../../../common/material-ui/dashboard/theme/customizations';
import {
    getCandidateIdFromCookie,
    getUserRolesFromCookie,
    logout
} from '../../../lib/auth-utils';
import { decryptData } from '../../../common/utils/encryption';
import { AuthProvider } from '../../../context/AuthContext';
import { ToastProvider } from '../../../lib/hooks/useToast';
import { SystemRole } from '../../../types/auth';

const xThemeComponents = {
    ...chartsCustomizations,
    ...dataGridCustomizations,
    ...datePickersCustomizations,
    ...treeViewCustomizations,
};

interface LayoutProps {
    children: React.ReactNode;
}

interface CandidateProfile {
    firstName: string;
    lastName: string;
    personalEmail: string;
    profilePictureUrl?: string;
}

export default function CandidateLayout({ children }: LayoutProps) {
    const router = useRouter();
    const [candidate, setCandidate] = React.useState<CandidateProfile | null>(null);
    const [roles, setRoles] = React.useState<SystemRole[]>(getUserRolesFromCookie() as SystemRole[]);

    React.useEffect(() => {
        const fetchCandidate = async () => {
            // Try cookie-based auth first (new approach)
            let candidateId = getCandidateIdFromCookie();
            setRoles(getUserRolesFromCookie() as SystemRole[]);

            // Fallback to localStorage during migration
            if (!candidateId) {
                const token = localStorage.getItem('access_token');
                const encryptedCandidateId = localStorage.getItem('candidateId');

                if (token && encryptedCandidateId) {
                    try {
                        candidateId = await decryptData(encryptedCandidateId, token);
                    } catch {
                        candidateId = null;
                    }
                }
            }

            // If no candidateId from either source, redirect to login
            if (!candidateId) {
                logout('/candidate/login');
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
                const response = await fetch(`${apiUrl}/employee/candidate/${candidateId}`, {
                    credentials: 'include', // Send httpOnly cookies
                });

                if (response.ok) {
                    const data = await response.json();
                    setCandidate(data);
                } else {
                    // Only logout on authentication/authorization failures
                    if (response.status === 401 || response.status === 403) {
                        logout('/candidate/login');
                    }
                }
            } catch (error) {
                console.error('❌ [CandidateLayout] Network error fetching profile:', error);
                // Don't logout on network error - might be transient
                // logout('/candidate/login');
            }
        };

        fetchCandidate();
    }, [router]);

    return (
        <AuthProvider initialRoles={roles} initialLoading={false}>
            <ToastProvider>
                <AppTheme themeComponents={xThemeComponents}>
                    <CssBaseline enableColorScheme />
                    <Box sx={{ display: 'flex' }}>
                        <SideMenu user={candidate ? {
                            name: `${candidate.firstName} ${candidate.lastName}`,
                            email: candidate.personalEmail,
                            image: candidate.profilePictureUrl || ''
                        } : undefined} />
                        <AppNavbar />

                        {/* Main Content Area */}
                        <Box
                            component="main"
                            sx={(theme) => ({
                                flexGrow: 1,
                                backgroundColor: theme.vars
                                    ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                                    : alpha(theme.palette.background.default, 1),
                                overflow: 'auto',
                                height: '100vh',
                            })}
                        >
                            <Stack
                                spacing={2}
                                sx={{
                                    alignItems: 'center',
                                    mx: 3,
                                    pb: 5,
                                    mt: { xs: 8, md: 0 },
                                    height: '100%',
                                }}
                            >
                                {/* Header is universal for this layout */}
                                <Header notificationPath="/candidate/notifications" />

                                {/* Page Content */}
                                <Box sx={{ width: '100%', height: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
                                    {children}
                                </Box>
                            </Stack>
                        </Box>
                    </Box>
                </AppTheme>
            </ToastProvider>
        </AuthProvider>
    );
}
