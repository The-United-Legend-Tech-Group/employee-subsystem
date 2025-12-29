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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useTheme, alpha } from '@mui/material/styles';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency, formatDate } from '../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

interface Compensation {
  payslipId: string;
  name: string;
  terms?: string;
  amount: number;
  createdAt: string | null;
}

export default function CompensationsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [compensations, setCompensations] = React.useState<Compensation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Table filters
  const {
    filteredData: filteredCompensations,
    filters,
    updateSearch,
    updateStartDate,
    updateEndDate,
    clearFilters,
  } = useTableFilters<Compensation>(
    compensations,
    ['name', 'terms'],
    'createdAt',
    'month' // Use month/year filtering for payroll periods
  );

  React.useEffect(() => {
    const fetchCompensations = async () => {
      try {
        // Check both cookie-based auth and localStorage fallback
        if (!isAuthenticated() && !localStorage.getItem('access_token')) {
          router.push('/employee/login');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

        const response = await fetch(`${apiUrl}/tracking/compensations`, {
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          setError(`Failed to load compensations: ${response.status} ${response.statusText}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setCompensations(data || []);
      } catch (err) {
        console.error('Error fetching compensations:', err);
        setError('An error occurred while loading compensations');
      } finally {
        setLoading(false);
      }
    };

    fetchCompensations();
  }, [router]);

  const totalAmount = compensations.reduce((sum, comp) => sum + (comp.amount || 0), 0);

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
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
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
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Compensations
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
                View all compensations including encashed leave days, transportation, and refunds
              </Typography>
            </Box>
          </Box>
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {compensations.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by name or terms..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          {compensations.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Compensations Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You don't have any compensations recorded yet.
              </Typography>
            </Box>
          ) : (
            <>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Total Compensations: {formatCurrency(totalAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredCompensations.length} compensation{filteredCompensations.length !== 1 ? 's' : ''} found
                  {filteredCompensations.length !== compensations.length && ` (filtered from ${compensations.length})`}
                </Typography>
              </Box>
              <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Terms</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCompensations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No compensations match your search criteria.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCompensations.map((compensation, index) => (
                        <TableRow
                          key={`${compensation.payslipId}-${index}`}
                          hover
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            }
                          }}
                          onClick={() => router.push(`/employee/payroll/tracking/self-services/payslips/${compensation.payslipId}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {compensation.name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {compensation.terms || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{
                                color: 'success.main',
                                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              {formatCurrency(compensation.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(compensation.createdAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}


