'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useTheme, alpha } from '@mui/material/styles';
import { isAuthenticated } from '@/lib/auth-utils';

interface PayslipDetails {
  _id: string;
  employeeId: any;
  payrollRunId: any;
  earningsDetails: {
    baseSalary: number;
    allowances?: Array<{
      name: string;
      amount: number;
      type?: string;
      description?: string;
      status?: string;
      createdBy?: any;
      approvedBy?: any;
      approvedAt?: string;
    }>;
    bonuses?: Array<{
      positionName?: string;
      name?: string;
      amount: number;
      type?: string;
      description?: string;
      status?: string;
    }>;
    benefits?: Array<{
      name: string;
      amount: number;
      type?: string;
      terms?: string;
      description?: string;
      status?: string;
    }>;
    refunds?: Array<{
      description: string;
      amount: number;
    }>;
  };
  deductionsDetails: {
    taxes?: Array<{
      name: string;
      amount: number;
      rate: number;
      description?: string;
      status?: string;
    }>;
    insurances?: Array<{
      name: string;
      amount: number;
      employeeRate?: number;
      employerRate?: number;
      minSalary?: number;
      maxSalary?: number;
      description?: string;
      status?: string;
    }>;
    penalties?: {
      penalties?: Array<{
        reason: string;
        amount: number;
      }>;
    };
  };
  totalGrossSalary: number;
  totaDeductions?: number;
  netPay: number;
  paymentStatus: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PayslipDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const payslipId = params?.payslipId as string;

  const [payslip, setPayslip] = React.useState<PayslipDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (payslipId) {
      fetchPayslipDetails();
    }
  }, [payslipId]);

  const fetchPayslipDetails = async () => {
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      const response = await fetch(`${apiUrl}/tracking/payslips/${payslipId}`, {
        credentials: 'include', // Primary: send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        setError(`Failed to load payslip: ${response.status} ${response.statusText}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Payslip data received:', data);
      setPayslip(data);
    } catch (err) {
      console.error('Error fetching payslip:', err);
      setError('An error occurred while loading payslip details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper function to clean item names (remove JSON data that might be concatenated)
  const cleanItemName = (name: string | undefined): string => {
    if (!name) return '';
    // If name contains JSON-like data (starts with " - {" or similar), extract only the prefix
    const jsonMatch = name.match(/^(.+?)\s*-\s*\{/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    // If entire name is JSON-like, return empty or default
    const trimmed = name.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return '';
    }
    return name;
  };

  // Helper function to safely render descriptions (skip objects and JSON strings)
  const renderDescription = (description: any): string | null => {
    if (!description) return null;
    // If it's a string, check if it looks like JSON
    if (typeof description === 'string') {
      const trimmed = description.trim();
      // Skip JSON-like strings (objects or arrays)
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return null;
      }
      return description;
    }
    // If it's an object, skip it
    if (typeof description === 'object') {
      return null;
    }
    return String(description);
  };

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

  const handleDownload = async () => {
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      const response = await fetch(`${apiUrl}/tracking/payslips/${payslipId}/download`, {
        credentials: 'include', // Primary: send httpOnly cookies
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        alert('Failed to download payslip');
        return;
      }

      // Get the PDF blob
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'payslip.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        // Generate filename from payslip data
        const employeeName = typeof payslip?.employeeId === 'object'
          ? `${payslip.employeeId?.firstName || ''}_${payslip.employeeId?.lastName || ''}`.trim() || 'Employee'
          : 'Employee';
        const payrollPeriod = typeof payslip?.payrollRunId === 'object'
          ? payslip.payrollRunId?.payrollPeriod
            ? new Date(payslip.payrollRunId.payrollPeriod).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        filename = `Payslip_${employeeName}_${payrollPeriod}.pdf`;
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading payslip:', err);
      alert('An error occurred while downloading the payslip');
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

  if (error || !payslip) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/employee/payroll/tracking/self-services/payslips')}
          sx={{ mb: 3 }}
        >
          Back
        </Button>
        <Alert severity="error">
          {error || 'Payslip not found'}
        </Alert>
      </Box>
    );
  }

  const employeeName = typeof payslip.employeeId === 'object'
    ? `${payslip.employeeId?.firstName || ''} ${payslip.employeeId?.lastName || ''}`.trim() || 'N/A'
    : 'N/A';

  return (
    <Box sx={{ fontFamily: 'inherit', maxWidth: '1400px', mx: 'auto' }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/employee/payroll/tracking/self-services/payslips')}
          sx={{
            mb: 3,
            textTransform: 'none',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.black, 0.04),
            },
          }}
        >
          Back
        </Button>

        {/* Header Section */}
        <Box
          sx={{
            mb: 4,
            pb: 3,
            borderBottom: `2px solid ${theme.palette.divider}`,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.75rem',
                  letterSpacing: '-0.01em',
                  mb: 1,
                  color: 'text.primary',
                }}
              >
                Payslip Details
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                }}
              >
                Payroll Period: {formatDate(payslip.createdAt || '')}
              </Typography>
            </Box>
            <Box display="flex" gap={1.5} alignItems="center">
              <Chip
                label={payslip.paymentStatus || 'Unknown'}
                color={getStatusColor(payslip.paymentStatus) as any}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 28,
                  px: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              />
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{
                  borderColor: theme.palette.divider,
                  color: 'text.primary',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: theme.palette.text.primary,
                    backgroundColor: alpha(theme.palette.common.black, 0.04),
                  },
                }}
              >
                Download PDF
              </Button>
            </Box>
          </Box>

          {/* Employee Information */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5,
                    display: 'block',
                  }}
                >
                  Employee
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {employeeName}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5,
                    display: 'block',
                  }}
                >
                  Net Pay
                </Typography>
                <Typography variant="h6" fontWeight={600} color="text.primary">
                  {formatCurrency(payslip.netPay || 0)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Earnings Section */}
      <Card
        sx={{
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          background: theme.palette.background.paper,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 3,
              color: 'text.primary',
              fontSize: '1.125rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Earnings Breakdown
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: 'text.secondary',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      py: 1.5,
                    },
                  }}
                >
                  <TableCell>Item</TableCell>
                  <TableCell>Type/Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Base Salary */}
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      Base Salary
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Regular monthly salary
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {formatCurrency(payslip.earningsDetails?.baseSalary || 0)}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Allowances */}
                {payslip.earningsDetails?.allowances?.map((allowance, index) => (
                  <TableRow
                    key={`allowance-${index}`}
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {cleanItemName(allowance.name) || 'Allowance'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {allowance.type && (
                          <Chip
                            label={allowance.type}
                            size="small"
                            sx={{
                              mr: 1,
                              mb: 0.5,
                              fontSize: '0.7rem',
                              height: 20,
                              backgroundColor: theme.palette.grey[200],
                              color: theme.palette.grey[800],
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          />
                        )}
                        {renderDescription(allowance.description) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {renderDescription(allowance.description)}
                          </Typography>
                        )}
                        {allowance.createdBy && typeof allowance.createdBy === 'object' && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Created by: {allowance.createdBy.firstName || ''} {allowance.createdBy.lastName || ''}
                          </Typography>
                        )}
                        {allowance.approvedBy && typeof allowance.approvedBy === 'object' && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Approved by: {allowance.approvedBy.firstName || ''} {allowance.approvedBy.lastName || ''}
                            {allowance.approvedAt && ` on ${formatDate(allowance.approvedAt)}`}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatCurrency(allowance.amount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Bonuses */}
                {payslip.earningsDetails?.bonuses?.map((bonus, index) => (
                  <TableRow
                    key={`bonus-${index}`}
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {cleanItemName(bonus.positionName || bonus.name) || 'Bonus'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {bonus.type && (
                          <Chip
                            label={bonus.type}
                            size="small"
                            sx={{
                              mr: 1,
                              mb: 0.5,
                              fontSize: '0.7rem',
                              height: 20,
                              backgroundColor: theme.palette.grey[200],
                              color: theme.palette.grey[800],
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          />
                        )}
                        {renderDescription(bonus.description) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {renderDescription(bonus.description)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatCurrency(bonus.amount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Benefits */}
                {payslip.earningsDetails?.benefits?.map((benefit, index) => (
                  <TableRow
                    key={`benefit-${index}`}
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {cleanItemName(benefit.name) || 'Benefit'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {benefit.terms && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Terms: {benefit.terms}
                          </Typography>
                        )}
                        {renderDescription(benefit.description) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {renderDescription(benefit.description)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatCurrency(benefit.amount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Refunds */}
                {payslip.earningsDetails?.refunds?.map((refund, index) => (
                  <TableRow
                    key={`refund-${index}`}
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        Refund
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {renderDescription(refund.description) || 'Refund'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatCurrency(refund.amount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total Gross Salary */}
                <TableRow
                  sx={{
                    backgroundColor: theme.palette.grey[50],
                    '& td': {
                      borderTop: `2px solid ${theme.palette.divider}`,
                      py: 2,
                    },
                  }}
                >
                  <TableCell colSpan={2}>
                    <Typography variant="body1" fontWeight={600}>
                      Total Gross Salary
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="text.primary"
                    >
                      {formatCurrency(payslip.totalGrossSalary || 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Deductions Section */}
      <Card
        sx={{
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          background: theme.palette.background.paper,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 3,
              color: 'text.primary',
              fontSize: '1.125rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Deductions Breakdown
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: 'text.secondary',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      py: 1.5,
                    },
                  }}
                >
                  <TableCell>Item</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Taxes */}
                {payslip.deductionsDetails?.taxes?.map((tax, index) => (
                  <TableRow
                    key={`tax-${index}`}
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {cleanItemName(tax.name) || 'Tax'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Rate: {tax.rate || 0}%
                        </Typography>
                        {renderDescription(tax.description) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {renderDescription(tax.description)}
                          </Typography>
                        )}
                        {tax.status && (
                          <Chip
                            label={tax.status}
                            color={getStatusColor(tax.status) as any}
                            size="small"
                            sx={{
                              mt: 0.5,
                              fontSize: '0.7rem',
                              height: 20,
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatCurrency(tax.amount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Insurances */}
                {payslip.deductionsDetails?.insurances?.map((insurance, index) => (
                  <TableRow
                    key={`insurance-${index}`}
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {cleanItemName(insurance.name) || 'Insurance'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {insurance.employeeRate !== undefined && (
                          <Typography variant="body2" color="text.secondary">
                            Employee Rate: {insurance.employeeRate}%
                            {insurance.employerRate !== undefined && ` | Employer Rate: ${insurance.employerRate}%`}
                          </Typography>
                        )}
                        {insurance.minSalary !== undefined && insurance.maxSalary !== undefined && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Salary Range: {formatCurrency(insurance.minSalary)} - {formatCurrency(insurance.maxSalary)}
                          </Typography>
                        )}
                        {renderDescription(insurance.description) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {renderDescription(insurance.description)}
                          </Typography>
                        )}
                        {insurance.status && (
                          <Chip
                            label={insurance.status}
                            color={getStatusColor(insurance.status) as any}
                            size="small"
                            sx={{
                              mt: 0.5,
                              fontSize: '0.7rem',
                              height: 20,
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatCurrency(insurance.amount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Penalties - New structure with penalties array */}
                {payslip.deductionsDetails?.penalties?.penalties?.map((penalty, index) => (
                  <TableRow
                    key={`penalty-${index}`}
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        Penalty
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {penalty.reason || 'Penalty'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatCurrency(penalty.amount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total Deductions */}
                <TableRow
                  sx={{
                    backgroundColor: theme.palette.grey[50],
                    '& td': {
                      borderTop: `2px solid ${theme.palette.divider}`,
                      py: 2,
                    },
                  }}
                >
                  <TableCell colSpan={2}>
                    <Typography variant="body1" fontWeight={600}>
                      Total Deductions
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="text.primary"
                    >
                      {formatCurrency(payslip.totaDeductions || 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card
        sx={{
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          background: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h6"
                fontWeight={600}
                mb={3}
                sx={{
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: 'text.secondary',
                }}
              >
                Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ px: 1 }}>
                  <Typography variant="body1" color="text.secondary" fontWeight={400}>
                    Gross Salary
                  </Typography>
                  <Typography variant="body1" fontWeight={500} color="text.primary" sx={{ minWidth: '140px', textAlign: 'right' }}>
                    {formatCurrency(payslip.totalGrossSalary || 0)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ px: 1 }}>
                  <Typography variant="body1" color="text.secondary" fontWeight={400}>
                    Total Deductions
                  </Typography>
                  <Typography variant="body1" fontWeight={500} color="text.primary" sx={{ minWidth: '140px', textAlign: 'right' }}>
                    {formatCurrency(payslip.totaDeductions || 0)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ px: 1, pt: 0.5 }}>
                  <Typography variant="body1" fontWeight={600} color="text.primary">
                    Net Pay
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color="text.primary"
                    sx={{ minWidth: '140px', textAlign: 'right' }}
                  >
                    {formatCurrency(payslip.netPay || 0)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  pl: { md: 4 },
                  borderLeft: { md: `1px solid ${theme.palette.divider}` },
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  mb={3}
                  sx={{
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'text.secondary',
                  }}
                >
                  Payment Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ px: 1 }}>
                    <Typography variant="body1" color="text.secondary" fontWeight={400}>
                      Payment Status
                    </Typography>
                    <Chip
                      label={payslip.paymentStatus || 'Unknown'}
                      color={getStatusColor(payslip.paymentStatus) as any}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        px: 1.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    />
                  </Box>
                  {payslip.updatedAt && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ px: 1 }}>
                      <Typography variant="body1" color="text.secondary" fontWeight={400}>
                        Last Updated
                      </Typography>
                      <Typography variant="body1" fontWeight={400} color="text.primary" sx={{ minWidth: '180px', textAlign: 'right' }}>
                        {formatDateTime(payslip.updatedAt)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
