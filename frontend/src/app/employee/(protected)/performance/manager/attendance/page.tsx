"use client";

import React, { useState, useEffect } from 'react';
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
    IconButton
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { AppraisalAssignment } from '@/types/performance';
import { decryptData } from '@/common/utils/encryption';

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

export default function TeamAttendancePage() {
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    // Attendance dialog state
    const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                throw new Error('Authentication details missing');
            }

            const managerId = await decryptData(encryptedEmployeeId, token);
            if (!managerId) {
                throw new Error('Failed to decrypt manager ID');
            }

            const response = await fetch(`${API_URL}/performance/assignments?managerId=${managerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
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

    const handleViewAttendance = async (employeeId: string, employeeName: string) => {
        setSelectedEmployee({ id: employeeId, name: employeeName });
        setAttendanceDialogOpen(true);
        setAttendanceLoading(true);
        setAttendanceError(null);
        setAttendanceData([]);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Authentication token missing');
            }

            // Fetch last 30 days of attendance records
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const response = await fetch(
                `${API_URL}/time/attendance/records/${employeeId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=50`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
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

    interface Row {
        id: string;
        employeeName: string;
        employeeProfileId: string | { _id?: string; id?: string; firstName?: string; lastName?: string };
    }

    const columns: GridColDef<Row>[] = [
        {
            field: 'employeeName',
            headerName: 'Employee',
            flex: 1,
            minWidth: 200
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Row>) => {
                // Get the employee profile ID - it can be an object or a string
                const employeeProfileId = typeof params.row.employeeProfileId === 'object'
                    ? (params.row.employeeProfileId as any)._id || (params.row.employeeProfileId as any).id
                    : params.row.employeeProfileId;

                return (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewAttendance(employeeProfileId, params.row.employeeName)}
                    >
                        View Attendance
                    </Button>
                );
            }
        }
    ];

    // Get unique employees from assignments
    const rows: Row[] = assignments
        .map(assignment => ({
            id: assignment._id,
            employeeName: typeof assignment.employeeProfileId === 'object'
                ? `${assignment.employeeProfileId.firstName} ${assignment.employeeProfileId.lastName}`
                : String(assignment.employeeProfileId),
            employeeProfileId: assignment.employeeProfileId,
        }))
        .filter((row, index, self) =>
            index === self.findIndex(r => r.employeeName === row.employeeName)
        )
        .filter(row =>
            row.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <IconButton onClick={() => router.push('/employee/performance/manager')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4">
                    Team Attendance
                </Typography>
            </Box>

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
                                paginationModel: { page: 0, pageSize: 10 },
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
        </Container>
    );
}
