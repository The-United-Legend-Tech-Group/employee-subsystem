'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Alert,
  Container,
  Skeleton,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface DepartmentPerformanceStats {
  departmentId: string;
  departmentName: string;
  totalAppraisals: number;
  completedAppraisals: number;
  inProgressAppraisals: number;
  notStartedAppraisals: number;
  completionRate: number;
}

interface DashboardStats {
  departmentStats: DepartmentPerformanceStats[];
  totalAppraisals: number;
  overallCompletionRate: number;
}

export default function PerformanceDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
        console.log('Fetching stats from:', `${apiUrl}/performance/dashboard/stats`);
        // No Authorization header needed as the endpoint is public
        const response = await fetch(`${apiUrl}/performance/dashboard/stats`, {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <Skeleton width={300} />
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mb={4}>
          <Box flex={1}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  <Skeleton width="60%" />
                </Typography>
                <Typography variant="h3">
                  <Skeleton width="40%" />
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box flex={1}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  <Skeleton width="60%" />
                </Typography>
                <Typography variant="h3">
                  <Skeleton width="40%" />
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Stack>

        <Typography variant="h5" gutterBottom>
          <Skeleton width={200} />
        </Typography>
        <Box sx={{ height: 500, width: '100%' }}>
          <Stack spacing={1}>
            <Skeleton variant="rectangular" height={52} />
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={52} />
            ))}
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const columns: GridColDef[] = [
    { field: 'departmentName', headerName: 'Department', flex: 1, minWidth: 200 },
    { field: 'totalAppraisals', headerName: 'Total Appraisals', type: 'number', width: 150 },
    { field: 'completedAppraisals', headerName: 'Completed', type: 'number', width: 130 },
    { field: 'inProgressAppraisals', headerName: 'In Progress', type: 'number', width: 130 },
    { field: 'notStartedAppraisals', headerName: 'Not Started', type: 'number', width: 130 },
    {
      field: 'completionRate',
      headerName: 'Completion Rate',
      type: 'number',
      width: 150,
      valueFormatter: (value: any) => {
        if (value == null) {
          return '';
        }
        return `${Number(value).toFixed(1)}%`;
      },
    },
  ];

  const rows = stats?.departmentStats.map((dept) => ({
    id: dept.departmentId,
    ...dept,
  })) || [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Performance Dashboard
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mb={4}>
        <Box flex={1}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overall Completion Rate
              </Typography>
              <Typography variant="h3" color="primary">
                {stats?.overallCompletionRate ? stats.overallCompletionRate.toFixed(1) : '0.0'}%
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Appraisals
              </Typography>
              <Typography variant="h3">
                {stats?.totalAppraisals || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      <Typography variant="h5" gutterBottom>
        Department Breakdown
      </Typography>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </Box>
    </Container>
  );
}
