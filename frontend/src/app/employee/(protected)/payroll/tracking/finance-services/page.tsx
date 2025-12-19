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
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

export default function FinanceServicesPage() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        fontFamily: 'inherit',
        maxWidth: '1180px',
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box mb={5}>
        <Typography 
          variant="h5" 
          component="h1"
          sx={{ 
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2rem' },
            letterSpacing: '-0.02em',
            color: 'text.primary',
            mb: 1,
          }}
        >
          Finance Services
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontSize: '1rem',
            fontWeight: 400,
          }}
        >
          Generate reports about taxes, insurance contributions, and benefits for accounting compliance. Process refunds for approved disputes and claims.
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: { xs: 2, sm: 2.5, md: 3 },
          alignItems: 'stretch',
        }}
      >
        {/* Payroll Summary Card */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
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
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
              },
            }}
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
                Payroll Summary
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
                Generate month-end or year-end payroll summaries that aggregate all payroll data for accounting compliance.
              </Typography>
              
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push('/employee/payroll/tracking/finance-services/generate-payroll-summary')}
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
                Payroll Summary
              </Button>
            </CardContent>
          </Card>
        </Box>
        
        {/* Tax/Insurance/Benefits Report Card */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
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
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
              },
            }}
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
                Tax/Insurance/Benefits Report
              </Typography>

              <DescriptionIcon 
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
                Generate comprehensive reports on tax deductions, insurance contributions, and employee benefits for regulatory compliance.
              </Typography>
              
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push('/employee/payroll/tracking/finance-services/generate-tax-insurance-benefits-report')}
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
                Tax/Insurance/Benefits Report
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Approved Disputes Card */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
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
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
              },
            }}
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
                Approved Disputes
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
                View approved payslip disputes and process refunds for payroll adjustments. Get notified when new disputes are approved.
              </Typography>
              
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push('/employee/payroll/tracking/finance-services/approved-disputes')}
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
                View Disputes
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Approved Claims Card */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
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
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
              },
            }}
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
                Approved Claims
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
                Generate refunds for approved expense claims. Refunds will be included in the next payroll cycle. Get notified when new claims are approved.
              </Typography>
              
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push('/employee/payroll/tracking/finance-services/approved-claims')}
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
                View Claims
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

