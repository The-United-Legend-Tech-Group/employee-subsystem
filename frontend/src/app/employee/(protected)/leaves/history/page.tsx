'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import LeaveHistoryPanel from './_components/LeaveHistoryPanel';

export default function LeaveHistoryPage() {
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
          My Leave History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and filter your past leave requests by type, date range, and status.
        </Typography>
      </Box>

      <LeaveHistoryPanel />
    </Box>
  );
}

