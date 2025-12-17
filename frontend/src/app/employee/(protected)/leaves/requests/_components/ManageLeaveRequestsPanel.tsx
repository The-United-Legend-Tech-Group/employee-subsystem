'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  MenuItem,
} from '@mui/material';
import { apiService } from '../../../../../../common/services/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type LeaveRequestOption = {
  _id: string;
  leaveTypeId?: string;
  dates?: { from?: any; to?: any };
  durationDays?: number;
  status?: string;
};

type ManageLeaveRequestsPanelProps = {
  onRequestModified?: () => void;
};

export default function ManageLeaveRequestsPanel({ onRequestModified }: ManageLeaveRequestsPanelProps) {
  // Modify request state
  const [modifyForm, setModifyForm] = useState({
    requestId: '',
    fromDate: '',
    toDate: '',
    justification: '',
  });
  const [modifyLoading, setModifyLoading] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);
  const [modifySuccess, setModifySuccess] = useState<string | null>(null);

  // Cancel request state
  const [cancelId, setCancelId] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Upload attachment for existing request
  const [attachmentRequestId, setAttachmentRequestId] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachmentSuccess, setAttachmentSuccess] = useState<string | null>(null);

  // Dashboard-style tab navigation
  const [activeTab, setActiveTab] = useState<'modify' | 'cancel' | 'attach'>('modify');

  // Requests for current employee
  const [myRequests, setMyRequests] = useState<LeaveRequestOption[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequestOption[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onModifyChange = (key: keyof typeof modifyForm, value: string) =>
    setModifyForm((f) => ({ ...f, [key]: value }));

  
  const computeDuration = () => {
    if (!modifyForm.fromDate || !modifyForm.toDate) return 0;
    const from = new Date(modifyForm.fromDate);
    const to = new Date(modifyForm.toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
    const diffMs = to.getTime() - from.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  function getCurrentEmployeeId() {
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

  async function handleModifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setModifyError(null);
    setModifySuccess(null);

    if (!API_BASE) {
      setModifyError('API base URL is not configured.');
      return;
    }
    if (!modifyForm.requestId) {
      setModifyError('Please enter a request ID.');
      return;
    }

    const durationDays = computeDuration();

    setModifyLoading(true);
    try {
      const token = localStorage.getItem('access_token');

      const payload: any = {};
      if (modifyForm.fromDate && modifyForm.toDate) {
        payload.dates = {
          from: modifyForm.fromDate,
          to: modifyForm.toDate,
        };
        payload.durationDays = durationDays;
      }
      if (modifyForm.justification) {
        payload.justification = modifyForm.justification;
      }

      const res = await fetch(`${API_BASE}/leaves/modify-request/${modifyForm.requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({
          message: 'Failed to modify leave request',
        }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setModifySuccess('Leave request modified successfully');
      setModifyForm({
        requestId: '',
        fromDate: '',
        toDate: '',
        justification: '',
      });
      // Refetch requests to see the update
      loadRequests();
      if (onRequestModified) {
        onRequestModified();
      }
    } catch (err: any) {
      setModifyError(err?.message ?? 'Failed to modify leave request');
    } finally {
      setModifyLoading(false);
    }
  }

  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCancelError(null);
    setCancelSuccess(null);

    if (!API_BASE) {
      setCancelError('API base URL is not configured.');
      return;
    }
    if (!cancelId.trim()) {
      setCancelError('Please enter a request ID.');
      return;
    }

    setCancelLoading(true);
    try {
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_BASE}/leaves/cancel/${cancelId}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({
          message: 'Failed to cancel leave request',
        }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setCancelSuccess('Leave request cancelled successfully');
      setCancelId('');
      // Refetch requests to see the update
      loadRequests();
      if (onRequestModified) {
        onRequestModified();
      }
    } catch (err: any) {
      setCancelError(err?.message ?? 'Failed to cancel leave request');
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleUploadAttachment(e: React.FormEvent) {
    e.preventDefault();
    setAttachmentError(null);
    setAttachmentSuccess(null);

    if (!API_BASE) {
      setAttachmentError('API base URL is not configured.');
      return;
    }
    if (!attachmentRequestId.trim()) {
      setAttachmentError('Please enter a request ID.');
      return;
    }
    const employeeId = getCurrentEmployeeId();
    if (!employeeId) {
      setError('Unable to identify current employee. Please log in again.');
      return;
    }
    if (!attachmentFile) {
      setAttachmentError('Please choose a file to upload.');
      return;
    }

    setAttachmentLoading(true);
    try {
      const token = localStorage.getItem('access_token');

      let documentUrl = null;

      if (attachmentFile) {
        documentUrl = await apiService.uploadFile(attachmentFile, employeeId);
      }
      // Step 1: create attachment metadata
      const uploadPayload = {
        originalName: String(attachmentFile?.name || ''),
        filePath: String(documentUrl || ''),
        fileType: String(attachmentFile?.type || ''),
        size: Number(attachmentFile?.size || 0),
      };

      const uploadRes = await fetch(`${API_BASE}/leaves/upload-attachment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(uploadPayload),
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({
          message: 'Failed to upload attachment',
        }));
        throw new Error(errData.message || `Failed (${uploadRes.status})`);
      }

      const attachment = await uploadRes.json();
      const attachmentId = attachment?._id;
      if (!attachmentId) {
        throw new Error('Attachment created without ID');
      }

      // Step 2: attach document to existing leave request using modify-request
      const modifyPayload = {
        attachmentId: attachmentId,
      };

      const modifyRes = await fetch(
        `${API_BASE}/leaves/modify-request/${attachmentRequestId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(modifyPayload),
        },
      );

      if (!modifyRes.ok) {
        const errData = await modifyRes.json().catch(() => ({
          message: 'Failed to attach document to request',
        }));
        throw new Error(errData.message || `Failed (${modifyRes.status})`);
      }

      setAttachmentSuccess('Document attached to request successfully');
      setAttachmentFile(null);
    } catch (err: any) {
      setAttachmentError(err?.message ?? 'Failed to upload or attach document');
    } finally {
      setAttachmentLoading(false);
    }
  }

  const durationDays = computeDuration();

  const formatDate = (value: any) => {
    if (!value) return '';
    if (typeof value === 'object' && value.$date) {
      value = value.$date;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  };

  const loadRequests = useCallback(async () => {
    if (!API_BASE) return;
    setRequestsLoading(true);
    setRequestsError(null);
    const token = localStorage.getItem('access_token');
    try {
      const commonHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [allRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/leaves/my-requests`, {
          headers: commonHeaders,
          credentials: 'include',
        }),
        fetch(`${API_BASE}/leaves/my-pending-requests`, {
          headers: commonHeaders,
          credentials: 'include',
        }),
      ]);

      if (!allRes.ok) {
        const errData = await allRes.json().catch(() => ({ message: 'Failed to load requests' }));
        throw new Error(errData.message || `Failed (${allRes.status})`);
      }
      if (!pendingRes.ok) {
        const errData = await pendingRes
          .json()
          .catch(() => ({ message: 'Failed to load pending requests' }));
        throw new Error(errData.message || `Failed (${pendingRes.status})`);
      }

      const allData = await allRes.json();
      const pendingData = await pendingRes.json();
      setMyRequests(Array.isArray(allData) ? allData : []);
      setPendingRequests(Array.isArray(pendingData) ? pendingData : []);
    } catch (err: any) {
      setRequestsError(err?.message ?? 'Failed to load your requests');
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    
    // Listen for refetch events from other components
    const handleRefetch = () => {
      loadRequests();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('refetch-leave-requests', handleRefetch);
      return () => {
        window.removeEventListener('refetch-leave-requests', handleRefetch);
      };
    }
  }, [loadRequests]);

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      {requestsError && (
        <Alert severity="error" onClose={() => setRequestsError(null)}>
          {requestsError}
        </Alert>
      )}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 0.5,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="modify" label="Modify Request" />
          <Tab value="cancel" label="Cancel Request" />
          <Tab value="attach" label="Attach Document" />
        </Tabs>
      </Box>

      {/* Modify pending request */}
      {activeTab === 'modify' && (
        <Box component="form" onSubmit={handleModifySubmit}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              Modify Pending Request
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update dates or justification for a request that is still pending approval.
            </Typography>

            <TextField
              select
              label="Request"
              value={modifyForm.requestId}
              onChange={(e) => onModifyChange('requestId', e.target.value)}
              size="small"
              fullWidth
              required
              helperText="Select one of your leave requests"
            >
              {pendingRequests.map((req) => (
                <MenuItem key={req._id} value={req._id}>
                  {`${req._id.slice(-6)} · ${req.status ?? ''} · ${formatDate(
                    req.dates?.from,
                  )} → ${formatDate(req.dates?.to)}`}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="From"
                type="date"
                value={modifyForm.fromDate}
                onChange={(e) => onModifyChange('fromDate', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="To"
                type="date"
                value={modifyForm.toDate}
                onChange={(e) => onModifyChange('toDate', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              label="Duration (days)"
              value={durationDays || ''}
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="Justification (optional)"
              value={modifyForm.justification}
              onChange={(e) => onModifyChange('justification', e.target.value)}
              fullWidth
              size="small"

            />

            {modifyError && (
              <Alert severity="error" onClose={() => setModifyError(null)}>
                {modifyError}
              </Alert>
            )}
            {modifySuccess && (
              <Alert severity="success" onClose={() => setModifySuccess(null)}>
                {modifySuccess}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                type="submit"
                disabled={modifyLoading}
                size="small"
                sx={{
                  px: 3,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {modifyLoading ? <CircularProgress size={18} /> : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Cancel pending request */}
      {activeTab === 'cancel' && (
        <Box component="form" onSubmit={handleCancelSubmit}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              Cancel Pending Request
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cancel a request that is still pending so it does not proceed unnecessarily.
            </Typography>

            <TextField
              select
              label="Pending Request"
              value={cancelId}
              onChange={(e) => setCancelId(e.target.value)}
              size="small"
              fullWidth
              required
              helperText="Select one of your pending requests to cancel"
            >
              {pendingRequests.map((req) => (
                <MenuItem key={req._id} value={req._id}>
                  {`${req._id.slice(-6)} · ${formatDate(req.dates?.from)} → ${formatDate(
                    req.dates?.to,
                  )}`}
                </MenuItem>
              ))}
            </TextField>

            {cancelError && (
              <Alert severity="error" onClose={() => setCancelError(null)}>
                {cancelError}
              </Alert>
            )}
            {cancelSuccess && (
              <Alert severity="success" onClose={() => setCancelSuccess(null)}>
                {cancelSuccess}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="error"
                type="submit"
                disabled={cancelLoading}
                size="small"
                sx={{
                  px: 3,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {cancelLoading ? <CircularProgress size={18} /> : 'Cancel Request'}
              </Button>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Upload / attach document to existing request */}
      {activeTab === 'attach' && (
        <Box component="form" onSubmit={handleUploadAttachment}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              Attach Document to Existing Request
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a supporting document (e.g., medical note) and link it to an existing request.
            </Typography>

            <TextField
              select
              label="Pending Request"
              value={attachmentRequestId}
              onChange={(e) => setAttachmentRequestId(e.target.value)}
              size="small"
              fullWidth
              required
              helperText="Select one of your pending requests to attach a document to"
            >
              {pendingRequests.map((req) => (
                <MenuItem key={req._id} value={req._id}>
                  {`${req._id.slice(-6)} · ${formatDate(req.dates?.from)} → ${formatDate(
                    req.dates?.to,
                  )}`}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button variant="outlined" size="small" component="label">
                {attachmentFile ? 'Change file' : 'Choose file'}
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    const picked = e.target.files?.[0] ?? null;
                    setAttachmentFile(picked);
                  }}
                />
              </Button>
              {attachmentFile && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {attachmentFile.name} ({Math.round(attachmentFile.size / 1024)} KB)
                </Typography>
              )}
            </Stack>

            {attachmentError && (
              <Alert severity="error" onClose={() => setAttachmentError(null)}>
                {attachmentError}
              </Alert>
            )}
            {attachmentSuccess && (
              <Alert severity="success" onClose={() => setAttachmentSuccess(null)}>
                {attachmentSuccess}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                type="submit"
                disabled={attachmentLoading}
                size="small"
                sx={{
                  px: 3,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {attachmentLoading ? <CircularProgress size={18} /> : 'Upload & Attach'}
              </Button>
            </Box>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}


