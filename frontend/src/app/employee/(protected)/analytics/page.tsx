'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import DownloadIcon from '@mui/icons-material/Download';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';

import StatCard from '../../../../common/material-ui/dashboard/components/StatCard';

// --- Interfaces ---

interface ComplianceSummary {
    generatedAt: string;
    period: {
        month: number;
        year: number;
    };
    departmentId: string;
    summary: {
        totalOvertimeRecords: number;
        totalOvertimeHours: number;
        totalExceptionRecords: number;
        missedPunchCount: number;
        weeklyRestViolations: number;
        pendingCorrections: number;
    };
}

interface OvertimeRecord {
    attendanceId: string;
    employeeId: string;
    employeeName: string;
    department: string;
    date: string;
    overtimeHours: number;
    shiftStartTime: string;
    shiftEndTime: string;
    actualClockIn: string;
    actualClockOut: string;
    wasApproved: boolean;
    isHoliday: boolean;
    holidayType: string;
}

interface ExceptionRecord {
    id?: string;
    employeeId: string;
    employeeName: string;
    department: string;
    date: string;
    exceptionType: string;
    details: string;
    hasMissedPunch: boolean;
    totalWorkMinutes: number;
    expectedWorkMinutes: number;
    shiftName: string;
    isWeeklyRest: boolean;
    hasCorrectionRequest: boolean;
}

// --- Components ---

function CustomTabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function AnalyticsPage() {
    const [loadingSummary, setLoadingSummary] = React.useState(true);
    const [summary, setSummary] = React.useState<ComplianceSummary | null>(null);

    // Filters
    const [month, setMonth] = React.useState(new Date().getMonth() + 1);
    const [year, setYear] = React.useState(new Date().getFullYear());
    const [tabValue, setTabValue] = React.useState(0);

    // Report Data
    const [overtimeRecords, setOvertimeRecords] = React.useState<OvertimeRecord[]>([]);
    const [exceptionRecords, setExceptionRecords] = React.useState<ExceptionRecord[]>([]);
    const [loadingOvertime, setLoadingOvertime] = React.useState(false);
    const [loadingException, setLoadingException] = React.useState(false);
    const [hasLoadedOvertime, setHasLoadedOvertime] = React.useState(false);
    const [hasLoadedException, setHasLoadedException] = React.useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

    // Track mounted state
    const isMounted = React.useRef(true);
    React.useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchSummary = React.useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        setLoadingSummary(true);
        try {
            const res = await fetch(`${apiUrl}/analytics/compliance-summary?month=${month}&year=${year}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (isMounted.current) {
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted.current) setSummary(data);
                } else {
                    console.error('Failed to fetch summary');
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoadingSummary(false);
        }
    }, [month, year, apiUrl]);

    const fetchOvertimeReport = React.useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        setLoadingOvertime(true);
        try {
            const otRes = await fetch(`${apiUrl}/analytics/overtime-report?month=${month}&year=${year}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (isMounted.current) {
                if (otRes.ok) {
                    const otData = await otRes.json();
                    const records = otData.records || [];
                    const recordsWithIds = records.map((record: OvertimeRecord, index: number) => ({
                        ...record,
                        id: record.attendanceId || `${record.employeeId}-${record.date}-${index}`
                    }));
                    if (isMounted.current) {
                        setOvertimeRecords(recordsWithIds);
                        setHasLoadedOvertime(true);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoadingOvertime(false);
        }
    }, [month, year, apiUrl]);

    const fetchExceptionReport = React.useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        setLoadingException(true);
        try {
            const exRes = await fetch(`${apiUrl}/analytics/exception-report?month=${month}&year=${year}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (isMounted.current) {
                if (exRes.ok) {
                    const exData = await exRes.json();
                    const records = exData.records || [];
                    const recordsWithIds = records.map((record: ExceptionRecord, index: number) => ({
                        ...record,
                        id: `${record.employeeId}-${record.date}-${record.exceptionType}-${index}`
                    }));
                    if (isMounted.current) {
                        setExceptionRecords(recordsWithIds);
                        setHasLoadedException(true);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setLoadingException(false);
        }
    }, [month, year, apiUrl]);

    // Cleanup and reset loaded flags when month/year changes
    React.useEffect(() => {
        setHasLoadedOvertime(false);
        setHasLoadedException(false);
        setOvertimeRecords([]);
        setExceptionRecords([]);
    }, [month, year]);

    // Fetch summary on mount and when filters change
    React.useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // Lazy load reports when tabs are accessed
    React.useEffect(() => {
        if (tabValue === 0 && !hasLoadedOvertime && !loadingOvertime) {
            fetchOvertimeReport();
        } else if (tabValue === 1 && !hasLoadedException && !loadingException) {
            fetchExceptionReport();
        }
    }, [tabValue, hasLoadedOvertime, hasLoadedException, loadingOvertime, loadingException, fetchOvertimeReport, fetchExceptionReport]);

    const getOvertimeRowId = React.useCallback((row: OvertimeRecord) => row.attendanceId, []);

    const handleDownload = async (type: 'overtime' | 'exception', format: 'CSV' | 'EXCEL') => {
        const token = localStorage.getItem('access_token');
        const endpoint = type === 'overtime' ? 'overtime-report' : 'exception-report';
        const url = `${apiUrl}/analytics/${endpoint}?month=${month}&year=${year}&format=${format}`;

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${type}_report_${month}_${year}.${format.toLowerCase() === 'excel' ? 'xlsx' : 'csv'}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Columns for DataGrids
    const overtimeColumns: GridColDef[] = React.useMemo(() => [
        { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
        { field: 'department', headerName: 'Department', flex: 1, minWidth: 150 },
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (params) => new Date(params as string).toLocaleDateString()
        },
        {
            field: 'overtimeHours',
            headerName: 'OT Hours',
            width: 100,
            type: 'number',
            valueFormatter: (params) => (params as number)?.toFixed(2)
        },
        {
            field: 'actualClockIn',
            headerName: 'Clock In',
            width: 100,
            valueFormatter: (params) => params ? new Date(params as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
        },
        {
            field: 'actualClockOut',
            headerName: 'Clock Out',
            width: 100,
            valueFormatter: (params) => params ? new Date(params as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
        },
        {
            field: 'isHoliday',
            headerName: 'Holiday',
            width: 100,
            type: 'boolean'
        },
    ], []);

    const exceptionColumns: GridColDef[] = React.useMemo(() => [
        { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
        { field: 'department', headerName: 'Department', flex: 1, minWidth: 150 },
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (params) => new Date(params as string).toLocaleDateString()
        },
        {
            field: 'exceptionType',
            headerName: 'Type',
            width: 150,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={params.value === 'MISSED_PUNCH' ? 'warning' : 'error'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        { field: 'details', headerName: 'Details', flex: 1.5, minWidth: 200 },
        {
            field: 'hasCorrectionRequest',
            headerName: 'Correction Pending',
            width: 150,
            type: 'boolean'
        },
    ], []);

    const mockTrendData = React.useMemo(() => [0, 0, 0, 0, 0, 0, 0], []);

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography component="h2" variant="h5" fontWeight="bold">
                    Analytics Dashboard
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        select
                        label="Month"
                        size="small"
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        sx={{ width: 120 }}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <MenuItem key={m} value={m}>
                                {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Year"
                        size="small"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        sx={{ width: 100 }}
                    >
                        {[2024, 2025, 2026].map((y) => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </TextField>
                </Stack>
            </Box>

            {/* Summary Cards */}
            {loadingSummary ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : summary ? (
                <Grid container spacing={2} columns={12} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <StatCard
                            title="Total Overtime Hours"
                            value={summary.summary.totalOvertimeHours.toFixed(1)}
                            interval={`${new Date(0, month - 1).toLocaleString('default', { month: 'short' })} ${year}`}
                            trend="neutral"
                            data={mockTrendData}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <StatCard
                            title="Overtime Records"
                            value={summary.summary.totalOvertimeRecords.toString()}
                            interval="Count"
                            trend="neutral"
                            data={mockTrendData}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <StatCard
                            title="Exceptions"
                            value={summary.summary.totalExceptionRecords.toString()}
                            interval="Count"
                            trend="neutral"
                            data={mockTrendData}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <StatCard
                            title="Pending Corrections"
                            value={summary.summary.pendingCorrections.toString()}
                            interval="Action Items"
                            trend="neutral"
                            data={mockTrendData}
                        />
                    </Grid>
                </Grid>
            ) : (
                <Alert severity="info" sx={{ mb: 4 }}>No summary data available for this period.</Alert>
            )}

            {/* Detailed Reports */}
            <Card variant="outlined">
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics reports tabs">
                        <Tab label="Overtime Report" />
                        <Tab label="Exception Report" />
                    </Tabs>

                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            size="small"
                            onClick={() => handleDownload(tabValue === 0 ? 'overtime' : 'exception', 'CSV')}
                        >
                            Export CSV
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            size="small"
                            onClick={() => handleDownload(tabValue === 0 ? 'overtime' : 'exception', 'EXCEL')}
                        >
                            Export Excel
                        </Button>
                    </Stack>
                </Box>

                <CustomTabPanel value={tabValue} index={0}>
                    <Box sx={{ height: 500, width: '100%', px: 2 }}>
                        <DataGrid
                            rows={overtimeRecords}
                            columns={overtimeColumns}
                            getRowId={getOvertimeRowId}
                            loading={loadingOvertime}
                            slots={{ toolbar: GridToolbar }}
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                },
                            }}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </CustomTabPanel>

                <CustomTabPanel value={tabValue} index={1}>
                    <Box sx={{ height: 500, width: '100%', px: 2 }}>
                        <DataGrid
                            rows={exceptionRecords}
                            columns={exceptionColumns}
                            loading={loadingException}
                            slots={{ toolbar: GridToolbar }}
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                },
                            }}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </CustomTabPanel>
            </Card>
        </Box>
    );
}
