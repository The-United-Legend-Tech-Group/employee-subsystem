"use client";

import React, { useState, useEffect, Suspense } from 'react';
import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Snackbar
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppraisalAssignment, AppraisalAssignmentStatus } from '@/types/performance';
import { getEmployeeIdFromCookie, logout } from '@/lib/auth-utils';

// Attendance record type based on the backend model
interface AttendanceRecord {
    _id: string;
    employeeId: string;
    date: string;
    punches: Array<{ type: string; time: string }>;
    totalWorkMinutes: number;
    hasMissedPunch: boolean;
    finalisedForPayroll: boolean;
}

interface AttendanceResponse {
    data: AttendanceRecord[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

function ManagerAssignmentsContent() {
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Snackbar state for operations
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');


    // Attendance dialog state
    const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);

    useEffect(() => {
        fetchAssignments();

        // Check for success/error params in URL
        const success = searchParams.get('success');
        const errorParam = searchParams.get('error');

        if (success === 'true') {
            setSnackbarMessage('Appraisal submitted successfully');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            // Optional: Clean up URL
            router.replace('/employee/performance/manager');
        } else if (errorParam) {
            setSnackbarMessage(decodeURIComponent(errorParam));
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    }, [searchParams]);

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };


    const fetchAssignments = async () => {
        setLoading(true);
        setError(null);
        try {
            const managerId = getEmployeeIdFromCookie();

            if (!managerId) {
                logout('/employee/login');
                return;
            }

            const response = await fetch(`${API_URL}/performance/assignments?managerId=${managerId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout('/employee/login');
                    return;
                }
                throw new Error('Failed to fetch assignments');
            }
            const data = await response.json();
            setAssignments(data);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleStartAppraisal = (assignmentId: string) => {
        router.push(`/employee/performance/appraisal/${assignmentId}`);
    };

    const handleViewAttendance = async (employeeId: string, employeeName: string) => {
        setSelectedEmployee({ id: employeeId, name: employeeName });
        setAttendanceDialogOpen(true);
        setAttendanceLoading(true);
        setAttendanceError(null);
        setAttendanceData([]);

        try {
            // Fetch last 30 days of attendance records
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const response = await fetch(
                `${API_URL}/time/attendance/records/${employeeId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=50`,
                {
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    logout('/employee/login');
                    return;
                }
                throw new Error('Failed to fetch attendance records');
            }

            const data: AttendanceResponse = await response.json();
            setAttendanceData(data.data || []);
        } catch (err: any) {
            setAttendanceError(err.message || 'Failed to load attendance data');
        } finally {
            setAttendanceLoading(false);
        }
    };

    const handleCloseAttendanceDialog = () => {
        setAttendanceDialogOpen(false);
        setSelectedEmployee(null);
        setAttendanceData([]);
        setAttendanceError(null);
    };

    // Calculate attendance summary stats
    const calculateAttendanceSummary = () => {
        const totalDays = attendanceData.length;
        const totalMinutes = attendanceData.reduce((sum, record) => sum + (record.totalWorkMinutes || 0), 0);
        const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
        const avgHoursPerDay = totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0;
        const missedPunchDays = attendanceData.filter(r => r.hasMissedPunch).length;
        return { totalDays, totalHours, avgHoursPerDay, missedPunchDays };
    };

    interface Row extends AppraisalAssignment {
        id: string;
        employeeName: string;
    }

    const columns: GridColDef<Row>[] = [
        {
            field: 'employeeName',
            headerName: 'Employee',
            flex: 1,
            minWidth: 200
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
            renderCell: (params: GridRenderCellParams<Row, string>) => {
                let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
                switch (params.value) {
                    case AppraisalAssignmentStatus.PUBLISHED:
                    case AppraisalAssignmentStatus.ACKNOWLEDGED:
                        color = 'success';
                        break;
                    case AppraisalAssignmentStatus.SUBMITTED:
                        color = 'warning';
                        break;
                    case AppraisalAssignmentStatus.IN_PROGRESS:
                        color = 'primary';
                        break;
                    case AppraisalAssignmentStatus.NOT_STARTED:
                    default:
                        color = 'default';
                        break;
                }
                return (
                    <Chip
                        label={params.value?.replace(/_/g, ' ')}
                        color={color}
                        size="small"
                    />
                );
            }
        },
        {
            field: 'assignedAt',
            headerName: 'Assigned At',
            width: 150,
            valueFormatter: (value: any) => value ? new Date(value).toLocaleDateString() : 'N/A'
        },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 150,
            valueGetter: (value: any, row: Row) => row.dueDate ? new Date(row.dueDate) : null,
            valueFormatter: (value: any) => value ? value.toLocaleDateString() : 'N/A'
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 260,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Row>) => {
                // Get the employee profile ID - it can be an object or a string
                const employeeProfileId = typeof params.row.employeeProfileId === 'object'
                    ? (params.row.employeeProfileId as any)._id || (params.row.employeeProfileId as any).id
                    : params.row.employeeProfileId;

                return (
                    <Stack direction="row" spacing={0.5}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleStartAppraisal(params.row.id)}
                        >
                            {params.row.status === AppraisalAssignmentStatus.NOT_STARTED ? 'Start' : 'Edit'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewAttendance(employeeProfileId, params.row.employeeName)}
                        >
                            Attendance
                        </Button>
                    </Stack>
                );
            }
        }
    ];

    const rows: Row[] = assignments
        .map(assignment => ({
            ...assignment,
            id: assignment._id,
            employeeName: typeof assignment.employeeProfileId === 'object'
                ? `${assignment.employeeProfileId.firstName} ${assignment.employeeProfileId.lastName}`
                : String(assignment.employeeProfileId),
        }))
        .filter(row =>
            row.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Manager Appraisal Dashboard
            </Typography>

            {loading && (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!loading && !error && (
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TextField
                            placeholder="Search employee..."
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 300 }}
                        />
                    </Box>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 5 },
                            },
                        }}
                        pageSizeOptions={[5, 10, 25]}
                        autoHeight
                        disableRowSelectionOnClick
                    />
                </Paper>
            )}

            {/* Attendance Dialog */}
            <Dialog
                open={attendanceDialogOpen}
                onClose={handleCloseAttendanceDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Attendance Records - {selectedEmployee?.name}
                </DialogTitle>
                <DialogContent>
                    {attendanceLoading && (
                        <Box display="flex" justifyContent="center" py={4}>
                            <CircularProgress />
                        </Box>
                    )}

                    {attendanceError && (
                        <Alert severity="error" sx={{ mb: 2 }}>{attendanceError}</Alert>
                    )}

                    {!attendanceLoading && !attendanceError && (
                        <>
                            {/* Summary Stats */}
                            {attendanceData.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Summary (Last 30 Days)
                                    </Typography>
                                    <Stack direction="row" spacing={3} flexWrap="wrap">
                                        <Chip
                                            label={`Days Present: ${calculateAttendanceSummary().totalDays}`}
                                            color="primary"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`Total Hours: ${calculateAttendanceSummary().totalHours}h`}
                                            color="success"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`Avg Hours/Day: ${calculateAttendanceSummary().avgHoursPerDay}h`}
                                            color="info"
                                            variant="outlined"
                                        />
                                        {calculateAttendanceSummary().missedPunchDays > 0 && (
                                            <Chip
                                                label={`Missed Punch Days: ${calculateAttendanceSummary().missedPunchDays}`}
                                                color="warning"
                                                variant="outlined"
                                            />
                                        )}
                                    </Stack>
                                </Box>
                            )}

                            {/* Attendance Records Table */}
                            {attendanceData.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={4}>
                                    No attendance records found for the last 30 days.
                                </Typography>
                            ) : (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Date</strong></TableCell>
                                                <TableCell><strong>Check-In</strong></TableCell>
                                                <TableCell><strong>Check-Out</strong></TableCell>
                                                <TableCell><strong>Work Hours</strong></TableCell>
                                                <TableCell><strong>Status</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {attendanceData.map((record) => {
                                                const inPunch = record.punches?.find(p => p.type === 'IN');
                                                const outPunch = record.punches?.find(p => p.type === 'OUT');
                                                const workHours = Math.round((record.totalWorkMinutes / 60) * 100) / 100;

                                                return (
                                                    <TableRow key={record._id}>
                                                        <TableCell>
                                                            {new Date(record.date).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            {inPunch ? new Date(inPunch.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {outPunch ? new Date(outPunch.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        </TableCell>
                                                        <TableCell>{workHours}h</TableCell>
                                                        <TableCell>
                                                            {record.hasMissedPunch ? (
                                                                <Chip label="Missed Punch" color="warning" size="small" />
                                                            ) : (
                                                                <Chip label="Complete" color="success" size="small" />
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAttendanceDialog}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container >
    );
}

// Wrap the page with Suspense to handle useSearchParams during static generation
export default function ManagerAssignmentsPage() {
    return (
        <Suspense fallback={
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        }>
            <ManagerAssignmentsContent />
        </Suspense>
    );
}
