import { Box, Skeleton, Stack, Card, CardContent } from '@mui/material';

export default function Loading() {
    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 2 }}>
            <Skeleton variant="text" width={350} height={48} sx={{ mb: 4 }} />
            <Stack spacing={4}>
                {/* Profile Section Skeleton */}
                <Card variant="outlined">
                    <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                            <Skeleton variant="circular" width={160} height={160} />
                            <Box sx={{ flex: 1, width: '100%' }}>
                                <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
                                <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
                                <Stack direction="row" spacing={3} flexWrap="wrap">
                                    <Skeleton variant="rectangular" width={180} height={50} />
                                    <Skeleton variant="rectangular" width={180} height={50} />
                                    <Skeleton variant="rectangular" width={180} height={50} />
                                </Stack>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
                {/* Employment Details Skeleton */}
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                {/* Performance Overview Skeleton */}
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
            </Stack>
        </Box>
    );
}
