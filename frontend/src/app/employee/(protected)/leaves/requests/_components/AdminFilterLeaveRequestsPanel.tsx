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
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  OutlinedInput,
} from '@mui/material';
import { Refresh as RefreshIcon, Settings as SettingsIcon } from '@mui/icons-material';

import { getAccessToken } from '@/lib/auth-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type LeaveType = {
  _id: string;
  code?: string;
  name?: string;
};

type LeaveRequest = {
  _id: string;
  employeeId?: string | {
    _id: string;
    employeeNumber?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      employeeNumber?: string;
    };
  };
  leaveTypeId?: string | {
    _id: string;
    code?: string;
    name?: string;
  };
  dates?: {
    from: string | Date;
    to: string | Date;
  };
  durationDays?: number;
  status?: string;
  justification?: string;
  approvalFlow?: Array<{
    role: string;
    status: string;
    decidedBy?: string;
    decidedAt?: Date;
  }>;
  createdAt?: string | Date;
};


function formatDate(value: any): string {
  if (!value) return 'N/A';
  if (typeof value === 'object' && value.$date) {
    value = value.$date;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString();
}

function getEmployeeName(employeeId: any): string {
  if (!employeeId) return 'N/A';
  if (typeof employeeId === 'string') return employeeId;
  if (employeeId.profile) {
    const firstName = employeeId.profile.firstName || '';
    const lastName = employeeId.profile.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    if (employeeId.profile.employeeNumber) return employeeId.profile.employeeNumber;
  }
  if (employeeId.firstName || employeeId.lastName) {
    return `${employeeId.firstName || ''} ${employeeId.lastName || ''}`.trim() || 'N/A';
  }
  if (employeeId.employeeNumber) return employeeId.employeeNumber;
  if (employeeId.email) return employeeId.email;
  return 'N/A';
}

function getLeaveTypeName(leaveTypeId: any): string {
  if (!leaveTypeId) return 'N/A';
  if (typeof leaveTypeId === 'string') return leaveTypeId;
  if (leaveTypeId.code && leaveTypeId.name) {
    return `${leaveTypeId.code} - ${leaveTypeId.name}`;
  }
  return leaveTypeId.code || leaveTypeId.name || 'N/A';
}

function getStatusColor(status?: string) {
  switch (status?.toLowerCase()) {
    case 'approved': return 'success';
    case 'rejected': return 'error';
    case 'pending': return 'warning';
    case 'cancelled': return 'default';
    default: return 'default';
  }
}

export default function AdminFilterLeaveRequestsPanel() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');

  // Approval flow dialog state
  const [approvalFlowDialog, setApprovalFlowDialog] = useState<{
    open: boolean;
    requestId: string | null;
    selectedRoles: string[];
  }>({
    open: false,
    requestId: null,
    selectedRoles: [],
  });
  const [savingApprovalFlow, setSavingApprovalFlow] = useState(false);

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveTypes = useCallback(async () => {
    if (!API_BASE) return;
    setLeaveTypesLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/leaves/leave-types`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLeaveTypes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load leave types:', err);
    } finally {
      setLeaveTypesLoading(false);
    }
  }, []);

  const loadLeaveRequests = useCallback(async () => {
    if (!API_BASE || !selectedLeaveTypeId) {
      setRequests([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getAccessToken();

      // Build query parameters - only leaveTypeId is required
      const params = new URLSearchParams();
      params.append('leaveTypeId', selectedLeaveTypeId);

      const res = await fetch(`${API_BASE}/leaves/admin/filter-by-type?${params.toString()}`, {
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
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [selectedLeaveTypeId]);

  // Auto-load when leave type is selected
  useEffect(() => {
    if (selectedLeaveTypeId) {
      loadLeaveRequests();
    } else {
      setRequests([]);
    }
  }, [selectedLeaveTypeId, loadLeaveRequests]);

  // System roles for approval flow selection
  const systemRoles = [
    'department employee',
    'department head',
    'HR Manager',
    'HR Employee',
    'Payroll Specialist',
    'System Admin',
    'Legal & Policy Admin',
    'Recruiter',
    'Finance Staff',
    'Job Candidate',
    'HR Admin',
    'Payroll Manager',
  ];

  const handleOpenApprovalFlowDialog = (requestId: string, currentApprovalFlow?: any[]) => {
    // Pre-populate with existing roles if any
    const existingRoles = currentApprovalFlow?.map((flow) => flow.role) || [];
    setApprovalFlowDialog({
      open: true,
      requestId,
      selectedRoles: existingRoles,
    });
  };

  const handleCloseApprovalFlowDialog = () => {
    setApprovalFlowDialog({
      open: false,
      requestId: null,
      selectedRoles: [],
    });
  };

  const handleSaveApprovalFlow = async () => {
    if (!approvalFlowDialog.requestId || approvalFlowDialog.selectedRoles.length === 0) {
      setError('Please select at least one role for approval flow');
      return;
    }

    setSavingApprovalFlow(true);
    setError(null);

    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE}/leaves/admin/${approvalFlowDialog.requestId}/set-approval-flow`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            roles: approvalFlowDialog.selectedRoles,
          }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to set approval flow' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      handleCloseApprovalFlowDialog();
      // Reload requests to show updated approval flow
      await loadLeaveRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to set approval flow');
    } finally {
      setSavingApprovalFlow(false);
    }
  };

  return (
    <Box>
      <Stack spacing={2}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={(theme) => ({
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: theme.palette.divider,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.paperChannel} / 0.9)`
              : theme.palette.background.paper,
          })}
        >
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Select Leave Type
          </Typography>

          <FormControl fullWidth size="small" required>
            <InputLabel>Leave Type</InputLabel>
            <Select
              value={selectedLeaveTypeId}
              onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
              label="Leave Type"
              disabled={leaveTypesLoading}
            >
              <MenuItem value="">
                <em>Select a leave type</em>
              </MenuItem>
              {leaveTypes.map((lt) => (
                <MenuItem key={lt._id} value={lt._id}>
                  {lt.code && lt.name ? `${lt.code} - ${lt.name}` : lt.code || lt.name || lt._id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {selectedLeaveTypeId && (
          <Paper
            elevation={0}
            sx={(theme) => ({
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.divider,
              backgroundColor: theme.vars
                ? `rgba(${theme.vars.palette.background.paperChannel} / 0.9)`
                : theme.palette.background.paper,
            })}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Leave Requests ({loading ? '...' : requests.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadLeaveRequests}
                disabled={loading}
              >
                Refresh
              </Button>
            </Stack>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && requests.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Leave Type</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Approval Flow</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>{getEmployeeName(request.employeeId)}</TableCell>
                        <TableCell>{getLeaveTypeName(request.leaveTypeId)}</TableCell>
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
                          {request.approvalFlow && request.approvalFlow.length > 0 ? (
                            <Stack spacing={0.5}>
                              {request.approvalFlow.map((flow, idx) => (
                                <Chip
                                  key={idx}
                                  label={`${flow.role}: ${flow.status}`}
                                  size="small"
                                  variant="outlined"
                                  color={
                                    flow.status === 'approved'
                                      ? 'success'
                                      : flow.status === 'rejected'
                                        ? 'error'
                                        : 'default'
                                  }
                                />
                              ))}
                            </Stack>
                          ) : (
                            'No approvals'
                          )}
                        </TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenApprovalFlowDialog(request._id, request.approvalFlow)
                            }
                            title="Set Approval Flow"
                          >
                            <SettingsIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {!loading && requests.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No leave requests found for this leave type.
              </Typography>
            )}
          </Paper>
        )}

        {/* Approval Flow Dialog */}
        <Dialog
          open={approvalFlowDialog.open}
          onClose={handleCloseApprovalFlowDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Set Approval Flow</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Select the roles that need to approve this leave request. All selected roles will have status "pending" initially.
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Approval Roles</InputLabel>
                <Select
                  multiple
                  value={approvalFlowDialog.selectedRoles}
                  onChange={(e) =>
                    setApprovalFlowDialog((prev) => ({
                      ...prev,
                      selectedRoles: e.target.value as string[],
                    }))
                  }
                  input={<OutlinedInput label="Approval Roles" />}
                  renderValue={(selected) => {
                    const count = (selected as string[]).length;
                    if (count === 0) return 'No roles selected';
                    if (count === 1) return '1 role selected';
                    return `${count} roles selected`;
                  }}
                >
                  {systemRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseApprovalFlowDialog} disabled={savingApprovalFlow}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveApprovalFlow}
              variant="contained"
              disabled={savingApprovalFlow || approvalFlowDialog.selectedRoles.length === 0}
            >
              {savingApprovalFlow ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}

