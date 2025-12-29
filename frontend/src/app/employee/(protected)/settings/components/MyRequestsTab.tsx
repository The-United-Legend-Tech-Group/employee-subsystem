'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface MyRequestsTabProps {
    employeeId: string | null;
}

export default function MyRequestsTab({ employeeId }: MyRequestsTabProps) {
    const [requests, setRequests] = React.useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = React.useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

    const fetchRequests = React.useCallback(async () => {
        if (!employeeId) return;
        setLoadingRequests(true);
        try {
            const res = await fetch(`${apiUrl}/employee/${employeeId}/correction-requests`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Failed to fetch requests', error);
        } finally {
            setLoadingRequests(false);
        }
    }, [employeeId, apiUrl]);

    React.useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const columns: GridColDef[] = [
        // { field: 'requestId', headerName: 'Request ID', width: 220 }, // Removed per previous request
        { field: 'requestDescription', headerName: 'Description', flex: 1, minWidth: 200 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => {
                let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
                switch (params.value) {
                    case 'APPROVED': color = 'success'; break;
                    case 'REJECTED': color = 'error'; break;
                    case 'PENDING': color = 'warning'; break;
                }
                return <Chip label={params.value} color={color} size="small" />;
            }
        },
        {
            field: 'createdAt',
            headerName: 'Submitted On',
            width: 180,
            valueFormatter: (params) => {
                if (!params) return 'N/A';
                return new Date(params).toLocaleDateString();
            }
        },
        { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 200 },
    ];

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>My Requests</Typography>
            <DataGrid
                rows={requests}
                columns={columns}
                getRowId={(row) => row.requestId || row._id}
                loading={loadingRequests}
                autoHeight
                initialState={{
                    pagination: { paginationModel: { pageSize: 5 } },
                    sorting: {
                        sortModel: [{ field: 'createdAt', sort: 'desc' }],
                    },
                }}
                pageSizeOptions={[5, 10]}
                disableRowSelectionOnClick
            />
        </Box>
    );
}
