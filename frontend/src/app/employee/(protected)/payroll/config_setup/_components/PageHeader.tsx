'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTheme, alpha } from '@mui/material/styles';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  action,
  backButton,
}: PageHeaderProps) {
  const theme = useTheme();

  return (
    <Box mb={4}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
        mb={1}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { fontSize: 32, color: 'primary.main' },
            } as any)}
          </Box>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: '2rem',
                letterSpacing: '-0.02em',
                mb: 0.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Box display="flex" gap={1.5}>
          {backButton && (
            <Button
              variant="outlined"
              onClick={backButton.onClick}
              sx={{
                height: 42,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {backButton.label}
            </Button>
          )}
          {action && (
            <Button
              variant="contained"
              onClick={action.onClick}
              startIcon={action.icon}
              sx={{
                height: 42,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {action.label}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
