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
    InputAdornment
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/navigation';
import { AppraisalAssignment, AppraisalAssignmentStatus } from '@/types/performance';
import { decryptData } from '@/common/utils/encryption';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function ManagerAssignmentsPage() {
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

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

    const handleStartAppraisal = (assignmentId: string) => {
        router.push(`/employee/performance/appraisal/${assignmentId}`);
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
            headerName: 'Action',
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Row>) => (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleStartAppraisal(params.row.id)}
                >
                    {params.row.status === AppraisalAssignmentStatus.NOT_STARTED ? 'Start' : 'Edit'}
                </Button>
            )
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
        </Container>
    );
}
