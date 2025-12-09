import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export default function ArcanaLogo() {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1 }}>
            <Typography
                variant="h5"
                component="div"
                sx={{
                    fontWeight: 800,
                    color: 'text.primary',
                    letterSpacing: '-0.02em',
                    fontSize: '1.75rem',
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                }}
            >
                Arcana
            </Typography>
            <Box
                component="svg"
                viewBox="0 0 24 24"
                sx={{
                    width: 28,
                    height: 28,
                    mt: 0.5,
                    transform: 'rotate(-45deg)', // Pointing Up-Right
                    mb: 1
                }}
            >
                {/* Bottom/Left Chevron (Light Blue/Teal) */}
                <path
                    d="M7 17 L12 12 L7 7" // Right pointing arrow
                    fill="none"
                    stroke="#4DD0E1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Top/Right Chevron (Darker Blue) */}
                <path
                    d="M13 17 L18 12 L13 7" // Right pointing arrow
                    fill="none"
                    stroke="#0288D1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Box>
        </Box>
    );
}
