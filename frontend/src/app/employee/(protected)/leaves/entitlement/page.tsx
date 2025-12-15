'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const adjustmentOptions = [
  { value: 'add', label: 'Add' },
  { value: 'deduct', label: 'Deduct' },
  { value: 'encashment', label: 'Encashment' },
];

type Adjustment = {
  _id: string;
  employeeId: string;
  leaveTypeId: string;
  adjustmentType: string;
  amount: number;
  reason: string;
  hrUserId: string;
  createdAt?: string;
  updatedAt?: string;
};

type Entitlement = {
  _id: string;
  employeeId: string;
  leaveTypeId: string;
  yearlyEntitlement: number;
  accruedActual: number;
  accruedRounded: number;
  carryForward: number;
  taken: number;
  pending: number;
  remaining: number;
  nextResetDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function EntitlementPage() {
  // Entitlement Recalc Form State
  const [recalcForm, setRecalcForm] = useState({
    employeeId: '',
    leaveTypeId: '',
  });
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcError, setRecalcError] = useState<string | null>(null);
  const [recalcSuccess, setRecalcSuccess] = useState<string | null>(null);

  // Assign Personalized Entitlement Form State
  const [personalizedForm, setPersonalizedForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    overrideYearlyEntitlement: '',
    extraDays: '',
    hrUserId: '',
    adjustmentType: 'add',
    reason: '',
  });
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [personalizedError, setPersonalizedError] = useState<string | null>(null);
  const [personalizedSuccess, setPersonalizedSuccess] = useState<string | null>(null);

  // Annual Reset Form State
  const [annualResetForm, setAnnualResetForm] = useState({
    year: new Date().getFullYear().toString(),
    employeeIds: [] as string[],
    leaveTypeIds: [] as string[],
  });
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newLeaveTypeId, setNewLeaveTypeId] = useState('');
  const [annualResetLoading, setAnnualResetLoading] = useState(false);
  const [annualResetSuccess, setAnnualResetSuccess] = useState<string | null>(null);
  const [annualResetError, setAnnualResetError] = useState<string | null>(null);

  // Manual Balance Adjustment Form State
  const [adjustmentForm, setAdjustmentForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    adjustmentType: 'add',
    amount: '',
    reason: '',
    hrUserId: '',
  });
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState<string | null>(null);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  // Adjustment History Form State
  const [historyEmployeeId, setHistoryEmployeeId] = useState('');
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // View Entitlements Form State
  const [entitlementsEmployeeId, setEntitlementsEmployeeId] = useState('');
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [entitlementsLoading, setEntitlementsLoading] = useState(false);
  const [entitlementsError, setEntitlementsError] = useState<string | null>(null);

  // UI state for which section is visible
  const [activeSection, setActiveSection] = useState(
    'recalc',
  );

  // Helper Functions
  function toNumber(value: string | number) {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  function getAdjustmentColor(type: string) {
    switch (type) {
      case 'add':
        return 'success';
      case 'deduct':
        return 'error';
      case 'encashment':
        return 'warning';
      default:
        return 'default';
    }
  }

  // Entitlement Recalc Handlers
  async function handleRecalcSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRecalcError(null);
    setRecalcSuccess(null);
    setRecalcLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/leaves/update-entitlement-internal/${recalcForm.employeeId}/${recalcForm.leaveTypeId}`,
        { method: 'PATCH' }
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setRecalcSuccess('Entitlement recalculated and updated successfully');
      setTimeout(() => setRecalcSuccess(null), 5000);
      setRecalcForm({ employeeId: '', leaveTypeId: '' });
    } catch (err: any) {
      setRecalcError(err?.message ?? 'Failed to update entitlement');
      setTimeout(() => setRecalcError(null), 5000);
    } finally {
      setRecalcLoading(false);
    }
  }

  // Assign Personalized Entitlement Handlers
  async function handlePersonalizedSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPersonalizedError(null);
    setPersonalizedSuccess(null);
    setPersonalizedLoading(true);
    try {
      const payload: any = {
        employeeId: personalizedForm.employeeId,
        leaveTypeId: personalizedForm.leaveTypeId,
        hrUserId: personalizedForm.hrUserId,
        adjustmentType: personalizedForm.adjustmentType,
        reason: personalizedForm.reason,
      };

      const override = toNumber(personalizedForm.overrideYearlyEntitlement);
      const extra = toNumber(personalizedForm.extraDays);
      if (override !== undefined) payload.overrideYearlyEntitlement = override;
      if (extra !== undefined) payload.extraDays = extra;

      const res = await fetch(`${API_BASE}/leaves/personalized-entitlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to assign entitlement' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setPersonalizedSuccess('Personalized entitlement assigned successfully');
      setTimeout(() => setPersonalizedSuccess(null), 5000);
      setPersonalizedForm((f) => ({ ...f, overrideYearlyEntitlement: '', extraDays: '' }));
    } catch (err: any) {
      setPersonalizedError(err?.message ?? 'Failed to assign entitlement');
      setTimeout(() => setPersonalizedError(null), 5000);
    } finally {
      setPersonalizedLoading(false);
    }
  }

  // Annual Reset Handlers
  function addEmployeeId() {
    if (newEmployeeId.trim()) {
      setAnnualResetForm((f) => ({ ...f, employeeIds: [...f.employeeIds, newEmployeeId.trim()] }));
      setNewEmployeeId('');
    }
  }

  function removeEmployeeId(index: number) {
    setAnnualResetForm((f) => ({ ...f, employeeIds: f.employeeIds.filter((_, i) => i !== index) }));
  }

  function addLeaveTypeId() {
    if (newLeaveTypeId.trim()) {
      setAnnualResetForm((f) => ({ ...f, leaveTypeIds: [...f.leaveTypeIds, newLeaveTypeId.trim()] }));
      setNewLeaveTypeId('');
    }
  }

  function removeLeaveTypeId(index: number) {
    setAnnualResetForm((f) => ({ ...f, leaveTypeIds: f.leaveTypeIds.filter((_, i) => i !== index) }));
  }

  async function handleAnnualResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAnnualResetError(null);
    setAnnualResetSuccess(null);
    setAnnualResetLoading(true);
    try {
      const payload: any = {};
      if (annualResetForm.year) payload.year = Number(annualResetForm.year);
      if (annualResetForm.employeeIds.length > 0) payload.employeeIds = annualResetForm.employeeIds;
      if (annualResetForm.leaveTypeIds.length > 0) payload.leaveTypeIds = annualResetForm.leaveTypeIds;

      const res = await fetch(`${API_BASE}/leaves/execute-annual-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to execute annual reset' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setAnnualResetSuccess('Annual reset completed successfully');
      setTimeout(() => setAnnualResetSuccess(null), 5000);
      setAnnualResetForm({
        year: new Date().getFullYear().toString(),
        employeeIds: [],
        leaveTypeIds: [],
      });
    } catch (err: any) {
      setAnnualResetError(err?.message ?? 'Failed to execute annual reset');
      setTimeout(() => setAnnualResetError(null), 5000);
    } finally {
      setAnnualResetLoading(false);
    }
  }

  // Manual Balance Adjustment Handlers
  async function handleAdjustmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAdjustmentError(null);
    setAdjustmentSuccess(null);
    setAdjustmentLoading(true);
    try {
      const payload = {
        employeeId: adjustmentForm.employeeId,
        leaveTypeId: adjustmentForm.leaveTypeId,
        adjustmentType: adjustmentForm.adjustmentType,
        amount: Number(adjustmentForm.amount),
        reason: adjustmentForm.reason,
        hrUserId: adjustmentForm.hrUserId,
      };

      const res = await fetch(`${API_BASE}/leaves/manual-adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to create adjustment' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setAdjustmentSuccess('Manual balance adjustment created successfully');
      setTimeout(() => setAdjustmentSuccess(null), 5000);
      setAdjustmentForm((f) => ({ ...f, amount: '', reason: '' }));
    } catch (err: any) {
      setAdjustmentError(err?.message ?? 'Failed to create manual adjustment');
      setTimeout(() => setAdjustmentError(null), 5000);
    } finally {
      setAdjustmentLoading(false);
    }
  }

  // Adjustment History Handlers
  async function handleLoadHistory() {
    if (!historyEmployeeId.trim()) {
      setHistoryError('Please enter an Employee ID');
      return;
    }

    setHistoryError(null);
    setAdjustments([]);
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaves/adjustment-history/${historyEmployeeId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setHistoryError(`No adjustment history found for employee: ${historyEmployeeId}`);
        } else {
          throw new Error(`Failed (${res.status})`);
        }
        return;
      }
      const data = await res.json();
      setAdjustments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setHistoryError(err?.message ?? 'Failed to load adjustment history');
    } finally {
      setHistoryLoading(false);
    }
  }

  // View Entitlements Handlers
  async function handleLoadEntitlements() {
    if (!entitlementsEmployeeId.trim()) {
      setEntitlementsError('Please enter an Employee ID');
      return;
    }

    setEntitlementsError(null);
    setEntitlements([]);
    setEntitlementsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaves/leave-entitlements/${entitlementsEmployeeId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setEntitlementsError(`No entitlements found for employee: ${entitlementsEmployeeId}`);
        } else {
          throw new Error(`Failed (${res.status})`);
        }
        return;
      }
      const data = await res.json();
      setEntitlements(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setEntitlementsError(err?.message ?? 'Failed to load entitlements');
    } finally {
      setEntitlementsLoading(false);
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
          Entitlement Maintenance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage leave entitlements, adjustments, and annual resets.
        </Typography>
      </Box>

      <Box
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={activeSection}
          onChange={(_, value) => setActiveSection(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Recalculate" value="recalc" />
          <Tab label="Personalized Entitlement" value="personalized" />
          <Tab label="Annual Reset" value="annualReset" />
          <Tab label="Manual Adjustment" value="adjustment" />
          <Tab label="Adjustment History" value="history" />
          <Tab label="View Entitlements" value="entitlements" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {/* Recalculate Entitlement */}
        {activeSection === 'recalc' && (
          <Grid component="div" size={{ xs: 12, md: 8 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={600}>
                Recalculate Entitlement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quickly trigger a recalculation for a specific employee and leave type.
              </Typography>
              <Box component="form" onSubmit={handleRecalcSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Employee ID"
                    value={recalcForm.employeeId}
                    onChange={(e) => setRecalcForm((f) => ({ ...f, employeeId: e.target.value }))}
                    required
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Leave Type ID"
                    value={recalcForm.leaveTypeId}
                    onChange={(e) => setRecalcForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
                    required
                    fullWidth
                    size="small"
                  />
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={recalcLoading}
                    sx={{
                      alignSelf: 'flex-start',
                      px: 4,
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {recalcLoading ? 'Updating…' : 'Update Entitlement'}
                  </Button>
                  {recalcSuccess && (
                    <CheckCircleOutlineIcon color="success" fontSize="medium" />
                  )}
                  {recalcError && (
                    <CancelOutlinedIcon color="error" fontSize="medium" />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Grid>
        )}

        {/* Assign Personalized Entitlement */}
        {activeSection === 'personalized' && (
          <Grid component="div" size={{ xs: 12, md: 10 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={600}>
                Assign Personalized Entitlement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Override yearly allowance or add a one-time adjustment, with a clear audit reason.
              </Typography>
              <Box component="form" onSubmit={handlePersonalizedSubmit}>
                <Grid container spacing={2} columns={12}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Employee ID"
                        value={personalizedForm.employeeId}
                        onChange={(e) =>
                          setPersonalizedForm((f) => ({ ...f, employeeId: e.target.value }))
                        }
                        required
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Leave Type ID"
                        value={personalizedForm.leaveTypeId}
                        onChange={(e) =>
                          setPersonalizedForm((f) => ({ ...f, leaveTypeId: e.target.value }))
                        }
                        required
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Override Yearly Entitlement"
                        type="number"
                        value={personalizedForm.overrideYearlyEntitlement}
                        onChange={(e) =>
                          setPersonalizedForm((f) => ({
                            ...f,
                            overrideYearlyEntitlement: e.target.value,
                          }))
                        }
                        placeholder="Optional – replaces yearly entitlement"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Amount"
                        type="number"
                        value={personalizedForm.extraDays}
                        onChange={(e) =>
                          setPersonalizedForm((f) => ({ ...f, extraDays: e.target.value }))
                        }
                        placeholder="Amount to add / deduct / encash"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="HR User ID"
                        value={personalizedForm.hrUserId}
                        onChange={(e) =>
                          setPersonalizedForm((f) => ({ ...f, hrUserId: e.target.value }))
                        }
                        required
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="personalized-adjustmentType-label">
                          Adjustment Type
                        </InputLabel>
                        <Select
                          labelId="personalized-adjustmentType-label"
                          label="Adjustment Type"
                          value={personalizedForm.adjustmentType}
                          onChange={(e) =>
                            setPersonalizedForm((f) => ({
                              ...f,
                              adjustmentType: e.target.value,
                            }))
                          }
                          required
                        >
                          {adjustmentOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Reason"
                        value={personalizedForm.reason}
                        onChange={(e) =>
                          setPersonalizedForm((f) => ({ ...f, reason: e.target.value }))
                        }
                        required
                        multiline
                        minRows={3}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={personalizedLoading}
                    sx={{
                      alignSelf: 'flex-start',
                      px: 4,
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {personalizedLoading ? 'Submitting…' : 'Assign Entitlement'}
                  </Button>
                  {personalizedSuccess && (
                    <CheckCircleOutlineIcon color="success" fontSize="medium" />
                  )}
                  {personalizedError && (
                    <CancelOutlinedIcon color="error" fontSize="medium" />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Grid>
        )}

        {/* Execute Annual Reset */}
        {activeSection === 'annualReset' && (
          <Grid component="div" size={{ xs: 12, md: 10 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={600}>
                Execute Annual Reset
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reset balances for a specific year, optionally narrowed to certain employees and leave types.
              </Typography>
              <Box component="form" onSubmit={handleAnnualResetSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Year"
                    type="number"
                    value={annualResetForm.year}
                    onChange={(e) =>
                      setAnnualResetForm((f) => ({ ...f, year: e.target.value }))
                    }
                    fullWidth
                    helperText="Leave empty to use current year"
                    size="small"
                  />
                    <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Employee IDs (Optional - leave empty for all employees)
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1}>
                      <TextField
                        size="small"
                        placeholder="Employee ID"
                        value={newEmployeeId}
                        onChange={(e) => setNewEmployeeId(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEmployeeId();
                          }
                        }}
                        sx={{ flex: 1 }}
                      />
                      <IconButton onClick={addEmployeeId} color="primary">
                        <AddIcon />
                      </IconButton>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {annualResetForm.employeeIds.map((id, idx) => (
                        <Chip
                          key={idx}
                          label={id}
                          onDelete={() => removeEmployeeId(idx)}
                          deleteIcon={<DeleteIcon />}
                          size="small"
                        />
                      ))}
                    </Stack>
                    </Box>
                    <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Leave Type IDs (Optional - leave empty for all leave types)
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1}>
                      <TextField
                        size="small"
                        placeholder="Leave Type ID"
                        value={newLeaveTypeId}
                        onChange={(e) => setNewLeaveTypeId(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addLeaveTypeId();
                          }
                        }}
                        sx={{ flex: 1 }}
                      />
                      <IconButton onClick={addLeaveTypeId} color="primary">
                        <AddIcon />
                      </IconButton>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {annualResetForm.leaveTypeIds.map((id, idx) => (
                        <Chip
                          key={idx}
                          label={id}
                          onDelete={() => removeLeaveTypeId(idx)}
                          deleteIcon={<DeleteIcon />}
                          size="small"
                        />
                      ))}
                    </Stack>
                    </Box>
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={annualResetLoading}
                      sx={{
                        alignSelf: 'flex-start',
                        px: 4,
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: 'common.white',
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'grey.100',
                        },
                      }}
                    >
                      {annualResetLoading ? 'Executing…' : 'Execute Annual Reset'}
                    </Button>
                    {annualResetSuccess && (
                      <CheckCircleOutlineIcon color="success" fontSize="medium" />
                    )}
                    {annualResetError && (
                      <CancelOutlinedIcon color="error" fontSize="medium" />
                    )}
                  </Stack>
                </Box>
            </Stack>
          </Grid>
        )}

        {/* Manual Balance Adjustment */}
        {activeSection === 'adjustment' && (
          <Grid component="div" size={{ xs: 12, md: 8 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={600}>
                Manual Balance Adjustment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manually adjust an employee&apos;s leave balance with a clear rationale.
              </Typography>
              <Box component="form" onSubmit={handleAdjustmentSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Employee ID"
                    value={adjustmentForm.employeeId}
                    onChange={(e) =>
                      setAdjustmentForm((f) => ({ ...f, employeeId: e.target.value }))
                    }
                    required
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Leave Type ID"
                    value={adjustmentForm.leaveTypeId}
                    onChange={(e) =>
                      setAdjustmentForm((f) => ({ ...f, leaveTypeId: e.target.value }))
                    }
                    required
                    fullWidth
                    size="small"
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel id="adjustment-adjustmentType-label">Adjustment Type</InputLabel>
                    <Select
                      labelId="adjustment-adjustmentType-label"
                      label="Adjustment Type"
                      value={adjustmentForm.adjustmentType}
                      onChange={(e) =>
                        setAdjustmentForm((f) => ({ ...f, adjustmentType: e.target.value }))
                      }
                      required
                    >
                      {adjustmentOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Amount"
                    type="number"
                    value={adjustmentForm.amount}
                    onChange={(e) =>
                      setAdjustmentForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    required
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="HR User ID"
                    value={adjustmentForm.hrUserId}
                    onChange={(e) =>
                      setAdjustmentForm((f) => ({ ...f, hrUserId: e.target.value }))
                    }
                    required
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Reason"
                    value={adjustmentForm.reason}
                    onChange={(e) =>
                      setAdjustmentForm((f) => ({ ...f, reason: e.target.value }))
                    }
                    required
                    multiline
                    minRows={2}
                    fullWidth
                    size="small"
                  />
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={adjustmentLoading}
                    sx={{
                      alignSelf: 'flex-start',
                      px: 4,
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {adjustmentLoading ? 'Submitting…' : 'Create Adjustment'}
                  </Button>
                  {adjustmentSuccess && (
                    <CheckCircleOutlineIcon color="success" fontSize="medium" />
                  )}
                  {adjustmentError && (
                    <CancelOutlinedIcon color="error" fontSize="medium" />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Grid>
        )}

        {/* Adjustment History */}
        {activeSection === 'history' && (
        <Grid component="div" size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Adjustment History
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Employee ID"
                    value={historyEmployeeId}
                    onChange={(e) => setHistoryEmployeeId(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    placeholder="Enter Employee ID"
                  />
                  <Button variant="outlined" onClick={handleLoadHistory} disabled={historyLoading || !historyEmployeeId.trim()}>
                    {historyLoading ? <CircularProgress size={20} /> : 'Load'}
                  </Button>
                </Stack>
                {historyError && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CancelOutlinedIcon color="error" fontSize="small" />
                    <Typography variant="body2" color="error">
                      {historyError}
                    </Typography>
                  </Stack>
                )}
                {adjustments.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Found {adjustments.length} adjustment(s)
                    </Typography>
                    <Stack spacing={2} mt={1}>
                      {adjustments.map((adj) => (
                        <Box
                          key={adj._id}
                          sx={{
                            p: 2,
                            border: '1px solid #eee',
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
                              <Chip
                                label={adj.adjustmentType.toUpperCase()}
                                color={getAdjustmentColor(adj.adjustmentType) as any}
                                size="small"
                              />
                              <Typography variant="body2" fontWeight={600}>
                                Amount: {adj.amount}
                              </Typography>
                            </Stack>
                            <Typography variant="body2">
                              <strong>Leave Type ID:</strong> {adj.leaveTypeId}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Reason:</strong> {adj.reason}
                            </Typography>
                            <Typography variant="body2">
                              <strong>HR User ID:</strong> {adj.hrUserId}
                            </Typography>
                            {adj.createdAt && (
                              <Typography variant="caption" color="text.secondary">
                                Created: {new Date(adj.createdAt).toLocaleString()}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
                {adjustments.length === 0 && !historyLoading && !historyError && historyEmployeeId && (
                  <Typography variant="body2" color="text.secondary">
                    No adjustments found for this employee.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        )}

        {/* View Leave Entitlements */}
        {activeSection === 'entitlements' && (
        <Grid component="div" size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                View Leave Entitlements
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Employee ID"
                    value={entitlementsEmployeeId}
                    onChange={(e) => setEntitlementsEmployeeId(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    placeholder="Enter Employee ID"
                  />
                  <Button variant="outlined" onClick={handleLoadEntitlements} disabled={entitlementsLoading || !entitlementsEmployeeId.trim()}>
                    {entitlementsLoading ? <CircularProgress size={20} /> : 'Load'}
                  </Button>
                </Stack>
                {entitlementsError && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CancelOutlinedIcon color="error" fontSize="small" />
                    <Typography variant="body2" color="error">
                      {entitlementsError}
                    </Typography>
                  </Stack>
                )}
                {entitlements.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Found {entitlements.length} entitlement(s)
                    </Typography>
                    <Stack spacing={2} mt={1}>
                      {entitlements.map((ent) => (
                        <Box
                          key={ent._id}
                          sx={{
                            p: 2,
                            border: '1px solid #eee',
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Stack spacing={1}>
                            <Typography variant="body2" fontWeight={600}>
                              Leave Type ID: {ent.leaveTypeId}
                            </Typography>
                            <Divider />
                            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                              <Chip label={`Yearly: ${ent.yearlyEntitlement}`} size="small" />
                              <Chip label={`Remaining: ${ent.remaining}`} color="success" size="small" />
                              <Chip label={`Taken: ${ent.taken}`} color="error" size="small" />
                              <Chip label={`Pending: ${ent.pending}`} color="warning" size="small" />
                            </Stack>
                            <Stack spacing={0.5} mt={1}>
                              <Typography variant="body2">
                                <strong>Accrued (Actual):</strong> {ent.accruedActual}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Accrued (Rounded):</strong> {ent.accruedRounded}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Carry Forward:</strong> {ent.carryForward}
                              </Typography>
                              {ent.nextResetDate && (
                                <Typography variant="body2">
                                  <strong>Next Reset:</strong> {new Date(ent.nextResetDate).toLocaleDateString()}
                                </Typography>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
                {entitlements.length === 0 && !entitlementsLoading && !entitlementsError && entitlementsEmployeeId && (
                  <Typography variant="body2" color="text.secondary">
                    No entitlements found for this employee.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        )}
      </Grid>
    </Box>
  );
}
