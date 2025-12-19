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
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import GavelIcon from '@mui/icons-material/Gavel';
import AssessmentIcon from '@mui/icons-material/Assessment';

export default function SpecialistServicesPage() {
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
        Payroll Specialist Services
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
        Approve claims and disputes, and generate payroll reports.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        {/* Approve Claims Card */}
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
            onClick={() => router.push('/employee/payroll/tracking/specialist-services/specialist-claims')}
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
                Approve Claims
              </Typography>

              <RequestQuoteIcon 
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
                Review and approve expense claims submitted by employees.
              </Typography>
              
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/employee/payroll/tracking/specialist-services/specialist-claims');
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
                Approve Claims
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Approve Disputes Card */}
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
            onClick={() => router.push('/employee/payroll/tracking/specialist-services/specialist-disputes')}
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
                Approve Disputes
              </Typography>

              <GavelIcon 
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
                Review and approve payroll disputes submitted by employees.
              </Typography>
              
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/employee/payroll/tracking/specialist-services/specialist-disputes');
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
                Approve Disputes
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Generate Reports Card */}
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
            onClick={() => router.push('/employee/payroll/tracking/specialist-services/specialist-reports')}
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
                Generate Reports
              </Typography>

              <AssessmentIcon 
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
                Generate comprehensive payroll reports by department for analysis and budget alignment.
              </Typography>
              
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/employee/payroll/tracking/specialist-services/specialist-reports');
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
                Generate Reports
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

