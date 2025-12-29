'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import ManagerLeaveRequestsPanel from './_components/ManagerLeaveRequestsPanel';

export default function ManagerLeaveRequestsPage() {
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
          Team Leave Requests
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review, approve, or reject leave requests from your team members.
        </Typography>
      </Box>

      <ManagerLeaveRequestsPanel />
    </Box>
  );
}

