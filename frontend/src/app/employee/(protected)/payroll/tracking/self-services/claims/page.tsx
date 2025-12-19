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
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency, formatDate, getStatusColor, formatStatusLabel, ExpenseFormDialog } from '../../utils';
import { apiClient } from '@/common/utils/api/client';

interface Claim {
  _id: string;
  claimId?: string; // Backend returns camelCase
  claim_id?: string; // For compatibility
  description: string;
  claimType: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function ClaimsPage() {
  const router = useRouter();
  const theme = useTheme();
  
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  
  const error = localError;

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
    'month'
  );

  React.useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    setLocalError(null);
    const response = await apiClient.get<Claim[]>('/tracking/claims');
    if (response.error) {
      setLocalError(response.error);
    } else if (response.data) {
      // Transform data to ensure consistent field names
      const transformedClaims = Array.isArray(response.data) ? response.data.map((claim: any) => ({
        _id: claim._id?.toString() || claim._id || '',
        claimId: claim.claimId || claim.claim_id || '',
        claim_id: claim.claimId || claim.claim_id || '',
        description: claim.description || '',
        claimType: claim.claimType || '',
        amount: claim.amount || 0,
        status: claim.status || 'Unknown',
        createdAt: claim.createdAt || claim.created_at || '',
        updatedAt: claim.updatedAt || claim.updated_at || '',
      })) : [];
      setClaims(transformedClaims);
    }
    setLoading(false);
  };

  const handleSubmitClaim = async (data: { description: string; claimType?: string; amount?: number }) => {
    if (!data.claimType || !data.amount) {
      setLocalError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    
    const response = await apiClient.post<Claim>('/tracking/claims', {
      description: data.description,
      claimType: data.claimType,
      amount: data.amount,
    });

    if (response.error) {
      setLocalError(response.error);
    } else if (response.data) {
      setOpenDialog(false);
      setSuccessMessage('Claim submitted successfully! We will review it within 3-5 business days.');
      loadClaims();
    }
    setSubmitting(false);
  };

  const handleClearError = () => {
    setLocalError(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Expense Claims
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Submit and track your expense reimbursement claims here.
          </Typography>
        </Box>
        <Box display="flex" gap={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            onClick={() => router.push('/employee/payroll/tracking/self-services')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Submit Claim
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={handleClearError}>
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
          searchPlaceholder="Search by Claim ID, description, type, or status..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      {claims.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              No claims found. Click "Submit Claim" to create a new one.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Claim ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No claims match your search criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClaims.map((claim) => (
                <TableRow key={claim._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {claim.claimId || claim.claim_id || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip label={claim.claimType || 'N/A'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
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
                    />
                  </TableCell>
                  <TableCell>{formatDate(claim.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/employee/payroll/tracking/self-services/claims/${claim.claimId || claim._id}?from=my-claims`)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ExpenseFormDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          handleClearError();
        }}
        onSubmit={handleSubmitClaim}
        submitting={submitting}
        error={error}
        formType="claim"
        claimTypes={['Travel', 'Meals', 'Medical', 'Office Supplies', 'Other']}
      />

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
