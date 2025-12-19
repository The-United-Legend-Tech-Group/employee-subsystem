'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Alert,
  Container,
  Skeleton,
  Grid,
  useTheme,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { PieChart } from '@mui/x-charts/PieChart';
import { logout } from '../../../../../lib/auth-utils';

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
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

        const response = await fetch(`${apiUrl}/performance/dashboard/stats`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout('/employee/login');
            return;
          }
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

  const aggregatedStats = useMemo(() => {
    if (!stats || !stats.departmentStats) return { completed: 0, inProgress: 0, notStarted: 0 };
    return stats.departmentStats.reduce(
      (acc, curr) => ({
        completed: acc.completed + curr.completedAppraisals,
        inProgress: acc.inProgress + curr.inProgressAppraisals,
        notStarted: acc.notStarted + curr.notStartedAppraisals,
      }),
      { completed: 0, inProgress: 0, notStarted: 0 }
    );
  }, [stats]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <Skeleton width={300} />
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mb={4}>
          <Skeleton variant="rectangular" height={200} width="100%" />
        </Stack>
        <Skeleton variant="rectangular" height={400} />
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
        if (value == null) return '';
        return `${Number(value).toFixed(1)}%`;
      },
      renderCell: (params) => {
        const val = Number(params.value || 0);
        return (
          <Box sx={{ color: val >= 100 ? 'success.main' : val >= 50 ? 'warning.main' : 'error.main', fontWeight: 'bold' }}>
            {val.toFixed(1)}%
          </Box>
        )
      }
    },
  ];

  const rows = stats?.departmentStats.map((dept) => ({
    id: dept.departmentId,
    ...dept,
  })) || [];

  const pieData = [
    { id: 0, value: aggregatedStats.completed, label: 'Completed', color: theme.palette.success.main },
    { id: 1, value: aggregatedStats.inProgress, label: 'In Progress', color: theme.palette.info.main },
    { id: 2, value: aggregatedStats.notStarted, label: 'Not Started', color: theme.palette.grey[400] },
  ];

  return (
    <Container maxWidth="xl" sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
        Performance Dashboard
      </Typography>

      <Grid container spacing={3} mb={4}>
        {/* Left Side: Pie Chart */}
        <Grid size={{ xs: 12, md: 7, lg: 6 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" textAlign="center">
              Overall Completion Status
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
              {stats?.totalAppraisals === 0 ? (
                <Typography color="text.secondary">No appraisals to display</Typography>
              ) : (
                <PieChart
                  series={[
                    {
                      data: pieData,
                      highlightScope: { fade: 'global', highlight: 'item' },
                      faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                      innerRadius: 60,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={250}
                  slotProps={{
                    legend: {
                      position: { vertical: 'middle', horizontal: 'end' },
                    }
                  }}
                />
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right Side: Summary Cards */}
        <Grid size={{ xs: 12, md: 5, lg: 6 }}>
          <Stack spacing={3} height="100%">
            <Card sx={{ flex: 1, display: 'flex', alignItems: 'center', p: 2 }}>
              <CardContent sx={{ width: '100%' }}>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Overall Completion Rate
                </Typography>
                <Typography variant="h2" color="primary.main" fontWeight="bold">
                  {stats?.overallCompletionRate ? stats.overallCompletionRate.toFixed(1) : '0.0'}%
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, display: 'flex', alignItems: 'center', p: 2 }}>
              <CardContent sx={{ width: '100%' }}>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Total Appraisals
                </Typography>
                <Typography variant="h2" fontWeight="bold">
                  {stats?.totalAppraisals || 0}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mt: 2, mb: 2 }}>
        Department Breakdown
      </Typography>
      <Box sx={{ width: '100%', height: 400 }}>
        <Card variant="outlined">
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{ border: 'none' }}
          />
        </Card>
      </Box>
    </Container>
  );
}
