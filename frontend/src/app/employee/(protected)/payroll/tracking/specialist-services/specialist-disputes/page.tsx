'use client';

/**
 * Payroll Specialist - Disputes Review Page
 * 
 * REQ-PY-39: As Payroll Specialist, I want to approve/reject Disputes,
 * so that it can be escalated to payroll manager in case of approval.
 * 
 * This page allows Payroll Specialists to:
 * - View all disputes that are "under review"
 * - Approve disputes (which escalates to Payroll Manager)
 * - Reject disputes with a reason
 * 
 * Multi-step approval workflow:
 * 1. Employee submits dispute → Status: "under review"
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
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { isAuthenticated } from '@/lib/auth-utils';

interface Dispute {
  _id: string;
  disputeId: string;
  payslipId: string | { _id: string; toString: () => string };
  description: string;
  status: string;
  rejectionReason?: string;
  resolutionComment?: string;
  approvedRefundAmount?: number;
  createdAt: string;
  updatedAt: string;
  employeeId?: string | { firstName?: string; lastName?: string; employeeNumber?: string };
}

export default function SpecialistDisputesPage() {
  const router = useRouter();
  const theme = useTheme();
  const [disputes, setDisputes] = React.useState<Dispute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = React.useState<Dispute | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = React.useState(false);

  // Form state for approve/reject
  const [approvedRefundAmount, setApprovedRefundAmount] = React.useState('');
  const [comment, setComment] = React.useState('');

  // Table filters
  const {
    filteredData: filteredDisputes,
    filters,
    updateSearch,
    updateStartDate,
    updateEndDate,
    clearFilters,
  } = useTableFilters<Dispute>(
    disputes,
    ['disputeId', 'description', 'status'],
    'createdAt',
    'month' // Use month/year filtering for payroll-related disputes
  );
  const [rejectionReason, setRejectionReason] = React.useState('');

  /**
   * Fetch all disputes that need specialist review
   * Note: Currently fetches all disputes. In production, backend should provide
   * an endpoint like GET /tracking/disputes/pending for specialists
   */
  React.useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

      // Fetch all disputes for specialist review (REQ-PY-39)
      // This endpoint returns all disputes with "under review" status
      const response = await fetch(`${apiUrl}/tracking/disputes/pending-specialist-approval`, {
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
        console.error('Full API URL called:', `${apiUrl}/tracking/disputes/pending-specialist-approval`);
        setError(`Failed to load disputes: ${response.status} ${response.statusText}. ${errorText || 'Please ensure the backend server is running and restarted after the latest changes.'}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Disputes data received:', data);

      // Transform disputes data
      // The /tracking/disputes/pending-specialist-approval endpoint already returns only "under review" disputes
      const transformedDisputes = Array.isArray(data) ? data.map((dispute: any) => ({
        _id: dispute._id?.toString() || dispute._id || '',
        disputeId: dispute.disputeId || dispute.dispute_id || '',
        payslipId: dispute.payslipId
          ? (typeof dispute.payslipId === 'object' && dispute.payslipId !== null
            ? (dispute.payslipId._id?.toString() || dispute.payslipId.toString?.() || String(dispute.payslipId))
            : dispute.payslipId?.toString() || String(dispute.payslipId))
          : dispute.payslip_id?.toString() || dispute.payslip_id || '',
        description: dispute.description || '',
        status: dispute.status || 'Unknown',
        rejectionReason: dispute.rejectionReason || null,
        resolutionComment: dispute.resolutionComment || null,
        approvedRefundAmount: dispute.approvedRefundAmount || null,
        createdAt: dispute.createdAt || dispute.created_at || '',
        updatedAt: dispute.updatedAt || dispute.updated_at || '',
        employeeId: dispute.employeeId || null,
      })) : [];

      console.log('Disputes for review:', transformedDisputes);
      setDisputes(transformedDisputes);
    } catch (err) {
      console.error('Error fetching disputes:', err);
      setError('An error occurred while loading disputes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle approve/reject action
   * Opens dialog for specialist to provide details
   */
  const handleActionClick = (dispute: Dispute, action: 'approve' | 'reject') => {
    setSelectedDispute(dispute);
    setActionType(action);
    setActionDialogOpen(true);
    // Reset form fields
    setApprovedRefundAmount('');
    setComment('');
    setRejectionReason('');
  };

  /**
   * Submit approve/reject action to backend
   * REQ-PY-39: Payroll Specialist approve/reject disputes
   */
  const handleSubmitAction = async () => {
    if (!selectedDispute || !actionType) return;

    // Validation
    if (actionType === 'approve' && !approvedRefundAmount) {
      setError('Please provide an approved refund amount when approving a dispute.');
      return;
    }
    const approvedRefundAmountNum = parseFloat(approvedRefundAmount);
    if (actionType === 'approve' && (isNaN(approvedRefundAmountNum) || approvedRefundAmountNum < 0)) {
      setError('Please provide a valid approved refund amount (must be >= 0).');
      return;
    }
    if (actionType === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason when rejecting a dispute.');
      return;
    }
    if (actionType === 'reject' && rejectionReason.trim().length < 20) {
      setError('Please provide a more detailed rejection reason (at least 20 characters).');
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

      // Prepare request body according to ApproveRejectDisputeDto
      const requestBody: any = {
        action: actionType,
      };

      if (actionType === 'approve') {
        requestBody.approvedRefundAmount = approvedRefundAmountNum;
        if (comment.trim()) {
          requestBody.comment = comment.trim();
        }
      } else {
        requestBody.rejectionReason = rejectionReason.trim();
        if (comment.trim()) {
          requestBody.comment = comment.trim();
        }
      }

      // Call backend API: PATCH /tracking/disputes/:disputeId/approve-reject
      const response = await fetch(
        `${apiUrl}/tracking/disputes/${selectedDispute.disputeId}/approve-reject`,
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
        let errorMessage = 'Failed to process dispute';
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
          ? 'Dispute approved successfully. It will be escalated to Payroll Manager for confirmation.'
          : 'Dispute rejected successfully.'
      );

      // Refresh disputes list
      await fetchDisputes();

      // Reset form
      setSelectedDispute(null);
      setActionType(null);
      setApprovedRefundAmount('');
      setComment('');
      setRejectionReason('');
    } catch (err) {
      console.error('Error processing dispute:', err);
      setError('An error occurred while processing the dispute. Please try again.');
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
            <GavelIcon
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
                Review Disputes
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
                Approve or reject payroll disputes. Approved disputes will be escalated to Payroll Manager.
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

      {disputes.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by Dispute ID, description, or status..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      {disputes.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <GavelIcon
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
              No disputes pending review
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                opacity: 0.7,
              }}
            >
              All disputes have been processed or there are no disputes awaiting review.
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
                <TableCell>Dispute ID</TableCell>
                <TableCell>Payslip ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDisputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No disputes match your search criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDisputes.map((dispute) => (
                  <TableRow
                    key={dispute._id}
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
                      {dispute.disputeId || 'N/A'}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      {typeof dispute.payslipId === 'string'
                        ? dispute.payslipId
                        : dispute.payslipId?.toString() || 'N/A'}
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
                        {dispute.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatusLabel(dispute.status)}
                        color={getStatusColor(dispute.status) as any}
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
                      {formatDate(dispute.createdAt)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/employee/payroll/tracking/self-services/disputes/${dispute.disputeId || dispute._id}?from=specialist-disputes`)}
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
                          onClick={() => handleActionClick(dispute, 'approve')}
                          disabled={dispute.status?.toLowerCase() !== 'under review'}
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
                          onClick={() => handleActionClick(dispute, 'reject')}
                          disabled={dispute.status?.toLowerCase() !== 'under review'}
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
                {actionType === 'approve' ? 'Approve Dispute' : 'Reject Dispute'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                {actionType === 'approve' ? 'Approve this dispute and set refund amount' : 'Reject this dispute with a reason'}
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

          {/* Dispute Information Card */}
          {selectedDispute && (
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
                  Dispute Information
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Dispute ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedDispute.disputeId || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedDispute.description || 'No description'}
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
                  label="Approved Refund Amount"
                  type="number"
                  value={approvedRefundAmount}
                  onChange={(e) => setApprovedRefundAmount(e.target.value)}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                  placeholder="0.00"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Amount to be refunded to the employee"
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
              </>
            ) : (
              <>
                <Box>
                  <TextField
                    label="Rejection Reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    fullWidth
                    multiline
                    rows={12}
                    placeholder="Please provide a detailed reason for rejecting this dispute..."
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
                    onChange={(e) => setComment(e.target.value)}
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
            disabled={processing || (actionType === 'approve' && (!approvedRefundAmount || isNaN(parseFloat(approvedRefundAmount)) || parseFloat(approvedRefundAmount) < 0)) || (actionType === 'reject' && (!rejectionReason.trim() || rejectionReason.trim().length < 20))}
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
