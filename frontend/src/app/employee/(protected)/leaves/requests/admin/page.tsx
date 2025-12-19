'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import AdminFilterLeaveRequestsPanel from '../_components/AdminFilterLeaveRequestsPanel';

export default function AdminLeaveRequestsPage() {
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
          Admin: Leave Requests by Type
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View all leave requests filtered by specific leave type. Select a leave type to see all related requests.
        </Typography>
      </Box>

      <AdminFilterLeaveRequestsPanel />
    </Box>
  );
}

