'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

import { getAccessToken } from '@/lib/auth-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type AccrualStatus = {
  lastProcessedDate: string | null;
  nextScheduledDate: string;
  totalEmployees: number;
  totalPolicies: number;
};

type AccrualResult = {
  processed?: number;
  successful?: number;
  failed?: number;
  details?: Array<{
    employeeId: string;
    leaveTypeId: string;
    accrualAmount: number;
    adjustedForUnpaidLeave: boolean;
    unpaidDays: number;
  }>;
  // Also handle array format from backend
  length?: number;
} | Array<{
  employeeId: string | any;
  leaveTypeId: string | any;
  baseAccrual: number;
  unpaidDays: number;
  adjustedAccrual: number;
}>;

type CarryForwardResult = {
  processed?: number;
  successful?: number;
  failed?: number;
  details?: Array<{
    employeeId: string;
    leaveTypeId: string;
    previousRemaining: number;
    carriedForward: number;
    expired: number;
    cappedAt: number;
  }>;
  // Also handle array format from backend
  length?: number;
} | Array<{
  employeeId: string | any;
  leaveTypeId: string | any;
  carriedForward: number;
}>;

export default function LeaveAutomationPanel() {
  const [status, setStatus] = useState<AccrualStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingAccrual, setProcessingAccrual] = useState(false);
  const [processingCarryForward, setProcessingCarryForward] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accrualResult, setAccrualResult] = useState<AccrualResult | null>(null);
  const [carryForwardResult, setCarryForwardResult] = useState<CarryForwardResult | null>(null);
  const [showAccrualDialog, setShowAccrualDialog] = useState(false);
  const [showCarryForwardDialog, setShowCarryForwardDialog] = useState(false);
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    if (!API_BASE) return;
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      // Ensure no double slashes in URL
      const baseUrl = API_BASE?.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      const url = `${baseUrl}/leaves-report/automation/status`;

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to load status (${res.status})`);
      }

      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load automation status');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAccrual = async () => {
    if (!API_BASE) return;
    setProcessingAccrual(true);
    setError(null);
    setSuccess(null);
    setAccrualResult(null);

    try {
      const token = getAccessToken();
      // Ensure no double slashes in URL
      const baseUrl = API_BASE?.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      const url = `${baseUrl}/leaves-report/automation/process-accrual`;

      console.log('Processing accrual - URL:', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to process accrual' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const data = await res.json();

      // Handle both array and object formats
      const result: AccrualResult = Array.isArray(data)
        ? {
          processed: data.length,
          successful: data.length,
          failed: 0,
          details: data.map((r: any) => ({
            employeeId: typeof r.employeeId === 'object' ? r.employeeId.toString() : r.employeeId,
            leaveTypeId: typeof r.leaveTypeId === 'object' ? r.leaveTypeId.toString() : r.leaveTypeId,
            accrualAmount: r.adjustedAccrual || 0,
            adjustedForUnpaidLeave: (r.unpaidDays || 0) > 0,
            unpaidDays: r.unpaidDays || 0,
          })),
        }
        : data;

      setAccrualResult(result);
      const successful = (result as any).successful ?? (Array.isArray(data) ? data.length : 0);
      const failed = (result as any).failed ?? 0;
      setSuccess(`Accrual processed successfully: ${successful} successful, ${failed} failed`);
      setShowAccrualDialog(false);
      setTargetDate('');
      loadStatus();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to process accrual');
    } finally {
      setProcessingAccrual(false);
    }
  };

  const handleProcessCarryForward = async () => {
    if (!API_BASE) return;
    setProcessingCarryForward(true);
    setError(null);
    setSuccess(null);
    setCarryForwardResult(null);

    try {
      const token = getAccessToken();
      // Ensure no double slashes in URL
      const baseUrl = API_BASE?.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      const url = `${baseUrl}/leaves-report/automation/process-carry-forward`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to process carry-forward' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const data = await res.json();

      // Handle both array and object formats
      const result: CarryForwardResult = Array.isArray(data)
        ? {
          processed: data.length,
          successful: data.length,
          failed: 0,
          details: data.map((r: any) => ({
            employeeId: typeof r.employeeId === 'object' ? r.employeeId.toString() : r.employeeId,
            leaveTypeId: typeof r.leaveTypeId === 'object' ? r.leaveTypeId.toString() : r.leaveTypeId,
            previousRemaining: 0,
            carriedForward: r.carriedForward || 0,
            expired: 0,
            cappedAt: r.carriedForward || 0,
          })),
        }
        : data;

      setCarryForwardResult(result);
      const successful = (result as any).successful ?? (Array.isArray(data) ? data.length : 0);
      const failed = (result as any).failed ?? 0;
      setSuccess(`Carry-forward processed successfully: ${successful} successful, ${failed} failed`);
      setShowCarryForwardDialog(false);
      setTargetDate('');
      loadStatus();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to process carry-forward');
    } finally {
      setProcessingCarryForward(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Stack spacing={3}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Status Card */}
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Automation Status
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadStatus}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : status ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Processed
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatDate(status.lastProcessedDate)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Next Scheduled
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatDate(status.nextScheduledDate)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {status.totalEmployees}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Policies
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {status.totalPolicies}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">No status available</Typography>
          )}
        </CardContent>
      </Card>

      {/* Action Cards */}
      <Grid container spacing={2}>
        {/* REQ-040: Automatic Accrual */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    REQ-040: Automatic Accrual
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatically add leave days to each employee's balance according to company policy.
                    Accrual is adjusted for unpaid leave and long absence periods.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => setShowAccrualDialog(true)}
                  disabled={processingAccrual}
                  fullWidth
                >
                  {processingAccrual ? 'Processing...' : 'Process Accrual'}
                </Button>
                {accrualResult && (
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={2}>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={`${(accrualResult as any).successful ?? 0} Successful`}
                        color="success"
                        size="small"
                      />
                      {((accrualResult as any).failed ?? 0) > 0 && (
                        <Chip
                          icon={<ErrorIcon />}
                          label={`${(accrualResult as any).failed ?? 0} Failed`}
                          color="error"
                          size="small"
                        />
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* REQ-041: Carry-Forward */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    REQ-041: Year-End Carry-Forward
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatically process carry-forward of unused leave days with caps and expiry rules.
                    Respects policy limits and expiration dates.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => setShowCarryForwardDialog(true)}
                  disabled={processingCarryForward}
                  fullWidth
                >
                  {processingCarryForward ? 'Processing...' : 'Process Carry-Forward'}
                </Button>
                {carryForwardResult && (
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={2}>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={`${(carryForwardResult as any).successful ?? 0} Successful`}
                        color="success"
                        size="small"
                      />
                      {((carryForwardResult as any).failed ?? 0) > 0 && (
                        <Chip
                          icon={<ErrorIcon />}
                          label={`${(carryForwardResult as any).failed ?? 0} Failed`}
                          color="error"
                          size="small"
                        />
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* REQ-042 Info Card */}
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <InfoIcon color="info" />
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                REQ-042: Accrual Suspension/Adjustment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accrual is automatically adjusted during unpaid leave or long absence periods.
                The system calculates working days and proportionally adjusts accrual amounts.
                This happens automatically during the accrual process (REQ-040).
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Results Tables */}
      {accrualResult && (accrualResult as any).details && (accrualResult as any).details.length > 0 && (
        <Paper>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Accrual Results
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Leave Type ID</TableCell>
                    <TableCell align="right">Accrual Amount</TableCell>
                    <TableCell align="center">Adjusted</TableCell>
                    <TableCell align="right">Unpaid Days</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(accrualResult as any).details.slice(0, 10).map((detail: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{detail.employeeId.slice(-8)}</TableCell>
                      <TableCell>{detail.leaveTypeId.slice(-8)}</TableCell>
                      <TableCell align="right">{detail.accrualAmount.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        {detail.adjustedForUnpaidLeave ? (
                          <Chip label="Yes" color="warning" size="small" />
                        ) : (
                          <Chip label="No" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">{detail.unpaidDays}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {(accrualResult as any).details.length > 10 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Showing first 10 of {(accrualResult as any).details.length} results
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      {carryForwardResult && (carryForwardResult as any).details && (carryForwardResult as any).details.length > 0 && (
        <Paper>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Carry-Forward Results
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Leave Type ID</TableCell>
                    <TableCell align="right">Previous Remaining</TableCell>
                    <TableCell align="right">Carried Forward</TableCell>
                    <TableCell align="right">Expired</TableCell>
                    <TableCell align="right">Capped At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(carryForwardResult as any).details.slice(0, 10).map((detail: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{detail.employeeId.slice(-8)}</TableCell>
                      <TableCell>{detail.leaveTypeId.slice(-8)}</TableCell>
                      <TableCell align="right">{detail.previousRemaining.toFixed(2)}</TableCell>
                      <TableCell align="right">{detail.carriedForward.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {detail.expired > 0 ? (
                          <Chip label={detail.expired.toFixed(2)} color="error" size="small" />
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell align="right">{detail.cappedAt.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {(carryForwardResult as any).details.length > 10 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Showing first 10 of {(carryForwardResult as any).details.length} results
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* Process Accrual Dialog */}
      <Dialog open={showAccrualDialog} onClose={() => setShowAccrualDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Automatic Accrual</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              This will process accrual for all employees based on their leave policies.
              Accrual will be adjusted for unpaid leave periods automatically.
            </Alert>
            <TextField
              label="Target Date (Optional)"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty to use today's date"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAccrualDialog(false)}>Cancel</Button>
          <Button
            onClick={handleProcessAccrual}
            variant="contained"
            disabled={processingAccrual}
            startIcon={processingAccrual ? <CircularProgress size={16} /> : <PlayArrowIcon />}
          >
            Process
          </Button>
        </DialogActions>
      </Dialog>

      {/* Process Carry-Forward Dialog */}
      <Dialog open={showCarryForwardDialog} onClose={() => setShowCarryForwardDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Year-End Carry-Forward</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              This will process carry-forward for all employees. Unused days will be carried forward
              according to policy caps and expiry rules. Days exceeding limits will be expired.
            </Alert>
            <TextField
              label="Target Date (Optional)"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty to use today's date"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCarryForwardDialog(false)}>Cancel</Button>
          <Button
            onClick={handleProcessCarryForward}
            variant="contained"
            disabled={processingCarryForward}
            startIcon={processingCarryForward ? <CircularProgress size={16} /> : <PlayArrowIcon />}
          >
            Process
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

