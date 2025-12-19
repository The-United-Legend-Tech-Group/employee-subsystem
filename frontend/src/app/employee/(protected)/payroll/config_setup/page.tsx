'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import { useTheme, alpha } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GradeIcon from '@mui/icons-material/Grade';
import PolicyIcon from '@mui/icons-material/Policy';
import PaymentIcon from '@mui/icons-material/Payment';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import BusinessIcon from '@mui/icons-material/Business';
import GavelIcon from '@mui/icons-material/Gavel';
import { PageHeader, PendingDraftsDashboard } from './_components';
import { useAuth } from '@/hooks/use-auth';
import { getConfigPermissions, ConfigEntityType } from './_utils/config-permissions';
interface ConfigItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  type: ConfigEntityType;
}

export default function ConfigSetupPage() {
  const router = useRouter();
  const theme = useTheme();
  const { roles: userRoles, loading } = useAuth();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const configItems: ConfigItem[] = React.useMemo(() => [
    {
      title: 'Allowances',
      description: 'Manage employee allowances like housing, transportation, and meal allowances',
      icon: <MonetizationOnIcon />,
      path: '/employee/payroll/config_setup/allowances',
      color: theme.palette.success.main,
      type: 'allowances',
    },
    {
      title: 'Insurance Brackets',
      description: 'Configure insurance brackets based on salary ranges with employee and employer rates',
      icon: <AccountBalanceIcon />,
      path: '/employee/payroll/config_setup/insurance-brackets',
      color: theme.palette.info.main,
      type: 'insurance-brackets',
    },
    {
      title: 'Pay Grades',
      description: 'Define pay grade levels with base and gross salary structures',
      icon: <GradeIcon />,
      path: '/employee/payroll/config_setup/pay-grades',
      color: theme.palette.warning.main,
      type: 'pay-grades',
    },
    {
      title: 'Payroll Policies',
      description: 'Create and manage payroll policies for deductions, allowances, and benefits',
      icon: <PolicyIcon />,
      path: '/employee/payroll/config_setup/payroll-policies',
      color: theme.palette.primary.main,
      type: 'payroll-policies',
    },
    {
      title: 'Pay Types',
      description: 'Configure different pay types like hourly, monthly, or contract-based payments',
      icon: <PaymentIcon />,
      path: '/employee/payroll/config_setup/pay-types',
      color: theme.palette.secondary.main,
      type: 'pay-types',
    },
    {
      title: 'Signing Bonuses',
      description: 'Set up signing bonus configurations for different positions',
      icon: <CardGiftcardIcon />,
      path: '/employee/payroll/config_setup/signing-bonuses',
      color: '#9c27b0',
      type: 'signing-bonuses',
    },
    {
      title: 'Termination Benefits',
      description: 'Define termination and resignation benefit packages',
      icon: <ExitToAppIcon />,
      path: '/employee/payroll/config_setup/termination-benefits',
      color: theme.palette.error.main,
      type: 'termination-benefits',
    },
    {
      title: 'Tax Rules',
      description: 'Manage tax rates and rules for payroll calculations',
      icon: <GavelIcon />,
      path: '/employee/payroll/config_setup/tax-rules',
      color: '#795548',
      type: 'tax-rules',
    },
    {
      title: 'Company Settings',
      description: 'Configure company-wide payroll settings including pay date and timezone',
      icon: <BusinessIcon />,
      path: '/employee/payroll/config_setup/company-settings',
      color: '#607d8b',
      type: 'company-settings',
    },
  ], [theme]);

  // Filter items based on user permissions
  const visibleItems = React.useMemo(() => {
    if (loading) return [];
    return configItems.filter((item) => {
      // System Admin sees Backups (not in list?), Company Settings. others. 
      // Permissions logic is centralized in getConfigPermissions
      const perms = getConfigPermissions(item.type, userRoles);
      return perms.canView;
    });
  }, [loading, userRoles, configItems]);

  return (
    <Box sx={{ fontFamily: 'inherit' }}>
      <PageHeader
        title="Payroll Configuration"
        subtitle="Manage all payroll configuration settings and policies"
        icon={<SettingsIcon />}
        backButton={{
          label: 'Back to Dashboard',
          onClick: () => router.push('/employee/dashboard'),
        }}
      />

      <PendingDraftsDashboard />

      <Grid container spacing={3}>
        {visibleItems.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.title}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                  borderColor: item.color,
                },
              }}
            >
              <CardActionArea
                onClick={() => router.push(item.path)}
                sx={{ height: '100%', p: 0 }}
              >
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(item.color, 0.1),
                      mb: 2,
                    }}
                  >
                    {React.cloneElement(item.icon as React.ReactElement<{ sx?: object }>, {
                      sx: { fontSize: 28, color: item.color },
                    })}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        {isClient && visibleItems.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
              You do not have permission to view any configuration items.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
