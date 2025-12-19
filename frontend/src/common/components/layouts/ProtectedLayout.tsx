'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Header from '../../material-ui/dashboard/components/Header';
import SideMenu from '../../material-ui/dashboard/components/SideMenu';
import AppNavbar from '../../material-ui/dashboard/components/AppNavbar';
import AppTheme from '../../material-ui/shared-theme/AppTheme';
import {
    chartsCustomizations,
    dataGridCustomizations,
    datePickersCustomizations,
    treeViewCustomizations,
} from '../../material-ui/dashboard/theme/customizations';
import {
    getEmployeeIdFromCookie,
    logout
} from '../../../lib/auth-utils';
import { decryptData } from '../../utils/encryption';

const xThemeComponents = {
    ...chartsCustomizations,
    ...dataGridCustomizations,
    ...datePickersCustomizations,
    ...treeViewCustomizations,
};

interface EmployeeProfile {
    firstName: string;
    lastName: string;
    personalEmail: string;
    workEmail?: string;
    profilePictureUrl?: string;
}

interface ProtectedLayoutProps {
    children: React.ReactNode;
    loginPath?: string;
    notificationPath?: string;
    apiPath?: string;
}

export default function ProtectedLayout({
    children,
    loginPath = '/employee/login',
    notificationPath = '/employee/notifications',
    apiPath
}: ProtectedLayoutProps) {
    const router = useRouter();
    const [employee, setEmployee] = React.useState<EmployeeProfile | null>(null);

    React.useEffect(() => {
        const fetchEmployee = async () => {
            // Try cookie-based auth first (new approach)
            let employeeId = getEmployeeIdFromCookie();

            // Fallback to localStorage during migration
            if (!employeeId) {
                const token = localStorage.getItem('access_token');
                const encryptedEmployeeId = localStorage.getItem('employeeId');

                if (token && encryptedEmployeeId) {
                    try {
                        employeeId = await decryptData(encryptedEmployeeId, token);
                    } catch {
                        employeeId = null;
                    }
                }
            }

            // If no employeeId from either source, redirect to login
            if (!employeeId) {
                logout(loginPath);
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
                const employeeApiPath = apiPath || `/employee/${employeeId}`;
                const response = await fetch(`${apiUrl}${employeeApiPath}`, {
                    credentials: 'include', // Send httpOnly cookies
                });

                if (response.ok) {
                    const data = await response.json();
                    setEmployee(data.profile || data);
                } else {
                    console.error('Failed to fetch employee profile', response.status, response.statusText);
                    logout(loginPath);
                }
            } catch (error) {
                console.error('Failed to fetch employee profile for layout', error);
                logout(loginPath);
            }
        };

        fetchEmployee();
    }, [router, loginPath, apiPath]);

    return (
        <AppTheme themeComponents={xThemeComponents}>
            <CssBaseline enableColorScheme />
            <Box sx={{ display: 'flex' }}>
                <SideMenu user={employee ? {
                    name: `${employee.firstName} ${employee.lastName}`,
                    email: employee.workEmail || employee.personalEmail,
                    image: employee.profilePictureUrl || '/static/images/avatar/7.jpg'
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
                        <Header notificationPath={notificationPath} />

                        {/* Page Content */}
                        <Box sx={{ width: '100%', height: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
                            {children}
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </AppTheme>
    );
}


