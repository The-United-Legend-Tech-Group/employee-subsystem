'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import LeaveAutomationPanel from './_components/LeaveAutomationPanel';

export default function LeaveAutomationPage() {
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
          Leave Automation Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage automatic leave accrual, carry-forward, and accrual adjustments for all employees.
        </Typography>
      </Box>

      <LeaveAutomationPanel />
    </Box>
  );
}

