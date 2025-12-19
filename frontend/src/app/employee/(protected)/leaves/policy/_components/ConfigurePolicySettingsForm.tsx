'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  Checkbox,
  MenuItem,
  FormControlLabel,
} from '@mui/material';

import { getAccessToken } from '@/lib/auth-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const accrualOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'per-term', label: 'Per Term' },
];

const roundingOptions = [
  { value: 'none', label: 'None' },
  { value: 'round', label: 'Round' },
  { value: 'round_up', label: 'Round Up' },
  { value: 'round_down', label: 'Round Down' },
];

type PolicyInput = {
  leaveTypeId?: string;
  accrualMethod?: string;
  monthlyRate?: number;
  yearlyRate?: number;
  carryForwardAllowed?: boolean;
  maxCarryForward?: number;
  maxConsecutiveDays?: number;
  minNoticeDays?: number;
  roundingRule?: string;
  expiryAfterMonths?: number;
};

type Props = {
  policy?: PolicyInput | null;
  onSaved?: () => void;
  onCancel?: () => void;
};

export default function ConfigurePolicySettingsForm(props: Props) {
  const { policy, onSaved, onCancel } = props;
  const [form, setForm] = useState({
    leaveTypeId: policy?.leaveTypeId ?? '',
    accrualMethod: policy?.accrualMethod ?? 'monthly',
    monthlyRate: policy?.monthlyRate?.toString() ?? '0',
    yearlyRate: policy?.yearlyRate?.toString() ?? '0',
    carryForwardAllowed: !!policy?.carryForwardAllowed,
    maxCarryForward: policy?.maxCarryForward?.toString() ?? '0',
    maxConsecutiveDays: policy?.maxConsecutiveDays?.toString() ?? '0',
    minNoticeDays: policy?.minNoticeDays?.toString() ?? '0',
    roundingRule: policy?.roundingRule ?? 'none',
    expiryAfterMonths: policy?.expiryAfterMonths?.toString() ?? '0',
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!policy) return;
    setForm({
      leaveTypeId: policy.leaveTypeId ?? '',
      accrualMethod: policy.accrualMethod ?? 'monthly',
      monthlyRate: policy.monthlyRate?.toString() ?? '0',
      yearlyRate: policy.yearlyRate?.toString() ?? '0',
      carryForwardAllowed: !!policy.carryForwardAllowed,
      maxCarryForward: policy.maxCarryForward?.toString() ?? '0',
      maxConsecutiveDays: policy.maxConsecutiveDays?.toString() ?? '0',
      minNoticeDays: policy.minNoticeDays?.toString() ?? '0',
      roundingRule: policy.roundingRule ?? 'none',
      expiryAfterMonths: policy.expiryAfterMonths?.toString() ?? '0',
    });
  }, [policy]);

  const toNumber = (value: string) => {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  };

  function onChange(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setLoading(true);
    try {
      const { leaveTypeId, ...settings } = form;
      const payload = {
        accrualMethod: settings.accrualMethod,
        monthlyRate: toNumber(settings.monthlyRate),
        yearlyRate: toNumber(settings.yearlyRate),
        carryForwardAllowed: settings.carryForwardAllowed,
        maxConsecutiveDays: toNumber(settings.maxConsecutiveDays),
        maxCarryForward: toNumber(settings.maxCarryForward),
        minNoticeDays: toNumber(settings.minNoticeDays),
        roundingRule: settings.roundingRule,
        expiryAfterMonths: toNumber(settings.expiryAfterMonths),
      };
      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE}/leaves/configure-settings/${leaveTypeId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setSuccess('Policy settings configured successfully');
      if (onSaved) onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to configure policy settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        mt: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Leave Type ID: <strong>{form.leaveTypeId || 'N/A'}</strong>
      </Typography>
      <Stack spacing={2}>
        <TextField
          select
          fullWidth
          size="small"
          label="Accrual Method"
          value={form.accrualMethod}
          onChange={(e) => onChange('accrualMethod', e.target.value)}
        >
          {accrualOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Monthly Rate"
            type="number"
            fullWidth
            size="small"
            value={form.monthlyRate}
            onChange={(e) => onChange('monthlyRate', e.target.value)}
          />
          <TextField
            label="Yearly Rate"
            type="number"
            fullWidth
            size="small"
            value={form.yearlyRate}
            onChange={(e) => onChange('yearlyRate', e.target.value)}
          />
        </Stack>

        <FormControlLabel
          control={
            <Checkbox
              checked={form.carryForwardAllowed}
              onChange={(e) =>
                onChange('carryForwardAllowed', e.target.checked)
              }
            />
          }
          label="Carry forward allowed"
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Max Carry Forward"
            type="number"
            fullWidth
            size="small"
            value={form.maxCarryForward}
            onChange={(e) => onChange('maxCarryForward', e.target.value)}
          />
          <TextField
            label="Min Notice Days"
            type="number"
            fullWidth
            size="small"
            value={form.minNoticeDays}
            onChange={(e) => onChange('minNoticeDays', e.target.value)}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Rounding Rule"
            fullWidth
            size="small"
            value={form.roundingRule}
            onChange={(e) => onChange('roundingRule', e.target.value)}
          >
            {roundingOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Expiry After Months"
            type="number"
            fullWidth
            size="small"
            value={form.expiryAfterMonths}
            onChange={(e) => onChange('expiryAfterMonths', e.target.value)}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Max Consecutive Days"
            type="number"
            fullWidth
            size="small"
            value={form.maxConsecutiveDays}
            onChange={(e) => onChange('maxConsecutiveDays', e.target.value)}
          />
        </Stack>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          {props.onCancel && (
            <Button variant="outlined" onClick={props.onCancel} disabled={loading} size="small">
              Cancel
            </Button>
          )}
          <Button variant="contained" type="submit" size="small" disabled={loading}>
            {loading ? 'Saving…' : 'Save Settings'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
