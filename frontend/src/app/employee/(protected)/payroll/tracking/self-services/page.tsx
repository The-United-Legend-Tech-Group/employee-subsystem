'use client';

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useRouter } from 'next/navigation';
import { useTheme, alpha } from '@mui/material/styles';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import GavelIcon from '@mui/icons-material/Gavel';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import WarningIcon from '@mui/icons-material/Warning';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import { getEmployeeIdFromCookie, isAuthenticated } from '../../../../../../lib/auth-utils';
import { decryptData } from '../../../../../../common/utils/encryption';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  dateOfHire: string;
  status: string;
  contractType?: string;
  workType?: string;
  payGradeId?: {
    _id: string;
    grade: string;
    baseSalary: number;
    grossSalary: number;
  };
}

interface BaseSalaryData {
  employeeId: string;
  employeeNumber: string;
  contractType?: string;
  workType?: string;
  payGrade?: {
    _id: string;
    grade: string;
    baseSalary: number;
    grossSalary: number;
  };
  baseSalary: number | null;
  latestPayrollPeriod: string | null;
}

interface PayrollDashboardProps {
  employeeId?: string;
  systemRole?: string;
}

export default function PayrollDashboard({ employeeId, systemRole }: PayrollDashboardProps) {
  const router = useRouter();
  const theme = useTheme();
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [baseSalaryData, setBaseSalaryData] = React.useState<BaseSalaryData | null>(null);
  const [loading, setLoading] = React.useState(true);


  const payrollOptions = [
    {
      title: 'Payslips',
      description: 'View and download your monthly payslips with detailed breakdowns of earnings, deductions, and net pay.',
      icon: ReceiptLongIcon,
      path: '/employee/payroll/tracking/self-services/payslips',
    },
    {
      title: 'Disputes',
      description: 'Submit disputes for payroll errors, missing payments, or incorrect deductions. Track the status of your disputes.',
      icon: GavelIcon,
      path: '/employee/payroll/tracking/self-services/disputes',
    },
    {
      title: 'Expense Claims',
      description: 'Submit expense reimbursement claims for business-related expenses. Track approval and payment status.',
      icon: RequestQuoteIcon,
      path: '/employee/payroll/tracking/self-services/claims',
    },
    {
      title: 'Compensations',
      description: 'View all compensations including encashed leave days, transportation allowances, and refunds from your payslips.',
      icon: AccountBalanceWalletIcon,
      path: '/employee/payroll/tracking/self-services/compensations',
    },
    {
      title: 'Tax Deductions',
      description: 'View detailed tax deductions from all payslips including income tax, social contributions, and applicable laws or rules.',
      icon: AccountBalanceIcon,
      path: '/employee/payroll/tracking/self-services/tax-deductions',
    },
    {
      title: 'Insurance Deductions',
      description: 'View itemized insurance deductions including health, pension, unemployment, and other protections covered by your contributions.',
      icon: HealthAndSafetyIcon,
      path: '/employee/payroll/tracking/self-services/insurance-deductions',
    },
    {
      title: 'Penalty Deductions',
      description: 'View salary deductions due to misconduct or unapproved absenteeism, so you know why part of your salary was reduced.',
      icon: WarningIcon,
      path: '/employee/payroll/tracking/self-services/penalty-deductions',
    },
    {
      title: 'Unpaid Leave Deductions',
      description: 'View deductions for unpaid leave days, so that you understand how your time off affects your salary.',
      icon: EventBusyIcon,
      path: '/employee/payroll/tracking/self-services/unpaid-leave-deductions',
    },
    {
      title: 'Employer Contributions',
      description: 'View employer contributions (insurance, pension, allowances) so that you know your full benefits.',
      icon: BusinessIcon,
      path: '/employee/payroll/tracking/self-services/employer-contributions',
    },
  ];

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Try cookie-based auth first, fallback to localStorage
        let decryptedEmployeeId = employeeId || getEmployeeIdFromCookie();

        // Fallback to localStorage during migration
        if (!decryptedEmployeeId) {
          const token = localStorage.getItem('access_token');
          const encryptedEmployeeId = localStorage.getItem('employeeId');

          if (encryptedEmployeeId && token) {
            decryptedEmployeeId = await decryptData(encryptedEmployeeId, token);
          }
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

        // If we have an employeeId from cookie or localStorage, try to fetch employee data
        if (decryptedEmployeeId) {
          const employeeRes = await fetch(`${apiUrl}/employee/${decryptedEmployeeId}`, {
            credentials: 'include', // Primary: send httpOnly cookies
          });

          if (employeeRes.status === 401) {
            // Only redirect on explicit 401 - authentication actually failed
            console.warn('[PayrollDashboard] 401 Unauthorized - redirecting to login');
            router.push('/employee/login');
            return;
          }

          if (employeeRes.ok) {
            const employeeData = await employeeRes.json();
            const employeeProfile = employeeData.profile;
            setEmployee(employeeProfile);

            // Get base salary from config controller using payGradeId
            // Handle payGradeId as string, object with _id, or object with $oid
            let payGradeIdValue: string | null = null;
            if (employeeProfile?.payGradeId) {
              if (typeof employeeProfile.payGradeId === 'string') {
                payGradeIdValue = employeeProfile.payGradeId;
              } else if (employeeProfile.payGradeId._id) {
                payGradeIdValue = employeeProfile.payGradeId._id;
              } else if ((employeeProfile.payGradeId as any).$oid) {
                payGradeIdValue = (employeeProfile.payGradeId as any).$oid;
              } else if (typeof employeeProfile.payGradeId === 'object' && employeeProfile.payGradeId.toString) {
                payGradeIdValue = employeeProfile.payGradeId.toString();
              }
            }

            if (payGradeIdValue) {
              try {
                const payGradeRes = await fetch(`${apiUrl}/config-setup/pay-grades/${payGradeIdValue}`, {
                  credentials: 'include', // Primary: send httpOnly cookies
                });

                if (payGradeRes.ok) {
                  const payGradeData = await payGradeRes.json();
                  setBaseSalaryData({
                    employeeId: employeeProfile._id,
                    employeeNumber: employeeProfile.employeeNumber || '',
                    contractType: employeeProfile.contractType,
                    workType: employeeProfile.workType,
                    payGrade: {
                      _id: payGradeData._id,
                      grade: payGradeData.grade,
                      baseSalary: payGradeData.baseSalary,
                      grossSalary: payGradeData.grossSalary,
                    },
                    baseSalary: payGradeData.baseSalary || null,
                    latestPayrollPeriod: null,
                  });
                } else {
                  // Pay grade not found (404) or other error - use fallback silently
                  // This can happen when a pay grade was deleted but employee still references it
                  console.debug('[PayrollDashboard] Pay grade not found, using fallback data');
                  setBaseSalaryData({
                    employeeId: employeeProfile._id,
                    employeeNumber: employeeProfile.employeeNumber || '',
                    contractType: employeeProfile.contractType,
                    workType: employeeProfile.workType,
                    payGrade: employeeProfile.payGradeId,
                    baseSalary: employeeProfile.payGradeId?.baseSalary || null,
                    latestPayrollPeriod: null,
                  });
                }
              } catch (error) {
                // Fallback: use payGradeId from employee profile if available
                setBaseSalaryData({
                  employeeId: employeeProfile._id,
                  employeeNumber: employeeProfile.employeeNumber || '',
                  contractType: employeeProfile.contractType,
                  workType: employeeProfile.workType,
                  payGrade: employeeProfile.payGradeId,
                  baseSalary: employeeProfile.payGradeId?.baseSalary || null,
                  latestPayrollPeriod: null,
                });
              }
            } else {
              // No payGradeId, set empty data
              setBaseSalaryData({
                employeeId: employeeProfile._id,
                employeeNumber: employeeProfile.employeeNumber || '',
                contractType: employeeProfile.contractType,
                workType: employeeProfile.workType,
                payGrade: undefined,
                baseSalary: null,
                latestPayrollPeriod: null,
              });
            }
          }
        } else {
          // No employeeId available from cookie or localStorage - redirect to login
          console.warn('[PayrollDashboard] No employeeId found - redirecting to login');
          router.push('/employee/login');
          return;
        }
      } catch (error) {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, employeeId, systemRole]);


  const getStatusColor = (status: string) => {
    if (!status) return 'default';
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'ON_LEAVE':
        return 'warning';
      case 'TERMINATED':
        return 'error';
      case 'PROBATION':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatContractType = (contractType?: string, workType?: string) => {
    if (!contractType && !workType) return 'N/A';

    const contract = contractType?.replace('_CONTRACT', '').replace(/_/g, ' ').toLowerCase() || '';
    const work = workType?.replace(/_/g, ' ').toLowerCase() || '';

    // Capitalize first letter of each word
    const capitalize = (str: string) => str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // If contract and work are the same, just show one
    if (contract && work && contract.toLowerCase() === work.toLowerCase()) {
      return capitalize(contract);
    }

    // If both exist and are different, show both
    if (contract && work) {
      return `${capitalize(contract)} (${capitalize(work)})`;
    }

    return capitalize(contract || work) || 'N/A';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };


  const getEmployeeDisplay = (employeeId: string | { _id: string; firstName?: string; lastName?: string; employeeNumber?: string } | undefined) => {
    if (!employeeId) return 'N/A';
    if (typeof employeeId === 'string') return employeeId;
    const name = [employeeId.firstName, employeeId.lastName].filter(Boolean).join(' ');
    return name || employeeId.employeeNumber || 'N/A';
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        fontFamily: 'inherit',
        maxWidth: '1180px',
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box mb={5}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            fontSize: '2.1rem',
            letterSpacing: '-0.02em',
            color: 'text.primary',
          }}
        >
          Payroll Self-Service
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: '1rem',
            fontWeight: 400,
            mt: 1,
          }}
        >
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: { xs: 2, sm: 2.5, md: 3 },
          alignItems: 'stretch',
        }}
      >
        {payrollOptions.map((option, index) => {
          const IconComponent = option.icon;
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Card
                sx={{
                  width: '100%',
                  borderRadius: 2.5,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
                  background: theme.palette.background.paper,
                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  overflow: 'hidden',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
                  },
                }}
              >
                <CardContent
                  sx={{
                    width: '100%',
                    px: 3,
                    pt: 3.5,
                    pb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    flex: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'text.primary',
                    }}
                  >
                    {option.title}
                  </Typography>

                  <IconComponent
                    sx={{
                      fontSize: 46,
                      color: 'text.secondary',
                      opacity: 0.7,
                    }}
                  />

                  <Divider sx={{ width: '100%', opacity: 0.2 }} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.6,
                      flex: 1,
                      display: 'flex',
                      alignItems: 'flex-start',
                    }}
                  >
                    {option.description}
                  </Typography>

                  <Button
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push(option.path)}
                    sx={{
                      mt: 'auto',
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      px: 2.8,
                      py: 1,
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'text.primary',
                        backgroundColor: alpha(theme.palette.common.black, 0.04),
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    {option.title}
                  </Button>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

