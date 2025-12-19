'use client';

import * as React from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CategoryIcon from '@mui/icons-material/Category';
import { useTheme, alpha } from '@mui/material/styles';
import { formatCurrency, formatDate, getStatusColor, formatStatusLabel } from '../../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

interface ClaimDetails {
  _id: string;
  claimId: string;
  employeeId: any;
  financeStaffId?: any;
  description: string;
  claimType: string;
  amount: number;
  approvedAmount?: number;
  status: string;
  rejectionReason?: string;
  resolutionComment?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ClaimDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const claimId = params?.claimId as string;

  const [claim, setClaim] = React.useState<ClaimDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Determine where to route back to based on query parameter
  const getBackRoute = React.useMemo(() => {
    try {
      const from = searchParams?.get('from');
      if (from === 'pending-approval') {
        return '/employee/payroll/tracking/manager-services/claims-pending-approval';
      }
      if (from === 'specialist-claims') {
        return '/employee/payroll/tracking/specialist-services/specialist-claims';
      }
      if (from === 'approved-claims') {
        return '/employee/payroll/tracking/finance-services/approved-claims';
      }
      if (from === 'my-claims') {
        return '/employee/payroll/tracking/self-services/claims';
      }
      if (from === 'my-disputes') {
        return '/employee/payroll/tracking/self-services/disputes';
      }
      // Check browser referrer as fallback
      if (typeof window !== 'undefined') {
        const referrer = document.referrer;
        if (referrer.includes('claims-pending-approval')) {
          return '/employee/payroll/tracking/manager-services/claims-pending-approval';
        }
        if (referrer.includes('specialist-claims')) {
          return '/employee/payroll/tracking/specialist-services/specialist-claims';
        }
        if (referrer.includes('approved-claims')) {
          return '/employee/payroll/tracking/finance-services/approved-claims';
        }
      }
    } catch (error) {
      console.error('Error determining back route:', error);
    }
    // Default fallback
    return '/employee/payroll/tracking/self-services/claims';
  }, [searchParams]);

  React.useEffect(() => {
    if (claimId) {
      fetchClaimDetails();
    }
  }, [claimId]);

  const fetchClaimDetails = async () => {
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      // Clean the claimId - Next.js already decodes URL parameters
      const cleanClaimId = claimId?.trim();
      if (!cleanClaimId) {
        setError('Claim ID is required');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      // Encode for the API call to handle special characters
      const response = await fetch(`${apiUrl}/tracking/claims/${encodeURIComponent(cleanClaimId)}`, {
        credentials: 'include', // Primary: send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        if (response.status === 404) {
          setError(`Claim with ID "${cleanClaimId}" not found. Please check the claim ID and try again.`);
        } else {
          setError(`Failed to load claim: ${response.status} ${response.statusText}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Claim data received:', data);
      setClaim(data);
    } catch (err) {
      console.error('Error fetching claim:', err);
      setError('An error occurred while loading claim details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return formatDate(dateString, true);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error || !claim) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(getBackRoute)}
          sx={{ mb: 3 }}
        >
          Back
        </Button>
        <Alert severity="error">
          {error || 'Claim not found'}
        </Alert>
      </Box>
    );
  }

  const employeeName = typeof claim.employeeId === 'object'
    ? `${claim.employeeId?.firstName || ''} ${claim.employeeId?.lastName || ''}`.trim() || 'N/A'
    : 'N/A';

  const financeStaffName = claim.financeStaffId && typeof claim.financeStaffId === 'object'
    ? `${claim.financeStaffId?.firstName || ''} ${claim.financeStaffId?.lastName || ''}`.trim() || 'N/A'
    : null;

  return (
    <Box sx={{ fontFamily: 'inherit', maxWidth: '1400px', mx: 'auto' }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(getBackRoute)}
          sx={{
            mb: 3,
            textTransform: 'none',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.black, 0.04),
            },
          }}
        >
          Back
        </Button>

        {/* Header Section */}
        <Box
          sx={{
            mb: 4,
            pb: 3,
            borderBottom: `2px solid ${theme.palette.divider}`,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.75rem',
                  letterSpacing: '-0.01em',
                  mb: 1,
                  color: 'text.primary',
                }}
              >
                Claim Details
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                }}
              >
                Claim ID: {claim.claimId || claim._id}
              </Typography>
            </Box>
            <Chip
              label={formatStatusLabel(claim.status)}
              color={getStatusColor(claim.status) as any}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                px: 1.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            />
          </Box>

          {/* Employee Information */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5,
                    display: 'block',
                  }}
                >
                  Employee
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {employeeName}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5,
                    display: 'block',
                  }}
                >
                  Claim Type
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {claim.claimType || 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Claim Information */}
      <Card
        sx={{
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          background: theme.palette.background.paper,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 3,
              color: 'text.primary',
              fontSize: '1.125rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Claim Information
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: 'text.secondary',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      py: 1.5,
                    },
                  }}
                >
                  <TableCell>Field</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell sx={{ width: '200px', fontWeight: 600 }}>
                    Claim ID
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {claim.claimId || claim._id}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    Status
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatStatusLabel(claim.status)}
                      color={getStatusColor(claim.status) as any}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    Claim Type
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={claim.claimType || 'N/A'}
                      size="small"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: 24,
                        backgroundColor: theme.palette.grey[200],
                        color: theme.palette.grey[800],
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    Description
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {claim.description || 'No description provided'}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    Claimed Amount
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="text.primary"
                    >
                      {formatCurrency(claim.amount || 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
                {claim.approvedAmount !== undefined && claim.approvedAmount !== null && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      Approved Amount
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color="text.primary"
                      >
                        {formatCurrency(claim.approvedAmount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {claim.rejectionReason && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      Rejection Reason
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 0,
                          background: theme.palette.grey[50],
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                          Rejection Reason
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }} color="text.primary">
                          {claim.rejectionReason}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {claim.resolutionComment && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      Resolution Comment
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 0,
                          background: theme.palette.grey[50],
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                          Resolution Comment
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }} color="text.primary">
                          {claim.resolutionComment}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {financeStaffName && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      Finance Staff
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {financeStaffName}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card
        sx={{
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          background: theme.palette.background.paper,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 3,
              color: 'text.primary',
              fontSize: '1.125rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Timeline
          </Typography>

          <Box sx={{ position: 'relative', pl: 3 }}>
            {/* Timeline line */}
            <Box
              sx={{
                position: 'absolute',
                left: '15px',
                top: 0,
                bottom: 0,
                width: '2px',
                background: theme.palette.divider,
              }}
            />

            {/* Created */}
            <Box sx={{ position: 'relative', mb: 3 }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: '-19px',
                  top: '4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: theme.palette.grey[600],
                  border: `2px solid ${theme.palette.background.paper}`,
                }}
              />
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                Claim Submitted
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {formatDateTime(claim.createdAt || '')}
              </Typography>
              <Typography variant="body2">
                Claim was submitted for review
              </Typography>
            </Box>

            {/* Status updates */}
            {claim.status?.toLowerCase().includes('approved') && (
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: '-19px',
                    top: '4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: theme.palette.grey[600],
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                />
                <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                  Claim Approved
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {formatDateTime(claim.updatedAt || claim.createdAt || '')}
                </Typography>
                {claim.resolutionComment && (
                  <Typography variant="body2" color="text.secondary">
                    {claim.resolutionComment}
                  </Typography>
                )}
                {claim.approvedAmount && (
                  <Typography variant="body2" color="text.primary" fontWeight={600} mt={1}>
                    Approved Amount: {formatCurrency(claim.approvedAmount)}
                  </Typography>
                )}
              </Box>
            )}

            {claim.status?.toLowerCase().includes('rejected') && (
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: '-19px',
                    top: '4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: theme.palette.grey[600],
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                />
                <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                  Claim Rejected
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {formatDateTime(claim.updatedAt || claim.createdAt || '')}
                </Typography>
                {claim.rejectionReason && (
                  <Typography variant="body2" color="text.secondary">
                    {claim.rejectionReason}
                  </Typography>
                )}
              </Box>
            )}

            {/* Last Updated */}
            {claim.updatedAt && claim.updatedAt !== claim.createdAt && (
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: '-19px',
                    top: '4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: theme.palette.grey[600],
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                />
                <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                  Last Updated
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(claim.updatedAt)}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

    </Box>
  );
}

