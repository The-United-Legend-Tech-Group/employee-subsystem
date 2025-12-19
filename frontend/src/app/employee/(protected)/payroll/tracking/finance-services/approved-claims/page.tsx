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
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import { useTheme, alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CategoryIcon from '@mui/icons-material/Category';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency, formatDate, getEmployeeName, getEmployeeNumber } from '../../utils';
import { apiClient } from '@/common/utils/api/client';

interface Claim {
  _id: string;
  claimId: string;
  description: string;
  claimType: string;
  amount: number;
  approvedAmount?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolutionComment?: string;
  employeeId?: string | { 
    _id: string; 
    firstName?: string; 
    lastName?: string; 
    employeeNumber?: string;
    fullName?: string;
  };
}


export default function ApprovedClaimsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = React.useState<Claim | null>(null);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    'updatedAt',
    'month'
  );

  React.useEffect(() => {
    loadApprovedClaims();
  }, []);

  const loadApprovedClaims = async () => {
    setLoading(true);
    setError(null);
    const response = await apiClient.get<Claim[]>('/tracking/claims/approved');
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setClaims(response.data);
    }
    setLoading(false);
  };


  const handleGenerateRefund = (claim: Claim) => {
    setSelectedClaim(claim);
    setDescription(`Refund for approved expense claim ${claim.claimId}`);
    setOpenDialog(true);
  };

  const handleSubmitRefund = async () => {
    if (!selectedClaim) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    const response = await apiClient.post<{ refundId?: string }>(
      `/tracking/claims/${selectedClaim.claimId}/generate-refund`,
      { description: description || `Refund for approved expense claim ${selectedClaim.claimId}` }
    );

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setSuccess(`Refund generated successfully! Refund ID: ${response.data.refundId || 'N/A'}. It will be included in the next payroll cycle.`);
      setOpenDialog(false);
      setSelectedClaim(null);
      setDescription('');
      loadApprovedClaims();
    }
    setProcessing(false);
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
            gap: 2,
            mb: 1,
          }}
        >
            <ReceiptIcon 
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
                Approved Expense Claims
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
                Generate refunds for approved expense claims to be included in the next payroll cycle
              </Typography>
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

      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            fontFamily: 'inherit',
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
          searchPlaceholder="Search by Claim ID, employee, description, type, or status..."
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
          ) : claims.length === 0 ? (
            <Box 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No Approved Claims
              </Typography>
              <Typography variant="body2">
                There are currently no approved expense claims requiring refund processing.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Claim ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Claimed Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Approved Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Approved Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
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
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                        },
                      }}
                    >
                      <TableCell>
                        <Button
                          variant="text"
                          onClick={() => router.push(`/employee/payroll/tracking/self-services/claims/${claim.claimId || claim._id}?from=approved-claims`)}
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
                          {claim.claimId}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {getEmployeeName(claim.employeeId)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getEmployeeNumber(claim.employeeId)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={claim.claimType}
                          size="small"
                          icon={<CategoryIcon sx={{ fontSize: 16 }} />}
                          sx={{ fontWeight: 500 }}
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
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(claim.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'success.main',
                          }}
                        >
                          {claim.approvedAmount 
                            ? formatCurrency(claim.approvedAmount)
                            : formatCurrency(claim.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(claim.updatedAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={claim.status}
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/employee/payroll/tracking/self-services/claims/${claim.claimId || claim._id}?from=approved-claims`)}
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
                            onClick={() => handleGenerateRefund(claim)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            Generate Refund
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
                Generate Refund for Expense Claim
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                Generate a refund that will be included in the next payroll cycle
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
                        {getEmployeeName(selectedClaim.employeeId)}
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
                        Approved Refund Amount
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {selectedClaim.approvedAmount 
                          ? formatCurrency(selectedClaim.approvedAmount)
                          : formatCurrency(selectedClaim.amount)}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                    This amount will be included in the next payroll cycle
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <TextField
                    label="Refund Description (Optional)"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={12}
                    placeholder="Refund for approved expense claim CLAIM-0015"
                    InputLabelProps={{
                      shrink: !!description,
                    }}
                    helperText={`${description.length} / 1000 characters`}
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
            onClick={handleSubmitRefund}
            variant="contained"
            disabled={processing}
            sx={{
              minWidth: 140,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
            startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <AccountBalanceIcon />}
          >
            {processing ? 'Generating...' : 'Generate Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


