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
import { decryptData } from '../../../common/utils/encryption';
import { AuthProvider } from '../../../context/AuthContext';
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

interface EmployeeProfile {
    firstName: string;
    lastName: string;
    personalEmail: string;
    workEmail?: string;
    profilePictureUrl?: string;
}


export default function EmployeeLayout({ children }: LayoutProps) {
    const router = useRouter();
    const [employee, setEmployee] = React.useState<EmployeeProfile | null>(null);
    const [userRoles, setUserRoles] = React.useState<SystemRole[]>([]);
    const [rolesLoading, setRolesLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchEmployee = async () => {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                // Let the individual pages handle redirect if needed, or handle it here.
                // Handling it here is safer for the protected group.
                router.push('/employee/login');
                return;
            }

            try {
                // Decrypt employeeId
                const employeeId = await decryptData(encryptedEmployeeId, token);

                if (!employeeId) {
                    console.error('Failed to decrypt employee ID');
                    router.push('/employee/login');
                    return;
                }

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
                const response = await fetch(`${apiUrl}/employee/${employeeId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setEmployee(data.profile || data);

                    // Extract roles from API response (systemRole.roles)
                    const roles = data.systemRole?.roles || [];
                    setUserRoles(roles as SystemRole[]);
                    setRolesLoading(false);
                } else {
                    console.error('Failed to fetch employee profile', response.status, response.statusText);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('employeeId');
                    router.push('/employee/login');
                }
            } catch (error) {
                console.error('Failed to fetch employee profile for layout', error);
                localStorage.removeItem('access_token');
                localStorage.removeItem('employeeId');
                router.push('/employee/login');
            }
        };

        fetchEmployee();
    }, [router]);

    return (
        <AuthProvider initialRoles={userRoles} initialLoading={rolesLoading}>
            <AppTheme themeComponents={xThemeComponents}>
                <CssBaseline enableColorScheme />
                <Box sx={{ display: 'flex' }}>
                    <SideMenu user={employee ? {
                        name: `${employee.firstName} ${employee.lastName}`,
                        email: employee.workEmail || employee.personalEmail,
                        image: employee.profilePictureUrl || ''
                    } : undefined} />
                    <AppNavbar />

                    {/* Main Content Area */}
                    <Box
                        component="main"
                        sx={(theme) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                            backgroundColor: theme.vars
                                ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                                : alpha(theme.palette.background.default, 1),
                            overflow: 'hidden',
                            height: '100vh',
                        })}
                    >
                        <Box
                            sx={{
                                zIndex: 1100,
                                width: '100%',
                                bgcolor: 'background.default',
                                px: 3, //CHANGE HERE
                                py: 0.5, //CHANGE HERE
                                mt: { xs: 8, md: 0 },
                                mb: 1, //CHANGE HERE
                                flexShrink: 0,
                            }}
                        >
                            {/* Header is universal for this layout */}
                            <Header notificationPath="/employee/notifications" />
                        </Box>

                        <Stack
                            spacing={2}
                            sx={{
                                alignItems: 'center',
                                mx: 3,
                                pb: 5,
                                flexGrow: 1,
                                overflow: 'auto',
                            }}
                        >
                            {/* Page Content */}
                            <Box sx={{ width: '100%', height: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
                                {children}
                            </Box>
                        </Stack>
                    </Box>
                </Box>
            </AppTheme>
        </AuthProvider>
    );
}
