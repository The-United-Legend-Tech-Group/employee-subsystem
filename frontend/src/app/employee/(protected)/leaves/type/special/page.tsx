'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Alert,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import Link from 'next/link';

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

const attachmentTypeOptions = [
  { value: 'medical', label: 'Medical' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' },
];

export default function SpecialLeaveTypesPage() {
  const [leaveTypeForm, setLeaveTypeForm] = useState({
    code: '',
    name: '',
    categoryId: '',
    description: '',
    paid: true,
    deductible: true,
    requiresAttachment: false,
    attachmentType: '',
    minTenureMonths: '',
    maxDurationDays: '',
  });
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);


  const [policyForm, setPolicyForm] = useState({
    accrualMethod: 'monthly',
    monthlyRate: '0',
    yearlyRate: '0',
    carryForwardAllowed: false,
    maxCarryForward: '0',
    minNoticeDays: '0',
    roundingRule: 'none',
    expiryAfterMonths: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toNumber(value: string) {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  // Load leave categories to select by name
  useEffect(() => {
    async function loadCategories() {
      if (!API_BASE) return;
      setLoadingCategories(true);
      setCategoriesError(null);
      try {
        const token = getAccessToken();
        const res = await fetch(`${API_BASE}/leaves/leave-categories`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
        const data = await res.json();
        const normalized = Array.isArray(data) ? data : [];
        setCategories(
          normalized.map((c: any) => ({
            _id: c._id,
            name: c.name ?? 'Unnamed category',
          })),
        );
      } catch (err: any) {
        setCategoriesError(err?.message ?? 'Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const leaveTypePayload: any = {
        code: leaveTypeForm.code,
        name: leaveTypeForm.name,
        categoryId: leaveTypeForm.categoryId,
        description: leaveTypeForm.description || undefined,
        paid: leaveTypeForm.paid,
        deductible: leaveTypeForm.deductible,
        requiresAttachment: leaveTypeForm.requiresAttachment,
        attachmentType: leaveTypeForm.attachmentType || undefined,
        minTenureMonths: toNumber(leaveTypeForm.minTenureMonths),
        maxDurationDays: toNumber(leaveTypeForm.maxDurationDays),
      };

      const policyPayload: any = {
        accrualMethod: policyForm.accrualMethod,
        monthlyRate: toNumber(policyForm.monthlyRate) ?? 0,
        yearlyRate: toNumber(policyForm.yearlyRate) ?? 0,
        carryForwardAllowed: policyForm.carryForwardAllowed,
        maxCarryForward: toNumber(policyForm.maxCarryForward) ?? 0,
        minNoticeDays: toNumber(policyForm.minNoticeDays) ?? 0,
        roundingRule: policyForm.roundingRule,
        expiryAfterMonths: toNumber(policyForm.expiryAfterMonths),
      };

      const payload = {
        leaveType: leaveTypePayload,
        policy: policyPayload,
      };

      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/leaves/special-leave-types-with-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to create special leave type' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      setSuccess(`Special leave type "${data.leaveType?.name}" created successfully with policy rules`);

      // Reset forms
      setLeaveTypeForm({
        code: '',
        name: '',
        categoryId: '',
        description: '',
        paid: true,
        deductible: true,
        requiresAttachment: false,
        attachmentType: '',
        minTenureMonths: '',
        maxDurationDays: '',
      });
      setPolicyForm({
        accrualMethod: 'monthly',
        monthlyRate: '0',
        yearlyRate: '0',
        carryForwardAllowed: false,
        maxCarryForward: '0',
        minNoticeDays: '0',
        roundingRule: 'none',
        expiryAfterMonths: '',
      });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create special leave type with rules');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2.5 },
        pb: 3,
        pt: 1,
        width: '100%',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Special Leave Types with Rules
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create and manage special absence or mission types with tailored policy rules.
        </Typography>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          component={Link}
          href="/employee/leaves/type"
          variant="outlined"
          size="small"
        >
          Back to Leave Types
        </Button>
      </Stack>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          mt: 0.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="flex-start"
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Leave Type Details
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Code"
                value={leaveTypeForm.code}
                onChange={(e) => setLeaveTypeForm((f) => ({ ...f, code: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Name"
                value={leaveTypeForm.name}
                onChange={(e) => setLeaveTypeForm((f) => ({ ...f, name: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                select
                fullWidth
                size="small"
                label="Category"
                value={leaveTypeForm.categoryId}
                onChange={(e) => setLeaveTypeForm((f) => ({ ...f, categoryId: e.target.value }))}
                required
                helperText={
                  categoriesError
                    ? categoriesError
                    : 'Select the category this leave type belongs to'
                }
                disabled={loadingCategories || !categories.length}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Description"
                value={leaveTypeForm.description}
                onChange={(e) => setLeaveTypeForm((f) => ({ ...f, description: e.target.value }))}
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Min Tenure Months"
                type="number"
                value={leaveTypeForm.minTenureMonths}
                onChange={(e) => setLeaveTypeForm((f) => ({ ...f, minTenureMonths: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Max Duration Days"
                type="number"
                value={leaveTypeForm.maxDurationDays}
                onChange={(e) => setLeaveTypeForm((f) => ({ ...f, maxDurationDays: e.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Attachment Type"
                value={leaveTypeForm.attachmentType}
                onChange={(e) => setLeaveTypeForm((f) => ({ ...f, attachmentType: e.target.value }))}
                fullWidth
              >
                <MenuItem value="">(None)</MenuItem>
                {attachmentTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={leaveTypeForm.paid}
                    onChange={(e) => setLeaveTypeForm((f) => ({ ...f, paid: e.target.checked }))}
                  />
                }
                label="Paid"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={leaveTypeForm.deductible}
                    onChange={(e) => setLeaveTypeForm((f) => ({ ...f, deductible: e.target.checked }))}
                  />
                }
                label="Deductible"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={leaveTypeForm.requiresAttachment}
                    onChange={(e) => setLeaveTypeForm((f) => ({ ...f, requiresAttachment: e.target.checked }))}
                  />
                }
                label="Requires Attachment"
              />
            </Stack>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Policy Rules
            </Typography>
            <Stack spacing={2}>
              <TextField
                select
                label="Accrual Method"
                value={policyForm.accrualMethod}
                onChange={(e) => setPolicyForm((f) => ({ ...f, accrualMethod: e.target.value }))}
                fullWidth
              >
                {accrualOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Monthly Rate"
                type="number"
                value={policyForm.monthlyRate}
                onChange={(e) => setPolicyForm((f) => ({ ...f, monthlyRate: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Yearly Rate"
                type="number"
                value={policyForm.yearlyRate}
                onChange={(e) => setPolicyForm((f) => ({ ...f, yearlyRate: e.target.value }))}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={policyForm.carryForwardAllowed}
                    onChange={(e) => setPolicyForm((f) => ({ ...f, carryForwardAllowed: e.target.checked }))}
                  />
                }
                label="Carry Forward Allowed"
              />
              <TextField
                label="Max Carry Forward"
                type="number"
                value={policyForm.maxCarryForward}
                onChange={(e) => setPolicyForm((f) => ({ ...f, maxCarryForward: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Min Notice Days"
                type="number"
                value={policyForm.minNoticeDays}
                onChange={(e) => setPolicyForm((f) => ({ ...f, minNoticeDays: e.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Rounding Rule"
                value={policyForm.roundingRule}
                onChange={(e) => setPolicyForm((f) => ({ ...f, roundingRule: e.target.value }))}
                fullWidth
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
                value={policyForm.expiryAfterMonths}
                onChange={(e) => setPolicyForm((f) => ({ ...f, expiryAfterMonths: e.target.value }))}
                fullWidth
              />
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ mt: 2, maxWidth: 360 }}>
          <Button variant="contained" type="submit" disabled={loading} fullWidth>
            {loading ? 'Creating…' : 'Create Special Leave Type with Rules'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

