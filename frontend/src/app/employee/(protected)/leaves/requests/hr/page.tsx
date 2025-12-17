'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import HRLeaveRequestsManager from './_components/HRLeaveRequestsManager';

export default function HRLeaveRequestsPage() {
  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2.5 },
        pb: 3,
        pt: 1,
        width: '100%',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          HR Leave Requests Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Finalize approved requests, override decisions, verify medical documents, and process requests in bulk.
        </Typography>
      </Box>

      <HRLeaveRequestsManager />
    </Box>
  );
}

