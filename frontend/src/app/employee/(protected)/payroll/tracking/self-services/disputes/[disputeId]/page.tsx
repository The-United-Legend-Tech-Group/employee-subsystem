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
import GavelIcon from '@mui/icons-material/Gavel';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import { useTheme, alpha } from '@mui/material/styles';
import { formatCurrency, formatDate, getStatusColor, formatStatusLabel } from '../../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

interface DisputeDetails {
  _id: string;
  disputeId: string;
  employeeId: any;
  payslipId: any;
  financeStaffId?: any;
  description: string;
  status: string;
  rejectionReason?: string;
  resolutionComment?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DisputeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const disputeId = params?.disputeId as string;
  
  const [dispute, setDispute] = React.useState<DisputeDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Determine where to route back to based on query parameter
  const getBackRoute = React.useMemo(() => {
    try {
      const from = searchParams?.get('from');
      if (from === 'pending-approval') {
        return '/employee/payroll/tracking/manager-services/disputes-pending-approval';
      }
      if (from === 'specialist-disputes') {
        return '/employee/payroll/tracking/specialist-services/specialist-disputes';
      }
      if (from === 'approved-disputes') {
        return '/employee/payroll/tracking/finance-services/approved-disputes';
      }
      if (from === 'my-disputes') {
        return '/employee/payroll/tracking/self-services/disputes';
      }
      // Check browser referrer as fallback
      if (typeof window !== 'undefined') {
        const referrer = document.referrer;
        if (referrer.includes('disputes-pending-approval')) {
          return '/employee/payroll/tracking/manager-services/disputes-pending-approval';
        }
        if (referrer.includes('specialist-disputes')) {
          return '/employee/payroll/tracking/specialist-services/specialist-disputes';
        }
        if (referrer.includes('approved-disputes')) {
          return '/employee/payroll/tracking/finance-services/approved-disputes';
        }
      }
    } catch (error) {
      console.error('Error determining back route:', error);
    }
    // Default fallback
    return '/employee/payroll/tracking/self-services/disputes';
  }, [searchParams]);

  React.useEffect(() => {
    if (disputeId) {
      fetchDisputeDetails();
    }
  }, [disputeId]);

  const fetchDisputeDetails = async () => {
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      // Clean the disputeId - Next.js already decodes URL parameters
      const cleanDisputeId = disputeId?.trim();
      if (!cleanDisputeId) {
        setError('Dispute ID is required');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      // Use the disputeId directly - the backend will handle encoding/decoding
      // Only encode if it contains special characters that need URL encoding
      const response = await fetch(`${apiUrl}/tracking/disputes/${encodeURIComponent(cleanDisputeId)}`, {
        credentials: 'include', // Primary: send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        if (response.status === 404) {
          setError(`Dispute with ID "${cleanDisputeId}" not found. Please check the dispute ID and try again.`);
        } else {
          setError(`Failed to load dispute: ${response.status} ${response.statusText}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Dispute data received:', data);
      setDispute(data);
    } catch (err) {
      console.error('Error fetching dispute:', err);
      setError('An error occurred while loading dispute details. Please try again.');
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

  if (error || !dispute) {
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
          {error || 'Dispute not found'}
        </Alert>
      </Box>
    );
  }

  const employeeName = typeof dispute.employeeId === 'object' 
    ? `${dispute.employeeId?.firstName || ''} ${dispute.employeeId?.lastName || ''}`.trim() || 'N/A'
    : 'N/A';
  
  const payslipId = typeof dispute.payslipId === 'object' 
    ? dispute.payslipId?._id?.toString() || dispute.payslipId?.toString() || 'N/A'
    : dispute.payslipId?.toString() || 'N/A';

  const financeStaffName = dispute.financeStaffId && typeof dispute.financeStaffId === 'object'
    ? `${dispute.financeStaffId?.firstName || ''} ${dispute.financeStaffId?.lastName || ''}`.trim() || 'N/A'
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
                Dispute Details
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                }}
              >
                Dispute ID: {dispute.disputeId || dispute._id}
              </Typography>
            </Box>
            <Chip
              label={formatStatusLabel(dispute.status)}
              color={getStatusColor(dispute.status) as any}
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
            <Grid size={{ xs: 12, sm: 4 }}>
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
          </Grid>
        </Box>
      </Box>

      {/* Dispute Information */}
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
            Dispute Information
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
                    Dispute ID
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {dispute.disputeId || dispute._id}
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
                      label={formatStatusLabel(dispute.status)}
                      color={getStatusColor(dispute.status) as any}
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
                    Payslip ID
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {payslipId}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => router.push(`/employee/payroll/tracking/self-services/payslips/${payslipId}`)}
                        sx={{ 
                          ml: 1, 
                          fontSize: '0.75rem', 
                          py: 0.5,
                          borderColor: theme.palette.divider,
                          color: 'text.primary',
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: theme.palette.text.primary,
                            backgroundColor: alpha(theme.palette.common.black, 0.04),
                          },
                        }}
                      >
                        View Payslip
                      </Button>
                    </Box>
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
                      {dispute.description || 'No description provided'}
                    </Typography>
                  </TableCell>
                </TableRow>
                {dispute.rejectionReason && (
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
                          {dispute.rejectionReason}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {dispute.resolutionComment && (
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
                          {dispute.resolutionComment}
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
                Dispute Created
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {formatDateTime(dispute.createdAt || '')}
              </Typography>
              <Typography variant="body2">
                Dispute was submitted for review
              </Typography>
            </Box>

            {/* Status updates */}
            {dispute.status?.toLowerCase().includes('approved') && (
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
                  Dispute Approved
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {formatDateTime(dispute.updatedAt || dispute.createdAt || '')}
                </Typography>
                {dispute.resolutionComment && (
                  <Typography variant="body2" color="text.secondary">
                    {dispute.resolutionComment}
                  </Typography>
                )}
              </Box>
            )}

            {dispute.status?.toLowerCase().includes('rejected') && (
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
                  Dispute Rejected
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {formatDateTime(dispute.updatedAt || dispute.createdAt || '')}
                </Typography>
                {dispute.rejectionReason && (
                  <Typography variant="body2" color="text.secondary">
                    {dispute.rejectionReason}
                  </Typography>
                )}
              </Box>
            )}

            {/* Last Updated */}
            {dispute.updatedAt && dispute.updatedAt !== dispute.createdAt && (
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
                  {formatDateTime(dispute.updatedAt)}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

    </Box>
  );
}

