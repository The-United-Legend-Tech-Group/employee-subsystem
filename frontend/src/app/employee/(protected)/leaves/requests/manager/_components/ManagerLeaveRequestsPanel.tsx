'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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

export default function ManagerLeaveRequestsPanel() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Dialog states
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  
  // Form states
  const [rejectJustification, setRejectJustification] = useState('');
  const [processing, setProcessing] = useState(false);

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
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = React.useMemo(() => {
    if (activeTab === 'all') return requests;
    if (activeTab === 'pending') return requests.filter(r => r.status === 'pending');
    if (activeTab === 'approved') return requests.filter(r => r.status === 'approved');
    if (activeTab === 'rejected') return requests.filter(r => r.status === 'rejected');
    return requests;
  }, [requests, activeTab]);

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

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab value="all" label={`All (${requests.length})`} />
            <Tab value="pending" label={`Pending (${requests.filter(r => r.status === 'pending').length})`} />
            <Tab value="approved" label={`Approved (${requests.filter(r => r.status === 'approved').length})`} />
            <Tab value="rejected" label={`Rejected (${requests.filter(r => r.status === 'rejected').length})`} />
          </Tabs>
          
          <IconButton onClick={loadRequests} disabled={loading}>
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
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Justification</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request._id} hover>
                    <TableCell>
                      {(() => {
                        const emp = getEmployeeProfile(request.employeeId as any);
                        if (!emp) {
                          return typeof request.employeeId === 'string'
                            ? `Employee: ${request.employeeId.slice(-8)}`
                            : 'N/A';
                        }
                        return (
                          emp.employeeNumber ||
                          `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
                          emp.email ||
                          'N/A'
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {typeof request.leaveTypeId === 'object' && request.leaveTypeId
                        ? `${request.leaveTypeId.code || ''} ${request.leaveTypeId.name || ''}`.trim() || 'N/A'
                        : typeof request.leaveTypeId === 'string'
                        ? `Type: ${request.leaveTypeId.slice(-8)}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{formatDate(request.dates?.from)}</TableCell>
                    <TableCell>{formatDate(request.dates?.to)}</TableCell>
                    <TableCell>{request.durationDays || 0} days</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status || 'N/A'}
                        color={getStatusColor(request.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {request.justification || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setApproveDialog({ open: true, requestId: request._id })}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setRejectDialog({ open: true, requestId: request._id })}
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
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No leave requests found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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

