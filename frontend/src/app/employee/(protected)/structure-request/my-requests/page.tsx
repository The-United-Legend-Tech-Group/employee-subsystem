'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { decryptData } from '../../../../../common/utils/encryption';

interface StructureRequest {
    _id: string;
    requestNumber: string;
    requestType: string;
    status: string;
    details?: string;
    reason?: string;
    submittedAt?: string;
    createdAt?: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
    'NEW_DEPARTMENT': 'New Department',
    'UPDATE_DEPARTMENT': 'Update Department',
    'NEW_POSITION': 'New Position',
    'UPDATE_POSITION': 'Position Assignment Change',
    'CLOSE_POSITION': 'Close Position',
};

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    'DRAFT': 'default',
    'SUBMITTED': 'info',
    'APPROVED': 'success',
    'REJECTED': 'error',
    'CANCELLED': 'warning',
};

export default function MyRequestsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requests, setRequests] = useState<StructureRequest[]>([]);

    useEffect(() => {
        const fetchRequests = async () => {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                router.push('/employee/login');
                return;
            }

            try {
                const employeeId = await decryptData(encryptedEmployeeId, token);
                if (!employeeId) throw new Error('Decryption failed');

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
                const res = await fetch(`${apiUrl}/organization-structure/requests/user/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch requests');
                }

                const data = await res.json();
                setRequests(Array.isArray(data) ? data : []);
            } catch (err: any) {
                console.error('Failed to fetch requests:', err);
                setError(err.message || 'Failed to load requests');
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [router]);

    const columns: GridColDef[] = [
        {
            field: 'requestNumber',
            headerName: 'Request #',
            width: 180,
        },
        {
            field: 'requestType',
            headerName: 'Type',
            flex: 1,
            minWidth: 180,
            valueGetter: (value, row) => REQUEST_TYPE_LABELS[row.requestType] || row.requestType,
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            renderCell: (params: GridRenderCellParams<StructureRequest>) => (
                <Chip
                    label={params.row.status}
                    size="small"
                    color={STATUS_COLORS[params.row.status] || 'default'}
                    variant="filled"
                />
            ),
        },
        {
            field: 'details',
            headerName: 'Details',
            flex: 1.5,
            minWidth: 200,
        },
        {
            field: 'reason',
            headerName: 'Reason',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'submittedAt',
            headerName: 'Submitted',
            width: 180,
            valueGetter: (value, row) => {
                const date = row.submittedAt || row.createdAt;
                return date ? new Date(date).toLocaleString() : '-';
            },
        },
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Toggle Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                    value="my-requests"
                    exclusive
                    onChange={(e, newView) => {
                        if (newView === 'submit') {
                            router.push('/employee/structure-request');
                        }
                    }}
                    aria-label="request view mode"
                    sx={{
                        bgcolor: 'background.paper',
                        borderRadius: '24px',
                        boxShadow: theme.shadows[3],
                        p: 0.5,
                        gap: 0.5,
                        '& .MuiToggleButton-root': {
                            borderRadius: '20px',
                            border: 'none',
                            px: 2,
                            py: 0.5,
                            transition: 'all 0.2s',
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                boxShadow: theme.shadows[2],
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                }
                            },
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                            }
                        },
                    }}
                    size="small"
                >
                    <ToggleButton value="submit" aria-label="submit request">
                        <AddCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" fontWeight="bold">Submit Request</Typography>
                    </ToggleButton>
                    <ToggleButton value="my-requests" aria-label="my requests">
                        <ListAltIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" fontWeight="bold">My Requests</Typography>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                My Submitted Requests
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {requests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" color="text.secondary">
                        No requests submitted yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Submit a structure change request to see it here
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ height: 500, width: '100%' }}>
                    <DataGrid
                        rows={requests}
                        columns={columns}
                        getRowId={(row) => row._id}
                        disableRowSelectionOnClick
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 10 } },
                        }}
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3,
                            bgcolor: 'background.paper',
                            '& .MuiDataGrid-cell': {
                                alignContent: 'center',
                            },
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}
