'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

/**
 * Payroll landing page - redirects to tracking/self-services by default
 * This page exists to prevent 404 when users navigate directly to /employee/payroll
 */
export default function PayrollPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to tracking self-services (available to all employees)
        router.replace('/employee/payroll/tracking/self-services');
    }, [router]);

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
            gap={2}
        >
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary">
                Redirecting to Payroll...
            </Typography>
        </Box>
    );
}
