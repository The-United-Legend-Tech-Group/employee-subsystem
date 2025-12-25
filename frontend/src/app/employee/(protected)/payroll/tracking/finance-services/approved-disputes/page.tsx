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
import Alert from '@mui/material/Alert';
import { useTheme, alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency, formatDate, getEmployeeName, getEmployeeNumber } from '../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

interface Dispute {
  _id: string;
  disputeId: string;
  payslipId: string | { _id: string; payrollPeriod?: string };
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  approvedRefundAmount?: number;
  resolutionComment?: string;
  employeeId?: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
    fullName?: string;
  };
}

export default function ApprovedDisputesPage() {
  const router = useRouter();
  const theme = useTheme();
  const [disputes, setDisputes] = React.useState<Dispute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = React.useState<Dispute | null>(null);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [refundAmount, setRefundAmount] = React.useState<string>('');
  const [processing, setProcessing] = React.useState(false);

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
    'updatedAt',
    'month' // Use month/year filtering for payroll-related disputes
  );

  React.useEffect(() => {
    fetchApprovedDisputes();
  }, []);

  const fetchApprovedDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      const response = await fetch(`${apiUrl}/tracking/disputes/approved`, {
        credentials: 'include', // Primary: send httpOnly cookies
      });

      if (response.ok) {
        const disputesData = await response.json();
        setDisputes(disputesData || []);
      } else {
        const errorText = await response.text();
        setError(`Failed to load approved disputes: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching approved disputes:', err);
      setError('An error occurred while loading approved disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRefund = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setOpenDialog(true);
    // Pre-fill refund amount if backend provides a suggested value; otherwise empty
    setRefundAmount(dispute.approvedRefundAmount ? dispute.approvedRefundAmount.toString() : '');
  };

  const handleSubmitRefund = async () => {
    if (!selectedDispute) return;

    const parsedAmount = parseFloat(refundAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid refund amount greater than 0.');
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      const response = await fetch(
        `${apiUrl}/tracking/disputes/${selectedDispute.disputeId}/generate-refund`,
        {
          method: 'POST',
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refundAmount: parsedAmount,
            comment: `Refund processed for approved dispute ${selectedDispute.disputeId}`,
          }),
        }
      );

      if (response.ok) {
        setOpenDialog(false);
        setSelectedDispute(null);
        setRefundAmount('');
        fetchApprovedDisputes();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate refund');
      }
    } catch (err) {
      console.error('Error generating refund:', err);
      setError('An error occurred while generating refund');
    } finally {
      setProcessing(false);
    }
  };


  const getPayslipPeriod = (payslipId: string | { _id: string; payrollPeriod?: string } | undefined) => {
    if (!payslipId) return 'N/A';
    if (typeof payslipId === 'string') return 'N/A';
    if (payslipId.payrollPeriod) {
      try {
        return new Date(payslipId.payrollPeriod).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        });
      } catch {
        return payslipId.payrollPeriod;
      }
    }
    return 'N/A';
  };

  return (
    <Box
      sx={{
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        maxWidth: '1400px',
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/employee/payroll/tracking/finance-services')}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          Back to Dashboard
        </Button>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircleIcon
              sx={{
                fontSize: 40,
                color: 'success.main',
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
                Approved Disputes
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
                View approved disputes and process refunds for payroll adjustments
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            fontFamily: 'inherit',
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
          searchPlaceholder="Search by Dispute ID, employee, description, or status..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : disputes.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No Approved Disputes
              </Typography>
              <Typography variant="body2">
                There are currently no approved disputes requiring refund processing.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Dispute ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Approved Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDisputes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No disputes match your search criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDisputes.map((dispute) => (
                      <TableRow
                        key={dispute._id}
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
                        }}
                      >
                        <TableCell>
                          <Button
                            variant="text"
                            onClick={() => router.push(`/employee/payroll/tracking/self-services/disputes/${dispute.disputeId || dispute._id}?from=approved-disputes`)}
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
                            {dispute.disputeId}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {getEmployeeName(dispute.employeeId)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getEmployeeNumber(dispute.employeeId)}
                            </Typography>
                          </Box>
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
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(dispute.updatedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={dispute.status}
                            color="success"
                            size="small"
                            icon={<CheckCircleIcon />}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/employee/payroll/tracking/self-services/disputes/${dispute.disputeId || dispute._id}?from=approved-disputes`)}
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
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AccountBalanceIcon />}
                              onClick={() => handleGenerateRefund(dispute)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                              }}
                            >
                              Process Refund
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Generate Refund Dialog */}
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
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 24, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
                Generate Refund for Dispute
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                Generate a refund that will be included in the next payroll cycle
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
                        {getEmployeeName(selectedDispute.employeeId)}
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
                      Resolution Comment
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                      {selectedDispute.resolutionComment}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ mt: 1 }}>
                <TextField
                  label="Refund Amount"
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Enter the refund amount that should be paid to the employee"
                />
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
            onClick={handleSubmitRefund}
            variant="contained"
            disabled={
              processing ||
              !refundAmount ||
              isNaN(parseFloat(refundAmount)) ||
              parseFloat(refundAmount) <= 0
            }
            sx={{
              minWidth: 140,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
            startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <AccountBalanceIcon />}
          >
            {processing ? 'Processing...' : 'Generate Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


