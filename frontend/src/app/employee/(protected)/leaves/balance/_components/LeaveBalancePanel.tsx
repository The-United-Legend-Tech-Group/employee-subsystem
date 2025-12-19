'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Stack,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type LeaveBalance = {
  leaveTypeId: string | {
    _id: string;
    name?: string;
    code?: string;
  };
  yearlyEntitlement: number;
  accruedActual: number;
  accruedRounded: number;
  carryForward: number;
  taken: number;
  pending: number;
  remaining: number;
  balance: number;
};

export default function LeaveBalancePanel() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalances = useCallback(async () => {
    if (!API_BASE) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves-report/my-balances`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to load balances' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      setBalances(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load leave balances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const getLeaveTypeName = (leaveTypeId: string | any): string => {
    if (typeof leaveTypeId === 'object' && leaveTypeId) {
      return `${leaveTypeId.code || ''} ${leaveTypeId.name || ''}`.trim() || 'Unknown';
    }
    return typeof leaveTypeId === 'string' ? `Type: ${leaveTypeId.slice(-8)}` : 'Unknown';
  };

  const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalTaken = balances.reduce((sum, b) => sum + b.taken, 0);
  const totalPending = balances.reduce((sum, b) => sum + b.pending, 0);

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Balance
              </Typography>
              <Typography variant="h4" fontWeight={600} >
                {totalBalance.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                days available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Taken
              </Typography>
              <Typography variant="h4" fontWeight={600} >
                {totalTaken.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                days used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pending Requests
              </Typography>
              <Typography variant="h4" fontWeight={600} >
                {totalPending.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                days pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Leave Balances by Type
          </Typography>
          <IconButton onClick={loadBalances} disabled={loading} size="small">
            <RefreshIcon />
          </IconButton>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Leave Type</TableCell>
                  <TableCell align="right">Yearly Entitlement</TableCell>
                  <TableCell align="right">Accrued</TableCell>
                  <TableCell align="right">Carry Forward</TableCell>
                  <TableCell align="right">Taken</TableCell>
                  <TableCell align="right">Pending</TableCell>
                  <TableCell align="right">Remaining</TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight={600}>
                      Balance
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {balances.map((balance, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {getLeaveTypeName(balance.leaveTypeId)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{balance.yearlyEntitlement.toFixed(1)}</TableCell>
                    <TableCell align="right">{balance.accruedRounded.toFixed(1)}</TableCell>
                    <TableCell align="right">{balance.carryForward.toFixed(1)}</TableCell>
                    <TableCell align="right">
                      <Typography color="error">{balance.taken.toFixed(1)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="warning.main">{balance.pending.toFixed(1)}</Typography>
                    </TableCell>
                    <TableCell align="right">{balance.remaining.toFixed(1)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={balance.balance.toFixed(1)}
                        color={balance.balance > 0 ? 'success' : balance.balance < 0 ? 'error' : 'default'}
                        size="small"
                        icon={balance.balance > 0 ? <CheckCircleIcon /> : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {balances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No leave balances found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  );
}

