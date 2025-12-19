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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DownloadIcon from '@mui/icons-material/Download';
import { useTheme, alpha } from '@mui/material/styles';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatCurrency } from '../../utils';
import { isAuthenticated } from '@/lib/auth-utils';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

interface TaxDeduction {
  payslipId: string;
  payslipPeriod?: string;
  taxName: string;
  description: string;
  rate: number;
  calculatedAmount?: number;
  status: string;
  createdAt: string | null;
  appliedTo?: number;
}

export default function TaxDeductionsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [taxDeductions, setTaxDeductions] = React.useState<TaxDeduction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());
  const [downloading, setDownloading] = React.useState(false);

  // Table filters
  const {
    filteredData: filteredTaxDeductions,
    filters,
    updateSearch,
    updateStartDate,
    updateEndDate,
    clearFilters,
  } = useTableFilters<TaxDeduction>(
    taxDeductions,
    ['taxName', 'description'],
    'createdAt',
    'month' // Use month/year filtering for payroll periods
  );

  React.useEffect(() => {
    const fetchTaxDeductions = async () => {
      try {
        // Check both cookie-based auth and localStorage fallback
        if (!isAuthenticated() && !localStorage.getItem('access_token')) {
          router.push('/employee/login');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

        const response = await fetch(`${apiUrl}/tracking/tax-deductions`, {
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          setError(`Failed to load tax deductions: ${response.status} ${response.statusText}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setTaxDeductions(data || []);
      } catch (err) {
        console.error('Error fetching tax deductions:', err);
        setError('An error occurred while loading tax deductions');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxDeductions();
  }, [router]);

  const totalAmount = taxDeductions.reduce((sum, tax) => sum + (tax.calculatedAmount || 0), 0);

  // Get available years from tax deductions
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    taxDeductions.forEach((tax) => {
      let year: number | null = null;

      // Try to get year from createdAt field
      if (tax.createdAt) {
        try {
          const date = new Date(tax.createdAt);
          if (!isNaN(date.getTime())) {
            year = date.getFullYear();
          }
        } catch (e) {
          console.warn('Invalid createdAt date:', tax.createdAt);
        }
      }

      if (year && year >= 2000 && year <= 2100) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [taxDeductions]);

  // Set default year to most recent year if available
  React.useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const handleDownloadTaxDocument = async () => {
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        setError('Not authenticated. Please log in again.');
        router.push('/employee/login');
        return;
      }

      setDownloading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

      const response = await fetch(`${apiUrl}/tracking/tax-documents/annual/${selectedYear}/download`, {
        credentials: 'include', // Primary: send httpOnly cookies
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError(`No tax documents found for year ${selectedYear}`);
        } else {
          const errorText = await response.text();
          console.error('Download Error:', errorText);
          setError(`Failed to download tax document: ${response.status} ${response.statusText}`);
        }
        setDownloading(false);
        return;
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          link.download = filenameMatch[1];
        } else {
          link.download = `Annual_Tax_Statement_${selectedYear}.pdf`;
        }
      } else {
        link.download = `Annual_Tax_Statement_${selectedYear}.pdf`;
      }

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading tax document:', err);
      setError('An error occurred while downloading the tax document');
    } finally {
      setDownloading(false);
    }
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
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 32, color: 'error.main' }} />
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
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Tax Deductions
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
                View detailed tax deductions including income tax, social contributions, and applicable laws
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            {taxDeductions.length > 0 && (
              <Box display="flex" gap={2} alignItems="center">
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 120,
                    '& .MuiInputLabel-root': {
                      color: theme.palette.text.primary,
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <InputLabel id="year-select-label" shrink={true}>Year</InputLabel>
                  <Select
                    labelId="year-select-label"
                    id="year-select"
                    value={selectedYear}
                    label="Year"
                    onChange={(e: any) => setSelectedYear(e.target.value as number)}
                    sx={{
                      height: 42,
                      borderRadius: 2,
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.text.primary, 0.23),
                        borderWidth: 1,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.text.primary, 0.5),
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2,
                      },
                      '& .MuiSelect-select': {
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                      },
                    }}
                  >
                    {availableYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                  onClick={handleDownloadTaxDocument}
                  disabled={downloading || availableYears.length === 0}
                  sx={{
                    height: 42,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#333333',
                    },
                    '&:disabled': {
                      backgroundColor: alpha('#000000', 0.26),
                      color: alpha('#ffffff', 0.5),
                    },
                  }}
                >
                  {downloading ? 'Downloading...' : 'Download Tax Document'}
                </Button>
              </Box>
            )}
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {taxDeductions.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by tax name, description, or period..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          {taxDeductions.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
            >
              <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Tax Deductions Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You don't have any tax deductions recorded yet.
              </Typography>
            </Box>
          ) : (
            <>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Total Tax Deductions: {formatCurrency(totalAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredTaxDeductions.length} tax deduction{filteredTaxDeductions.length !== 1 ? 's' : ''} found
                  {filteredTaxDeductions.length !== taxDeductions.length && ` (filtered from ${taxDeductions.length})`}
                </Typography>
              </Box>
              <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Payroll Period</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tax Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description / Law</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rate (%)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Applied To</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTaxDeductions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No tax deductions match your search criteria.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTaxDeductions.map((tax, index) => (
                        <TableRow
                          key={`${tax.payslipId}-${index}`}
                          hover
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            }
                          }}
                          onClick={() => router.push(`/employee/payroll/tracking/self-services/payslips/${tax.payslipId}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {tax.payslipPeriod || 'Unknown Period'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {tax.taxName || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {tax.description || 'No description available'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {tax.rate ? `${tax.rate}%` : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(tax.appliedTo || 0)}
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
                              {formatCurrency(tax.calculatedAmount || 0)}
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


