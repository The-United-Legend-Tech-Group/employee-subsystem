'use client';

import React, { useEffect, useState } from 'react';
import { Box, Stack, TextField, Button, Typography, MenuItem, FormControlLabel, Checkbox, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const attachmentTypeOptions = [
  { value: 'medical', label: 'Medical' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' },
];

type Props = {
  onCreated?: () => void;
};

export default function CreateLeaveTypeForm({ onCreated }: Props) {
  const [form, setForm] = useState({
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [buttonActive, setButtonActive] = useState(false);

  const onChange = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  function handleButtonClick() {
    setButtonActive(true);
    setTimeout(() => {
      setButtonActive(false);
    }, 1000);
  }

  // Load leave categories to select by name
  useEffect(() => {
    async function loadCategories() {
      if (!API_BASE) return;
      setLoadingCategories(true);
      setCategoriesError(null);
      try {
        const res = await fetch(`${API_BASE}/leaves/leave-categories`, {
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
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: any = {
        code: form.code,
        name: form.name,
        categoryId: form.categoryId,
        description: form.description || undefined,
        paid: form.paid,
        deductible: form.deductible,
        requiresAttachment: form.requiresAttachment,
        attachmentType: form.attachmentType || undefined,
        minTenureMonths: form.minTenureMonths ? Number(form.minTenureMonths) : undefined,
        maxDurationDays: form.maxDurationDays ? Number(form.maxDurationDays) : undefined,
      };
      const res = await fetch(`${API_BASE}/leaves/leave-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setSuccess('Leave type created');
      setTimeout(() => setSuccess(null), 5000);
      setForm({
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
      if (onCreated) onCreated();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create leave type');
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
        gap: 1,
        flex: 1,
      }}
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Create a new leave type with its configuration and requirements.
        </Typography>

        {/* Basic Details */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Basic Details
          </Typography>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Code"
                value={form.code}
                onChange={(e) => onChange('code', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Category"
                value={form.categoryId}
                onChange={(e) => onChange('categoryId', e.target.value)}
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
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Description"
                value={form.description}
                onChange={(e) => onChange('description', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Duration & Tenure */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Duration & Tenure
          </Typography>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Min Tenure Months"
                type="number"
                value={form.minTenureMonths}
                onChange={(e) => onChange('minTenureMonths', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Max Duration Days"
                type="number"
                value={form.maxDurationDays}
                onChange={(e) => onChange('maxDurationDays', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Attachment & Requirements */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Attachment & Requirements
          </Typography>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12 }}>
        <TextField
          select
                fullWidth
                size="small"
          label="Attachment Type"
          value={form.attachmentType}
          onChange={(e) => onChange('attachmentType', e.target.value)}
          required
        >
          <MenuItem value="">(None)</MenuItem>
          {attachmentTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
          ))}
        </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.requiresAttachment}
                    onChange={(e) => onChange('requiresAttachment', e.target.checked)}
                  />
                }
                label="Requires attachment"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Leave Properties */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Leave Properties
          </Typography>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.paid}
                    onChange={(e) => onChange('paid', e.target.checked)}
                  />
                }
                label="Paid leave"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.deductible}
                    onChange={(e) => onChange('deductible', e.target.checked)}
                  />
                }
                label="Deductible"
              />
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
            {loading ? 'Creating…' : 'Create Leave Type'}
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
