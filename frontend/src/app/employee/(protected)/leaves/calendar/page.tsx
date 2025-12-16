'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Grid,
  TextField,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Pagination,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TodayIcon from '@mui/icons-material/Today';
import PaginatedSyncedHolidays from './PaginatedSyncedHolidays';
import PaginatedCalendarHolidays from './PaginatedCalendarHolidays';
import PaginatedBlockedPeriods from './PaginatedBlockedPeriods';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type BlockedPeriod = {
  from: string | Date;
  to: string | Date;
  reason: string;
};

type Calendar = {
  _id?: string;
  year: number;
  holidays: string[];
  blockedPeriods: { from: string; to: string; reason: string }[];
};

type HolidayOption = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  type?: string;
};

export default function CalendarPage() {
  // Configure Calendar state
  const [configForm, setConfigForm] = useState({
    year: new Date().getFullYear().toString(),
    holidays: [] as string[],
    blockedPeriods: [] as BlockedPeriod[],
  });
  const [newHolidayId, setNewHolidayId] = useState('');
  const [newBlockedPeriod, setNewBlockedPeriod] = useState<BlockedPeriod>({
    from: '',
    to: '',
    reason: '',
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // View Calendar state
  const [viewYear, setViewYear] = useState(new Date().getFullYear().toString());
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  // Sync Holidays state
  const [syncYear, setSyncYear] = useState(new Date().getFullYear().toString());
  const [syncLoading, setSyncLoading] = useState(false);
  const [autoSyncLoading, setAutoSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  // UI state
  const [activeSection, setActiveSection] = useState<'configure' | 'view' | 'sync'>('configure');

  // Holiday options for Configure tab (from Time Management per year)
  const [holidayOptions, setHolidayOptions] = useState<HolidayOption[]>([]);
  const [holidayOptionsLoading, setHolidayOptionsLoading] = useState(false);
  const [holidayOptionsError, setHolidayOptionsError] = useState<string | null>(null);
  const [holidayOptionsPage, setHolidayOptionsPage] = useState(1);
  const HOLIDAYS_PER_PAGE = 20;

  const [viewHolidayOptions, setViewHolidayOptions] = useState<HolidayOption[]>([]);
  const [viewHolidayOptionsLoading, setViewHolidayOptionsLoading] = useState(false);
  const [viewHolidayOptionsError, setViewHolidayOptionsError] = useState<string | null>(null);

  const [viewBlockedPeriods, setViewBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [viewBlockedPeriodsLoading, setViewBlockedPeriodsLoading] = useState(false);
  const [viewBlockedPeriodsError, setViewBlockedPeriodsError] = useState<string | null>(null);

  // Configure Calendar handlers (from ConfigureCalendarForm)
  function addHoliday() {
    if (newHolidayId.trim()) {
      setConfigForm((f) => ({ ...f, holidays: [...f.holidays, newHolidayId.trim()] }));
      setNewHolidayId('');
    }
  }

  function removeHoliday(index: number) {
    setConfigForm((f) => ({ ...f, holidays: f.holidays.filter((_, i) => i !== index) }));
  }

  function addBlockedPeriod() {
    if (newBlockedPeriod.from && newBlockedPeriod.to && newBlockedPeriod.reason) {
      setConfigForm((f) => ({ ...f, blockedPeriods: [...f.blockedPeriods, { ...newBlockedPeriod }] }));
      setNewBlockedPeriod({ from: '', to: '', reason: '' });
    }
  }

  function removeBlockedPeriod(index: number) {
    setConfigForm((f) => ({ ...f, blockedPeriods: f.blockedPeriods.filter((_, i) => i !== index) }));
  }

  async function handleConfigSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConfigError(null);
    setConfigSuccess(null);
    setConfigLoading(true);
    try {
      const payload = {
        year: Number(configForm.year),
        holidays: configForm.holidays,
        blockedPeriods: configForm.blockedPeriods.map((bp) => ({
          from: bp.from,
          to: bp.to,
          reason: bp.reason,
        })),
      };

      const res = await fetch(`${API_BASE}/leaves/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to configure calendar' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      setConfigSuccess('Calendar configured successfully');
      const currentYear = new Date().getFullYear().toString();
      setConfigForm({
        year: currentYear,
        holidays: [],
        blockedPeriods: [],
      });
      setNewBlockedPeriod({ from: '', to: '', reason: '' });
    } catch (err: any) {
      setConfigError(err?.message ?? 'Failed to configure calendar');
    } finally {
      setConfigLoading(false);
    }
  }

  // Local helper for formatting dates in the Configure preview
  function formatLocalDate(value: string | Date) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return String(value);
    }
    return d.toLocaleDateString();
  }

  // Load holiday options from Time Management for the selected year (read-only)
  async function loadHolidayOptions(year: string) {
    if (!API_BASE) return;
    const numericYear = Number(year);
    if (!numericYear) {
      setHolidayOptions([]);
      return;
    }

    setHolidayOptionsLoading(true);
    setHolidayOptionsError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/calendar/holidays/${numericYear}`);
      if (!res.ok) {
        throw new Error(`Failed to load holidays for year ${year} (${res.status})`);
      }
      const data = await res.json();
      setHolidayOptions(Array.isArray(data) ? data : []);
      setHolidayOptionsPage(1);
    } catch (err: any) {
      setHolidayOptionsError(err?.message ?? 'Failed to load holidays from Time Management');
      setHolidayOptions([]);
    } finally {
      setHolidayOptionsLoading(false);
    }
  }

  // Load holiday options for view year (for displaying names instead of IDs)
  async function loadViewHolidayOptions(year: string) {
    if (!API_BASE) return;
    const numericYear = Number(year);
    if (!numericYear) {
      setViewHolidayOptions([]);
      return;
    }

    setViewHolidayOptionsLoading(true);
    setViewHolidayOptionsError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/calendar/holidays/${numericYear}`);
      if (!res.ok) {
        throw new Error(`Failed to load holidays for year ${year} (${res.status})`);
      }
      const data = await res.json();
      setViewHolidayOptions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setViewHolidayOptionsError(err?.message ?? 'Failed to load holidays from Time Management');
      setViewHolidayOptions([]);
    } finally {
      setViewHolidayOptionsLoading(false);
    }
  }

  // Load blocked periods for the view year (via calendar service)
  async function loadViewBlockedPeriods(year: string) {
    if (!API_BASE) return;
    const numericYear = Number(year);
    if (!numericYear) {
      setViewBlockedPeriods([]);
      return;
    }

    setViewBlockedPeriodsLoading(true);
    setViewBlockedPeriodsError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/calendar/blocked-periods/${numericYear}`);
      if (!res.ok) {
        throw new Error(`Failed to load blocked periods for year ${year} (${res.status})`);
      }
      const data = await res.json();
      setViewBlockedPeriods(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setViewBlockedPeriodsError(err?.message ?? 'Failed to load blocked periods');
      setViewBlockedPeriods([]);
    } finally {
      setViewBlockedPeriodsLoading(false);
    }
  }

  // Reload holiday options whenever the config year changes
  useEffect(() => {
    loadHolidayOptions(configForm.year);
  }, [configForm.year]);

  // View Calendar handlers (from ViewCalendarForm)
  async function handleLoadCalendar() {
    setViewError(null);
    setCalendar(null);
    setViewLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaves/calendar/${viewYear}`);
      if (!res.ok) {
        if (res.status === 404) {
          setViewError(`No calendar found for year ${viewYear}`);
        } else {
          throw new Error(`Failed (${res.status})`);
        }
        return;
      }
      const data = await res.json();
      const cal = Array.isArray(data) ? data[0] : data;
      setCalendar(cal);
      // Load holiday names and blocked periods for this year so we can display rich info
      loadViewHolidayOptions(viewYear);
      loadViewBlockedPeriods(viewYear);
    } catch (err: any) {
      setViewError(err?.message ?? 'Failed to load calendar');
    } finally {
      setViewLoading(false);
    }
  }

  // Sync Holidays handlers (from SyncHolidaysForm)
  async function handleSyncForYear(targetYear: string) {
    setSyncError(null);
    setSyncSuccess(null);
    setSyncResult(null);
    setSyncLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaves/calendar/sync-holidays/${targetYear}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to sync holidays' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      setSyncResult(data);
      setSyncSuccess(`Successfully synced ${data.syncedHolidays?.length || 0} holidays for year ${targetYear}`);
    } catch (err: any) {
      setSyncError(err?.message ?? 'Failed to sync holidays');
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleSync() {
    if (!syncYear) {
      const current = new Date().getFullYear().toString();
      setSyncYear(current);
      await handleSyncForYear(current);
      return;
    }
    await handleSyncForYear(syncYear);
  }

  async function handleAutoSync() {
    setSyncError(null);
    setSyncSuccess(null);
    setSyncResult(null);
    setAutoSyncLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaves/calendar/auto-sync-holidays`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to auto-sync holidays' }));
        throw new Error(errData.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      setSyncResult(data);
      setSyncSuccess(`Successfully synced ${data.syncedHolidays?.length || 0} holidays for current year`);
    } catch (err: any) {
      setSyncError(err?.message ?? 'Failed to auto-sync holidays');
    } finally {
      setAutoSyncLoading(false);
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
          Calendar Maintenance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure leave calendars, manage holidays, and sync with Time Management.
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
          <Tab label="Configure" value="configure" />
          <Tab label="View" value="view" />
          <Tab label="Sync" value="sync" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {activeSection === 'configure' && (
          <Grid component="div" size={{ xs: 12, md: 8 }}>
            <Box component="form" onSubmit={handleConfigSubmit}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Configure Calendar
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Year"
                  type="number"
                  value={configForm.year}
                  onChange={(e) => setConfigForm((f) => ({ ...f, year: e.target.value }))}
                  required
                  fullWidth
                  size="small"
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Holidays for Year {configForm.year}
                  </Typography>
                  <Typography variant="caption" color={holidayOptionsError ? 'error' : 'text.secondary'}>
                    {holidayOptionsError
                      ? holidayOptionsError
                      : 'Select which holidays from Time Management apply to this calendar year.'}
                  </Typography>
                  {holidayOptionsLoading ? (
                    <Box mt={1}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : (
                    <>
                      <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                        {holidayOptions
                          .slice(
                            (holidayOptionsPage - 1) * HOLIDAYS_PER_PAGE,
                            holidayOptionsPage * HOLIDAYS_PER_PAGE,
                          )
                          .map((opt) => {
                            const selected = configForm.holidays.includes(opt.id);
                            return (
                              <Chip
                                key={opt.id}
                                label={opt.name}
                                variant={selected ? 'filled' : 'outlined'}
                                color={selected ? 'primary' : 'default'}
                                onClick={() => {
                                  setConfigForm((f) => ({
                                    ...f,
                                    holidays: selected
                                      ? f.holidays.filter((h) => h !== opt.id)
                                      : [...f.holidays, opt.id],
                                  }));
                                }}
                                size="small"
                              />
                            );
                          })}
                      </Stack>
                      {holidayOptions.length > HOLIDAYS_PER_PAGE && (
                        <Pagination
                          sx={{ mt: 1 }}
                          size="small"
                          count={Math.ceil(holidayOptions.length / HOLIDAYS_PER_PAGE)}
                          page={holidayOptionsPage}
                          onChange={(_, page) => setHolidayOptionsPage(page)}
                        />
                      )}
                    </>
                  )}
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Blocked Periods
                  </Typography>
                  <Stack spacing={1}>
                    <TextField
                      size="small"
                      label="From Date"
                      type="date"
                      value={newBlockedPeriod.from}
                      onChange={(e) => setNewBlockedPeriod((bp) => ({ ...bp, from: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="To Date"
                      type="date"
                      value={newBlockedPeriod.to}
                      onChange={(e) => setNewBlockedPeriod((bp) => ({ ...bp, to: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Reason"
                      value={newBlockedPeriod.reason}
                      onChange={(e) => setNewBlockedPeriod((bp) => ({ ...bp, reason: e.target.value }))}
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addBlockedPeriod}
                      disabled={!newBlockedPeriod.from || !newBlockedPeriod.to || !newBlockedPeriod.reason}
                    >
                      Add Blocked Period
                    </Button>
                  </Stack>
                  <Stack spacing={1} mt={2}>
                    {configForm.blockedPeriods.map((bp, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1,
                          border: '1px solid #eee',
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="body2">
                            <strong>{formatLocalDate(bp.from)}</strong> to{' '}
                            <strong>{formatLocalDate(bp.to)}</strong>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bp.reason}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => removeBlockedPeriod(idx)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Button variant="contained" type="submit" disabled={configLoading} sx={{ alignSelf: 'flex-start' }}>
                  {configLoading ? 'Saving…' : 'Save Calendar Configuration'}
                </Button>
              </Stack>
            </Box>
          </Grid>
        )}

        {activeSection === 'view' && (
          <Grid component="div" size={{ xs: 12, md: 8 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                View Calendar
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Year"
                    type="number"
                    value={viewYear}
                    onChange={(e) => setViewYear(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <Button variant="outlined" onClick={handleLoadCalendar} disabled={viewLoading}>
                    {viewLoading ? <CircularProgress size={20} /> : 'Load'}
                  </Button>
                </Stack>

                {calendar && (
                  <Box>
                    <Stack
                      spacing={2}
                      mt={1}
                      direction={{ xs: 'column', md: 'row' }}
                      alignItems="stretch"
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            Holidays ({calendar.holidays?.length || 0})
                          </Typography>
                          {viewHolidayOptionsLoading && (
                            <CircularProgress size={20} />
                          )}
                          {viewHolidayOptionsError && (
                            <Typography variant="caption" color="error">
                              {viewHolidayOptionsError}
                            </Typography>
                          )}
                          {calendar.holidays && calendar.holidays.length > 0 && !viewHolidayOptionsLoading && (
                            <PaginatedCalendarHolidays
                              holidays={calendar.holidays.map((id) => {
                                const opt = viewHolidayOptions.find((o) => o.id === id);
                                return {
                                  id,
                                  name: opt?.name,
                                  startDate: opt?.startDate,
                                  endDate: opt?.endDate,
                                };
                              })}
                              perPage={10}
                            />
                          )}
                          {calendar.holidays && calendar.holidays.length === 0 && !viewHolidayOptionsLoading && (
                            <Typography variant="caption" color="text.secondary">
                              No holidays configured
                            </Typography>
                          )}
                        </Box>

                      <Box
                        sx={(theme) => ({
                          width: 1,
                          maxWidth: '1px',
                          alignSelf: 'stretch',
                          bgcolor: theme.palette.divider,
                          display: { xs: 'none', md: 'block' },
                        })}
                      />

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Blocked Periods ({viewBlockedPeriods.length || 0})
                        </Typography>
                        {viewBlockedPeriodsLoading && <CircularProgress size={20} />}
                        {viewBlockedPeriodsError && (
                          <Typography variant="caption" color="error">
                            {viewBlockedPeriodsError}
                          </Typography>
                        )}
                        {!viewBlockedPeriodsLoading && !viewBlockedPeriodsError && (
                          <PaginatedBlockedPeriods periods={viewBlockedPeriods} perPage={4} />
                        )}
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Box>
          </Grid>
        )}

        {activeSection === 'sync' && (
          <Grid component="div" size={{ xs: 12, md: 8 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Sync Holidays from Time Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Import holidays from the Time Management system into the Leaves Calendar.
              </Typography>

              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <TextField
                    label="Year to sync"
                    type="number"
                    value={syncYear}
                    onChange={(e) => setSyncYear(e.target.value)}
                    size="small"
                    sx={{ width: 140 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSync}
                    disabled={syncLoading || autoSyncLoading}
                    startIcon={syncLoading ? <CircularProgress size={16} /> : null}
                  >
                    Sync Selected Year
                  </Button>
                  <Tooltip title="Use current year and sync">
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={syncLoading || autoSyncLoading}
                        onClick={async () => {
                          const current = new Date().getFullYear().toString();
                          setSyncYear(current);
                          await handleSyncForYear(current);
                        }}
                      >
                        <TodayIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                {syncResult && syncResult.syncedHolidays && syncResult.syncedHolidays.length > 0 && (
                  <PaginatedSyncedHolidays holidays={syncResult.syncedHolidays} holidaysPerPage={10} />
                )}
              </Stack>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
