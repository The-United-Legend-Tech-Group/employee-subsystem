'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Grid,
    Chip,
    Divider,
    List,
    ListItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    IconButton,
    Tooltip,
    useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';

import { getEmployeeIdFromCookie, logout } from '../../../../../lib/auth-utils';
import { AppraisalRecord } from '../../../../../types/performance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function MyPerformanceRecordsPage() {
    const theme = useTheme();
    const [records, setRecords] = useState<AppraisalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const employeeId = getEmployeeIdFromCookie();

            if (!employeeId) {
                logout('/employee/login');
                return;
            }

            const url = `${API_URL}/performance/records/employee/${employeeId}/final`;

            const response = await fetch(url, {
                credentials: 'include', // Send httpOnly cookies
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout('/employee/login');
                    return;
                }
                const errorText = await response.text();
                throw new Error(`Failed to fetch performance records: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            // Sort records by date (assuming updatedAt or similar represents the timeline)
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
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error" variant="filled">{error}</Alert>
            </Container>
        );
    }

    if (records.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">My Performance</Typography>
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper' }}>
                    <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary">
                        No finalized performance records found yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Once your manager completes and publishes an appraisal, it will appear here.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    const { latestRecord } = chartData!;

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
            <Box mb={5}>
                <Typography variant="h4" fontWeight="800" gutterBottom sx={{ letterSpacing: '-0.02em' }}>
                    Performance Overview
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Track your professional growth, review feedback, and analyze your performance history.
                </Typography>
            </Box>

            {/* Summary Stats */}
            <Grid container spacing={3} mb={5}>
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
            <Grid container spacing={4} mb={6}>
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

            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Detailed Records ({records.length})
            </Typography>

            <Stack spacing={3}>
                {records.slice().reverse().map((record) => (
                    <PerformanceRecordCard key={record._id} record={record} />
                ))}
            </Stack>
        </Container>
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

function PerformanceRecordCard({ record }: { record: AppraisalRecord }) {
    const theme = useTheme();
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const publishedDate = (record as any).hrPublishedAt || (record as any).updatedAt;

    return (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Box
                sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    p: 2,
                    px: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        {record.cycleName || 'Performance Appraisal'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Finalized on {formatDate(publishedDate)}
                    </Typography>
                </Box>
                <Chip
                    label={record.overallRatingLabel || 'No Rating'}
                    color={record.overallRatingLabel ? 'primary' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                />
            </Box>

            <CardContent sx={{ p: 3 }}>
                <Grid container spacing={4} alignItems="center">
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box textAlign="center" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="overline" color="text.secondary">Total Score</Typography>
                            <Typography variant="h3" fontWeight="bold" color="primary.main">
                                {record.totalScore ?? '-'}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 9 }}>
                        <Box mb={2}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.primary">Manager's Summary</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                "{record.managerSummary || 'No summary provided.'}"
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" fontWeight="bold" color="success.main" display="block" gutterBottom>
                                    STRENGTHS
                                </Typography>
                                <Typography variant="body2">
                                    {record.strengths || 'None listed.'}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" fontWeight="bold" color="error.main" display="block" gutterBottom>
                                    AREAS FOR IMPROVEMENT
                                </Typography>
                                <Typography variant="body2">
                                    {record.improvementAreas || 'None listed.'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Accordion
                    elevation={0}
                    disableGutters
                    sx={{
                        '&:before': { display: 'none' },
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: '12px !important',
                        overflow: 'hidden',
                        '&.Mui-expanded': {
                            borderRadius: '12px !important',
                            margin: 0
                        }
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                        <Typography fontWeight="600">View Detailed Ratings</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, bgcolor: 'transparent' }}>
                        <Stack spacing={0} divider={<Divider />}>
                            {record.ratings.map((rating, index) => (
                                <Box key={index} sx={{ py: 2.5, px: 2 }}>
                                    <Grid container spacing={3} alignItems="center">
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="text.primary" fontSize="0.95rem">
                                                {rating.title}
                                            </Typography>
                                            {rating.ratingLabel && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    {rating.ratingLabel}
                                                </Typography>
                                            )}
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 2 }}>
                                            <Chip
                                                label={rating.ratingValue}
                                                color={rating.ratingValue >= 3 ? 'success' : 'warning'}
                                                variant="filled"
                                                size="small"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    minWidth: 40,
                                                    height: 28,
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 7 }}>
                                            {rating.comments ? (
                                                <Box sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(theme.palette.text.primary, 0.05),
                                                    border: '1px solid',
                                                    borderColor: 'divider'
                                                }}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        "{rating.comments}"
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                    No comments.
                                                </Typography>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </CardContent>
        </Card>
    );
}
