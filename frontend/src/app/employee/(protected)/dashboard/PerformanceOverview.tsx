'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Button,
    useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useRouter } from 'next/navigation';

import { getEmployeeIdFromCookie, isAuthenticated } from '../../../../lib/auth-utils';
import { AppraisalRecord } from '../../../../types/performance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function PerformanceOverview({ employeeId: propEmployeeId, initialRecords }: { employeeId?: string, initialRecords?: AppraisalRecord[] }) {
    const theme = useTheme();
    const router = useRouter();
    const [records, setRecords] = useState<AppraisalRecord[]>(initialRecords || []);
    const [loading, setLoading] = useState(!initialRecords);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!initialRecords) {
            fetchRecords();
        }
    }, [propEmployeeId]);

    const fetchRecords = async () => {
        try {
            if (!isAuthenticated()) {
                return;
            }

            let employeeId = propEmployeeId;

            if (!employeeId) {
                employeeId = getEmployeeIdFromCookie() ?? undefined;
            }

            if (!employeeId) throw new Error('Failed to resolve employee ID');

            const url = `${API_URL}/performance/records/employee/${employeeId}/final`;

            const response = await fetch(url, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch performance records`);
            }

            const data = await response.json();
            // Sort records by date
            const sortedData = data.sort((a: any, b: any) => {
                const dateA = new Date(a.hrPublishedAt || a.updatedAt).getTime();
                const dateB = new Date(b.hrPublishedAt || b.updatedAt).getTime();
                return dateA - dateB;
            });
            setRecords(sortedData);
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const chartData = useMemo(() => {
        if (records.length === 0) return null;

        const labels = records.map(r => {
            const date = new Date((r as any).hrPublishedAt || (r as any).updatedAt);
            return r.cycleName || date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        });
        const scores = records.map(r => r.totalScore || 0);

        // For breakdown chart, take the latest record
        const latestRecord = records[records.length - 1];
        const latestRatings = latestRecord.ratings.map(r => ({
            label: r.title,
            value: r.ratingValue
        }));

        return { labels, scores, latestRatings, latestRecord };
    }, [records]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    if (error) {
        // Can optionally hide the section if error or no data
        return (
            <Alert severity="error" variant="outlined" sx={{ mb: 4 }}>{error}</Alert>
        );
    }

    if (records.length === 0) {
        // Render nothing or a placeholder if no records
        return null;
    }

    const { latestRecord } = chartData!;

    return (
        <Box sx={{ mt: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                    Performance Overview
                </Typography>
                <Button
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push('/employee/performance/my-records')}
                >
                    View All Records
                </Button>
            </Box>

            {/* Summary Stats */}
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SummaryCard
                        title="Latest Score"
                        value={latestRecord?.totalScore?.toFixed(1) || 'N/A'}
                        subtitle={latestRecord?.overallRatingLabel || 'No Rating'}
                        icon={<TrendingUpIcon />}
                        color={theme.palette.primary.main}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SummaryCard
                        title="Total Reviews"
                        value={records.length}
                        subtitle="Completed Cycles"
                        icon={<HistoryIcon />}
                        color={theme.palette.secondary.main}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SummaryCard
                        title="Last Review"
                        value={new Date((latestRecord as any).hrPublishedAt || (latestRecord as any).updatedAt).toLocaleDateString()}
                        subtitle="Date Finalized"
                        icon={<AssessmentIcon />}
                        color={theme.palette.success.main}
                    />
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={4}>
                <Grid size={{ xs: 12, lg: 7 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" fontWeight="bold">Performance History</Typography>
                            <Tooltip title="Trend of your total scores over time">
                                <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                            </Tooltip>
                        </Box>
                        <Box sx={{ flexGrow: 1, minHeight: 300, width: '100%' }}>
                            <LineChart
                                xAxis={[{ data: chartData!.labels, scaleType: 'point' }]}
                                series={[
                                    {
                                        data: chartData!.scores,
                                        area: true,
                                        color: theme.palette.primary.main,
                                        showMark: true,
                                    },
                                ]}
                                height={300}
                                margin={{ left: 30, right: 10, top: 10, bottom: 30 }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, lg: 5 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box mb={2}>
                            <Typography variant="h6" fontWeight="bold">Latest Skill Breakdown</Typography>
                            <Typography variant="caption" color="text.secondary">
                                From: {chartData!.latestRecord.cycleName || 'Latest Review'}
                            </Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1, minHeight: 300, width: '100%' }}>
                            <BarChart
                                dataset={chartData!.latestRatings}
                                yAxis={[{ scaleType: 'band', dataKey: 'label' }]}
                                series={[{ dataKey: 'value', label: 'Score', color: theme.palette.secondary.main }]}
                                layout="horizontal"
                                height={300}
                                margin={{ left: 100, right: 10, top: 10, bottom: 30 }}
                                hideLegend
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

function SummaryCard({ title, value, subtitle, icon, color }: any) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}
        >
            <Box
                sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: alpha(color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color
                }}
            >
                {React.cloneElement(icon, { fontSize: 'large' })}
            </Box>
            <Box>
                <Typography variant="body2" color="text.secondary" fontWeight="600" textTransform="uppercase">
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ my: 0.5 }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {subtitle}
                </Typography>
            </Box>
        </Paper>
    );
}
