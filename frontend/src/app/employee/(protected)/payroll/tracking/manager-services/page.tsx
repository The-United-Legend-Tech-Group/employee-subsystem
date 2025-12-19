'use client';

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useRouter } from 'next/navigation';
import { useTheme, alpha } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function ManagerServicesPage() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
      <Typography 
        variant="h4" 
        component="h1"
        sx={{ 
          fontWeight: 700,
          fontSize: '2.5rem',
          letterSpacing: '-0.02em',
          color: 'text.primary',
          mb: 1,
        }}
      >
        Manager Services
      </Typography>
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ 
          fontSize: '1.1rem',
          fontWeight: 400,
          mb: 4,
        }}
      >
        Review and confirm approvals for disputes and expense claims that have been approved by Payroll Specialists.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        {/* Disputes Pending Approval Card */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            maxWidth: '350px',
            flex: 1,
            minWidth: { xs: '100%', sm: '300px' },
          }}
        >
          <Card 
            sx={{ 
              width: '100%',
              borderRadius: 2.5,
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
              background: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              overflow: 'hidden',
              transition: 'transform 180ms ease, box-shadow 180ms ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
              },
            }}
            onClick={() => router.push('/employee/payroll/tracking/manager-services/disputes-pending-approval')}
          >
            <CardContent 
              sx={{ 
                width: '100%',
                px: 3,
                pt: 3.5,
                pb: 3,
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                flex: 1,
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'text.primary',
                }}
              >
                Disputes Pending Approval
              </Typography>

              <CheckCircleIcon 
                sx={{ 
                  fontSize: 46,
                  color: 'text.secondary',
                  opacity: 0.7,
                }} 
              />

              <Divider sx={{ width: '100%', opacity: 0.2 }} />
              
              <Typography 
                variant="body2"
                color="text.secondary"
                sx={{ 
                  lineHeight: 1.6,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                Review and confirm approvals for disputes that have been approved by Payroll Specialists.
              </Typography>
              
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/employee/payroll/tracking/manager-services/disputes-pending-approval');
                }}
                sx={{ 
                  mt: 'auto',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  px: 2.8,
                  py: 1,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'text.primary',
                    backgroundColor: alpha(theme.palette.common.black, 0.04),
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Disputes Pending Approval
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Claims Pending Approval Card */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            maxWidth: '350px',
            flex: 1,
            minWidth: { xs: '100%', sm: '300px' },
          }}
        >
          <Card 
            sx={{ 
              width: '100%',
              borderRadius: 2.5,
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
              background: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              overflow: 'hidden',
              transition: 'transform 180ms ease, box-shadow 180ms ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
              },
            }}
            onClick={() => router.push('/employee/payroll/tracking/manager-services/claims-pending-approval')}
          >
            <CardContent 
              sx={{ 
                width: '100%',
                px: 3,
                pt: 3.5,
                pb: 3,
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                flex: 1,
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'text.primary',
                }}
              >
                Claims Pending Approval
              </Typography>

              <AssignmentIcon 
                sx={{ 
                  fontSize: 46,
                  color: 'text.secondary',
                  opacity: 0.7,
                }} 
              />

              <Divider sx={{ width: '100%', opacity: 0.2 }} />
              
              <Typography 
                variant="body2"
                color="text.secondary"
                sx={{ 
                  lineHeight: 1.6,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                Review and confirm approvals for expense claims that have been approved by Payroll Specialists.
              </Typography>
              
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/employee/payroll/tracking/manager-services/claims-pending-approval');
                }}
                sx={{ 
                  mt: 'auto',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  px: 2.8,
                  py: 1,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'text.primary',
                    backgroundColor: alpha(theme.palette.common.black, 0.04),
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Claims Pending Approval
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

