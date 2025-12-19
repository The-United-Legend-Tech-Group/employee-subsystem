'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Stack,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type ViewTab = 'requests' | 'balances' | 'analytics' | 'reports';

type LeaveRequest = {
  _id: string;
  employeeId?: string | {
    _id?: string;
    profile?: {
      _id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      employeeNumber?: string;
    };
    firstName?: string;
    lastName?: string;
    email?: string;
    employeeNumber?: string;
  };
  leaveTypeId?: string | {
    _id: string;
    name?: string;
    code?: string;
  };
  dates?: {
    from: string | Date;
    to: string | Date;
  };
  durationDays?: number;
  status?: LeaveStatus;
  justification?: string;
  attachmentId?: string;
  approvalFlow?: Array<{
    role: string;
    status: string;
    decidedBy: string;
    decidedAt: Date;
  }>;
  createdAt?: string | Date;
  irregularPatternFlag?: boolean;
};

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Helper function to extract employee profile from various data structures
function getEmployeeProfile(employee: any): any | null {
  if (!employee || typeof employee !== 'object') return null;
  if (employee.profile && typeof employee.profile === 'object') {
    return employee.profile;
  }
  return employee;
}

function getCurrentUserId() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.employeeId || payload.userId || null;
  } catch (err) {
    console.error('Failed to decode token:', err);
    return null;
  }
}

function formatDate(value: any): string {
  if (!value) return 'N/A';
  if (typeof value === 'object' && value.$date) {
    value = value.$date;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString();
}

// Robust formatter to display a leave type label from various possible shapes
function formatLeaveTypeLabel(raw: any): string {
  if (!raw) return 'N/A';
  // If the value is nested under leaveType or leaveTypeId, unwrap it
  const lt = typeof raw === 'object' ? (raw.leaveType || raw.leaveTypeId || raw) : raw;

  // If it's a plain string (likely an id), display a short form
  if (typeof lt === 'string') return lt.length > 12 ? lt.slice(-8) : lt;

  // Try common fields first
  const code = lt.code ?? lt.leaveTypeCode ?? lt.typeCode ?? lt.shortCode;
  const name = lt.name ?? lt.leaveTypeName ?? lt.typeName ?? lt.title ?? lt.label;

  if (name && code) return `${code} ${name}`.trim();
  if (name) return String(name);
  if (code) return String(code);

  // Fallback to _id when available
  if (lt._id) return String(lt._id);

  // Avoid rendering raw objects (e.g., showing __v). Return a safe default.
  return 'N/A';
}

type TeamBalanceEntry = {
  employeeId: any;
  employeeName: string;
  balances: any[];
  upcomingLeaves: {
    requestId: string;
    leaveType: any;
    startDate: string | Date;
    endDate: string | Date;
    durationDays: number;
    status: string;
  }[];
};

export default function ManagerLeaveRequestsPanel() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>('requests');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Dialog states
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  
  // Form states
  const [rejectJustification, setRejectJustification] = useState('');
  const [processing, setProcessing] = useState(false);

  // Team balances + upcoming leaves (REQ-034)
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [teamBalances, setTeamBalances] = useState<TeamBalanceEntry[]>([]);

  // Simple per-employee history view (analytics-lite)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [teamEmployees, setTeamEmployees] = useState<
    { id: string; label: string }[]
  >([]);
  const [teamEmployeesLoading, setTeamEmployeesLoading] = useState(false);

  // Reports (manager filter/sort by type/date/department/status)
  type ReportItem =
    | {
        type: 'REQUEST';
        id: string;
        employee: any;
        leaveType: any;
        startDate: string | Date;
        endDate: string | Date;
        durationDays: number;
        justification?: string;
        status: string;
      }
    | {
        type: 'ADJUSTMENT';
        id: string;
        employee: any;
        leaveType: any;
        adjustmentType: string;
        amount: number;
        reason?: string;
        hrUser?: any;
      };

  const [reportFilters, setReportFilters] = useState({
    leaveTypeId: '',
    status: '',
    from: '',
    to: '',
    sortBy: 'startDate',
    sortOrder: 'desc',
  });
  const [reportResults, setReportResults] = useState<ReportItem[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<Array<{ _id: string; code?: string; name?: string }>>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!API_BASE) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/leaves/my-team-requests`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to load requests' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewTab === 'requests') {
    loadRequests();
    }
  }, [loadRequests, viewTab]);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') return requests;
    if (activeTab === 'pending') return requests.filter(r => r.status === 'pending');
    if (activeTab === 'approved') return requests.filter(r => r.status === 'approved');
    if (activeTab === 'rejected') return requests.filter(r => r.status === 'rejected');
    return requests;
  }, [requests, activeTab]);

  const loadTeamBalances = useCallback(async () => {
    if (!API_BASE) return;
    setBalancesLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const managerId = getCurrentUserId();
      if (!managerId) throw new Error('Unable to identify manager');

      const res = await fetch(
        `${API_BASE}/leaves-report/manager/team-balances/${managerId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        },
      );

      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ message: 'Failed to load team balances' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      setTeamBalances(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load team balances');
    } finally {
      setBalancesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewTab === 'balances') {
      loadTeamBalances();
    }
  }, [viewTab, loadTeamBalances]);

  // Load team employees for history dropdown
  const loadTeamEmployees = useCallback(async () => {
    if (!API_BASE) return;
    setTeamEmployeesLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const managerId = getCurrentUserId();
      if (!managerId) throw new Error('Unable to identify manager');

      const params = new URLSearchParams();
      params.append('managerId', managerId);

      const res = await fetch(
        `${API_BASE}/employee/team/profiles?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        },
      );

      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ message: 'Failed to load team employees' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      const items: any[] = Array.isArray(data?.items)
        ? data.items
        : [];

      const options = items.map((emp: any) => {
        const id = String(emp._id);
        const label =
          emp.employeeNumber ||
          `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
          emp.workEmail ||
          id.slice(-8);
        return { id, label };
      });

      setTeamEmployees(options);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load team employees');
      setTeamEmployees([]);
    } finally {
      setTeamEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewTab === 'analytics') {
      loadTeamEmployees();
    }
  }, [viewTab, loadTeamEmployees]);

  // Load leave types for reports tab
  const loadLeaveTypes = useCallback(async () => {
    if (!API_BASE) return;
    setLeaveTypesLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      // Use team union leave types for managers
      const res = await fetch(`${API_BASE}/leaves/leave-types/for-team`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to load leave types (${res.status})`);
      const data = await res.json();
      setLeaveTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      // non-fatal; keep types empty
      setLeaveTypes([]);
    } finally {
      setLeaveTypesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewTab === 'reports') {
      loadLeaveTypes();
    }
  }, [viewTab, loadLeaveTypes]);

  const applyReportsFilter = useCallback(async () => {
    if (!API_BASE) return;
    setReportLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (reportFilters.leaveTypeId) params.append('leaveTypeId', reportFilters.leaveTypeId);
      if (reportFilters.status) params.append('status', reportFilters.status);
      if (reportFilters.from) params.append('from', reportFilters.from);
      if (reportFilters.to) params.append('to', reportFilters.to);
      if (reportFilters.sortBy) params.append('sortBy', reportFilters.sortBy);
      if (reportFilters.sortOrder) params.append('sortOrder', reportFilters.sortOrder);

      const res = await fetch(`${API_BASE}/leaves-report/manager/team-data?${params.toString()}` , {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to load team data' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }
      const data = await res.json();
      setReportResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load team data');
      setReportResults([]);
    } finally {
      setReportLoading(false);
    }
  }, [reportFilters]);

  const employeeHistory = useMemo(
    () => {
      if (!selectedEmployeeId) return [];
      return requests.filter((r) => {
        const raw = r.employeeId as any;
        let id = '';
        if (typeof raw === 'string') {
          id = raw;
        } else if (raw && typeof raw === 'object') {
          if (raw._id) {
            id = String(raw._id);
          } else if (raw.profile && raw.profile._id) {
            // When backend enriches employee as { profile: { _id, ... }, ... }
            id = String(raw.profile._id);
          }
        }
        return id === selectedEmployeeId;
      });
    },
    [requests, selectedEmployeeId],
  );

  const handleApprove = async () => {
    if (!approveDialog.requestId) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const managerId = getCurrentUserId();
      if (!managerId) throw new Error('Unable to identify manager');

      const res = await fetch(`${API_BASE}/leaves/${approveDialog.requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          decidedBy: managerId,
          role: 'department head', // Specify the role being used to approve
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to approve request' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setApproveDialog({ open: false, requestId: null });
      await loadRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to approve leave request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.requestId || !rejectJustification.trim()) {
      setError('Please provide a justification for rejection');
      return;
    }
    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const managerId = getCurrentUserId();
      if (!managerId) throw new Error('Unable to identify manager');

      const res = await fetch(`${API_BASE}/leaves/${rejectDialog.requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          decidedBy: managerId,
          justification: rejectJustification,
          role: 'department head', // Specify the role being used to reject
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to reject request' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setRejectDialog({ open: false, requestId: null });
      setRejectJustification('');
      await loadRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reject leave request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const handleToggleIrregular = async (request: LeaveRequest) => {
    if (!API_BASE) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const nextFlag = !request.irregularPatternFlag;
      const res = await fetch(
        `${API_BASE}/leaves-report/flag-irregular/${request._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ flag: nextFlag }),
        },
      );

      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ message: 'Failed to flag irregular pattern' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      await loadRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to flag irregular pattern');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Tabs
            value={viewTab}
            onChange={(_, v) => setViewTab(v)}
          >
            <Tab value="requests" label="Requests" />
            <Tab value="balances" label="Team Balances" />
            <Tab value="analytics" label="Employee History" />
            <Tab value="reports" label="Reports" />
          </Tabs>
          
          {viewTab === 'requests' && (
          <IconButton onClick={loadRequests} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          )}
          {viewTab === 'balances' && (
            <IconButton onClick={loadTeamBalances} disabled={balancesLoading}>
              <RefreshIcon />
            </IconButton>
          )}
        </Stack>

        {viewTab === 'requests' && (
          <>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
              >
                <Tab
                  value="all"
                  label={`All (${requests.length})`}
                />
                <Tab
                  value="pending"
                  label={`Pending (${
                    requests.filter((r) => r.status === 'pending').length
                  })`}
                />
                <Tab
                  value="approved"
                  label={`Approved (${
                    requests.filter((r) => r.status === 'approved').length
                  })`}
                />
                <Tab
                  value="rejected"
                  label={`Rejected (${
                    requests.filter((r) => r.status === 'rejected').length
                  })`}
                />
              </Tabs>
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
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Justification</TableCell>
                      <TableCell>Irregular</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request._id} hover>
                    <TableCell>
                          {(() => {
                            const emp = getEmployeeProfile(
                              request.employeeId as any,
                            );
                            if (!emp) {
                              return typeof request.employeeId === 'string'
                        ? `Employee: ${request.employeeId.slice(-8)}`
                                : 'N/A';
                            }
                            return (
                              emp.employeeNumber ||
                              `${emp.firstName || ''} ${
                                emp.lastName || ''
                              }`.trim() ||
                              emp.email ||
                              'N/A'
                            );
                          })()}
                    </TableCell>
                    <TableCell>
                          {typeof request.leaveTypeId === 'object' &&
                          request.leaveTypeId
                            ? `${request.leaveTypeId.code || ''} ${
                                request.leaveTypeId.name || ''
                              }`.trim() || 'N/A'
                        : typeof request.leaveTypeId === 'string'
                        ? `Type: ${request.leaveTypeId.slice(-8)}`
                        : 'N/A'}
                    </TableCell>
                        <TableCell>
                          {formatDate(request.dates?.from)}
                        </TableCell>
                        <TableCell>
                          {formatDate(request.dates?.to)}
                        </TableCell>
                    <TableCell>{request.durationDays || 0} days</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status || 'N/A'}
                        color={getStatusColor(request.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 200 }}
                          >
                        {request.justification || 'N/A'}
                      </Typography>
                    </TableCell>
                        <TableCell>
                          <Tooltip
                            title={
                              request.irregularPatternFlag
                                ? 'Unflag irregular pattern'
                                : 'Flag irregular pattern'
                            }
                          >
                            <IconButton
                              size="small"
                              color={
                                request.irregularPatternFlag
                                  ? 'warning'
                                  : 'default'
                              }
                              onClick={() => handleToggleIrregular(request)}
                              disabled={processing}
                            >
                              <WarningIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                                  onClick={() =>
                                    setApproveDialog({
                                      open: true,
                                      requestId: request._id,
                                    })
                                  }
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                                  onClick={() =>
                                    setRejectDialog({
                                      open: true,
                                      requestId: request._id,
                                    })
                                  }
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRequests.length === 0 && (
                  <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No leave requests found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {viewTab === 'balances' && (
          <>
            {balancesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Balances</TableCell>
                      <TableCell>Upcoming Leaves</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamBalances.map((row) => (
                      <TableRow key={row.employeeId}>
                        <TableCell>{row.employeeName || 'N/A'}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.balances && row.balances.length > 0 ? (
                              row.balances.map((b, idx) => (
                                <Typography
                                  key={idx}
                                  variant="body2"
                                >
                                  {`Type: ${
                                    (b.leaveTypeId as any)?.code ||
                                    (b.leaveTypeId as any)?.name ||
                                    (b.leaveTypeId as any)?._id ||
                                    ''
                                  } — Remaining: ${b.remaining ?? ''}`}
                                </Typography>
                              ))
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No balances
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            {row.upcomingLeaves &&
                            row.upcomingLeaves.length > 0 ? (
                              row.upcomingLeaves.map((u) => (
                                <Typography
                                  key={u.requestId}
                                  variant="body2"
                                >
                                  {`${formatDate(u.startDate)} → ${formatDate(
                                    u.endDate,
                                  )} (${u.durationDays} days, ${
                                    u.status
                                  })`}
                                </Typography>
                              ))
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No upcoming leaves
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {teamBalances.length === 0 && !balancesLoading && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No team balances found
                          </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
            )}
          </>
        )}

        {viewTab === 'analytics' && (
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ mb: 1 }}
              alignItems="center"
            >
              <TextField
                select
                label="Employee"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                size="small"
                sx={{ minWidth: 240 }}
                helperText={
                  teamEmployeesLoading
                    ? 'Loading team employees…'
                    : teamEmployees.length === 0
                    ? 'No team employees found'
                    : 'Select a team member'
                }
              >
                <MenuItem value="">
                  <em>Select employee</em>
                </MenuItem>
                {teamEmployees.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {selectedEmployeeId && employeeHistory.length === 0 && (
              <Typography color="text.secondary">
                No leave requests found for this employee.
              </Typography>
            )}

            {selectedEmployeeId && employeeHistory.length > 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Leave Type</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Justification</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employeeHistory.map((req) => (
                      <TableRow key={req._id}>
                        <TableCell>
                          {typeof req.leaveTypeId === 'object' &&
                          req.leaveTypeId
                            ? `${req.leaveTypeId.code || ''} ${
                                req.leaveTypeId.name || ''
                              }`.trim() || 'N/A'
                            : typeof req.leaveTypeId === 'string'
                            ? `Type: ${req.leaveTypeId.slice(-8)}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(req.dates?.from)}</TableCell>
                        <TableCell>{formatDate(req.dates?.to)}</TableCell>
                        <TableCell>
                          {req.durationDays ?? 0} days
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={req.status || 'N/A'}
                            color={getStatusColor(req.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 260 }}
                          >
                            {req.justification || 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {!selectedEmployeeId && (
              <Typography color="text.secondary">
                Select an employee to view all of their leave requests.
              </Typography>
            )}
          </Stack>
        )}

        {viewTab === 'reports' && (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                select
                size="small"
                label="Leave Type"
                value={reportFilters.leaveTypeId}
                onChange={(e) => setReportFilters((f) => ({ ...f, leaveTypeId: e.target.value }))}
                sx={{ minWidth: 220 }}
                helperText={leaveTypesLoading ? 'Loading types…' : 'Optional'}
              >
                <MenuItem value=""><em>Any</em></MenuItem>
                {leaveTypes.map((lt) => (
                  <MenuItem key={lt._id} value={lt._id}>
                    {`${lt.code || ''} ${lt.name || ''}`.trim() || lt._id}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Status"
                value={reportFilters.status}
                onChange={(e) => setReportFilters((f) => ({ ...f, status: e.target.value }))}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value=""><em>Any</em></MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </TextField>

              <TextField
                type="date"
                size="small"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={reportFilters.from}
                onChange={(e) => setReportFilters((f) => ({ ...f, from: e.target.value }))}
              />
              <TextField
                type="date"
                size="small"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={reportFilters.to}
                onChange={(e) => setReportFilters((f) => ({ ...f, to: e.target.value }))}
              />

              {/* Department filter removed per requirement */}
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                select
                size="small"
                label="Sort By"
                value={reportFilters.sortBy}
                onChange={(e) => setReportFilters((f) => ({ ...f, sortBy: e.target.value }))}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="startDate">Start Date</MenuItem>
                <MenuItem value="endDate">End Date</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="leaveType">Leave Type</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Order"
                value={reportFilters.sortOrder}
                onChange={(e) => setReportFilters((f) => ({ ...f, sortOrder: e.target.value }))}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </TextField>

              <Button
                variant="contained"
                onClick={applyReportsFilter}
                disabled={reportLoading}
              >
                {reportLoading ? <CircularProgress size={20} /> : 'Apply Filters'}
              </Button>
              <Button
                onClick={() => setReportFilters({ leaveTypeId: '', status: '', from: '', to: '', sortBy: 'startDate', sortOrder: 'desc' })}
                disabled={reportLoading}
              >
                Reset
              </Button>
            </Stack>

            {reportLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Employee</TableCell>
                      <TableCell>Leave Type</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Duration/Amount</TableCell>
                      <TableCell>Status/Adj Type</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportResults.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>
                          {(() => {
                            const emp = getEmployeeProfile((item as any).employee);
                            if (!emp) return typeof (item as any).employee === 'string' ? (item as any).employee.slice(-8) : 'N/A';
                            return (
                              emp.employeeNumber || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.workEmail || 'N/A'
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {formatLeaveTypeLabel((item as any).leaveType)}
                        </TableCell>
                        <TableCell>
                          {'startDate' in item ? formatDate(item.startDate) : '-'}
                        </TableCell>
                        <TableCell>
                          {'endDate' in item ? formatDate(item.endDate) : '-'}
                        </TableCell>
                        <TableCell>
                          {'durationDays' in item ? `${item.durationDays} days` : 'amount' in item ? String((item as any).amount) : '-'}
                        </TableCell>
                        <TableCell>
                          {'status' in item ? (
                            <Chip label={item.status} color={getStatusColor(item.status) as any} size="small" />
                          ) : (
                            (item as any).adjustmentType || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {'justification' in item ? (item as any).justification || '' : (item as any).reason || ''}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportResults.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No results</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        )}
      </Paper>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, requestId: null })}>
        <DialogTitle>Approve Leave Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to approve this leave request? The employee will be notified of the approval.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, requestId: null })}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, requestId: null })}>
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 400 }}>
            <TextField
              label="Justification for Rejection"
              value={rejectJustification}
              onChange={(e) => setRejectJustification(e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
              helperText="Please provide a reason for rejecting this leave request"
            />
            <Typography variant="body2" color="text.secondary">
              The employee will be notified of the rejection with your justification.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRejectDialog({ open: false, requestId: null });
            setRejectJustification('');
          }}>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error" disabled={processing || !rejectJustification.trim()}>
            {processing ? <CircularProgress size={20} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

