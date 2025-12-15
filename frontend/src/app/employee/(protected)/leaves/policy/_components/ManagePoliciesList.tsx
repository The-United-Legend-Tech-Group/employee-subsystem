'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Alert,
  Stack,
  Collapse,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Pagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RuleIcon from '@mui/icons-material/Rule';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import ConfigurePolicySettingsForm from './ConfigurePolicySettingsForm';
import SetEligibilityRulesForm from './SetEligibilityRulesForm';
import ConfigureLeaveParametersForm from './ConfigureLeaveParametersForm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type Policy = {
  _id: string;
  name?: string;
  leaveTypeId?: string;
  accrualMethod?: string;
  monthlyRate?: number;
  yearlyRate?: number;
  carryForwardAllowed?: boolean;
  maxCarryForward?: number;
  expiryAfterMonths?: number;
  roundingRule?: string;
  minNoticeDays?: number;
  maxConsecutiveDays?: number;
  eligibility?: {
    minTenureMonths?: number;
    positionsAllowed?: string[];
    contractTypesAllowed?: string[];
  };
};

export default function ManagePoliciesList() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);

  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [eligibilityPolicy, setEligibilityPolicy] = useState<Policy | null>(null);
  const [eligibilityDialogOpen, setEligibilityDialogOpen] = useState(false);

  const [paramsPolicy, setParamsPolicy] = useState<Policy | null>(null);
  const [paramsDialogOpen, setParamsDialogOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/policies`);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleEditPolicy(policy: Policy) {
    setEditPolicy(policy);
    setEditDialogOpen(true);
  }

  function handleCloseEditDialog() {
    setEditDialogOpen(false);
    setTimeout(() => setEditPolicy(null), 300);
  }

  function handleSaved() {
    handleCloseEditDialog();
    load();
  }

  function handleDelete(policyId: string) {
    setDeleteId(policyId);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;

    try {
      const res = await fetch(`${API_BASE}/leaves/policies/${deleteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete policy');

      setDeleteDialogOpen(false);
      setDeleteId(null);
      load();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete policy');
    }
  }

  function handleSetEligibility(policy: Policy) {
    setEligibilityPolicy(policy);
    setEligibilityDialogOpen(true);
  }

  function handleCloseEligibilityDialog() {
    setEligibilityDialogOpen(false);
    setTimeout(() => setEligibilityPolicy(null), 300);
  }

  function handleEligibilitySaved() {
    handleCloseEligibilityDialog();
    load();
  }

  function handleSetParameters(policy: Policy) {
    setParamsPolicy(policy);
    setParamsDialogOpen(true);
  }

  function handleCloseParamsDialog() {
    setParamsDialogOpen(false);
    setTimeout(() => setParamsPolicy(null), 300);
  }

  function handleParamsSaved() {
    handleCloseParamsDialog();
    load();
  }

  const hasOpen = Boolean(openId);

  // Smoothly transition page size between 7 (no item open) and 5 (one item open)
  useEffect(() => {
    const targetSize = hasOpen ? 5 : 7;
    const timeout = window.setTimeout(() => {
      setPageSize(targetSize);
    }, 96);

    return () => window.clearTimeout(timeout);
  }, [hasOpen]);

  // Ensure opened item is always visible after pageSize change
  useEffect(() => {
    if (!openId) return;
    const idx = policies.findIndex(p => p._id === openId);
    if (idx === -1) return;
    const pageForOpen = Math.floor(idx / pageSize) + 1;
    if (page !== pageForOpen) {
      setPage(pageForOpen);
    }
  }, [openId, pageSize, policies, page]);

  const totalPages = Math.max(1, Math.ceil(policies.length / pageSize));

  // Keep current page within valid range after page size or data changes
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedPolicies = policies.slice((page - 1) * pageSize, page * pageSize);

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
        Review, configure, and maintain currently active leave policies.
      </Typography>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" fontWeight={600}>
          Existing Policies
        </Typography>
        <Tooltip title="Reload policies from the server">
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


      <List
        dense
        sx={{
          pr: 0,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {paginatedPolicies.map((p) => {
          const isOpen = openId === p._id;
          return (
            <Box
              key={p._id}
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
                onClick={() => setOpenId(isOpen ? null : p._id)}
                sx={{
                  py: isOpen ? 1.2 : hasOpen ? 0.6 : 1,
                  px: 2,
                  cursor: 'pointer',
                }}
              >
                <ListItemText
                  primary={p.name || 'Unnamed Policy'}
                  primaryTypographyProps={{
                    fontWeight: isOpen ? 600 : 500,
                    noWrap: hasOpen && !isOpen,
                  }}
                  secondary={
                    isOpen || !hasOpen
                      ? `ID: ${p._id} · LeaveType: ${p.leaveTypeId ?? 'N/A'}`
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
                      <strong>Accrual:</strong> {p.accrualMethod ?? '—'}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Monthly / Yearly:</strong> {p.monthlyRate ?? 0} / {p.yearlyRate ?? 0}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Carry Forward:</strong> {p.carryForwardAllowed ? 'Yes' : 'No'} (max {p.maxCarryForward ?? 0})
                    </Typography>

                    <Typography variant="body2">
                      <strong>Expiry (months):</strong> {p.expiryAfterMonths ?? '—'}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Rounding:</strong> {p.roundingRule ?? '—'}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Notice / Max Consecutive:</strong> {p.minNoticeDays ?? 0} / {p.maxConsecutiveDays ?? '—'}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Eligibility:</strong>{' '}
                      {p.eligibility
                        ? `Tenure ≥ ${p.eligibility.minTenureMonths ?? 0} months`
                        : '—'}
                    </Typography>

                    {p.eligibility?.positionsAllowed?.length ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {p.eligibility.positionsAllowed.map((pos) => (
                          <Chip key={pos} size="small" label={`Pos: ${pos}`} />
                        ))}
                      </Stack>
                    ) : null}

                    {p.eligibility?.contractTypesAllowed?.length ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {p.eligibility.contractTypesAllowed.map((ct) => (
                          <Chip key={ct} size="small" label={`Contract: ${ct}`} />
                        ))}
                      </Stack>
                    ) : null}

                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
                      <Tooltip title="Configure Leave Parameters">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<SettingsApplicationsIcon />}
                          onClick={() => handleSetParameters(p)}
                        >
                          Parameters
                        </Button>
                      </Tooltip>
                      <Tooltip title={p.eligibility ? 'Edit Eligibility Rules' : 'Set Eligibility Rules'}>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<RuleIcon />}
                          color={p.eligibility ? 'primary' : 'inherit'}
                          onClick={() => handleSetEligibility(p)}
                        >
                          Eligibility
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit Policy">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditPolicy(p)}
                        >
                          Edit
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete Policy">
                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(p._id)}
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

        {policies.length === 0 && !loading && !error && (
          <ListItem disablePadding>
            <ListItemText primary="No policies found" />
          </ListItem>
        )}
      </List>

      {policies.length > pageSize && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, policies.length)} of {policies.length} policies
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
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Policy Settings</DialogTitle>
        <DialogContent>
          {editPolicy && (
            <ConfigurePolicySettingsForm policy={editPolicy} onSaved={handleSaved} onCancel={handleCloseEditDialog} />
          )}
        </DialogContent>
      </Dialog>

      {/* Eligibility Rules Dialog */}
      <Dialog
        open={eligibilityDialogOpen}
        onClose={handleCloseEligibilityDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {eligibilityPolicy?.eligibility ? 'Edit Eligibility Rules' : 'Set Eligibility Rules'}
        </DialogTitle>
        <DialogContent>
          {eligibilityPolicy && (
            <SetEligibilityRulesForm
              policy={eligibilityPolicy}
              onSaved={handleEligibilitySaved}
              onCancel={handleCloseEligibilityDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Configure Leave Parameters Dialog */}
      <Dialog
        open={paramsDialogOpen}
        onClose={handleCloseParamsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure Leave Parameters</DialogTitle>
        <DialogContent>
          {paramsPolicy && paramsPolicy.leaveTypeId && (
            <ConfigureLeaveParametersForm
              leaveTypeId={paramsPolicy.leaveTypeId}
              minNoticeDays={paramsPolicy.minNoticeDays}
              maxDurationDays={paramsPolicy.maxConsecutiveDays}
              approvalFlowRoles={[]}
              onSaved={handleParamsSaved}
              onCancel={handleCloseParamsDialog}
            />
          )}
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
            Are you sure you want to delete this policy?
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
