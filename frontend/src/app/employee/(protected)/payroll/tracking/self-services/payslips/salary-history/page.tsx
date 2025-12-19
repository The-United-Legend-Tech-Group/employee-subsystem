'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme, alpha } from '@mui/material/styles';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { isAuthenticated } from '@/lib/auth-utils';

interface SalaryHistoryEntry {
  payslipId: string;
  payrollPeriod?: string;
  createdAt?: string;
  baseSalary: number;
  totalGrossSalary: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: string;
}

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

export default function SalaryHistoryPage() {
  const router = useRouter();
  const theme = useTheme();
  const [salaryHistory, setSalaryHistory] = React.useState<SalaryHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSalaryHistory = async () => {
      try {
        // Check both cookie-based auth and localStorage fallback
        if (!isAuthenticated() && !localStorage.getItem('access_token')) {
          router.push('/employee/login');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

        // Use the tracking service endpoint to get all payslips for the employee
        const response = await fetch(`${apiUrl}/tracking/salary/history`, {
          credentials: 'include', // Primary: send httpOnly cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          setError(`Failed to load salary history: ${response.status} ${response.statusText}`);
          setLoading(false);
          return;
        }

        const data = await response.json();

        // Transform the data to match the frontend interface
        const transformedHistory = Array.isArray(data) ? data.map((payslip: any) => ({
          payslipId: payslip.payslipId || payslip._id?.toString() || '',
          payrollPeriod: payslip.payrollPeriod || null,
          createdAt: payslip.createdAt || null,
          baseSalary: payslip.baseSalary || 0,
          totalGrossSalary: payslip.totalGrossSalary || 0,
          totalDeductions: payslip.totalDeductions || 0,
          netPay: payslip.netPay || 0,
          paymentStatus: payslip.paymentStatus || 'Unknown',
        })).sort((a, b) => {
          // Sort by date (newest first for timeline, but we'll reverse for display)
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }) : [];

        setSalaryHistory(transformedHistory);
      } catch (err) {
        console.error('Error fetching salary history:', err);
        setError('An error occurred while loading salary history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryHistory();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatPeriod = (period: string | null | undefined) => {
    if (!period) return 'N/A';
    return period;
  };

  // Prepare chart data - reverse to show oldest first
  const chartData = React.useMemo(() => {
    const reversed = [...salaryHistory].reverse();
    return {
      labels: reversed.map((entry, index) => {
        if (entry.payrollPeriod) return entry.payrollPeriod;
        if (entry.createdAt) {
          const date = new Date(entry.createdAt);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        return `Period ${index + 1}`;
      }),
      grossSalaries: reversed.map(entry => entry.totalGrossSalary || 0),
      netPays: reversed.map(entry => entry.netPay || 0),
      baseSalaries: reversed.map(entry => entry.baseSalary || 0),
    };
  }, [salaryHistory]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'info';
      case 'disputed':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const colorPalette = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.info.main,
  ];

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
              <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main' }} />
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
                Salary History
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
                Track your salary progression over time
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/employee/payroll/tracking/self-services/payslips')}
            sx={{
              height: 42,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Back to Payslips
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {salaryHistory.length === 0 ? (
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
                <TrendingUpIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
              </Box>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                No salary history found
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ opacity: 0.7, maxWidth: 400, textAlign: 'center' }}
              >
                Your salary history will appear here once you have payslips
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3} mb={4}>
            <Card
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              }}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Gross Salary
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    mb: 1
                  }}
                >
                  {formatCurrency(salaryHistory[0]?.totalGrossSalary || 0)}
                </Typography>
                {salaryHistory.length > 1 && (
                  <Chip
                    size="small"
                    label={
                      calculateChange(
                        salaryHistory[0]?.totalGrossSalary || 0,
                        salaryHistory[1]?.totalGrossSalary || 0
                      ) >= 0 ? '+' : ''
                    }
                    color={calculateChange(
                      salaryHistory[0]?.totalGrossSalary || 0,
                      salaryHistory[1]?.totalGrossSalary || 0
                    ) >= 0 ? 'success' : 'error'}
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
              }}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Gross Salary
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'success.main',
                    mb: 1
                  }}
                >
                  {formatCurrency(
                    salaryHistory.reduce((sum, entry) => sum + (entry.totalGrossSalary || 0), 0) /
                    salaryHistory.length
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Over {salaryHistory.length} period{salaryHistory.length !== 1 ? 's' : ''}
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
              }}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Periods
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'info.main',
                    mb: 1
                  }}
                >
                  {salaryHistory.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Payroll records
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Salary Trend Chart */}
          <Card
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
              mb: 4,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  fontSize: '1.25rem'
                }}
              >
                Salary Trend Over Time
              </Typography>
              <LineChart
                colors={colorPalette}
                xAxis={[{
                  scaleType: 'point',
                  data: chartData.labels,
                  label: 'Payroll Period',
                  tickInterval: (index, i) => chartData.labels.length <= 12 ? true : (i + 1) % Math.ceil(chartData.labels.length / 12) === 0,
                }]}
                yAxis={[{
                  label: 'Amount (USD)',
                  valueFormatter: (value: number) => formatCurrency(value),
                }]}
                series={[
                  {
                    id: 'gross-salary',
                    label: 'Gross Salary',
                    data: chartData.grossSalaries,
                    showMark: true,
                    curve: 'monotoneX',
                    area: true,
                  },
                  {
                    id: 'net-pay',
                    label: 'Net Pay',
                    data: chartData.netPays,
                    showMark: true,
                    curve: 'monotoneX',
                  },
                  {
                    id: 'base-salary',
                    label: 'Base Salary',
                    data: chartData.baseSalaries,
                    showMark: true,
                    curve: 'monotoneX',
                  },
                ]}
                height={400}
                margin={{ left: 80, right: 30, top: 30, bottom: 80 }}
                grid={{ horizontal: true, vertical: false }}
                sx={{
                  '& .MuiAreaElement-series-gross-salary': {
                    fill: "url('#gross-salary-gradient')",
                  },
                }}
              >
                <AreaGradient color={theme.palette.primary.main} id="gross-salary-gradient" />
              </LineChart>
            </CardContent>
          </Card>

          {/* Timeline View */}
          <Card
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  fontSize: '1.25rem'
                }}
              >
                Salary Timeline
              </Typography>
              <Box sx={{ position: 'relative' }}>
                {salaryHistory.map((entry, index) => {
                  const previousEntry = salaryHistory[index + 1];
                  const change = previousEntry
                    ? calculateChange(entry.totalGrossSalary, previousEntry.totalGrossSalary)
                    : 0;
                  const isLast = index === salaryHistory.length - 1;

                  return (
                    <Box key={entry.payslipId} sx={{ position: 'relative', mb: isLast ? 0 : 4 }}>
                      <Box display="flex" gap={3}>
                        {/* Timeline line and dot */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: 60,
                            flexShrink: 0,
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              border: `3px solid ${change > 0 ? theme.palette.success.main :
                                  change < 0 ? theme.palette.error.main :
                                    theme.palette.primary.main
                                }`,
                              backgroundColor: theme.palette.background.paper,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1,
                              position: 'relative',
                            }}
                          >
                            <ReceiptLongIcon
                              fontSize="small"
                              sx={{
                                color: change > 0 ? 'success.main' :
                                  change < 0 ? 'error.main' :
                                    'primary.main'
                              }}
                            />
                          </Box>
                          {!isLast && (
                            <Box
                              sx={{
                                width: 2,
                                flex: 1,
                                backgroundColor: alpha(theme.palette.divider, 0.3),
                                mt: 1,
                              }}
                            />
                          )}
                        </Box>

                        {/* Content */}
                        <Box flex={1}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 3,
                              borderRadius: 3,
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              backgroundColor: alpha(theme.palette.background.paper, 0.8),
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                                transform: 'translateY(-2px)',
                              },
                            }}
                          >
                            <Stack spacing={2}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                    {formatPeriod(entry.payrollPeriod)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(entry.createdAt)}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={entry.paymentStatus}
                                  color={getStatusColor(entry.paymentStatus) as any}
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                              </Box>

                              <Divider />

                              <Box>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} flexWrap="wrap">
                                  <Box flex={1} minWidth={150}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                      Gross Salary
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} color="primary.main" gutterBottom>
                                      {formatCurrency(entry.totalGrossSalary)}
                                    </Typography>
                                    {change !== 0 && (
                                      <Chip
                                        size="small"
                                        label={`${change >= 0 ? '+' : ''}${change.toFixed(1)}% ${change > 0 ? '↑' : '↓'}`}
                                        color={change >= 0 ? 'success' : 'error'}
                                        sx={{ fontSize: '0.7rem', height: 22, mt: 0.5 }}
                                      />
                                    )}
                                  </Box>
                                  <Box flex={1} minWidth={150}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                      Net Pay
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} color="success.main">
                                      {formatCurrency(entry.netPay)}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>

                              <Box>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} flexWrap="wrap">
                                  <Box flex={1} minWidth={150}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                      Base Salary
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                      {formatCurrency(entry.baseSalary)}
                                    </Typography>
                                  </Box>
                                  <Box flex={1} minWidth={150}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                      Deductions
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600} color="error.main">
                                      {formatCurrency(entry.totalDeductions)}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            </Stack>
                          </Paper>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}