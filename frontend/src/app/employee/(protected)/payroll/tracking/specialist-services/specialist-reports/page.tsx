'use client';

/**
 * Payroll Specialist - Generate Payroll Reports by Department
 * 
 * REQ-PY-38: As a Payroll Specialist, I want to generate payroll reports by department,
 * so that I can analyze salary distribution and ensure budget alignment.
 * 
 * This page allows Payroll Specialists to:
 * - Select a department
 * - Specify date range (optional)
 * - Generate comprehensive payroll reports
 * - View and download generated reports
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import { alpha, useTheme } from '@mui/material/styles';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { formatCurrency, formatDate } from '../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

interface Department {
  _id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface PayrollReport {
  departmentId: string;
  departmentName: string;
  startDate?: Date;
  endDate?: Date;
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalTaxDeductions: number;
  totalInsuranceDeductions: number;
  totalEmployerContributions: number;
  payrollRuns: any[];
  generatedAt: Date;
}

export default function SpecialistReportsPage() {
  const router = useRouter();
  const theme = useTheme();
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>('');
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [loadingDepartments, setLoadingDepartments] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<PayrollReport | null>(null);

  /**
   * Fetch available departments for report generation
   */
  React.useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

      // Fetch departments
      const response = await fetch(`${apiUrl}/organization-structure/departments`, {
        credentials: 'include', // Primary: send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        setError(`Failed to load departments: ${response.status} ${response.statusText}`);
        setLoadingDepartments(false);
        return;
      }

      const data = await response.json();
      // Filter to show only active departments
      const activeDepartments = Array.isArray(data)
        ? data.filter((dept: Department) => dept.isActive !== false)
        : [];

      setDepartments(activeDepartments);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('An error occurred while loading departments. Please try again.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  /**
   * Generate payroll report by department
   * REQ-PY-38: Payroll Specialist generate payroll reports by department
   */
  const handleGenerateReport = async () => {
    if (!selectedDepartment) {
      setError('Please select a department.');
      return;
    }

    // Validate date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        setError('Start date must be before end date.');
        return;
      }
    }

    setGenerating(true);
    setError(null);
    setReport(null);

    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', new Date(startDate).toISOString());
      }
      if (endDate) {
        params.append('endDate', new Date(endDate).toISOString());
      }

      // Call backend API: GET /tracking/reports/department/:departmentId
      const url = `${apiUrl}/tracking/reports/department/${selectedDepartment}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include', // Primary: send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to generate report';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setError(errorMessage);
        setGenerating(false);
        return;
      }

      const data = await response.json();
      console.log('Report data received:', data);

      // Transform report data
      // Backend returns data in nested structure: { summary: { totalEmployees, totalGrossPay, ... }, reportByPeriod: [...] }
      const selectedDept = departments.find(d => d._id === selectedDepartment);
      const reportData: PayrollReport = {
        departmentId: selectedDepartment,
        departmentName: data.departmentName || selectedDept?.name || 'Unknown Department',
        startDate: data.reportPeriod?.startDate ? new Date(data.reportPeriod.startDate) : (startDate ? new Date(startDate) : undefined),
        endDate: data.reportPeriod?.endDate ? new Date(data.reportPeriod.endDate) : (endDate ? new Date(endDate) : undefined),
        totalEmployees: data.summary?.totalEmployees || 0,
        totalGrossPay: data.summary?.totalGrossPay || 0,
        totalNetPay: data.summary?.totalNetPay || 0,
        totalTaxDeductions: data.summary?.totalTaxDeductions || 0,
        totalInsuranceDeductions: data.summary?.totalInsuranceDeductions || 0,
        totalEmployerContributions: data.summary?.totalEmployerContributions || 0,
        payrollRuns: data.reportByPeriod || [],
        generatedAt: data.generatedAt ? new Date(data.generatedAt) : new Date(),
      };

      setReport(reportData);
      setSuccessMessage('Payroll report generated successfully!');
    } catch (err) {
      console.error('Error generating report:', err);
      setError('An error occurred while generating the report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Download report as CSV/PDF (placeholder - can be implemented based on backend support)
   */
  const handleDownloadReport = () => {
    if (!report) return;

    // Create CSV content
    const csvContent = [
      ['Payroll Report by Department'],
      ['Department:', report.departmentName],
      ['Generated At:', report.generatedAt.toLocaleString()],
      [''],
      ['Summary'],
      ['Total Employees:', report.totalEmployees],
      ['Total Gross Pay:', formatCurrency(report.totalGrossPay)],
      ['Total Net Pay:', formatCurrency(report.totalNetPay)],
      ['Total Tax Deductions:', formatCurrency(report.totalTaxDeductions)],
      ['Total Insurance Deductions:', formatCurrency(report.totalInsuranceDeductions)],
      ['Total Employer Contributions:', formatCurrency(report.totalEmployerContributions)],
    ].map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-report-${report.departmentName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setSuccessMessage('Report downloaded successfully!');
  };

  if (loadingDepartments) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        sx={{
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        '& *': {
          fontFamily: 'inherit',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssessmentIcon
              sx={{
                fontSize: 40,
                color: 'primary.main',
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
                Generate Payroll Reports
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
                Generate comprehensive payroll reports by department to analyze salary distribution and ensure budget alignment.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/employee/payroll/tracking/specialist-services')}
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
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            fontFamily: 'inherit',
            '& .MuiAlert-message': {
              fontWeight: 500,
            },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Report Generation Form */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
          mb: 4,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`,
          },
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            px: 3,
            py: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AssessmentIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Report Parameters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                Select department and date range to generate report
              </Typography>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 3.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {/* Department Selection */}
            <FormControl fullWidth required>
              <InputLabel sx={{ fontWeight: 500 }}>Department</InputLabel>
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                label="Department"
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.divider, 0.3),
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2,
                  },
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Date Range */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Start Date (Optional)"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                  },
                }}
              />
              <TextField
                label="End Date (Optional)"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </Box>

            {/* Generate Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', pt: 1 }}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={generating || !selectedDepartment}
                startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 5,
                  py: 1.75,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}`,
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                  '&:disabled': {
                    backgroundColor: 'action.disabledBackground',
                    color: 'action.disabled',
                    boxShadow: 'none',
                    transform: 'none',
                  },
                }}
              >
                {generating ? 'Generating Report...' : 'Generate Report'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Report Results
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadReport}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Download Report
              </Button>
            </Box>

            {/* Report Info */}
            <Box
              sx={{
                mb: 4,
                p: 2.5,
                borderRadius: 2,
                background: alpha(theme.palette.primary.main, 0.04),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', display: 'block', mb: 0.5 }}>
                    Department
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {report.departmentName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', display: 'block', mb: 0.5 }}>
                    Period
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {startDate && endDate
                      ? `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`
                      : 'All Time'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', display: 'block', mb: 0.5 }}>
                    Generated At
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {report.generatedAt.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Key Metrics Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5, mb: 4 }}>
              {/* Total Employees */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.info.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`,
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', mb: 1, display: 'block' }}>
                  Total Employees
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.dark' }}>
                  {report.totalEmployees}
                </Typography>
              </Paper>

              {/* Total Gross Pay */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.success.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`,
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', mb: 1, display: 'block' }}>
                  Total Gross Pay
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.dark' }}>
                  {formatCurrency(report.totalGrossPay)}
                </Typography>
              </Paper>

              {/* Total Net Pay */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.primary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', mb: 1, display: 'block' }}>
                  Total Net Pay
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                  {formatCurrency(report.totalNetPay)}
                </Typography>
              </Paper>

              {/* Total Tax Deductions */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.warning.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}`,
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', mb: 1, display: 'block' }}>
                  Total Tax Deductions
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                  {formatCurrency(report.totalTaxDeductions)}
                </Typography>
              </Paper>

              {/* Total Insurance Deductions */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.error.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`,
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', mb: 1, display: 'block' }}>
                  Total Insurance Deductions
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.dark' }}>
                  {formatCurrency(report.totalInsuranceDeductions)}
                </Typography>
              </Paper>

              {/* Total Employer Contributions */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.secondary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.15)}`,
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', mb: 1, display: 'block' }}>
                  Total Employer Contributions
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.dark' }}>
                  {formatCurrency(report.totalEmployerContributions)}
                </Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      )}

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