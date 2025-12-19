'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  MenuItem,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {apiService} from '../../../../../../common/services/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type LeaveTypeOption = {
  _id: string;
  code: string;
  name: string;
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

function getLeaveTypeLabel(lt: LeaveTypeOption) {
  if (!lt) return '';
  if (lt.code && lt.name) return `${lt.code} — ${lt.name}`;
  return lt.code || lt.name || lt._id;
}

type NewLeaveRequestFormProps = {
  onRequestCreated?: () => void;
};

export default function NewLeaveRequestForm({ onRequestCreated }: NewLeaveRequestFormProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [leaveTypesError, setLeaveTypesError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    leaveTypeId: '',
    fromDate: '',
    toDate: '',
    justification: '',
    isEmergency: false,
  });

  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaveTypes() {
      if (!API_BASE) return;
      setLeaveTypesLoading(true);
      setLeaveTypesError(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/leaves/leave-types/for-me`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`Failed to load leave types (${res.status})`);
        }
        const data = await res.json();
        setLeaveTypes(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setLeaveTypesError(err?.message ?? 'Failed to load leave types');
      } finally {
        setLeaveTypesLoading(false);
      }
    }

    loadLeaveTypes();
  }, []);

  const onChange = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const computeDuration = () => {
    if (!form.fromDate || !form.toDate) return 0;
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
    const diffMs = to.getTime() - from.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUploading(true);


    if (!API_BASE) {
      setError('API base URL is not configured.');
      return;
    }

    const employeeId = getCurrentEmployeeId();
    if (!employeeId) {
      setError('Unable to identify current employee. Please log in again.');
      return;
    }

    if (!form.leaveTypeId || !form.fromDate || !form.toDate) {
      setError('Please select leave type and dates.');
      return;
    }

    const durationDays = computeDuration();
    if (durationDays <= 0) {
      setError('Please select a valid date range.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');

      let documentUrl = null;

      if (file) {
        documentUrl = await apiService.uploadFile(file, employeeId);
      }
      const attachmentMeta = {
        originalFileName: file?.name,
        filePath: documentUrl,
        fileType: file?.type,
        size: file?.size,
      };

      const payload: any = {
        employeeId,
        leaveTypeId: form.leaveTypeId,
        dates: {
          from: form.fromDate,
          to: form.toDate,
        },
        durationDays,
        justification: form.justification || undefined,
        isEmergency: form.isEmergency,
        ...attachmentMeta,
      };

      const res = await fetch(`${API_BASE}/leaves/submit-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({
          message: 'Failed to submit leave request',
        }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setSuccess('Leave request submitted successfully');
      setForm({
        leaveTypeId: '',
        fromDate: '',
        toDate: '',
        justification: '',
        isEmergency: false,
      });
      setFile(null);
      
      // Trigger refetch of requests
      if (onRequestCreated) {
        onRequestCreated();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  }

  const durationDays = computeDuration();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flex: 1,
      }}
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Fill in the leave details below. Duration is calculated automatically from the selected
          dates.
        </Typography>

        <TextField
          select
          fullWidth
          size="small"
          label="Leave Type"
          value={form.leaveTypeId}
          onChange={(e) => onChange('leaveTypeId', e.target.value)}
          helperText={leaveTypesError ?? 'Select the leave type you are requesting'}
          disabled={leaveTypesLoading || !leaveTypes.length}
          required
        >
          {leaveTypes.map((lt) => (
            <MenuItem key={lt._id} value={lt._id}>
              {getLeaveTypeLabel(lt)}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="From"
            type="date"
            value={form.fromDate}
            onChange={(e) => onChange('fromDate', e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="To"
            type="date"
            value={form.toDate}
            onChange={(e) => onChange('toDate', e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            required
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
          label="Justification"
          value={form.justification}
          onChange={(e) => onChange('justification', e.target.value)}
          fullWidth
          size="small"

          placeholder="Explain the reason for your leave (optional but recommended)"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.isEmergency}
              onChange={(e) => setForm((f) => ({ ...f, isEmergency: e.target.checked }))}
              color="error"
            />
          }
          label="This is an emergency leave request"
          sx={{ color: 'text.secondary' }}
        />

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            Attachment (optional)
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              component="label"
            >
              {file ? 'Change file' : 'Upload document'}
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const picked = e.target.files?.[0] ?? null;
                  setFile(picked);
                }}
              />
            </Button>
            {file && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {file.name} ({Math.round(file.size / 1024)} KB)
              </Typography>
            )}
          </Stack>
        </Box>

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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{
              px: 4,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Submit Request'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}


