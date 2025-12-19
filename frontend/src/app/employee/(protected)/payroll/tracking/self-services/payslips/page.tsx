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
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TimelineIcon from '@mui/icons-material/Timeline';
import Divider from '@mui/material/Divider';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTheme, alpha } from '@mui/material/styles';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency, getStatusColor, isValidObjectId, ExpenseFormDialog, downloadFile } from '../../utils';
import { apiClient } from '@/common/utils/api/client';

interface Payslip {
  payslipId: string;
  payrollRunId: string;
  payrollPeriod?: string;
  runId?: string;
  baseSalary: number;
  totalGrossSalary: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: string;
  createdAt?: string;
}

export default function PayslipsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [openDisputeDialog, setOpenDisputeDialog] = React.useState(false);
  const [selectedPayslipId, setSelectedPayslipId] = React.useState<string | null>(null);
  const [selectedPayslip, setSelectedPayslip] = React.useState<Payslip | null>(null);
  const [submittingDispute, setSubmittingDispute] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [openTaxDialog, setOpenTaxDialog] = React.useState(false);
  const [taxDeductions, setTaxDeductions] = React.useState<any>(null);
  const [loadingTax, setLoadingTax] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  
  const error = localError || apiError;

  // Table filters - use month/year filtering for payslips
  const {
    filteredData: filteredPayslips,
    filters,
    updateSearch,
    updateStartDate,
    updateEndDate,
    clearFilters,
  } = useTableFilters<Payslip>(
    payslips,
    ['payslipId', 'payrollRunId', 'runId', 'paymentStatus'],
    'payrollPeriod',
    'month'
  );

  React.useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    setLoading(true);
    setApiError(null);
    const response = await apiClient.get<Payslip[]>('/tracking/salary/history');
    if (response.error) {
      setApiError(response.error);
    } else if (response.data) {
      // Transform the data to match the frontend interface
      const transformedPayslips = Array.isArray(response.data) ? response.data.map((payslip: any) => ({
        payslipId: payslip.payslipId || payslip._id?.toString() || '',
        payrollRunId: payslip.payrollRunId || '',
        payrollPeriod: payslip.payrollPeriod || null,
        runId: payslip.runId || null,
        baseSalary: payslip.baseSalary || 0,
        totalGrossSalary: payslip.totalGrossSalary || 0,
        totalDeductions: payslip.totalDeductions || 0,
        netPay: payslip.netPay || 0,
        paymentStatus: payslip.paymentStatus || 'Unknown',
        createdAt: payslip.createdAt || null,
      })) : [];
      setPayslips(transformedPayslips);
    }
    setLoading(false);
  };

  const handleClearError = () => {
    setLocalError(null);
    setApiError(null);
  };

  const handleViewPayslip = (payslipId: string) => {
    router.push(`/employee/payroll/tracking/self-services/payslips/${payslipId}`);
  };

  const handleDownloadPayslip = async (payslipId: string) => {
    const success = await downloadFile(
      `/tracking/payslips/${payslipId}/download`,
      `payslip_${payslipId}.pdf`
    );
    if (!success) {
      setLocalError('Failed to download payslip');
    }
  };

  const handleOpenDisputeDialog = (payslipId: string) => {
    console.log('Opening dispute dialog for payslip ID:', payslipId);
    console.log('Payslip ID type:', typeof payslipId);
    console.log('Payslip ID length:', payslipId?.length);
    const payslip = payslips.find(p => p.payslipId === payslipId);
    setSelectedPayslipId(payslipId);
    setSelectedPayslip(payslip || null);
    setOpenDisputeDialog(true);
  };

  const handleCloseDisputeDialog = () => {
    setOpenDisputeDialog(false);
    setSelectedPayslipId(null);
    setSelectedPayslip(null);
    handleClearError();
  };

  const handleViewTaxDeductions = async (payslipId: string) => {
    setLoadingTax(true);
    setOpenTaxDialog(true);
    setTaxDeductions(null);
    
    const response = await apiClient.get<any>(`/tracking/payslips/${payslipId}/tax-deductions`);
    if (response.error) {
      setLocalError(response.error);
    } else if (response.data) {
      setTaxDeductions(response.data);
    }
    setLoadingTax(false);
  };

  const handleCloseTaxDialog = () => {
    setOpenTaxDialog(false);
    setTaxDeductions(null);
    handleClearError();
  };

  const handleSubmitDispute = async (data: { description: string; claimType?: string; amount?: number }) => {
    if (!selectedPayslipId) {
      setLocalError('Payslip ID is missing');
      return;
    }

    // Validate payslip ID format using utility function
    if (!isValidObjectId(selectedPayslipId)) {
      setLocalError('Invalid payslip ID format');
      return;
    }

    setSubmittingDispute(true);
    handleClearError();
    
    const response = await apiClient.post('/tracking/disputes', {
      payslip_id: selectedPayslipId,
      description: data.description,
    });

    if (response.error) {
      setLocalError(response.error);
    } else if (response.data) {
      handleCloseDisputeDialog();
      setSuccessMessage('Dispute submitted successfully! We will review it within 3-5 business days.');
    }
    setSubmittingDispute(false);
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

  return (
    <Box sx={{ fontFamily: 'inherit' }}>
      <Box mb={5}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2.5}
          mb={1.5}
        >
          <Box display="flex" alignItems="center" gap={2.5}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: '2rem',
                  letterSpacing: '-0.02em',
                  mb: 0.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                My Payslips
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                }}
              >
                View and download your monthly payslips with detailed breakdowns
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<TimelineIcon />}
              onClick={() => router.push('/employee/payroll/tracking/self-services/payslips/salary-history')}
              sx={{
                height: 42,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              Salary History
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/employee/payroll/tracking/self-services')}
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
      </Box>

      {error && (
        <Alert severity="error" onClose={handleClearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {payslips.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by Payslip ID, Run ID, or status..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      {payslips.length === 0 ? (
        <Card
          sx={{
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: 'none',
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
          }}
        >
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: alpha(theme.palette.action.hover, 0.3),
                  mb: 3,
                }}
              >
                <ReceiptLongIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
              </Box>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ fontWeight: 600, mb: 1 }}
              >
                No payslips found
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ opacity: 0.7, maxWidth: 400, textAlign: 'center' }}
              >
                Your payslips will appear here once they are generated
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer 
          component={Paper}
          sx={{
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
            overflow: 'hidden',
            background: theme.palette.background.paper,
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                  '& th': {
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'text.primary',
                    borderBottom: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                    py: 2.5,
                    fontFamily: 'inherit',
                  },
                }}
              >
                <TableCell>Payroll Period</TableCell>
                <TableCell align="right">Base Salary</TableCell>
                <TableCell align="right">Gross Salary</TableCell>
                <TableCell align="right">Deductions</TableCell>
                <TableCell align="right">Net Pay</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No payslips match your search criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayslips.map((payslip) => (
                <TableRow 
                  key={payslip.payslipId} 
                  hover
                  sx={{
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                    },
                    '& td': {
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      py: 2.5,
                      fontFamily: 'inherit',
                    },
                    '&:last-child td': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>
                    {payslip.payrollPeriod || payslip.runId || 'N/A'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    {formatCurrency(payslip.baseSalary || 0)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    {formatCurrency(payslip.totalGrossSalary || 0)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      color="error.main"
                      sx={{ fontWeight: 600, fontSize: '0.95rem' }}
                    >
                      {formatCurrency(payslip.totalDeductions || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body1" 
                      fontWeight={700}
                      sx={{
                        fontSize: '1.1rem',
                        color: 'success.main',
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {formatCurrency(payslip.netPay || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payslip.paymentStatus || 'Unknown'}
                      color={getStatusColor(payslip.paymentStatus) as any}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 28,
                        borderRadius: 2,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewPayslip(payslip.payslipId)}
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
                        onClick={() => handleDownloadPayslip(payslip.payslipId)}
                        sx={{
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                        title="Download Payslip"
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDisputeDialog(payslip.payslipId)}
                        sx={{
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                        title="Submit Dispute"
                      >
                        <GavelIcon fontSize="small" />
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

      {/* Submit Dispute Dialog */}
      <ExpenseFormDialog
        open={openDisputeDialog}
        onClose={handleCloseDisputeDialog}
        onSubmit={handleSubmitDispute}
        submitting={submittingDispute}
        error={error}
        formType="dispute"
        payslipInfo={selectedPayslip ? {
          payslipId: selectedPayslip.payslipId,
          payrollPeriod: selectedPayslip.payrollPeriod || selectedPayslip.runId,
          netPay: selectedPayslip.netPay,
        } : undefined}
      />

      {/* Tax Deductions Dialog */}
      <Dialog 
        open={openTaxDialog} 
        onClose={handleCloseTaxDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1.5}>
            <AccountBalanceIcon sx={{ color: 'info.main' }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
              Tax Deductions Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingTax ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : taxDeductions ? (
            <Box>
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Gross Salary
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {formatCurrency(taxDeductions.grossSalary || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tax Base Salary
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {formatCurrency(taxDeductions.taxBaseSalary || 0)}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Tax Breakdown
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tax Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description / Law</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rate (%)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Applied To</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {taxDeductions.taxBreakdown && taxDeductions.taxBreakdown.length > 0 ? (
                      taxDeductions.taxBreakdown.map((tax: any, index: number) => (
                        <TableRow key={index} hover>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {tax.taxName || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {tax.description || 'No description available'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {tax.rate ? `${tax.rate}%` : 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(tax.appliedTo || 0)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                              {formatCurrency(tax.calculatedAmount || 0)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No tax deductions found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {taxDeductions.taxBreakdown && taxDeductions.taxBreakdown.length > 0 && (
                <Box mt={3} p={2} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Total Tax Deductions
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        color: 'error.main',
                        background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {formatCurrency(taxDeductions.totalTaxDeductions || 0)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="error">
              {error || 'Failed to load tax deductions'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaxDialog} variant="outlined">
            Close
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