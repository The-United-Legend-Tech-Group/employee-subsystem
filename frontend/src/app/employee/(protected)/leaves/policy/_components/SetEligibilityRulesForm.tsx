'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
} from '@mui/material';

import { getAccessToken } from '@/lib/auth-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Reference enums from backend (mirrored here for the UI)
const contractTypeOptions = [
  'FULL_TIME_CONTRACT',
  'PART_TIME_CONTRACT',
];

const positionOptions = [
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
  policy: {
    _id: string;
    leaveTypeId?: string;
    eligibility?: {
      minTenureMonths?: number;
      positionsAllowed?: string[];
      contractTypesAllowed?: string[];
    };
  };
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function SetEligibilityRulesForm({ policy, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    minTenureMonths: '',
    positionsAllowed: [] as string[],
    contractTypesAllowed: [] as string[],
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill form with existing eligibility data if available
    if (policy.eligibility) {
      setForm({
        minTenureMonths: policy.eligibility.minTenureMonths?.toString() ?? '',
        positionsAllowed: policy.eligibility.positionsAllowed ?? [],
        contractTypesAllowed: policy.eligibility.contractTypesAllowed ?? [],
      });
    }
  }, [policy]);

  function toNumber(value: string | number) {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setLoading(true);

    if (!policy.leaveTypeId) {
      setError('Policy must have a leaveTypeId');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        leaveTypeId: policy.leaveTypeId,
        minTenureMonths: toNumber(form.minTenureMonths),
        positionsAllowed: form.positionsAllowed,
        contractTypesAllowed: form.contractTypesAllowed,
      };

      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/leaves/set-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to set eligibility rules' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setSuccess('Eligibility rules set successfully');
      setTimeout(() => {
        if (onSaved) onSaved();
      }, 1000);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to set eligibility rules');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={2}>
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

        <Typography variant="body2" color="text.secondary">
          Leave Type: <strong>{policy.leaveTypeId ?? 'N/A'}</strong>
        </Typography>

        <TextField
          label="Minimum Tenure (Months)"
          type="number"
          value={form.minTenureMonths}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              minTenureMonths: e.target.value,
            }))
          }
          fullWidth
          size="small"
          inputProps={{ min: 0, step: 1 }}
        />

        <FormControl fullWidth size="small">
          <InputLabel>Positions Allowed</InputLabel>
          <Select
            multiple
            value={form.positionsAllowed}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                positionsAllowed: e.target.value as string[],
              }))
            }
            input={<OutlinedInput label="Positions Allowed" />}
            renderValue={(selected) => {
              const count = (selected as string[]).length;
              if (count === 0) return 'No roles selected';
              if (count === 1) return '1 role selected';
              return `${count} roles selected`;
            }}
          >
            {positionOptions.map((pos) => (
              <MenuItem key={pos} value={pos}>
                {pos}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Contract Types Allowed</InputLabel>
          <Select
            multiple
            value={form.contractTypesAllowed}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                contractTypesAllowed: e.target.value as string[],
              }))
            }
            input={<OutlinedInput label="Contract Types Allowed" />}
            renderValue={(selected) => {
              const count = (selected as string[]).length;
              if (count === 0) return 'No contract types selected';
              if (count === 1) return '1 contract type selected';
              return `${count} contract types selected`;
            }}
          >
            {contractTypeOptions.map((ct) => (
              <MenuItem key={ct} value={ct}>
                {ct}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} disabled={loading} size="small">
              Cancel
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={loading} size="small">
            {loading ? 'Saving...' : policy.eligibility ? 'Update Eligibility Rules' : 'Set Eligibility Rules'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
