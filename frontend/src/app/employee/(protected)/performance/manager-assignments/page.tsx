'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import { decryptData } from '@/common/utils/encryption';
import { AppraisalAssignment } from '../assignments/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function ManagerAssignmentsPage() {
    const router = useRouter();
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                setError('Authentication details missing');
                setLoading(false);
                return;
            }

            const managerId = await decryptData(encryptedEmployeeId, token);
            if (!managerId) {
                setError('Failed to decrypt manager ID');
                setLoading(false);
                return;
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
            console.error(err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (assignment: AppraisalAssignment) => {
        if (!assignment.latestAppraisalId) {
            alert('No appraisal record found to publish.');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/performance/records/${assignment.latestAppraisalId}/publish`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to publish appraisal');
            }

            // Refresh list
            loadAssignments();
            alert('Appraisal published successfully');
        } catch (error) {
            console.error(error);
            alert('Error publishing appraisal');
        }
    };

    const columns: GridColDef[] = [
        { 
            field: 'employeeProfileId', 
            headerName: 'Employee', 
            width: 200,
            valueGetter: (params: any) => {
                if (params && typeof params === 'object' && 'firstName' in params) {
                    return `${params.firstName} ${params.lastName}`;
                }
                return params; 
            }
        },
        { 
            field: 'status', 
            headerName: 'Status', 
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Chip 
                    label={params.value as string} 
                    color={
                        params.value === 'COMPLETED' ? 'success' : 
                        params.value === 'IN_PROGRESS' ? 'warning' : 'default'
                    } 
                    size="small" 
                />
            )
        },
        { 
            field: 'dueDate', 
            headerName: 'Due Date', 
            width: 150,
            valueGetter: (value: any, row: any) => {
                if (value) return value;
                if (row.cycleId && typeof row.cycleId === 'object') {
                    return row.cycleId.managerDueDate || row.cycleId.endDate;
                }
                return null;
            },
            valueFormatter: (value: any) => {
                if (!value) return '-';
                return new Date(value).toLocaleDateString();
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 250,
            renderCell: (params: GridRenderCellParams) => {
                const status = params.row.status;
                const isPublished = status === 'PUBLISHED' || status === 'ACKNOWLEDGED';
                const isSubmitted = status === 'SUBMITTED';

                return (
                    <Box display="flex" gap={1} sx={{ mt: 1 }}>
                        {!isPublished && (
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => router.push(`/employee/performance/appraisal/${params.row._id}`)}
                            >
                                Evaluate
                            </Button>
                        )}
                        {isSubmitted && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                onClick={() => handlePublish(params.row)}
                            >
                                Publish
                            </Button>
                        )}
                    </Box>
                );
            },
        },
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Assigned Appraisals
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <DataGrid
                    rows={assignments}
                    columns={columns}
                    getRowId={(row) => row._id}
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
        </Container>
    );
}
