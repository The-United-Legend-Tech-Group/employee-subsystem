'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  Alert,
  Chip,
  OutlinedInput,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';

import { getAccessToken } from '@/lib/auth-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Basic list of roles; using strings keeps it flexible.
const roleOptions = [
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

interface Props {
  leaveTypeId: string;
  minNoticeDays?: number | null;
  maxDurationDays?: number | null;
  approvalFlowRoles?: string[];
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function ConfigureLeaveParametersForm({
  leaveTypeId,
  minNoticeDays,
  maxDurationDays,
  approvalFlowRoles,
  onSaved,
  onCancel,
}: Props) {
  const [form, setForm] = useState({
    minNoticeDays: minNoticeDays?.toString() ?? '',
    maxDurationDays: maxDurationDays?.toString() ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      minNoticeDays: minNoticeDays?.toString() ?? '',
      maxDurationDays: maxDurationDays?.toString() ?? '',
    });
  }, [minNoticeDays, maxDurationDays]);

  function toNumber(value: string) {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = {
        maxDurationDays: toNumber(form.maxDurationDays),
        minNoticeDays: toNumber(form.minNoticeDays),
      };

      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE}/leaves/configure-leave-parameters/${leaveTypeId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to configure leave parameters' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setSuccess('Leave parameters saved');
      if (onSaved) onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to configure leave parameters');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Leave Type: <strong>{leaveTypeId}</strong>
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Max Duration (days)"
            type="number"
            value={form.maxDurationDays}
            onChange={(e) =>
              setForm((f) => ({ ...f, maxDurationDays: e.target.value }))
            }
            fullWidth
            size="small"
          />

          <TextField
            label="Minimum Notice (days)"
            type="number"
            value={form.minNoticeDays}
            onChange={(e) =>
              setForm((f) => ({ ...f, minNoticeDays: e.target.value }))
            }
            fullWidth
            size="small"
          />
        </Stack>



        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} disabled={loading} size="small">
              Cancel
            </Button>
          )}
          <Button variant="contained" type="submit" disabled={loading} size="small">
            {loading ? 'Saving…' : 'Save Parameters'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
