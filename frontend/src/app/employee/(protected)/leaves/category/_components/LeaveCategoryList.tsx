'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Tooltip,
  Pagination,
  Divider,
} from '@mui/material';

import { getAccessToken } from '@/lib/auth-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type LeaveCategory = {
  _id: string;
  name: string;
  description?: string;
};

export default function LeaveCategoryList({ refreshToken = 0 }: { refreshToken?: number }) {
  const [items, setItems] = useState<LeaveCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<LeaveCategory | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (!API_BASE) throw new Error('API base URL is not configured');
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/leaves/leave-categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [refreshToken]);

  function openEdit(item: LeaveCategory) {
    setEditItem(item);
    setEditForm({ name: item.name ?? '', description: item.description ?? '' });
    setSaveError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setTimeout(() => setEditItem(null), 300);
  }

  async function handleSave() {
    if (!editItem) return;
    try {
      if (!API_BASE) throw new Error('API base URL is not configured');
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/leaves/leave-categories/${editItem._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      closeDialog();
      load();
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to update category');
      setTimeout(() => setSaveError(null), 5000);
    }
  }

  async function handleDelete(id: string) {
    try {
      if (!API_BASE) throw new Error('API base URL is not configured');
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/leaves/leave-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) throw new Error(`Failed (${res.status})`);
      load();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete category');
    }
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginated = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, minHeight: 0 }}>
      <Typography variant="body2" color="text.secondary">
        Review and manage categories that group your leave types.
      </Typography>

      <Stack direction="row" alignItems="center" justifyContent="flex-end">
        <Tooltip title="Reload categories from the server">
          <span>
            <Button size="small" variant="outlined" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {error && (
        <Typography variant="body2" color="error">{error}</Typography>
      )}

      <List dense sx={{ pr: 0, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {paginated.map((c) => (
          <Box key={c._id} sx={(theme) => ({
            mb: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: theme.palette.divider,
            transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              backgroundColor: theme.vars
                ? `rgba(${theme.vars.palette.action.hoverOpacity} / 1)`
                : theme.palette.action.hover,
              boxShadow: theme.shadows[1],
            },
          })}>
            <ListItem component="div" sx={{ py: 1, px: 2 }}>
              <ListItemText
                primary={c.name}
                secondary={c.description}
                primaryTypographyProps={{ fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
              />
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="text" onClick={() => openEdit(c)}>Edit</Button>
                <Button size="small" color="error" variant="text" onClick={() => handleDelete(c._id)}>Delete</Button>
              </Stack>
            </ListItem>
          </Box>
        ))}

        {items.length === 0 && !loading && !error && (
          <ListItem disablePadding><ListItemText primary="No categories found" /></ListItem>
        )}
      </List>

      {items.length > pageSize && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, items.length)} of {items.length} categories
          </Typography>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Leave Category</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, mb: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              multiline
              minRows={2}
            />
            {saveError && (
              <Typography variant="body2" color="error">{saveError}</Typography>
            )}
            <Divider />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" onClick={closeDialog}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}>Save</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
