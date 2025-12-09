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

    React.useEffect(() => {
        const fetchCandidate = async () => {
            const token = localStorage.getItem('access_token');
            const candidateId = localStorage.getItem('candidateId');

            if (!token || !candidateId) {
                router.push('/candidate/login');
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
                const response = await fetch(`${apiUrl}/employee/candidate/${candidateId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCandidate(data);
                }
            } catch (error) {
                console.error('Failed to fetch candidate profile for layout', error);
            }
        };

        fetchCandidate();
    }, [router]);

    return (
        <AppTheme themeComponents={xThemeComponents}>
            <CssBaseline enableColorScheme />
            <Box sx={{ display: 'flex' }}>
                <SideMenu user={candidate ? {
                    name: `${candidate.firstName} ${candidate.lastName}`,
                    email: candidate.personalEmail,
                    image: candidate.profilePictureUrl || '/static/images/avatar/default.jpg'
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
    );
}
