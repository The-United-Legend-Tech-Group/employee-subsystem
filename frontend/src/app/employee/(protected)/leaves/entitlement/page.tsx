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
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab,
  Autocomplete,
  Checkbox,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const adjustmentOptions = [
  { value: 'add', label: 'Add' },
  { value: 'deduct', label: 'Deduct' },
  { value: 'encashment', label: 'Encashment' },
];

type EmployeeOption = {
  _id: string;
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
};

type LeaveTypeOption = {
  _id: string;
  code: string;
  name: string;
};

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

  // Shared leave types (one fetch)
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [leaveTypesError, setLeaveTypesError] = useState<string | null>(null);

  // Helper Functions
  function toNumber(value: string | number) {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  // Helper to decode JWT token and get current user ID
  const getCurrentUserId = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId || payload.employeeId;
    } catch (err) {
      console.error('Failed to decode token:', err);
      return null;
    }
  };

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

  function getEmployeeLabel(emp: EmployeeOption) {
    if (!emp) return '';
    return emp.employeeNumber || emp._id;
  }

  function getLeaveTypeLabel(lt: LeaveTypeOption) {
    if (!lt) return '';
    if (lt.code && lt.name) return `${lt.code} — ${lt.name}`;
    return lt.code || lt.name || lt._id;
  }

  function ensureLeaveTypeOption(id: string) {
    if (!id) return null;
    return leaveTypes.find((lt) => lt._id === id) ?? { _id: id, code: id, name: id } as LeaveTypeOption;
  }

  async function loadLeaveTypes() {
    if (!API_BASE) return;
    setLeaveTypesLoading(true);
    setLeaveTypesError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/leaves/leave-types`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`Failed to load leave types (${res.status})`);
      const data = await res.json();
      setLeaveTypes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setLeaveTypesError(err?.message ?? 'Failed to load leave types');
    } finally {
      setLeaveTypesLoading(false);
    }
  }

  function useEmployeeLookup() {
    const [options, setOptions] = React.useState<EmployeeOption[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const load = React.useCallback(async (search = '') => {
      if (!API_BASE) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        query.append('limit', '50');

        const res = await fetch(`${API_BASE}/employee?${query.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) throw new Error(`Failed to load employees (${res.status})`);
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || data.data || [];
        setOptions(items);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load employees');
      } finally {
        setLoading(false);
      }
    }, []);

    React.useEffect(() => {
      load();
    }, [load]);

    const ensureOption = React.useCallback(
      (id: string) => {
        if (!id) return null;
        return options.find((e) => e._id === id) ?? { _id: id } as EmployeeOption;
      },
      [options],
    );

    return { options, loading, error, load, ensureOption };
  }

  React.useEffect(() => {
    loadLeaveTypes();
  }, []);

  const autoNoIcons = {
    popupIndicator: { sx: { display: 'none' } },
    clearIndicator: { sx: { display: 'none' } },
  } as const;

  // Entitlement Recalc Handlers
  async function handleRecalcSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRecalcError(null);
    setRecalcSuccess(null);
    setRecalcLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(
        `${API_BASE}/leaves/update-entitlement-internal/${recalcForm.employeeId}/${recalcForm.leaveTypeId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
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

  const recalcEmployees = useEmployeeLookup();
  const personalizedEmployees = useEmployeeLookup();
  const annualResetEmployees = useEmployeeLookup();
  const adjustmentEmployees = useEmployeeLookup();
  const historyEmployees = useEmployeeLookup();
  const entitlementEmployees = useEmployeeLookup();

  // Assign Personalized Entitlement Handlers
  async function handlePersonalizedSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPersonalizedError(null);
    setPersonalizedSuccess(null);
    setPersonalizedLoading(true);
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        setPersonalizedError('Unable to identify current user. Please log in again.');
        setPersonalizedLoading(false);
        return;
      }

      const payload: any = {
        employeeId: personalizedForm.employeeId,
        leaveTypeId: personalizedForm.leaveTypeId,
        hrUserId: currentUserId,
        adjustmentType: personalizedForm.adjustmentType,
        reason: personalizedForm.reason,
      };

      const override = toNumber(personalizedForm.overrideYearlyEntitlement);
      const extra = toNumber(personalizedForm.extraDays);
      if (override !== undefined) payload.overrideYearlyEntitlement = override;
      if (extra !== undefined) payload.extraDays = extra;

      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/leaves/personalized-entitlement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/leaves/execute-annual-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        setAdjustmentError('Unable to identify current user. Please log in again.');
        setAdjustmentLoading(false);
        return;
      }

      const payload = {
        employeeId: adjustmentForm.employeeId,
        leaveTypeId: adjustmentForm.leaveTypeId,
        adjustmentType: adjustmentForm.adjustmentType,
        amount: Number(adjustmentForm.amount),
        reason: adjustmentForm.reason,
        hrUserId: currentUserId,
      };

      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/leaves/manual-adjustment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/leaves/adjustment-history/${historyEmployeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/leaves/leave-entitlements/${entitlementsEmployeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
          Entitlement Management
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
                  <Autocomplete
                    options={recalcEmployees.options}
                    loading={recalcEmployees.loading}
                    getOptionLabel={getEmployeeLabel}
                    value={recalcEmployees.ensureOption(recalcForm.employeeId)}
                    isOptionEqualToValue={(opt, val) => opt._id === val._id}
                    onChange={(_, value) =>
                      setRecalcForm((f) => ({ ...f, employeeId: value?._id ?? '' }))
                    }
                    onInputChange={(_, value) => recalcEmployees.load(value)}
                    slotProps={autoNoIcons}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employee"
                        required
                        fullWidth
                        size="small"
                        helperText={
                          recalcEmployees.error ?? 'Search by employee number or name'
                        }
                      />
                    )}
                  />
                  <TextField
                    label="Leave Type"
                    select
                    value={recalcForm.leaveTypeId}
                    onChange={(e) => setRecalcForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
                    required
                    fullWidth
                    size="small"
                    helperText={leaveTypesError ?? 'Choose the leave type'}
                    disabled={leaveTypesLoading || !leaveTypes.length}
                  >
                    {leaveTypes.map((lt) => (
                      <MenuItem key={lt._id} value={lt._id}>
                        {getLeaveTypeLabel(lt)}
                      </MenuItem>
                    ))}
                  </TextField>
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
                      <Autocomplete
                        options={personalizedEmployees.options}
                        loading={personalizedEmployees.loading}
                        getOptionLabel={getEmployeeLabel}
                        value={personalizedEmployees.ensureOption(personalizedForm.employeeId)}
                        isOptionEqualToValue={(opt, val) => opt._id === val._id}
                        onChange={(_, value) =>
                          setPersonalizedForm((f) => ({ ...f, employeeId: value?._id ?? '' }))
                        }
                        onInputChange={(_, value) => personalizedEmployees.load(value)}
                        slotProps={autoNoIcons}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Employee"
                            required
                            fullWidth
                            size="small"
                            helperText={personalizedEmployees.error ?? 'Search by employee number or name'}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Leave Type"
                        select
                        value={personalizedForm.leaveTypeId}
                        onChange={(e) =>
                          setPersonalizedForm((f) => ({ ...f, leaveTypeId: e.target.value }))
                        }
                        required
                        fullWidth
                        size="small"
                        helperText={leaveTypesError ?? 'Choose the leave type'}
                        disabled={leaveTypesLoading || !leaveTypes.length}
                      >
                        {leaveTypes.map((lt) => (
                          <MenuItem key={lt._id} value={lt._id}>
                            {getLeaveTypeLabel(lt)}
                          </MenuItem>
                        ))}
                      </TextField>
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
                  <Autocomplete
                    multiple
                    options={annualResetEmployees.options}
                    loading={annualResetEmployees.loading}
                    getOptionLabel={getEmployeeLabel}
                    isOptionEqualToValue={(opt, val) => opt._id === val._id}
                    value={annualResetForm.employeeIds
                      .map((id) => annualResetEmployees.ensureOption(id))
                      .filter((v): v is EmployeeOption => Boolean(v))}
                    onChange={(_, values) =>
                      setAnnualResetForm((f) => ({ ...f, employeeIds: values.map((v) => v._id) }))
                    }
                    onInputChange={(_, value) => annualResetEmployees.load(value)}
                    slotProps={autoNoIcons}
                    renderTags={() => null}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employees (optional)"
                        placeholder={
                          annualResetForm.employeeIds.length
                            ? `${annualResetForm.employeeIds.length} selected`
                            : 'Leave empty for all employees'
                        }
                        size="small"
                            helperText={annualResetEmployees.error ?? 'Select employees by number or name'}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: null,
                        }}
                      />
                    )}
                  />
                  <Autocomplete
                    multiple
                    options={leaveTypes}
                    loading={leaveTypesLoading}
                    getOptionLabel={getLeaveTypeLabel}
                    isOptionEqualToValue={(opt, val) => opt._id === val._id}
                    value={annualResetForm.leaveTypeIds
                      .map((id) => ensureLeaveTypeOption(id))
                      .filter((v): v is LeaveTypeOption => Boolean(v))}
                    onChange={(_, values) =>
                      setAnnualResetForm((f) => ({ ...f, leaveTypeIds: values.map((v) => v._id) }))
                    }
                    slotProps={autoNoIcons}
                    renderTags={() => null}
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Checkbox
                            checked={selected}
                            size="small"
                          />
                          <Typography variant="body2">
                            {getLeaveTypeLabel(option)}
                          </Typography>
                        </Stack>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Leave Types (optional)"
                        placeholder=" "
                        size="small"
                        helperText={leaveTypesError ?? 'Select leave types'}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: annualResetForm.leaveTypeIds.length
                            ? (
                              <Typography variant="body2" color="text.primary" sx={{ pl: 1 }}>
                                {annualResetForm.leaveTypeIds.length} selected
                              </Typography>
                            )
                            : null,
                        }}
                      />
                    )}
                  />
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
                  <Autocomplete
                    options={adjustmentEmployees.options}
                    loading={adjustmentEmployees.loading}
                    getOptionLabel={getEmployeeLabel}
                    value={adjustmentEmployees.ensureOption(adjustmentForm.employeeId)}
                    isOptionEqualToValue={(opt, val) => opt._id === val._id}
                    onChange={(_, value) =>
                      setAdjustmentForm((f) => ({ ...f, employeeId: value?._id ?? '' }))
                    }
                    onInputChange={(_, value) => adjustmentEmployees.load(value)}
                    slotProps={autoNoIcons}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employee"
                        required
                        fullWidth
                        size="small"
                        helperText={adjustmentEmployees.error ?? 'Search by employee number or name'}
                      />
                    )}
                  />
                  <TextField
                    label="Leave Type"
                    select
                    value={adjustmentForm.leaveTypeId}
                    onChange={(e) =>
                      setAdjustmentForm((f) => ({ ...f, leaveTypeId: e.target.value }))
                    }
                    required
                    fullWidth
                    size="small"
                    helperText={leaveTypesError ?? 'Choose the leave type'}
                    disabled={leaveTypesLoading || !leaveTypes.length}
                  >
                    {leaveTypes.map((lt) => (
                      <MenuItem key={lt._id} value={lt._id}>
                        {getLeaveTypeLabel(lt)}
                      </MenuItem>
                    ))}
                  </TextField>
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
                  <Autocomplete
                    options={historyEmployees.options}
                    loading={historyEmployees.loading}
                    getOptionLabel={getEmployeeLabel}
                    value={historyEmployees.ensureOption(historyEmployeeId)}
                    isOptionEqualToValue={(opt, val) => opt._id === val._id}
                    onChange={(_, value) => setHistoryEmployeeId(value?._id ?? '')}
                    onInputChange={(_, value) => historyEmployees.load(value)}
                    slotProps={autoNoIcons}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employee"
                        size="small"
                        placeholder="Enter employee"
                        helperText={historyEmployees.error}
                      />
                    )}
                    sx={{ flex: 1 }}
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
                  <Autocomplete
                    options={entitlementEmployees.options}
                    loading={entitlementEmployees.loading}
                    getOptionLabel={getEmployeeLabel}
                    value={entitlementEmployees.ensureOption(entitlementsEmployeeId)}
                    isOptionEqualToValue={(opt, val) => opt._id === val._id}
                    onChange={(_, value) => setEntitlementsEmployeeId(value?._id ?? '')}
                    onInputChange={(_, value) => entitlementEmployees.load(value)}
                    slotProps={autoNoIcons}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employee"
                        size="small"
                        placeholder="Enter employee"
                        helperText={entitlementEmployees.error}
                      />
                    )}
                    sx={{ flex: 1 }}
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
