'use client';

import React, { useState } from 'react';
import { Box, Stack, TextField, Button, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

import { getAccessToken } from '@/lib/auth-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  onCreated?: () => void;
};

export default function CreateLeaveCategoryForm({ onCreated }: Props) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onChange = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!API_BASE) throw new Error('API base URL is not configured');
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/leaves/leave-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
        }),
      });
      if (!res.ok) {
        const msg = `Failed (${res.status})`;
        throw new Error(msg);
      }
      setSuccess('Leave category created');
      setTimeout(() => setSuccess(null), 5000);
      setForm({ name: '', description: '' });
      onCreated?.();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create category');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Define a category to group related leave types.
        </Typography>
        <TextField
          fullWidth
          size="small"
          label="Name"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          required
        />
        <TextField
          fullWidth
          size="small"
          label="Description"
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          multiline
          minRows={2}
        />

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
          <Button variant="contained" type="submit" size="medium" disabled={loading}>
            {loading ? 'Creating…' : 'Create Leave Category'}
          </Button>
          {success && <CheckCircleOutlineIcon color="success" fontSize="medium" />}
          {error && <CancelOutlinedIcon color="error" fontSize="medium" />}
        </Stack>
      </Stack>
    </Box>
  );
}
