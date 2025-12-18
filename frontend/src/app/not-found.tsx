'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import CssBaseline from '@mui/material/CssBaseline';
import ArcanaLogo from '@/common/material-ui/shared-theme/ArcanaLogo';
import AppTheme from '@/common/material-ui/shared-theme/AppTheme';

export default function NotFoundPage() {
    return (
        <AppTheme>
            <CssBaseline enableColorScheme />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    gap: 3,
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ transform: 'scale(1.5)', mb: 4 }}>
                        <ArcanaLogo />
                    </Box>
                    <Typography
                        variant="h1"
                        component="h1"
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: '4rem', md: '6rem' },
                            opacity: 0.1,
                            mb: -2,
                            userSelect: 'none'
                        }}
                    >
                        404
                    </Typography>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 800 }}>
                        Page Not Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 4 }}>
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            component={Link}
                            href="/employee/login"
                            sx={{ px: 3, borderRadius: 2 }}
                        >
                            Sign In
                        </Button>
                        <Button
                            variant="contained"
                            component={Link}
                            href="/"
                            sx={{ px: 3, borderRadius: 2 }}
                        >
                            Back Home
                        </Button>
                    </Box>
                </Box>
            </Box>
        </AppTheme>
    );
}
