'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import LeaveBalancePanel from './_components/LeaveBalancePanel';

export default function LeaveBalancePage() {
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
          My Leave Balance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View your current leave balances across all leave types.
        </Typography>
      </Box>

      <LeaveBalancePanel />
    </Box>
  );
}

