import { Box, Skeleton, Stack } from '@mui/material';

export default function Loading() {
    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 2 }}>
            <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 1 }} />
        </Box>
    );
}
