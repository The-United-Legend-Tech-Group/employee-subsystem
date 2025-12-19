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
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { useTheme, alpha } from '@mui/material/styles';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency, formatDate } from '../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

interface InsuranceDeduction {
  payslipId: string;
  payslipPeriod?: string;
  insuranceName: string;
  employeeRate: number;
  employerRate: number;
  employeeContribution?: number;
  employerContribution?: number;
  appliedTo?: number;
  minSalary?: number;
  maxSalary?: number;
  status: string;
  createdAt: string | null;
  // Optional fields returned or computed for display
  appliedTo?: number;
  employeeContribution?: number;
  employerContribution?: number;
  payslipPeriod?: string | null;
}

export default function InsuranceDeductionsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [insuranceDeductions, setInsuranceDeductions] = React.useState<InsuranceDeduction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Table filters
  const {
    filteredData: filteredInsuranceDeductions,
    filters,
    updateSearch,
    updateStartDate,
    updateEndDate,
    clearFilters,
  } = useTableFilters<InsuranceDeduction>(
    insuranceDeductions,
    ['insuranceName'],
    'createdAt',
    'month' // Use month/year filtering for payroll periods
  );

  React.useEffect(() => {
    const fetchInsuranceDeductions = async () => {
      try {
        // Check both cookie-based auth and localStorage fallback
        if (!isAuthenticated() && !localStorage.getItem('access_token')) {
          router.push('/employee/login');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

        const response = await fetch(`${apiUrl}/tracking/insurance-deductions`, {
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          setError(`Failed to load insurance deductions: ${response.status} ${response.statusText}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setInsuranceDeductions(data || []);
      } catch (err) {
        console.error('Error fetching insurance deductions:', err);
        setError('An error occurred while loading insurance deductions');
      } finally {
        setLoading(false);
      }
    };

    fetchInsuranceDeductions();
  }, [router]);

  const totalEmployeeContribution = insuranceDeductions.reduce((sum, insurance) => sum + (insurance.employeeContribution || 0), 0);
  const totalEmployerContribution = insuranceDeductions.reduce((sum, insurance) => sum + (insurance.employerContribution || 0), 0);

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
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              }}
            >
              <HealthAndSafetyIcon sx={{ fontSize: 32, color: 'warning.main' }} />
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
                  background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Insurance Deductions
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
                View itemized insurance deductions including health, pension, unemployment, and other protections
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

      {insuranceDeductions.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by insurance name or period..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          {insuranceDeductions.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
            >
              <HealthAndSafetyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Insurance Deductions Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You don't have any insurance deductions recorded yet.
              </Typography>
            </Box>
          ) : (
            <>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Total Employee Contributions: {formatCurrency(totalEmployeeContribution)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Employer Contributions: {formatCurrency(totalEmployerContribution)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredInsuranceDeductions.length} insurance deduction{filteredInsuranceDeductions.length !== 1 ? 's' : ''} found
                  {filteredInsuranceDeductions.length !== insuranceDeductions.length && ` (filtered from ${insuranceDeductions.length})`}
                </Typography>
              </Box>
              <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Payroll Period</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Insurance Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Employee Rate (%)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Employer Rate (%)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Applied To</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Your Contribution</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Employer Contribution</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInsuranceDeductions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No insurance deductions match your search criteria.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInsuranceDeductions.map((insurance, index) => (
                        <TableRow
                          key={`${insurance.payslipId}-${index}`}
                          hover
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            }
                          }}
                          onClick={() => router.push(`/employee/payroll/tracking/self-services/payslips/${insurance.payslipId}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {insurance.payslipPeriod || 'Unknown Period'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {insurance.insuranceName || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {insurance.employeeRate ? `${insurance.employeeRate}%` : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {insurance.employerRate ? `${insurance.employerRate}%` : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(insurance.appliedTo || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{
                                color: 'error.main',
                                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              {formatCurrency(insurance.employeeContribution || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{
                                color: 'success.main',
                              }}
                            >
                              {formatCurrency(insurance.employerContribution || 0)}
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


