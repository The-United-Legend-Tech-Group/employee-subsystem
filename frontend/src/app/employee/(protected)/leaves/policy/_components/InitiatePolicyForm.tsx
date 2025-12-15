'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  Chip,
  Divider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import Grid from '@mui/material/Grid';

// Use NEXT_PUBLIC_API_URL to point to backend (e.g., http://localhost:3000/api)
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

type LeaveTypeOption = {
  _id: string;
  code: string;
  name: string;
};

export default function InitiatePolicyForm() {
  const [form, setForm] = useState({
    leaveTypeId: '',
    accrualMethod: 'monthly',
    monthlyRate: 0,
    yearlyRate: 0,
    carryForwardAllowed: false,
    maxCarryForward: 0,
    expiryAfterMonths: '',
    roundingRule: 'none',
    minNoticeDays: 0,
    maxConsecutiveDays: '',
    eligibilityMinTenureMonths: '',
    eligibilityPositionsAllowed: [] as string[],
    eligibilityContractTypesAllowed: [] as string[],
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [buttonActive, setButtonActive] = useState(false);

  const onChange = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  function toNumber(value: string | number) {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  useEffect(() => {
    async function loadLeaveTypes() {
      if (!API_BASE) return;
      setLoadingTypes(true);
      setTypesError(null);
      try {
        const res = await fetch(`${API_BASE}/leaves/leave-types`);
        if (!res.ok) throw new Error(`Failed to load leave types (${res.status})`);
        const data = await res.json();
        setLeaveTypes(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setTypesError(err?.message ?? 'Failed to load leave types');
      } finally {
        setLoadingTypes(false);
      }
    }

    loadLeaveTypes();
  }, []);

  function handleButtonClick() {
    setButtonActive(true);
    setTimeout(() => {
      setButtonActive(false);
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        leaveTypeId: form.leaveTypeId,
        accrualMethod: form.accrualMethod,
        monthlyRate: toNumber(form.monthlyRate) ?? 0,
        yearlyRate: toNumber(form.yearlyRate) ?? 0,
        carryForwardAllowed: form.carryForwardAllowed,
        maxCarryForward: toNumber(form.maxCarryForward) ?? 0,
        expiryAfterMonths: toNumber(form.expiryAfterMonths),
        roundingRule: form.roundingRule,
        minNoticeDays: toNumber(form.minNoticeDays) ?? 0,
        maxConsecutiveDays: toNumber(form.maxConsecutiveDays),
      };

      const eligibility: any = {};
      const tenure = toNumber(form.eligibilityMinTenureMonths);
      if (tenure !== undefined) eligibility.minTenureMonths = tenure;
      if (form.eligibilityPositionsAllowed.length) {
        eligibility.positionsAllowed = form.eligibilityPositionsAllowed;
      }
      if (form.eligibilityContractTypesAllowed.length) {
        eligibility.contractTypesAllowed = form.eligibilityContractTypesAllowed;
      }
      if (Object.keys(eligibility).length > 0) {
        payload.eligibility = eligibility;
      }

      const res = await fetch(`${API_BASE}/leaves/initiate-policy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setSuccess('Policy initiated');
      setTimeout(() => setSuccess(null), 5000);
      setForm({
        leaveTypeId: '',
        accrualMethod: 'monthly',
        monthlyRate: 0,
        yearlyRate: 0,
        carryForwardAllowed: false,
        maxCarryForward: 0,
        expiryAfterMonths: '',
        roundingRule: 'none',
        minNoticeDays: 0,
        maxConsecutiveDays: '',
        eligibilityMinTenureMonths: '',
        eligibilityPositionsAllowed: [],
        eligibilityContractTypesAllowed: [],
      });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to initiate policy');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }

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
          Configure how this leave type accrues over time and which employees are eligible.
        </Typography>
        {/* Basic details */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Basic Details
          </Typography>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Leave Type"
                select
                value={form.leaveTypeId}
                onChange={(e) => onChange('leaveTypeId', e.target.value)}
                required
                helperText={
                  typesError
                    ? typesError
                    : 'Select the leave type this policy applies to'
                }
                disabled={loadingTypes || !leaveTypes.length}
              >
                {leaveTypes.map((lt) => (
                  <MenuItem key={lt._id} value={lt._id}>
                    {lt.code} — {lt.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Accrual settings */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Accrual Settings
          </Typography>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Monthly Rate"
                type="number"
                value={form.monthlyRate}
                onChange={(e) => onChange('monthlyRate', e.target.value)}
                inputProps={{ step: '0.01', min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Yearly Rate"
                type="number"
                value={form.yearlyRate}
                onChange={(e) => onChange('yearlyRate', e.target.value)}
                inputProps={{ step: '0.01', min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Rounding Rule"
                value={form.roundingRule}
                onChange={(e) => onChange('roundingRule', e.target.value)}
              >
                {roundingOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Carry forward & limits */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Carry Forward & Limits
          </Typography>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Max Carry Forward"
                type="number"
                value={form.maxCarryForward}
                onChange={(e) => onChange('maxCarryForward', e.target.value)}
                inputProps={{ step: '0.01', min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Expiry After Months"
                type="number"
                value={form.expiryAfterMonths}
                onChange={(e) => onChange('expiryAfterMonths', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Min Notice Days"
                type="number"
                value={form.minNoticeDays}
                onChange={(e) => onChange('minNoticeDays', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Max Consecutive Days"
                type="number"
                value={form.maxConsecutiveDays}
                onChange={(e) => onChange('maxConsecutiveDays', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.carryForwardAllowed}
                    onChange={(e) => onChange('carryForwardAllowed', e.target.checked)}
                  />
                }
                label="Allow carry forward of unused leave"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Eligibility */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Eligibility
          </Typography>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Min Tenure (months)"
                type="number"
                value={form.eligibilityMinTenureMonths}
                onChange={(e) => onChange('eligibilityMinTenureMonths', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="positions-label">Positions Allowed</InputLabel>
                <Select
                  labelId="positions-label"
                  multiple
                  value={form.eligibilityPositionsAllowed}
                  onChange={(e) => onChange('eligibilityPositionsAllowed', e.target.value as string[])}
                  input={<OutlinedInput label="Positions Allowed" />}
                  renderValue={(selected) => {
                    const count = (selected as string[]).length;
                    if (count === 0) return 'No roles selected';
                    if (count === 1) return '1 role selected';
                    return `${count} roles selected`;
                  }}
                >
                  {positionOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="contracts-label">Contract Types Allowed</InputLabel>
                <Select
                  labelId="contracts-label"
                  multiple
                  value={form.eligibilityContractTypesAllowed}
                  onChange={(e) => onChange('eligibilityContractTypesAllowed', e.target.value as string[])}
                  input={<OutlinedInput label="Contract Types Allowed" />}
                  renderValue={(selected) => {
                    const count = (selected as string[]).length;
                    if (count === 0) return 'No contract types selected';
                    if (count === 1) return '1 contract type selected';
                    return `${count} contract types selected`;
                  }}
                >
                  {contractTypeOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ mt: 1 }}>
          <Button
            variant="contained"
            type="submit"
            size="medium"
            disabled={loading}
            onClick={handleButtonClick}
            sx={(theme) => ({
              minWidth: 260,
              px: 4,
              py: 0.9,
              fontWeight: 600,
              backgroundColor: buttonActive
                ? theme.palette.success.main
                : theme.palette.common.white,
              color: buttonActive
                ? theme.palette.common.white
                : theme.palette.primary.main,
              borderRadius: 2,
              boxShadow: buttonActive ? theme.shadows[4] : theme.shadows[1],
              '&:hover': {
                backgroundColor: buttonActive
                  ? theme.palette.success.dark
                  : theme.palette.grey[100],
              },
            })}
          >
            {loading ? 'Submitting…' : 'Create Policy'}
          </Button>
          {success && (
            <CheckCircleOutlineIcon color="success" fontSize="medium" />
          )}
          {error && (
            <CancelOutlinedIcon color="error" fontSize="medium" />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
