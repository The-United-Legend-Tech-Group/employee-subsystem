import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useTheme, alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { configSetupApi, type PendingApprovalsResponse } from '../_api/config-setup.api';

export default function PendingDraftsDashboard() {
    const router = useRouter();
    const theme = useTheme();

    const [data, setData] = React.useState<PendingApprovalsResponse | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await configSetupApi.getPendingApprovals();
                if (response.error) {
                    setError(response.error);
                } else {
                    setData(response.data || null);
                }
            } catch (err) {
                setError('Failed to load pending approvals');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!data || data.total === 0) {
        return null; // Don't show anything if no pending items
    }

    const items = [
        { label: 'Allowances', count: data.allowances, path: '/employee/payroll/config_setup/allowances?status=draft' },
        { label: 'Insurance', count: data.insuranceBrackets, path: '/employee/payroll/config_setup/insurance-brackets?status=draft' },
        { label: 'Pay Grades', count: data.payGrades, path: '/employee/payroll/config_setup/pay-grades?status=draft' },
        { label: 'Policies', count: data.payrollPolicies, path: '/employee/payroll/config_setup/payroll-policies?status=draft' },
        { label: 'Pay Types', count: data.payTypes, path: '/employee/payroll/config_setup/pay-types?status=draft' },
        { label: 'Bonuses', count: data.signingBonuses, path: '/employee/payroll/config_setup/signing-bonuses?status=draft' },
        { label: 'Tax Rules', count: data.taxRules, path: '/employee/payroll/config_setup/tax-rules?status=draft' },
        { label: 'Termination', count: data.terminationBenefits, path: '/employee/payroll/config_setup/termination-benefits?status=draft' },
    ].filter(item => item.count > 0);

    return (
        <Card
            elevation={0}
            sx={{
                mb: 4,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                background: `linear-gradient(to right, ${alpha(theme.palette.warning.light, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PendingActionsIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="text.primary">
                        Pending Actions ({data.total})
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    You have {data.total} draft items waiting for review or completion.
                </Typography>

                <Grid container spacing={2}>
                    {items.map((item) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.label}>
                            <Box
                                onClick={() => router.push(item.path)}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.warning.main, 0.15),
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {item.count}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {item.label}
                                    </Typography>
                                </Box>
                                <ChevronRightIcon fontSize="small" color="action" />
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
}
