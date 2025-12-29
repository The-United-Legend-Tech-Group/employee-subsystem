'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import { useTheme, alpha } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency, formatDate, getStatusColor, formatStatusLabel, getEmployeeDisplay } from '../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

interface Claim {
  _id: string;
  claimId: string;
  description: string;
  claimType: string;
  amount: number;
  approvedAmount?: number;
  status: string;
  createdAt: string;
  resolutionComment?: string;
  employeeId?: string | { _id: string; firstName?: string; lastName?: string; employeeNumber?: string };
}

export default function ClaimsPendingApprovalPage() {
  const router = useRouter();
  const theme = useTheme();
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = React.useState<Claim | null>(null);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openRejectDialog, setOpenRejectDialog] = React.useState(false);
  const [comment, setComment] = React.useState('');
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [approvedRefundAmount, setApprovedRefundAmount] = React.useState<string>('');
  const [processing, setProcessing] = React.useState(false);

  // Table filters
  const {
    filteredData: filteredClaims,
    filters,
    updateSearch,
    updateStartDate,
    updateEndDate,
    clearFilters,
  } = useTableFilters<Claim>(
    claims,
    ['claimId', 'description', 'claimType', 'status'],
    'createdAt',
    'month' // Use month/year filtering for payroll-related claims
  );

  React.useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      // Use the dedicated endpoint for Payroll Managers to view all pending claims
      const response = await fetch(`${apiUrl}/tracking/claims/pending-manager-approval`, {
        credentials: 'include', // Primary: send httpOnly cookies
      });

      if (response.ok) {
        const claimsData = await response.json();
        // Transform data to ensure consistent field names
        const transformedClaims = Array.isArray(claimsData) ? claimsData.map((claim: any) => ({
          _id: claim._id?.toString() || claim._id || '',
          claimId: claim.claimId || claim.claim_id || '',
          description: claim.description || '',
          claimType: claim.claimType || '',
          amount: claim.amount || 0,
          approvedAmount: claim.approvedAmount || null,
          status: claim.status || 'Unknown',
          createdAt: claim.createdAt || claim.created_at || '',
          resolutionComment: claim.resolutionComment || null,
          employeeId: claim.employeeId || null,
        })) : [];

        console.log('🔍 [ClaimsPendingApproval] Fetched claims:', {
          total: transformedClaims.length,
          claims: transformedClaims.map((c: Claim) => ({
            claimId: c.claimId,
            status: c.status,
            employeeId: c.employeeId,
          })),
        });
        setClaims(transformedClaims);
      } else {
        let errorMessage = `Failed to load claims: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('❌ [ClaimsPendingApproval] API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
          console.error('❌ [ClaimsPendingApproval] Parse Error:', errorText);
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError('An error occurred while loading claims');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClaim = (claim: Claim) => {
    setSelectedClaim(claim);
    setOpenDialog(true);
    setComment('');
    // Initialize with Payroll Specialist's approved amount, manager can override
    setApprovedRefundAmount(claim.approvedAmount ? claim.approvedAmount.toString() : '');
  };

  const handleRejectClaim = (claim: Claim) => {
    setSelectedClaim(claim);
    setOpenRejectDialog(true);
    setRejectionReason('');
    setComment('');
  };

  const handleSubmitConfirmation = async () => {
    if (!selectedClaim) return;

    setProcessing(true);
    setError(null);
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        setError('Not authenticated. Please log in again.');
        setProcessing(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      // Trim claimId to ensure no whitespace issues
      const cleanClaimId = selectedClaim.claimId.trim();

      console.log('🔍 [ClaimsPendingApproval] Confirming claim:', {
        claimId: cleanClaimId,
        status: selectedClaim.status,
        approvedAmount: selectedClaim.approvedAmount,
        resolutionComment: selectedClaim.resolutionComment,
        hasPayrollSpecialistComment: selectedClaim.resolutionComment?.includes('Payroll Specialist:') || false,
      });

      const response = await fetch(
        `${apiUrl}/tracking/claims/${encodeURIComponent(cleanClaimId)}/confirm-approval`,
        {
          method: 'PATCH',
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'confirm',
            comment: comment || undefined,
            approvedRefundAmount: approvedRefundAmount ? parseFloat(approvedRefundAmount) : undefined,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [ClaimsPendingApproval] Claim confirmed successfully:', result);
        setSuccess(`Claim ${cleanClaimId} has been confirmed successfully! It will now be available for Finance Staff to process refunds.`);
        setOpenDialog(false);
        setSelectedClaim(null);
        setComment('');
        setApprovedRefundAmount('');
        // Refresh the claims list
        await fetchClaims();
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        let errorMessage = 'Failed to confirm approval';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;

          // Log full error details - use console.log to avoid interception
          console.log('❌ [ClaimsPendingApproval] ========== ERROR DETAILS ==========');
          console.log('Status:', response.status, response.statusText);
          console.log('Error Message:', errorMessage);
          console.log('Claim ID:', cleanClaimId);
          console.log('Claim Status:', selectedClaim.status);
          console.log('Approved Amount:', selectedClaim.approvedAmount);
          console.log('Resolution Comment:', selectedClaim.resolutionComment);
          console.log('Has Payroll Specialist Comment:', selectedClaim.resolutionComment?.includes('Payroll Specialist:') || false);
          console.log('Full Error Object:', JSON.stringify(errorData, null, 2));
          console.log('❌ [ClaimsPendingApproval] ====================================');
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || `Server returned ${response.status}: ${response.statusText}`;
          console.error('❌ [ClaimsPendingApproval] Parse Error:', {
            errorText,
            claimId: cleanClaimId,
            parseError,
          });
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('❌ [ClaimsPendingApproval] Exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while confirming approval');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitRejection = async () => {
    if (!selectedClaim || !rejectionReason.trim()) return;
    if (rejectionReason.trim().length < 20) {
      setError('Please provide a more detailed rejection reason (at least 20 characters).');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        setError('Not authenticated. Please log in again.');
        setProcessing(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      const cleanClaimId = selectedClaim.claimId.trim();

      console.log('🔍 [ClaimsPendingApproval] Rejecting claim:', {
        claimId: cleanClaimId,
        status: selectedClaim.status,
      });

      const response = await fetch(
        `${apiUrl}/tracking/claims/${encodeURIComponent(cleanClaimId)}/confirm-approval`,
        {
          method: 'PATCH',
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'reject',
            rejectionReason: rejectionReason.trim(),
            comment: comment || undefined,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [ClaimsPendingApproval] Claim rejected successfully:', result);
        setSuccess(`Claim ${cleanClaimId} has been rejected.`);
        setOpenRejectDialog(false);
        setSelectedClaim(null);
        setRejectionReason('');
        setComment('');
        fetchClaims();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        let errorMessage = 'Failed to reject claim';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;

          console.log('❌ [ClaimsPendingApproval] ========== REJECT ERROR DETAILS ==========');
          console.log('Status:', response.status, response.statusText);
          console.log('Error Message:', errorMessage);
          console.log('Claim ID:', cleanClaimId);
          console.log('Full Error Object:', JSON.stringify(errorData, null, 2));
          console.log('❌ [ClaimsPendingApproval] ====================================');
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || `Server returned ${response.status}: ${response.statusText}`;
          console.error('❌ [ClaimsPendingApproval] Parse Error:', {
            errorText,
            claimId: cleanClaimId,
            parseError,
          });
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('❌ [ClaimsPendingApproval] Exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while rejecting claim');
    } finally {
      setProcessing(false);
    }
  };


  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        sx={{
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        '& *': {
          fontFamily: 'inherit',
        },
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon
              sx={{
                fontSize: 40,
                color: 'primary.main',
                opacity: 0.9,
              }}
            />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                  mb: 0.5,
                }}
              >
                Claims Pending Approval
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: '1rem',
                  fontWeight: 400,
                  opacity: 0.8,
                }}
              >
                Review and confirm approvals for expense claims that have been approved by Payroll Specialists
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={() => router.push('/employee/payroll/tracking/manager-services')}
            sx={{
              height: 42,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            fontFamily: 'inherit',
            '& .MuiAlert-message': {
              fontWeight: 500,
            },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
            fontFamily: 'inherit',
            '& .MuiAlert-message': {
              fontWeight: 500,
            },
          }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {claims.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by Claim ID, employee, description, or type..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      {claims.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <AssignmentIcon
              sx={{
                fontSize: 64,
                color: 'text.disabled',
                mb: 2,
                opacity: 0.5,
              }}
            />
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                fontSize: '1.1rem',
              }}
            >
              No claims pending approval
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                opacity: 0.7,
              }}
            >
              All claims have been processed or none are awaiting your approval
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden',
            background: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <Table sx={{ fontFamily: 'inherit' }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  '& th': {
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    color: 'text.primary',
                    borderBottom: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                    py: 2,
                  },
                }}
              >
                <TableCell>Claim ID</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Claimed Amount</TableCell>
                <TableCell align="right">Approved Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No claims match your search criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClaims.map((claim) => (
                  <TableRow
                    key={claim._id}
                    hover
                    sx={{
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                        transform: 'translateX(2px)',
                      },
                      '& td': {
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                        py: 2.5,
                        fontSize: '0.95rem',
                      },
                      '&:last-child td': {
                        borderBottom: 'none',
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                      }}
                    >
                      <Button
                        variant="text"
                        onClick={() => router.push(`/employee/payroll/tracking/self-services/claims/${claim.claimId || claim._id}?from=pending-approval`)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          color: 'primary.main',
                          p: 0,
                          minWidth: 'auto',
                          '&:hover': {
                            textDecoration: 'underline',
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {claim.claimId || 'N/A'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getEmployeeDisplay(claim.employeeId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={claim.claimType || 'N/A'}
                        size="small"
                        sx={{
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {claim.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(claim.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {claim.approvedAmount
                          ? formatCurrency(claim.approvedAmount)
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatusLabel(claim.status)}
                        color={getStatusColor(claim.status) as any}
                        size="small"
                        sx={{
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(claim.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/employee/payroll/tracking/self-services/claims/${claim.claimId || claim._id}?from=pending-approval`)}
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleConfirmClaim(claim)}
                          sx={{
                            color: 'success.main',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.success.main, 0.1),
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                          title="Confirm"
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRejectClaim(claim)}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                          title="Reject"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !processing && setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 24, color: 'success.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                Confirm Claim Approval
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                Confirm the approval of this expense claim
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {selectedClaim && (
            <>
              {/* Claim Information Card */}
              <Card
                sx={{
                  mb: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ py: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                    Claim Information
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Claim ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedClaim.claimId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Employee
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getEmployeeDisplay(selectedClaim.employeeId)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Claimed Amount
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(selectedClaim.amount)}
                      </Typography>
                    </Box>
                    {selectedClaim.approvedAmount && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Approved Amount (by Payroll Specialist)
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(selectedClaim.approvedAmount)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {selectedClaim.approvedAmount && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                      This amount will be confirmed. You can override it below if needed.
                    </Typography>
                  )}
                  {!selectedClaim.approvedAmount && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Missing Approved Amount
                      </Typography>
                      <Typography variant="body2">
                        This claim does not have an approved amount set by the Payroll Specialist.
                        The claim must be approved by a Payroll Specialist first before you can confirm it.
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Approved Amount Override Field */}
                <TextField
                  label="Approved Refund Amount"
                  type="number"
                  value={approvedRefundAmount}
                  onChange={(e) => setApprovedRefundAmount(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                  placeholder="0.00"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText={
                    selectedClaim?.approvedAmount
                      ? `Current approved amount: ${formatCurrency(selectedClaim.approvedAmount)}. You can override this amount if needed.`
                      : "Set the approved refund amount for this claim."
                  }
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '0.95rem',
                    },
                  }}
                />
                <Box>
                  <TextField
                    label="Confirmation Comment (Optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    fullWidth
                    multiline
                    rows={12}
                    placeholder="Add any additional comments about this approval..."
                    InputLabelProps={{
                      shrink: !!comment,
                    }}
                    helperText={`${comment.length} / 1000 characters`}
                    inputProps={{
                      maxLength: 1000,
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '0.95rem',
                        alignItems: 'flex-start',
                        minHeight: '280px',
                      },
                      '& .MuiInputBase-input': {
                        lineHeight: '1.6',
                        padding: '14px 14px !important',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        minHeight: '280px !important',
                      },
                      '& textarea': {
                        lineHeight: '1.6 !important',
                        resize: 'vertical',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap !important',
                        minHeight: '280px !important',
                      }
                    }}
                  />
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={processing}
            variant="outlined"
            sx={{
              minWidth: 100,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitConfirmation}
            variant="contained"
            color="success"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
            sx={{
              minWidth: 140,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {processing ? 'Confirming...' : 'Confirm Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={openRejectDialog}
        onClose={() => !processing && setOpenRejectDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            >
              <CancelIcon sx={{ fontSize: 24, color: 'error.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                Reject Claim
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                Reject this expense claim with a reason
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {selectedClaim && (
            <>
              {/* Claim Information Card */}
              <Card
                sx={{
                  mb: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ py: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                    Claim Information
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Claim ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedClaim.claimId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Employee
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getEmployeeDisplay(selectedClaim.employeeId)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Claim Type
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedClaim.claimType}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Claimed Amount
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(selectedClaim.amount)}
                      </Typography>
                    </Box>
                    {selectedClaim.approvedAmount && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Approved Amount (by Payroll Specialist)
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {formatCurrency(selectedClaim.approvedAmount)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Warning: Rejecting this claim
                </Typography>
                <Typography variant="body2">
                  This claim was approved by a Payroll Specialist. Rejecting it will notify the employee and the claim will be marked as rejected.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <TextField
                    label="Rejection Reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    fullWidth
                    required
                    multiline
                    rows={12}
                    placeholder="Please provide a detailed reason for rejecting this claim..."
                    InputLabelProps={{
                      shrink: !!rejectionReason,
                    }}
                    helperText={`${rejectionReason.length} / 1000 characters (minimum 20 characters)`}
                    inputProps={{
                      maxLength: 1000,
                    }}
                    error={rejectionReason.length > 0 && rejectionReason.length < 20}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '0.95rem',
                        alignItems: 'flex-start',
                        minHeight: '280px',
                      },
                      '& .MuiInputBase-input': {
                        lineHeight: '1.6',
                        padding: '14px 14px !important',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        minHeight: '280px !important',
                      },
                      '& textarea': {
                        lineHeight: '1.6 !important',
                        resize: 'vertical',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap !important',
                        minHeight: '280px !important',
                      }
                    }}
                  />
                  {rejectionReason.length > 0 && rejectionReason.length < 20 && (
                    <FormHelperText error sx={{ mt: 0.5 }}>
                      Please provide at least 20 characters for a detailed rejection reason
                    </FormHelperText>
                  )}
                </Box>
                <Box>
                  <TextField
                    label="Additional Comment (Optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    fullWidth
                    multiline
                    rows={6}
                    placeholder="Add any additional comments about this rejection..."
                    InputLabelProps={{
                      shrink: !!comment,
                    }}
                    helperText={`${comment.length} / 500 characters`}
                    inputProps={{
                      maxLength: 500,
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: '0.95rem',
                        alignItems: 'flex-start',
                      },
                      '& .MuiInputBase-input': {
                        lineHeight: '1.6',
                        padding: '14px 14px !important',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      },
                      '& textarea': {
                        lineHeight: '1.6 !important',
                        resize: 'vertical',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap !important',
                      }
                    }}
                  />
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2 }}>
          <Button
            onClick={() => {
              setOpenRejectDialog(false);
              setRejectionReason('');
              setComment('');
            }}
            disabled={processing}
            variant="outlined"
            sx={{
              minWidth: 100,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRejection}
            variant="contained"
            color="error"
            disabled={processing || !rejectionReason.trim() || rejectionReason.trim().length < 20}
            startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
            sx={{
              minWidth: 120,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {processing ? 'Rejecting...' : 'Reject Claim'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

