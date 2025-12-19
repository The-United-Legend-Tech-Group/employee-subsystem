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
  Checkbox,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  VerifiedUser as VerifiedUserIcon,
  Update as UpdateIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { apiService } from '@/common/services/api';
import { getEmployeeIdFromCookie } from '@/lib/auth-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type LeaveRequest = {
  _id: string;
  employeeId?: string | {
    _id: string;
    employeeNumber?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
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
  status?: string;
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

// Helper to normalize employee object shape from backend
function getEmployeeProfile(employee: any): any | null {
  if (!employee || typeof employee !== 'object') return null;
  // When coming from employeeService.getProfile, structure is { profile: {...} }
  if (employee.profile && typeof employee.profile === 'object') {
    return employee.profile;
  }
  return employee;
}

function getCurrentUserId() {
  return getEmployeeIdFromCookie();
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

export default function HRLeaveRequestsManager() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'medical'>('all');
  
  // Dialog states
  const [finalizeDialog, setFinalizeDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [overrideDialog, setOverrideDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [bulkDialog, setBulkDialog] = useState<{ open: boolean }>({ open: false });
  
  // Form states
  const [overrideStatus, setOverrideStatus] = useState<LeaveStatus>('approved');
  const [overrideReason, setOverrideReason] = useState('');
  const [verifyStatus, setVerifyStatus] = useState(true);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'override_approve' | 'override_reject'>('approve');
  const [bulkOverrideReason, setBulkOverrideReason] = useState('');
  const [processing, setProcessing] = useState(false);

  
  const loadRequests = useCallback(async () => {
    if (!API_BASE) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/hr/all-requests`, {
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
    if (activeTab === 'approved') return requests.filter(r => r.status === 'approved');
    if (activeTab === 'pending') return requests.filter(r => r.status === 'pending');
    if (activeTab === 'rejected') return requests.filter(r => r.status === 'rejected');
    if (activeTab === 'medical') return requests.filter(r => r.attachmentId && (r.status === 'pending' || r.status === 'approved'));
    return requests;
  }, [requests, activeTab]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRequests(filteredRequests.map(r => r._id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectOne = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleFinalize = async () => {
    if (!finalizeDialog.requestId) return;
    setProcessing(true);
    try {
      const hrUserId = getCurrentUserId();
      if (!hrUserId) throw new Error('Unable to identify HR user');

      const res = await fetch(`${API_BASE}/leaves/finalize/${finalizeDialog.requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          hrUserId,
          finalStatus: 'approved', // Always approved when medical verified and manager approved
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to finalize request' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setFinalizeDialog({ open: false, requestId: null });
      await loadRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to finalize leave request');
    } finally {
      setProcessing(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideDialog.requestId || !overrideReason.trim()) {
      setError('Please provide a reason for the override');
      return;
    }
    setProcessing(true);
    try {
      const hrUserId = getCurrentUserId();
      if (!hrUserId) throw new Error('Unable to identify HR user');

      const res = await fetch(`${API_BASE}/leaves/hr-override/${overrideDialog.requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          hrUserId,
          newStatus: overrideStatus,
          reason: overrideReason,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to override request' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setOverrideDialog({ open: false, requestId: null });
      setOverrideReason('');
      await loadRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to override leave request');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyMedical = async () => {
    if (!verifyDialog.requestId) return;
    setProcessing(true);
    try {
      const hrUserId = getCurrentUserId();
      if (!hrUserId) throw new Error('Unable to identify HR user');

      const res = await fetch(`${API_BASE}/leaves/verify-medical/${verifyDialog.requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          hrUserId,
          verified: verifyStatus,
          notes: verifyNotes || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to verify medical documents' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setVerifyDialog({ open: false, requestId: null });
      setVerifyNotes('');
      await loadRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to verify medical documents');
    } finally {
      setProcessing(false);
    }
  };

  const handleHrApproveNormal = async (requestId: string) => {
    setProcessing(true);
    try {
      const hrUserId = getCurrentUserId();
      if (!hrUserId) throw new Error('Unable to identify HR user');

      const res = await fetch(`${API_BASE}/leaves/hr/${requestId}/approve-normal`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ hrUserId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to approve (normal)' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      await loadRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to approve (normal)');
    } finally {
      setProcessing(false);
    }
  };

  const handleHrRejectNormal = async (requestId: string) => {
    setProcessing(true);
    try {
      const hrUserId = getCurrentUserId();
      if (!hrUserId) throw new Error('Unable to identify HR user');

      const res = await fetch(`${API_BASE}/leaves/hr/${requestId}/reject-normal`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ hrUserId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to reject (normal)' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      await loadRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reject (normal)');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewMedicalDocument = async (request: LeaveRequest) => {
    if (!API_BASE || !request.attachmentId) return;
    setProcessing(true);
    try {
      const res = await fetch(
        `${API_BASE}/leaves/attachments/${request.attachmentId}`,
        {
          credentials: 'include',
        },
      );

      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ message: 'Failed to load attachment' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const attachment = await res.json();
      const filePath = attachment?.filePath as string;
      if (!filePath) {
        throw new Error('Attachment has no file path');
      }
      const publicUrl = await apiService.getPublicFileUrl(filePath);
      if (typeof window !== 'undefined') {
        window.open(publicUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to open medical document');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkProcess = async () => {
    if (selectedRequests.length === 0) {
      setError('Please select at least one request');
      return;
    }
    setProcessing(true);
    try {
      const hrUserId = getCurrentUserId();
      if (!hrUserId) throw new Error('Unable to identify HR user');

      const res = await fetch(`${API_BASE}/leaves/bulk-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          leaveRequestIds: selectedRequests,
          action: bulkAction,
          hrUserId,
          reason: (bulkAction === 'override_approve' || bulkAction === 'override_reject') ? (bulkOverrideReason || 'Bulk override') : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to process requests' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const result = await res.json();
      setBulkDialog({ open: false });
      setSelectedRequests([]);
      await loadRequests();
      alert(`Bulk processing completed: ${result.processed} processed, ${result.failed} failed`);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to process requests in bulk');
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoUpdateBalances = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/leaves/auto-update-balances`, {
        method: 'POST',
        headers: undefined,
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to update balances' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const result = await res.json();
      alert(`Successfully updated ${result.updated} leave balances`);
      await loadRequests();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update balances');
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
            <Tab value="approved" label={`Approved (${requests.filter(r => r.status === 'approved').length})`} />
            <Tab value="pending" label={`Pending (${requests.filter(r => r.status === 'pending').length})`} />
            <Tab value="rejected" label={`Rejected (${requests.filter(r => r.status === 'rejected').length})`} />
            <Tab value="medical" label={`Medical (${requests.filter(r => r.attachmentId && (r.status === 'pending' || r.status === 'approved')).length})`} />
          </Tabs>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Auto-update balances for all approved requests">
              <Button
                variant="outlined"
                size="small"
                startIcon={<UpdateIcon />}
                onClick={handleAutoUpdateBalances}
                disabled={processing}
              >
                Update Balances
              </Button>
            </Tooltip>
            {selectedRequests.length > 0 && (
              <Button
                variant="contained"
                size="small"
                onClick={() => setBulkDialog({ open: true })}
              >
                Bulk Process ({selectedRequests.length})
              </Button>
            )}
            <IconButton onClick={loadRequests} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Stack>
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
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={filteredRequests.length > 0 && selectedRequests.length === filteredRequests.length}
                      indeterminate={selectedRequests.length > 0 && selectedRequests.length < filteredRequests.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Medical Verification</TableCell>
                  <TableCell>Finalization Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request._id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRequests.includes(request._id)}
                        onChange={() => handleSelectOne(request._id)}
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const emp = getEmployeeProfile(request.employeeId as any);
                        if (!emp) return 'N/A';
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
                        ? request.leaveTypeId.code || request.leaveTypeId.name || 'N/A'
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
                      {request.attachmentId ? (() => {
                        const hrEntries = request.approvalFlow?.filter(flow => flow.role === 'hr') || [];
                        if (hrEntries.length > 0) {
                          const firstHr = hrEntries[0];
                          return firstHr.status === 'approved' ? 'Verified - Approved' : 'Verified - Rejected';
                        } else {
                          return 'Not Verified';
                        }
                      })() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const hrEntries = request.approvalFlow?.filter(flow => flow.role === 'hr') || [];
                        if (hrEntries.length > 1) {
                          const lastHr = hrEntries[hrEntries.length - 1];
                          return lastHr.status === 'approved' ? 'Finalized - Approved' : 'Finalized - Rejected';
                        } else {
                          return 'Not Finalized';
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {(() => {
                          const medicalVerified = request.approvalFlow?.some(flow => flow.role === 'HR Manager' && flow.status === 'approved');
                          const managerApproved = request.approvalFlow?.some(flow => flow.role === 'department head' && flow.status === 'approved');
                          const canFinalize = medicalVerified && managerApproved;

                          return canFinalize ? (
                            <Tooltip title="Finalize (Medical verified & Manager approved)">
                              <IconButton
                                size="small"
                                onClick={() => setFinalizeDialog({ open: true, requestId: request._id })}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null;
                        })()}
                        {request.status === 'pending' && (
                          <>
                            <Tooltip title="HR Approve (normal)">
                              <IconButton
                                size="small"
                                onClick={() => handleHrApproveNormal(request._id)}
                                disabled={processing}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="HR Reject (normal)">
                              <IconButton
                                size="small"
                                onClick={() => handleHrRejectNormal(request._id)}
                                disabled={processing}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Override">
                          <IconButton
                            size="small"
                            onClick={() => setOverrideDialog({ open: true, requestId: request._id })}
                          >
                            <VerifiedUserIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {request.attachmentId && (
                          <>
                            <Tooltip title="View Medical Document">
                              <IconButton
                                size="small"
                                onClick={() => handleViewMedicalDocument(request)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          <Tooltip title="Verify Medical">
                            <IconButton
                              size="small"
                              onClick={() => setVerifyDialog({ open: true, requestId: request._id })}
                            >
                                <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No leave requests found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Finalize Dialog */}
      <Dialog open={finalizeDialog.open} onClose={() => setFinalizeDialog({ open: false, requestId: null })}>
        <DialogTitle>Finalize Leave Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Medical documents verified and manager approved. This request can now be finalized to APPROVED status.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Finalizing will update employee records, leave balances, and payroll accordingly.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizeDialog({ open: false, requestId: null })}>Cancel</Button>
          <Button onClick={handleFinalize} variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Finalize'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={overrideDialog.open} onClose={() => setOverrideDialog({ open: false, requestId: null })}>
        <DialogTitle>Override Leave Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 400 }}>
            <TextField
              select
              label="New Status"
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value as LeaveStatus)}
              fullWidth
            >
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
            <TextField
              label="Reason for Override"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
              helperText="Please provide a reason for overriding the manager's decision"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialog({ open: false, requestId: null })}>Cancel</Button>
          <Button onClick={handleOverride} variant="contained" disabled={processing || !overrideReason.trim()}>
            {processing ? <CircularProgress size={20} /> : 'Override'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify Medical Dialog */}
      <Dialog open={verifyDialog.open} onClose={() => setVerifyDialog({ open: false, requestId: null })}>
        <DialogTitle>Verify Medical Documents</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 400 }}>
            <TextField
              select
              label="Verification Status"
              value={verifyStatus ? 'verified' : 'rejected'}
              onChange={(e) => setVerifyStatus(e.target.value === 'verified')}
              fullWidth
            >
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
            <TextField
              label="Verification Notes (Optional)"
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialog({ open: false, requestId: null })}>Cancel</Button>
          <Button onClick={handleVerifyMedical} variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Process Dialog */}
      <Dialog open={bulkDialog.open} onClose={() => setBulkDialog({ open: false })}>
        <DialogTitle>Bulk Process Leave Requests</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Processing {selectedRequests.length} selected request(s)
            </Typography>
            <TextField
              select
              label="Action"
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as 'approve' | 'reject' | 'override_approve' | 'override_reject')}
              fullWidth
            >
              <MenuItem value="approve">Approve</MenuItem>
              <MenuItem value="reject">Reject</MenuItem>
              <MenuItem value="override_approve">Override Approve</MenuItem>
              <MenuItem value="override_reject">Override Reject</MenuItem>
            </TextField>
            {(bulkAction === 'override_approve' || bulkAction === 'override_reject') && (
              <TextField
                label="Override Reason"
                value={bulkOverrideReason}
                onChange={(e) => setBulkOverrideReason(e.target.value)}
                fullWidth
                multiline
                rows={3}
                helperText="Provide a reason for the override applied to all selected requests"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleBulkProcess} variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Process'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

