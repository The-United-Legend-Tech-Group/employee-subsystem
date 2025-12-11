'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { decryptData } from '../../../../../common/utils/encryption';

interface TeamSummaryItem {
    positionId: string;
    positionTitle: string;
    departmentId: string;
    departmentName: string;
    count: number;
}

interface RoleSummaryItem {
    role: string;
    count: number;
}

export default function TeamSummaryPage() {
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = React.useState(true);
    const [summaryData, setSummaryData] = React.useState<TeamSummaryItem[]>([]);
    const [roleData, setRoleData] = React.useState<RoleSummaryItem[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                router.push('/employee/login');
                return;
            }

            const employeeId = await decryptData(encryptedEmployeeId, token);
            if (!employeeId) throw new Error('Decryption failed');

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
            const response = await fetch(`${apiUrl}/employee/team/summary?managerId=${employeeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSummaryData(data.positionSummary || data.items || []); // Fallback to items if positionSummary missing
                setRoleData(data.roleSummary || []);
            } else {
                setError('Failed to load team summary.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while fetching data.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchSummary();
    }, [router]);

    // --- Helpers ---
    const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    // --- Process Data for Charts ---
    const positionData = React.useMemo(() => {
        return summaryData
            .filter(item => item.positionTitle && item.positionTitle !== 'Unknown Role')
            .map((item, index) => ({
                id: index,
                value: item.count || 0,
                label: toTitleCase(item.positionTitle),
            }));
    }, [summaryData]);

    const departmentData = React.useMemo(() => {
        const deptMap = new Map<string, number>();
        summaryData.forEach(item => {
            const name = item.departmentName || 'Unknown Department';
            const current = deptMap.get(name) || 0;
            deptMap.set(name, current + (item.count || 0));
        });
        return Array.from(deptMap.entries()).map(([name, count], index) => ({
            id: index,
            label: toTitleCase(name),
            value: count
        }));
    }, [summaryData]);

    const formattedRoleData = React.useMemo(() => {
        return roleData.map((item, index) => ({
            id: index,
            value: item.count || 0,
            label: toTitleCase(item.role || 'Unknown Role'),
        }));
    }, [roleData]);

    const totalMembers = summaryData.reduce((acc, curr) => acc + (curr.count || 0), 0);

    const topRole = React.useMemo(() => {
        if (formattedRoleData.length === 0) return { label: '-', value: 0 };
        return formattedRoleData.reduce((prev, current) => (prev.value > current.value) ? prev : current, formattedRoleData[0]);
    }, [formattedRoleData]);

    const largestDept = React.useMemo(() => {
        if (departmentData.length === 0) return { label: '-', value: 0 };
        return departmentData.reduce((prev, current) => (prev.value > current.value) ? prev : current, departmentData[0]);
    }, [departmentData]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            flexGrow: 1,
            p: 3,
            height: '100%',
            overflow: 'auto',
            bgcolor: 'background.default',
        }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => router.back()} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <ArrowBackRoundedIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">Team Summary</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Overview of your team's composition and structure
                        </Typography>
                    </Box>
                </Box>
                <Button
                    startIcon={<RefreshRoundedIcon />}
                    variant="outlined"
                    onClick={fetchSummary}
                >
                    Refresh
                </Button>
            </Box>

            {error ? (
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'error.lighter', borderRadius: 2, color: 'error.main' }}>
                    <Typography variant="h6">{error}</Typography>
                    <Button sx={{ mt: 2 }} onClick={fetchSummary}>Try Again</Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {/* Row 1: Key Metrics */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                    <GroupsRoundedIcon fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">{totalMembers}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight="medium">Total Members</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                                    <EngineeringRoundedIcon fontSize="medium" />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">{roleData.length}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight="medium">Unique Roles</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}>
                                    <StarRoundedIcon fontSize="medium" />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        title={topRole.label}
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {topRole.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight="medium">Top Role</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                                    <BusinessRoundedIcon fontSize="medium" />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        title={largestDept.label}
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {largestDept.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight="medium">Largest Dept</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Row 2: Charts (Full Width Stacked) */}
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ height: 380, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>Position Distribution</Typography>
                                <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {positionData.length > 0 ? (
                                        <PieChart
                                            series={[
                                                {
                                                    data: positionData,
                                                    highlightScope: { fade: 'global', highlight: 'item' },
                                                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                                    innerRadius: 30,
                                                    paddingAngle: 2,
                                                    cornerRadius: 4,
                                                },
                                            ]}
                                            height={280}
                                            slotProps={{
                                                legend: { hidden: true } as any
                                            }}
                                            margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        />
                                    ) : (
                                        <Typography color="text.secondary">No data available</Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ height: 380, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>Role Distribution</Typography>
                                <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {formattedRoleData.length > 0 ? (
                                        <PieChart
                                            series={[
                                                {
                                                    data: formattedRoleData,
                                                    highlightScope: { fade: 'global', highlight: 'item' },
                                                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                                    innerRadius: 30,
                                                    paddingAngle: 2,
                                                    cornerRadius: 4,
                                                },
                                            ]}
                                            height={280}
                                            slotProps={{
                                                legend: { hidden: true } as any
                                            }}
                                            margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        />
                                    ) : (
                                        <Typography color="text.secondary">No data available</Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ height: 380, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>Department Overview</Typography>
                                <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {departmentData.length > 0 ? (
                                        <BarChart
                                            xAxis={[{ scaleType: 'band', data: departmentData.map(d => d.label) }]}
                                            series={[{ data: departmentData.map(d => d.value), color: theme.palette.secondary.main }]}
                                            height={280}
                                            borderRadius={8}
                                            margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                                        />
                                    ) : (
                                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                            <Typography color="text.secondary">No data available</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Row 3: Detailed List */}
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>System Roles</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {roleData.map((item, idx) => (
                                        <Chip
                                            key={idx}
                                            label={`${item.role}: ${item.count}`}
                                            variant="outlined"
                                            sx={{ p: 1 }}
                                        />
                                    ))}
                                    {roleData.length === 0 && (
                                        <Typography color="text.secondary" variant="body2">No system roles assigned.</Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
