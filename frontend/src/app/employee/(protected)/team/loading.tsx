import { Box, Skeleton, Stack } from '@mui/material';

export default function Loading() {
    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 2 }}>
            <Skeleton variant="text" width={300} height={40} sx={{ mb: 4 }} />
            <Stack spacing={2}>
                <Skeleton variant="rectangular" height={200} />
                <Skeleton variant="rectangular" height={400} />
            </Stack>
        </Box>
    );
}
