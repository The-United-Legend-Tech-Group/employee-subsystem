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
import BusinessIcon from '@mui/icons-material/Business';
import { useTheme, alpha } from '@mui/material/styles';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency, formatDate } from '../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

interface EmployerContribution {
  payslipId: string;
  payslipPeriod: string;
  type: 'Insurance' | 'Allowance' | 'Benefit';
  name: string;
  employerContribution: number;
  employeeContribution?: number;
  employerRate?: number;
  employeeRate?: number;
  calculationBase?: number;
  status?: string;
  createdAt: string | null;
}

export default function EmployerContributionsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [contributions, setContributions] = React.useState<EmployerContribution[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Table filters
  const {
    filteredData: filteredContributions,
    filters,
    updateSearch,
    updateStartDate,
    updateEndDate,
    clearFilters,
  } = useTableFilters<EmployerContribution>(
    contributions,
    ['type', 'name', 'payslipPeriod'],
    'createdAt',
    'month' // Use month/year filtering for payroll periods
  );

  React.useEffect(() => {
    const fetchContributions = async () => {
      try {
        // Check both cookie-based auth and localStorage fallback
        if (!isAuthenticated() && !localStorage.getItem('access_token')) {
          router.push('/employee/login');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

        const response = await fetch(`${apiUrl}/tracking/employer-contributions`, {
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          setError(`Failed to load employer contributions: ${response.status} ${response.statusText}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setContributions(data || []);
      } catch (err) {
        console.error('Error fetching employer contributions:', err);
        setError('An error occurred while loading employer contributions');
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [router]);

  const getTypeColor = (type: string | undefined | null) => {
    if (!type) {
      return 'default';
    }
    switch (type.toLowerCase()) {
      case 'insurance':
        return 'primary';
      case 'allowance':
        return 'success';
      case 'benefit':
        return 'info';
      default:
        return 'default';
    }
  };

  const totalAmount = contributions.reduce((sum, contribution) => sum + (contribution.employerContribution || 0), 0);

  // Group by type for summary
  const summaryByType = contributions.reduce((acc, contribution) => {
    const type = contribution.type || 'Unknown';
    if (!acc[type]) {
      acc[type] = { count: 0, total: 0 };
    }
    acc[type].count += 1;
    acc[type].total += contribution.employerContribution || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

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
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <BusinessIcon sx={{ fontSize: 32, color: 'success.main' }} />
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
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Employer Contributions
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
                View employer contributions (insurance, pension, allowances) to know your full benefits
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

      {contributions.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by type, name, or period..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          {contributions.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
            >
              <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Employer Contributions Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You don't have any employer contributions recorded.
              </Typography>
            </Box>
          ) : (
            <>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Total Employer Contributions: {formatCurrency(totalAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {filteredContributions.length} contribution{filteredContributions.length !== 1 ? 's' : ''} found
                  {filteredContributions.length !== contributions.length && ` (filtered from ${contributions.length})`}
                </Typography>
                <Box display="flex" gap={2} mt={2} flexWrap="wrap">
                  {Object.entries(summaryByType).map(([type, data]) => (
                    <Chip
                      key={type}
                      label={`${type}: ${formatCurrency(data.total)} (${data.count})`}
                      color={getTypeColor(type) as any}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
              </Box>
              <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Payroll Period</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Employer Contribution</TableCell>
                      {contributions.some(c => c.employeeContribution !== undefined && c.employeeContribution > 0) && (
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Employee Contribution</TableCell>
                      )}
                      {contributions.some(c => c.employerRate !== undefined) && (
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Employer Rate</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredContributions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No employer contributions match your search criteria.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredContributions.map((contribution, index) => (
                      <TableRow 
                        key={`${contribution.payslipId}-${index}`}
                        hover
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                          }
                        }}
                        onClick={() => router.push(`/employee/payroll/tracking/self-services/payslips/${contribution.payslipId}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {contribution.payslipPeriod || 'Unknown Period'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={contribution.type || 'Unknown'}
                            color={getTypeColor(contribution.type) as any}
                            size="small"
                            variant="filled"
                            sx={{
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {contribution.name}
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
                            {formatCurrency(contribution.employerContribution || 0)}
                          </Typography>
                        </TableCell>
                        {contributions.some(c => c.employeeContribution !== undefined && c.employeeContribution > 0) && (
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {contribution.employeeContribution ? formatCurrency(contribution.employeeContribution) : '-'}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                            <Chip
                              label={contribution.type}
                              color={getTypeColor(contribution.type) as any}
                              size="small"
                              variant="filled"
                              sx={{
                                fontWeight: 'bold',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {contribution.name}
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
                              {formatCurrency(contribution.employerContribution || 0)}
                            </Typography>
                          </TableCell>
                          {contributions.some(c => c.employeeContribution !== undefined && c.employeeContribution > 0) && (
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {contribution.employeeContribution ? formatCurrency(contribution.employeeContribution) : '-'}
                              </Typography>
                            </TableCell>
                          )}
                          {contributions.some(c => c.employerRate !== undefined) && (
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {contribution.employerRate !== undefined ? `${contribution.employerRate}%` : '-'}
                              </Typography>
                            </TableCell>
                          )}
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

