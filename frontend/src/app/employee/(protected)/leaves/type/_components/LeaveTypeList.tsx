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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  Collapse,
  Divider,
  Chip,
  Tooltip,
  Pagination,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const attachmentTypeOptions = [
  { value: 'medical', label: 'Medical' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' },
];

type LeaveType = {
  _id: string;
  code: string;
  name: string;
  categoryId?: string;
  description?: string;
  paid?: boolean;
  deductible?: boolean;
  requiresAttachment?: boolean;
  attachmentType?: string;
  minTenureMonths?: number;
  maxDurationDays?: number;
};

export default function LeaveTypeList() {
  const [items, setItems] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<LeaveType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);

  const [editForm, setEditForm] = useState({
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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/leave-types`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load leave types');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(item: LeaveType) {
    setEditItem(item);
    setEditForm({
      code: item.code ?? '',
      name: item.name ?? '',
      categoryId: item.categoryId ?? '',
      description: item.description ?? '',
      paid: item.paid ?? true,
      deductible: item.deductible ?? true,
      requiresAttachment: item.requiresAttachment ?? false,
      attachmentType: item.attachmentType ?? '',
      minTenureMonths: item.minTenureMonths?.toString() ?? '',
      maxDurationDays: item.maxDurationDays?.toString() ?? '',
    });
    setSaveError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setTimeout(() => setEditItem(null), 300);
  }

  async function handleSave() {
    if (!editItem) return;
    setSaveError(null);
    try {
      const payload: any = {
        code: editForm.code,
        name: editForm.name,
        categoryId: editForm.categoryId,
        description: editForm.description || undefined,
        attachmentType: editForm.attachmentType || undefined,
      };
      if (editForm.minTenureMonths !== '') payload.minTenureMonths = Number(editForm.minTenureMonths);
      if (editForm.maxDurationDays !== '') payload.maxDurationDays = Number(editForm.maxDurationDays);

      const res = await fetch(`${API_BASE}/leaves/leave-types/${editItem._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      closeDialog();
      load();
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to update leave type');
      setTimeout(() => setSaveError(null), 5000);
    }
  }

  function handleDeleteClick(id: string) {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/leaves/leave-types/${itemToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      load();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete leave type');
    }
  }

  const hasOpen = Boolean(openId);

  // Smoothly transition page size between 7 (no item open) and 5 (one item open)
  useEffect(() => {
    const targetSize = hasOpen ? 2 : 6;
    const timeout = window.setTimeout(() => {
      setPageSize(targetSize);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [hasOpen]);

  // Ensure opened item is always visible after pageSize change
  useEffect(() => {
    if (!openId) return;
    const idx = items.findIndex(i => i._id === openId);
    if (idx === -1) return;
    const pageForOpen = Math.floor(idx / pageSize) + 1;
    if (page !== pageForOpen) {
      setPage(pageForOpen);
    }
  }, [openId, pageSize, items, page]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Keep current page within valid range after page size or data changes
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        flex: 1,
        minHeight: 0,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Review and manage existing leave types and their configurations.
      </Typography>

      <Stack direction="row" alignItems="center" justifyContent="flex-end">
        <Tooltip title="Reload leave types from the server">
          <span>
            <Button
              size="small"
              variant="outlined"
              onClick={load}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {error && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <CancelOutlinedIcon color="error" fontSize="small" />
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Stack>
      )}

      <List
        dense
        sx={{
          pr: 0,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {paginatedItems.map((t) => {
          const isOpen = openId === t._id;
          return (
            <Box
              key={t._id}
              sx={(theme) => ({
                mb: isOpen ? 1.25 : hasOpen ? 0.5 : 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isOpen ? theme.palette.primary.light : theme.palette.divider,
                backgroundColor: isOpen
                  ? theme.vars
                    ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.04)`
                    : theme.palette.action.hover
                  : 'transparent',
                transition:
                  'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, margin 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.vars
                    ? `rgba(${theme.vars.palette.action.hoverOpacity} / 1)`
                    : theme.palette.action.hover,
                  boxShadow: theme.shadows[1],
                },
              })}
            >
              <ListItem
                component="div"
                onClick={() => setOpenId(isOpen ? null : t._id)}
                sx={{
                  py: isOpen ? 1.2 : hasOpen ? 0.6 : 1,
                  px: 2,
                  cursor: 'pointer',
                }}
              >
                <ListItemText
                  primary={`${t.code} — ${t.name}`}
                  primaryTypographyProps={{
                    fontWeight: isOpen ? 600 : 500,
                    noWrap: hasOpen && !isOpen,
                  }}
                  secondary={
                    isOpen || !hasOpen
                      ? `ID: ${t._id}${t.categoryId ? ' · Category: ' + t.categoryId : ''}`
                      : undefined
                  }
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                  }}
                />
              </ListItem>

              <Collapse in={isOpen} timeout="auto" collapsedSize={0} unmountOnExit>
                <Divider />
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="body2">
                      <strong>Code:</strong> {t.code}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {t.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Category ID:</strong> {t.categoryId ?? '—'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Description:</strong> {t.description ?? '—'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Paid:</strong> {t.paid ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Deductible:</strong> {t.deductible ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Requires Attachment:</strong> {t.requiresAttachment ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Attachment Type:</strong> {t.attachmentType ?? '—'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Min Tenure Months:</strong> {t.minTenureMonths ?? '—'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Max Duration Days:</strong> {t.maxDurationDays ?? '—'}
                    </Typography>

                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
                      <Tooltip title="Edit Leave Type">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<EditIcon />}
                          onClick={() => openEdit(t)}
                        >
                          Edit
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete Leave Type">
                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteClick(t._id)}
                        >
                          Delete
                        </Button>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          );
        })}

        {items.length === 0 && !loading && !error && (
          <ListItem disablePadding>
            <ListItemText primary="No leave types found" />
          </ListItem>
        )}
      </List>

      {items.length > pageSize && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, items.length)} of {items.length} leave types
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            size="small"
            color="primary"
          />
        </Stack>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Leave Type</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Edit this leave type&apos;s information and configuration.
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
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Category ID"
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Description"

                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
                    value={editForm.minTenureMonths}
                    onChange={(e) => setEditForm({ ...editForm, minTenureMonths: e.target.value })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Max Duration Days"
                    type="number"
                    value={editForm.maxDurationDays}
                    onChange={(e) => setEditForm({ ...editForm, maxDurationDays: e.target.value })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Attachment */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Attachment
              </Typography>
              <Grid container spacing={2} columns={12}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Attachment Type"
                    value={editForm.attachmentType}
                    onChange={(e) => setEditForm({ ...editForm, attachmentType: e.target.value })}
                  >
                    <MenuItem value="">(None)</MenuItem>
                    {attachmentTypeOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
              <Button variant="outlined" onClick={closeDialog}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}>Save</Button>
              {saveError && (
                <CancelOutlinedIcon color="error" fontSize="medium" />
              )}
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this leave type?
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
