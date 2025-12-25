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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency, formatDate, getStatusColor, formatStatusLabel, getEmployeeDisplay } from '../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

interface Dispute {
  _id: string;
  disputeId: string;
  payslipId: string | {
    _id: string;
    payrollRunId?: string | {
      _id: string;
      payrollPeriod?: Date | string;
    };
  };
  description: string;
  status: string;
  createdAt: string;
  approvedRefundAmount?: number;
  resolutionComment?: string;
  employeeId?: string | { _id: string; firstName?: string; lastName?: string; employeeNumber?: string };
}

export default function DisputesPendingApprovalPage() {
  const router = useRouter();
  const theme = useTheme();
  const [disputes, setDisputes] = React.useState<Dispute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = React.useState<Dispute | null>(null);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openRejectDialog, setOpenRejectDialog] = React.useState(false);
  const [comment, setComment] = React.useState('');
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      const response = await fetch(`${apiUrl}/tracking/disputes/pending-manager-approval`, {
        credentials: 'include', // Primary: send httpOnly cookies
      });

      if (response.ok) {
        const disputesData = await response.json();
        setDisputes(disputesData || []);
      } else {
        const errorText = await response.text();
        setError(`Failed to load disputes: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching disputes:', err);
      setError('An error occurred while loading disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setOpenDialog(true);
    setComment('');
  };

  const handleRejectDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setOpenRejectDialog(true);
    setRejectionReason('');
    setComment('');
  };

  const handleSubmitConfirmation = async () => {
    if (!selectedDispute) return;

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
      // Trim disputeId to ensure no whitespace issues
      const cleanDisputeId = selectedDispute.disputeId.trim();

      console.log('🔍 [DisputesPendingApproval] Confirming dispute:', {
        disputeId: cleanDisputeId,
        status: selectedDispute.status,
        approvedRefundAmount: selectedDispute.approvedRefundAmount,
      });

      const response = await fetch(
        `${apiUrl}/tracking/disputes/${encodeURIComponent(cleanDisputeId)}/confirm-approval`,
        {
          method: 'PATCH',
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: comment || undefined,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [DisputesPendingApproval] Dispute confirmed successfully:', result);
        setSuccess(`Dispute ${cleanDisputeId} has been confirmed successfully!`);
        setOpenDialog(false);
        setSelectedDispute(null);
        setComment('');
        fetchDisputes();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        let errorMessage = 'Failed to confirm approval';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;

          // Log full error details
          console.log('❌ [DisputesPendingApproval] ========== ERROR DETAILS ==========');
          console.log('Status:', response.status, response.statusText);
          console.log('Error Message:', errorMessage);
          console.log('Dispute ID:', selectedDispute.disputeId);
          console.log('Dispute Status:', selectedDispute.status);
          console.log('Approved Refund Amount:', selectedDispute.approvedRefundAmount);
          console.log('Full Error Object:', JSON.stringify(errorData, null, 2));
          console.log('❌ [DisputesPendingApproval] ====================================');
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || `Server returned ${response.status}: ${response.statusText}`;
          console.error('❌ [DisputesPendingApproval] Parse Error:', {
            errorText,
            disputeId: selectedDispute.disputeId,
            parseError,
          });
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('❌ [DisputesPendingApproval] Exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while confirming approval');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitRejection = async () => {
    if (!selectedDispute || !rejectionReason.trim()) return;
    if (rejectionReason.trim().length < 20) {
      setError('Please provide a more detailed rejection reason (at least 20 characters).');
      setProcessing(false);
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
      const cleanDisputeId = selectedDispute.disputeId.trim();

      console.log('🔍 [DisputesPendingApproval] Rejecting dispute:', {
        disputeId: cleanDisputeId,
        status: selectedDispute.status,
      });

      const response = await fetch(
        `${apiUrl}/tracking/disputes/${encodeURIComponent(cleanDisputeId)}/reject`,
        {
          method: 'PATCH',
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rejectionReason: rejectionReason.trim(),
            comment: comment || undefined,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [DisputesPendingApproval] Dispute rejected successfully:', result);
        setSuccess(`Dispute ${cleanDisputeId} has been rejected.`);
        setOpenRejectDialog(false);
        setSelectedDispute(null);
        setRejectionReason('');
        setComment('');
        fetchDisputes();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        let errorMessage = 'Failed to reject dispute';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;

          console.log('❌ [DisputesPendingApproval] ========== REJECT ERROR DETAILS ==========');
          console.log('Status:', response.status, response.statusText);
          console.log('Error Message:', errorMessage);
          console.log('Dispute ID:', cleanDisputeId);
          console.log('Full Error Object:', JSON.stringify(errorData, null, 2));
          console.log('❌ [DisputesPendingApproval] ====================================');
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || `Server returned ${response.status}: ${response.statusText}`;
          console.error('❌ [DisputesPendingApproval] Parse Error:', {
            errorText,
            disputeId: cleanDisputeId,
            parseError,
          });
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('❌ [DisputesPendingApproval] Exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while rejecting dispute');
    } finally {
      setProcessing(false);
    }
  };


  const getPayrollPeriod = (payslipId: string | {
    _id: string;
    payrollRunId?: string | {
      _id: string;
      payrollPeriod?: Date | string;
    };
  } | undefined): string => {
    if (!payslipId) return 'N/A';
    if (typeof payslipId === 'string') return 'N/A';

    const payrollRun = payslipId.payrollRunId;
    if (!payrollRun) return 'N/A';

    if (typeof payrollRun === 'string') return 'N/A';

    const payrollPeriod = payrollRun.payrollPeriod;
    if (!payrollPeriod) return 'N/A';

    // Format the payroll period similar to how it's done in payslips page
    try {
      const date = new Date(payrollPeriod);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } catch {
      return 'N/A';
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
            <CheckCircleIcon
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
                Disputes Pending Approval
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
                Review and confirm approvals for disputes that have been approved by Payroll Specialists
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

      {disputes.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by Dispute ID, employee, description, or status..."
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
            <CheckCircleIcon
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
              No disputes pending approval
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                opacity: 0.7,
              }}
            >
              All disputes have been processed or none are awaiting your approval
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
                <TableCell>Employee</TableCell>
                <TableCell>Payroll Period</TableCell>
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
                      <Button
                        variant="text"
                        onClick={() => router.push(`/employee/payroll/tracking/self-services/disputes/${dispute.disputeId || dispute._id}?from=pending-approval`)}
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
                        {dispute.disputeId || 'N/A'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getEmployeeDisplay(dispute.employeeId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getPayrollPeriod(dispute.payslipId)}
                      </Typography>
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
                        {dispute.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatusLabel(dispute.status)}
                        color={getStatusColor(dispute.status) as any}
                        size="small"
                        sx={{
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(dispute.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/employee/payroll/tracking/self-services/disputes/${dispute.disputeId || dispute._id}?from=pending-approval`)}
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
                          onClick={() => handleConfirmDispute(dispute)}
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
                          onClick={() => handleRejectDispute(dispute)}
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
                Confirm Dispute Approval
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                Confirm the approval of this dispute and set refund amount
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {selectedDispute && (
            <>
              {/* Dispute Information Card */}
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
                        {selectedDispute.disputeId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Employee
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getEmployeeDisplay(selectedDispute.employeeId)}
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

              {selectedDispute.resolutionComment && (
                <Card
                  sx={{
                    mb: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ py: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                      Specialist Resolution Comment
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                      {selectedDispute.resolutionComment}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
            onClick={() => {
              setOpenDialog(false);
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
                Reject Dispute
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                Reject this dispute with a reason
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {selectedDispute && (
            <>
              {/* Dispute Information Card */}
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
                        {selectedDispute.disputeId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Employee
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getEmployeeDisplay(selectedDispute.employeeId)}
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
                    {selectedDispute.approvedRefundAmount && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Proposed Refund Amount (by Payroll Specialist)
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {formatCurrency(selectedDispute.approvedRefundAmount)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Warning: Rejecting this dispute
                </Typography>
                <Typography variant="body2">
                  This dispute was approved by a Payroll Specialist. Rejecting it will notify the employee and the dispute will be marked as rejected.
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
                    placeholder="Please provide a detailed reason for rejecting this dispute..."
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
            onClick={() => setOpenRejectDialog(false)}
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
            {processing ? 'Rejecting...' : 'Reject Dispute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
