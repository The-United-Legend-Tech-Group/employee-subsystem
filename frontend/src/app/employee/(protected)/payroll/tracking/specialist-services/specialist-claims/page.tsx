'use client';

/**
 * Payroll Specialist - Expense Claims Review Page
 * 
 * REQ-PY-42: As Payroll Specialist, I want to approve/reject expense claims,
 * so that it can be escalated to payroll manager in case of approval.
 * 
 * This page allows Payroll Specialists to:
 * - View all expense claims that are "under review"
 * - Approve claims with an approved amount (can be less than claimed amount)
 * - Reject claims with a reason
 * 
 * Multi-step approval workflow:
 * 1. Employee submits claim → Status: "under review"
 * 2. Payroll Specialist approves/rejects → Status: "pending payroll Manager approval" or "rejected"
 * 3. If approved, Payroll Manager confirms → Status: "approved"
 * 4. Finance Department processes refund
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { formatCurrency, formatDate, getStatusColor, formatStatusLabel } from '../../utils';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import Snackbar from '@mui/material/Snackbar';
import { alpha, useTheme } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getEmployeeIdFromCookie, isAuthenticated } from '@/lib/auth-utils';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';

interface Claim {
  _id: string;
  claimId?: string;
  claim_id?: string;
  description: string;
  claimType: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  employeeId?: string | { firstName?: string; lastName?: string; employeeNumber?: string };
}

export default function SpecialistClaimsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = React.useState<Claim | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = React.useState(false);

  // Form state for approve/reject
  const [approvedAmount, setApprovedAmount] = React.useState('');
  const [comment, setComment] = React.useState('');

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
    ['claimId', 'claim_id', 'description', 'claimType', 'status'],
    'createdAt',
    'month' // Use month/year filtering for payroll-related claims
  );
  const [rejectionReason, setRejectionReason] = React.useState('');

  /**
   * Fetch all expense claims that need specialist review
   * Note: Currently fetches all claims. In production, backend should provide
   * an endpoint like GET /tracking/claims/pending for specialists
   */
  React.useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

      // Fetch all claims for specialist review (REQ-PY-42)
      // This endpoint returns all claims with "under review" status
      const response = await fetch(`${apiUrl}/tracking/claims/pending-specialist-approval`, {
        credentials: 'include', // Primary: send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorText: errorText,
        });
        console.error('Full API URL called:', `${apiUrl}/tracking/claims/pending-specialist-approval`);
        setError(`Failed to load claims: ${response.status} ${response.statusText}. ${errorText || 'Please ensure the backend server is running and restarted after the latest changes.'}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Claims data received:', data);

      // Transform claims data
      // The /tracking/claims/pending-specialist-approval endpoint already returns only "under review" claims
      const transformedClaims = Array.isArray(data) ? data.map((claim: any) => ({
        _id: claim._id?.toString() || claim._id || '',
        claimId: claim.claimId || claim.claim_id || '',
        claim_id: claim.claimId || claim.claim_id || '',
        description: claim.description || '',
        claimType: claim.claimType || '',
        amount: claim.amount || 0,
        status: claim.status || 'Unknown',
        createdAt: claim.createdAt || claim.created_at || '',
        updatedAt: claim.updatedAt || claim.updated_at || '',
        employeeId: claim.employeeId || null,
      })) : [];

      console.log('Claims for review:', transformedClaims);
      setClaims(transformedClaims);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError('An error occurred while loading claims. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle approve/reject action
   * Opens dialog for specialist to provide details
   */
  const handleActionClick = (claim: Claim, action: 'approve' | 'reject') => {
    setSelectedClaim(claim);
    setActionType(action);
    setActionDialogOpen(true);
    // Reset form fields
    setApprovedAmount(claim.amount.toString());
    setComment('');
    setRejectionReason('');
  };

  /**
   * Submit approve/reject action to backend
   * REQ-PY-42: Payroll Specialist approve/reject expense claims
   */
  const handleSubmitAction = async () => {
    if (!selectedClaim || !actionType) return;

    // Validation
    if (actionType === 'approve' && !approvedAmount) {
      setError('Please provide an approved amount when approving a claim.');
      return;
    }
    const approvedAmountNum = parseFloat(approvedAmount);
    if (actionType === 'approve' && (isNaN(approvedAmountNum) || approvedAmountNum < 0)) {
      setError('Please provide a valid approved amount (must be >= 0).');
      return;
    }
    if (actionType === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason when rejecting a claim.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

      // Prepare request body according to ApproveRejectClaimDto
      const requestBody: any = {
        action: actionType,
      };

      if (actionType === 'approve') {
        requestBody.approvedAmount = approvedAmountNum;
        if (comment.trim()) {
          requestBody.comment = comment.trim();
        }
      } else {
        requestBody.rejectionReason = rejectionReason.trim();
        if (comment.trim()) {
          requestBody.comment = comment.trim();
        }
      }

      // Call backend API: PATCH /tracking/claims/:claimId/approve-reject
      const claimId = selectedClaim.claimId || selectedClaim.claim_id || selectedClaim._id;
      const response = await fetch(
        `${apiUrl}/tracking/claims/${claimId}/approve-reject`,
        {
          method: 'PATCH',
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to process claim';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setError(errorMessage);
        setProcessing(false);
        return;
      }

      // Success
      setActionDialogOpen(false);
      setSuccessMessage(
        actionType === 'approve'
          ? 'Claim approved successfully. It will be escalated to Payroll Manager for confirmation.'
          : 'Claim rejected successfully.'
      );

      // Refresh claims list
      await fetchClaims();

      // Reset form
      setSelectedClaim(null);
      setActionType(null);
      setApprovedAmount('');
      setComment('');
      setRejectionReason('');
    } catch (err) {
      console.error('Error processing claim:', err);
      setError('An error occurred while processing the claim. Please try again.');
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
      {/* Header */}
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
            <RequestQuoteIcon
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
                Review Expense Claims
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
                Approve or reject expense reimbursement claims. Approved claims will be escalated to Payroll Manager.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/employee/payroll/tracking/specialist-services')}
            sx={{
              height: 42,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Back
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

      {claims.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by Claim ID, employee, description, type, or status..."
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
            <RequestQuoteIcon
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
              No claims pending review
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                opacity: 0.7,
              }}
            >
              All claims have been processed or there are no claims awaiting review.
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
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Claimed Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
                      {claim.claimId || claim.claim_id || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip label={claim.claimType || 'N/A'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 400,
                          color: 'text.primary',
                          fontWeight: 400,
                        }}
                      >
                        {claim.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(claim.amount || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatusLabel(claim.status)}
                        color={getStatusColor(claim.status) as any}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 28,
                          '& .MuiChip-label': {
                            px: 1.5,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      {formatDate(claim.createdAt)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/employee/payroll/tracking/self-services/claims/${claim.claimId || claim._id}?from=specialist-claims`)}
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
                          onClick={() => handleActionClick(claim, 'approve')}
                          disabled={claim.status?.toLowerCase() !== 'under review'}
                          sx={{
                            color: 'success.main',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.success.main, 0.1),
                              transform: 'scale(1.1)',
                            },
                            '&:disabled': {
                              opacity: 0.3,
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                          title="Approve"
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleActionClick(claim, 'reject')}
                          disabled={claim.status?.toLowerCase() !== 'under review'}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              transform: 'scale(1.1)',
                            },
                            '&:disabled': {
                              opacity: 0.3,
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

      {/* Approve/Reject Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => {
          if (!processing) {
            setActionDialogOpen(false);
            setError(null);
          }
        }}
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
                background: actionType === 'approve'
                  ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`
                  : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                border: actionType === 'approve'
                  ? `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  : `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            >
              {actionType === 'approve' ? (
                <CheckCircleIcon sx={{ fontSize: 24, color: 'success.main' }} />
              ) : (
                <CancelIcon sx={{ fontSize: 24, color: 'error.main' }} />
              )}
            </Box>
            <Box>
              <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                {actionType === 'approve' ? 'Approve Expense Claim' : 'Reject Expense Claim'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                {actionType === 'approve' ? 'Approve this expense claim for reimbursement' : 'Reject this expense claim with a reason'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Claim Information Card */}
          {selectedClaim && (
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
                      {selectedClaim.claimId || selectedClaim.claim_id || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Claimed Amount
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(selectedClaim.amount || 0)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedClaim.description || 'No description'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {actionType === 'approve' ? (
              <>
                <TextField
                  label="Approved Amount"
                  type="number"
                  value={approvedAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApprovedAmount(e.target.value)}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                  placeholder="0.00"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Amount to be approved (can be less than claimed amount)"
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '0.95rem',
                    },
                  }}
                />
                <Box>
                  <TextField
                    label="Comment (Optional)"
                    value={comment}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
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
              </>
            ) : (
              <>
                <Box>
                  <TextField
                    label="Rejection Reason"
                    value={rejectionReason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectionReason(e.target.value)}
                    required
                    fullWidth
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
                    fullWidth
                    multiline
                    rows={6}
                    placeholder="Add any additional comments..."
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
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2 }}>
          <Button
            onClick={() => {
              if (!processing) {
                setActionDialogOpen(false);
                setError(null);
              }
            }}
            variant="outlined"
            disabled={processing}
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
            onClick={handleSubmitAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={processing || (actionType === 'approve' && (!approvedAmount || isNaN(parseFloat(approvedAmount)) || parseFloat(approvedAmount) < 0)) || (actionType === 'reject' && (!rejectionReason.trim() || rejectionReason.trim().length < 20))}
            sx={{
              minWidth: 120,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
            startIcon={processing ? <CircularProgress size={16} color="inherit" /> : (actionType === 'approve' ? <CheckCircleIcon /> : <CancelIcon />)}
          >
            {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}