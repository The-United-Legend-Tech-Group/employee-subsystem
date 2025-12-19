'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';

export interface TeamSummaryItem {
    positionId: string;
    positionTitle: string;
    departmentId: string;
    departmentName: string;
    count: number;
}

export interface RoleSummaryItem {
    role: string;
    count: number;
}

export interface PerformanceSummary {
    averageScore: number | null;
    topPerformer: { name: string; score: number } | null;
    totalReviewed: number;
    totalTeamMembers: number;
    lastReviewDate: string | null;
    scoreDistribution: { label: string; count: number }[];
    memberScores: { employeeId: string; name: string; score: number | null; ratingLabel: string | null }[];
}

interface TeamSummaryClientProps {
    summaryData: TeamSummaryItem[];
    roleData: RoleSummaryItem[];
    performanceData: PerformanceSummary | null;
}

export default function TeamSummaryClient({
    summaryData,
    roleData,
    performanceData
}: TeamSummaryClientProps) {
    const router = useRouter();
    const theme = useTheme();

    const handleRefresh = () => {
        router.refresh();
    };

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
                    onClick={handleRefresh}
                >
                    Refresh
                </Button>
            </Box>

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

                {/* Performance Section */}
                {performanceData && (
                    <>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h5" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
                                Team Performance
                            </Typography>
                        </Grid>

                        {/* Performance Metrics Cards */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                        <TrendingUpIcon fontSize="medium" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold">
                                            {performanceData.averageScore !== null ? performanceData.averageScore.toFixed(1) : 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">Avg Team Score</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}>
                                        <EmojiEventsRoundedIcon fontSize="medium" />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            variant="h5"
                                            fontWeight="bold"
                                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title={performanceData.topPerformer?.name}
                                        >
                                            {performanceData.topPerformer?.name || 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                            Top Performer {performanceData.topPerformer ? `(${performanceData.topPerformer.score.toFixed(1)})` : ''}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                                        <AssessmentRoundedIcon fontSize="medium" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold">
                                            {performanceData.totalReviewed}/{performanceData.totalTeamMembers}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">Members Reviewed</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                                        <EventNoteRoundedIcon fontSize="medium" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold">
                                            {performanceData.lastReviewDate ? new Date(performanceData.lastReviewDate).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">Last Review</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Performance Charts */}
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Card sx={{ height: 380, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Score Distribution</Typography>
                                    <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {performanceData.scoreDistribution.length > 0 ? (
                                            <PieChart
                                                series={[{
                                                    data: performanceData.scoreDistribution.map((item, idx) => ({
                                                        id: idx,
                                                        value: item.count,
                                                        label: item.label,
                                                    })),
                                                    highlightScope: { fade: 'global', highlight: 'item' },
                                                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                                    innerRadius: 30,
                                                    paddingAngle: 2,
                                                    cornerRadius: 4,
                                                }]}
                                                height={280}
                                                slotProps={{ legend: { hidden: true } as any }}
                                                margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">No performance data available</Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Card sx={{ height: 380, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Team Member Scores</Typography>
                                    <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {performanceData.memberScores.filter(m => m.score !== null).length > 0 ? (
                                            <BarChart
                                                dataset={performanceData.memberScores.filter(m => m.score !== null).slice(0, 8).map(m => ({
                                                    name: m.name,
                                                    score: m.score,
                                                }))}
                                                yAxis={[{ scaleType: 'band', dataKey: 'name' }]}
                                                series={[{ dataKey: 'score', label: 'Score', color: theme.palette.secondary.main }]}
                                                layout="horizontal"
                                                height={280}
                                                margin={{ left: 100, right: 10, top: 10, bottom: 30 }}
                                                borderRadius={8}
                                                slotProps={{ legend: { hidden: true } as any }}
                                            />
                                        ) : (
                                            <Typography color="text.secondary">No performance scores available</Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}

                {/* Role Distribution - at end of page */}
                <Grid size={{ xs: 12 }}>
                    <Card sx={{ height: 380, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Role Distribution</Typography>
                            <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {formattedRoleData.length > 0 ? (
                                    <PieChart
                                        series={[{
                                            data: formattedRoleData,
                                            highlightScope: { fade: 'global', highlight: 'item' },
                                            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                            innerRadius: 30,
                                            paddingAngle: 2,
                                            cornerRadius: 4,
                                        }]}
                                        height={280}
                                        slotProps={{ legend: { hidden: true } as any }}
                                        margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    />
                                ) : (
                                    <Typography color="text.secondary">No data available</Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
