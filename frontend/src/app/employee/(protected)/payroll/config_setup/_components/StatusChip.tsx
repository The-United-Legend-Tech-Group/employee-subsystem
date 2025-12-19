'use client';

import * as React from 'react';
import Chip from '@mui/material/Chip';
import { useTheme, alpha } from '@mui/material/styles';

export type ConfigStatusType = 'draft' | 'approved' | 'rejected';

interface StatusChipProps {
  status?: ConfigStatusType;
  size?: 'small' | 'medium';
}

export default function StatusChip({ status = 'draft', size = 'small' }: StatusChipProps) {
  const theme = useTheme();

  const getStatusConfig = (status: ConfigStatusType) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          color: theme.palette.success.main,
          bgcolor: alpha(theme.palette.success.main, 0.1),
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: theme.palette.error.main,
          bgcolor: alpha(theme.palette.error.main, 0.1),
        };
      case 'draft':
      default:
        return {
          label: 'Draft',
          color: theme.palette.warning.main,
          bgcolor: alpha(theme.palette.warning.main, 0.1),
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        color: config.color,
        bgcolor: config.bgcolor,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        borderRadius: 1,
      }}
    />
  );
}
