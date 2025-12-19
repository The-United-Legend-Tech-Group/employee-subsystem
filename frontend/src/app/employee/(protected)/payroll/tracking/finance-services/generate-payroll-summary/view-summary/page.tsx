'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { formatCurrency, formatDate, formatMonthYear } from '../../../utils';

interface DepartmentSummary {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalGrossPay: number;
  totalNetPay: number;
  totalBaseSalary: number;
  totalAllowances: number;
  totalBonuses: number;
  totalBenefits: number;
  totalDeductions: number;
  totalTaxDeductions: number;
  totalInsuranceDeductions: number;
  totalEmployerContributions: number;
  employeesCount: number;
  payrollRunsCount: number;
}

interface PayrollSummaryResult {
  period: string;
  periodStart?: string;
  periodEnd?: string;
  departmentId: string | null;
  departmentName?: string;
  departmentCode?: string | null;
  summaryType: string;
  status: string;
  isAllDepartments?: boolean;
  departments?: DepartmentSummary[];
  totalGrossPay: number;
  totalNetPay: number;
  totalBaseSalary?: number;
  totalAllowances?: number;
  totalBonuses?: number;
  totalBenefits?: number;
  totalDeductions?: number;
  totalTaxDeductions: number;
  totalInsuranceDeductions: number;
  totalEmployerContributions: number;
  employeesCount: number;
  payrollRunsCount: number;
  generatedAt: string;
}

export default function ViewPayrollSummaryPage() {
  const router = useRouter();
  const theme = useTheme();
  const [summary, setSummary] = React.useState<PayrollSummaryResult | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Get summary data from sessionStorage
    const summaryData = sessionStorage.getItem('payrollSummaryData');
    if (summaryData) {
      try {
        const parsed = JSON.parse(summaryData);
        setSummary(parsed);
        // Clear sessionStorage after reading
        sessionStorage.removeItem('payrollSummaryData');
      } catch (err) {
        console.error('Error parsing summary data:', err);
      }
    }
    setLoading(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!summary) return;
    
    // Create a comprehensive text summary for download
    let summaryText = `
Payroll Summary Report
======================

Summary Type: ${summary.summaryType}
${summary.periodStart && summary.periodEnd ? `Period Range: ${formatDate(summary.periodStart)} - ${formatDate(summary.periodEnd)}` : summary.period ? `Period: ${(summary.summaryType === 'Month-End' || summary.summaryType === 'Year-End') ? formatMonthYear(summary.period) : summary.period}` : ''}
Status: ${summary.status}

${summary.isAllDepartments ? 'Scope: All Departments' : `Department: ${summary.departmentName || 'N/A'}`}
${summary.departmentCode ? `Department Code: ${summary.departmentCode}` : ''}

Employees Count: ${summary.employeesCount}
Payroll Runs: ${summary.payrollRunsCount}

${summary.isAllDepartments ? 'GRAND TOTAL SUMMARY' : 'Financial Summary'}:
${summary.isAllDepartments ? '===================' : '-----------------'}
Total Gross Pay: ${formatCurrency(summary.totalGrossPay)}
Total Net Pay: ${formatCurrency(summary.totalNetPay)}
${summary.totalBaseSalary !== undefined ? `Base Salary: ${formatCurrency(summary.totalBaseSalary)}` : ''}
${summary.totalAllowances !== undefined ? `Allowances: ${formatCurrency(summary.totalAllowances)}` : ''}
${summary.totalBonuses !== undefined ? `Bonuses: ${formatCurrency(summary.totalBonuses)}` : ''}
${summary.totalBenefits !== undefined ? `Benefits: ${formatCurrency(summary.totalBenefits)}` : ''}
${summary.totalDeductions !== undefined ? `Total Deductions: ${formatCurrency(summary.totalDeductions)}` : ''}

Deductions & Contributions:
--------------------------
Total Tax Deductions: ${formatCurrency(summary.totalTaxDeductions)}
Total Insurance Deductions: ${formatCurrency(summary.totalInsuranceDeductions)}
Total Employer Contributions: ${formatCurrency(summary.totalEmployerContributions)}
    `;

    // Add department breakdowns if viewing all departments
    if (summary.isAllDepartments && summary.departments && summary.departments.length > 0) {
      summaryText += `\n\n\nDEPARTMENT BREAKDOWN\n`;
      summaryText += `===================\n\n`;
      
      summary.departments.forEach((dept, index) => {
        summaryText += `${index + 1}. ${dept.departmentName}${dept.departmentCode ? ` (${dept.departmentCode})` : ''}\n`;
        summaryText += `${'='.repeat(50)}\n`;
        summaryText += `Employees: ${dept.employeesCount}\n`;
        summaryText += `Payroll Runs: ${dept.payrollRunsCount}\n\n`;
        summaryText += `Financial Summary:\n`;
        summaryText += `  Gross Pay: ${formatCurrency(dept.totalGrossPay)}\n`;
        summaryText += `  Net Pay: ${formatCurrency(dept.totalNetPay)}\n`;
        if (dept.totalBaseSalary !== undefined) {
          summaryText += `  Base Salary: ${formatCurrency(dept.totalBaseSalary)}\n`;
        }
        if (dept.totalAllowances !== undefined) {
          summaryText += `  Allowances: ${formatCurrency(dept.totalAllowances)}\n`;
        }
        if (dept.totalBonuses !== undefined) {
          summaryText += `  Bonuses: ${formatCurrency(dept.totalBonuses)}\n`;
        }
        if (dept.totalBenefits !== undefined) {
          summaryText += `  Benefits: ${formatCurrency(dept.totalBenefits)}\n`;
        }
        summaryText += `  Tax Deductions: ${formatCurrency(dept.totalTaxDeductions)}\n`;
        summaryText += `  Insurance Deductions: ${formatCurrency(dept.totalInsuranceDeductions)}\n`;
        summaryText += `  Employer Contributions: ${formatCurrency(dept.totalEmployerContributions)}\n`;
        summaryText += `\n`;
      });
    }

    summaryText += `\nGenerated At: ${formatDate(summary.generatedAt)}`;
    summaryText = summaryText.trim();

    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = summary.periodStart 
      ? `payroll-summary-${new Date(summary.periodStart).toISOString().split('T')[0]}.txt`
      : summary.period && (summary.summaryType === 'Month-End' || summary.summaryType === 'Year-End')
      ? `payroll-summary-${formatMonthYear(summary.period).replace(/\s+/g, '-')}.txt`
      : `payroll-summary-${summary.period || 'report'}.txt`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  if (!summary) {
    return (
      <Box sx={{ fontFamily: 'inherit', maxWidth: '1400px', mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/employee/payroll/tracking/finance-services/generate-payroll-summary')}
            sx={{ 
              mb: 3,
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.black, 0.04),
              },
            }}
          >
            Back to Generate Summary
          </Button>
        </Box>
        <Card
          sx={{
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            background: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" color="error">
              No summary data found. Please generate a summary first.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const formatMonthYearForPeriod = (period: string) => {
    if (summary.summaryType === 'Month-End' || summary.summaryType === 'Year-End') {
      return formatMonthYear(period);
    }
    return period;
  };

  return (
    <Box sx={{ fontFamily: 'inherit', maxWidth: '1400px', mx: 'auto' }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/employee/payroll/tracking/finance-services/generate-payroll-summary')}
          sx={{ 
            mb: 3,
            textTransform: 'none',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.black, 0.04),
            },
          }}
        >
          Back to Generate Summary
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
                Payroll Summary Report
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                }}
              >
                {summary.summaryType} Summary
                {summary.periodStart && summary.periodEnd ? (
                  <span> • {formatDate(summary.periodStart)} - {formatDate(summary.periodEnd)}</span>
                ) : summary.period ? (
                  <span> • {formatMonthYearForPeriod(summary.period)}</span>
                ) : null}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={summary.summaryType}
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
              <Chip
                label={summary.departmentName || 'All Departments'}
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
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                label={summary.status}
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
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ 
                textTransform: 'none',
                borderColor: theme.palette.divider,
                color: 'text.primary',
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.common.black, 0.04),
                },
              }}
            >
              Print Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ 
                textTransform: 'none',
                borderColor: theme.palette.divider,
                color: 'text.primary',
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.common.black, 0.04),
                },
              }}
            >
              Download
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        <Card
          sx={{
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            background: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ p: 3 }}>
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
              Employees
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              {summary.employeesCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {summary.isAllDepartments ? 'Total employees across all departments' : 'Active employees in department'}
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            background: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ p: 3 }}>
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
              Payroll Runs
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              {summary.payrollRunsCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Processed in period
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            background: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ p: 3 }}>
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
              Gross Pay
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              {formatCurrency(summary.totalGrossPay)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Total before deductions
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            background: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ p: 3 }}>
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
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              {formatCurrency(summary.totalNetPay)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Total after deductions
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Report Information */}
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
            Report Information
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
                  <TableCell>Field</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell sx={{ width: '200px', fontWeight: 600 }}>
                    Reporting Period
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {summary.periodStart && summary.periodEnd ? (
                        <>
                          {formatDate(summary.periodStart)} - {formatDate(summary.periodEnd)}
                        </>
                      ) : summary.period ? (
                        formatMonthYearForPeriod(summary.period)
                      ) : (
                        'N/A'
                      )}
                    </Typography>
                    {summary.period && (summary.summaryType === 'Month-End' || summary.summaryType === 'Year-End') && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mt: 0.5 }}>
                        Period: {formatMonthYearForPeriod(summary.period)}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    Department
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {summary.departmentName || 'All Departments'}
                    </Typography>
                    {summary.departmentCode && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mt: 0.5 }}>
                        Code: {summary.departmentCode}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    Report Status
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                      label={summary.status}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
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
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.totalBaseSalary !== undefined && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      Base Salary
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(summary.totalBaseSalary)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {summary.totalAllowances !== undefined && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      Allowances
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(summary.totalAllowances)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {summary.totalBonuses !== undefined && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      Bonuses
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(summary.totalBonuses)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {summary.totalBenefits !== undefined && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      Benefits
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(summary.totalBenefits)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                <TableRow
                  sx={{
                    '& td': {
                      borderBottom: 'none',
                      borderTop: `2px solid ${theme.palette.divider}`,
                      pt: 2,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    Total Gross Pay
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {formatCurrency(summary.totalGrossPay)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Deductions & Contributions Section */}
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
            Deductions & Employer Contributions
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <Card
              sx={{
                borderRadius: 0,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                background: theme.palette.background.paper,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Tax Deductions
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {formatCurrency(summary.totalTaxDeductions)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Total tax withholdings
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 0,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                background: theme.palette.background.paper,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Insurance Deductions
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {formatCurrency(summary.totalInsuranceDeductions)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Employee contributions
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 0,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                background: theme.palette.background.paper,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Employer Contributions
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {formatCurrency(summary.totalEmployerContributions)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Company contributions
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </CardContent>
      </Card>

      {/* Department Breakdown Sections - Only show when viewing all departments */}
      {summary.isAllDepartments && summary.departments && summary.departments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              fontWeight: 600,
              fontSize: '1.125rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Department Breakdown
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {summary.departments.map((dept) => (
              <Card
                key={dept.departmentId}
                sx={{
                  borderRadius: 0,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: 'none',
                  background: theme.palette.background.paper,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Department Header */}
                  <Box sx={{ mb: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {dept.departmentName}
                        </Typography>
                        {dept.departmentCode && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Code: {dept.departmentCode}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={`${dept.employeesCount} Employees`}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Department Financial Summary */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                    <Card
                      sx={{
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        background: theme.palette.background.paper,
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 1,
                            display: 'block',
                          }}
                        >
                          Gross Pay
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatCurrency(dept.totalGrossPay)}
                        </Typography>
                      </CardContent>
                    </Card>

                    <Card
                      sx={{
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        background: theme.palette.background.paper,
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 1,
                            display: 'block',
                          }}
                        >
                          Net Pay
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatCurrency(dept.totalNetPay)}
                        </Typography>
                      </CardContent>
                    </Card>

                    <Card
                      sx={{
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        background: theme.palette.background.paper,
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 1,
                            display: 'block',
                          }}
                        >
                          Tax Deductions
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatCurrency(dept.totalTaxDeductions)}
                        </Typography>
                      </CardContent>
                    </Card>

                    <Card
                      sx={{
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        background: theme.palette.background.paper,
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 1,
                            display: 'block',
                          }}
                        >
                          Insurance
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatCurrency(dept.totalInsuranceDeductions)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>

                  {/* Detailed Breakdown */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          mb: 1.5,
                          display: 'block',
                        }}
                      >
                        Earnings Breakdown
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {dept.totalBaseSalary !== undefined && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                            <Typography variant="body2" color="text.secondary">Base Salary</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(dept.totalBaseSalary)}</Typography>
                          </Box>
                        )}
                        {dept.totalAllowances !== undefined && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                            <Typography variant="body2" color="text.secondary">Allowances</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(dept.totalAllowances)}</Typography>
                          </Box>
                        )}
                        {dept.totalBonuses !== undefined && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                            <Typography variant="body2" color="text.secondary">Bonuses</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(dept.totalBonuses)}</Typography>
                          </Box>
                        )}
                        {dept.totalBenefits !== undefined && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                            <Typography variant="body2" color="text.secondary">Benefits</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(dept.totalBenefits)}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          mb: 1.5,
                          display: 'block',
                        }}
                      >
                        Contributions
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                          <Typography variant="body2" color="text.secondary">Employer Contributions</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(dept.totalEmployerContributions)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                          <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(dept.totalDeductions)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                          <Typography variant="body2" color="text.secondary">Payroll Runs</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{dept.payrollRunsCount}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          textAlign: 'center',
          borderTop: `1px solid ${theme.palette.divider}`,
          pt: 3,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Report generated on {formatDate(summary.generatedAt)} • This is an official payroll summary document
        </Typography>
      </Box>
    </Box>
  );
}


