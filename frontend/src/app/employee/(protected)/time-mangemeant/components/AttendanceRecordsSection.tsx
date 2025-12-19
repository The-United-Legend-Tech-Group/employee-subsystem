"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import TablePagination from "@mui/material/TablePagination";
import { alpha, useTheme } from "@mui/material/styles";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";

import SectionHeading from "./SectionHeading";
import AttendanceFilters, { AttendanceFilterState } from "./AttendanceFilters";
import { AttendanceRecord, Punch, PunchType, SectionDefinition } from "./types";
import { getAccessToken } from "@/lib/auth-utils";

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type AttendanceRecordsSectionProps = {
  section: SectionDefinition;
  attendanceRecords: AttendanceRecord[];
  loading: boolean;
  onPunchRecord?: (
    employeeId: string,
    type: PunchType,
    time?: string
  ) => Promise<void>;
  onRefresh?: () => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onFiltersChange?: (
    startDate?: string,
    endDate?: string,
    hasMissedPunch?: boolean,
    finalisedForPayroll?: boolean
  ) => void;
};

function formatTime(timeStr?: string) {
  if (!timeStr) return "-";
  const date = new Date(timeStr);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs}h ${mins}m`;
  if (hrs) return `${hrs}h`;
  return `${mins}m`;
}

export default function AttendanceRecordsSection({
  section,
  attendanceRecords,
  loading,
  onPunchRecord,
  onRefresh,
  pagination,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
}: AttendanceRecordsSectionProps) {
  const theme = useTheme();
  const [punchDialogOpen, setPunchDialogOpen] = React.useState(false);
  const [punchType, setPunchType] = React.useState<PunchType>(PunchType.IN);
  const [punchDate, setPunchDate] = React.useState("");
  const [punchTime, setPunchTime] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [filters, setFilters] = React.useState<AttendanceFilterState>({
    dateRange: "all",
  });

  const [employeeInput, setEmployeeInput] = React.useState("");
  const [nameInput, setNameInput] = React.useState("");
  const [domainInput, setDomainInput] = React.useState("");
  const [localRecords, setLocalRecords] = React.useState<
    AttendanceRecord[] | null
  >(null);
  const [localLoading, setLocalLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState("");
  const [localInfo, setLocalInfo] = React.useState("");
  const [searchDialogOpen, setSearchDialogOpen] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [infoSnackOpen, setInfoSnackOpen] = React.useState(false);
  const [errorSnackOpen, setErrorSnackOpen] = React.useState(false);

  // Manual correction dialog state
  const [manualDialogOpen, setManualDialogOpen] = React.useState(false);
  const [selectedRecordId, setSelectedRecordId] = React.useState<string>("");
  const [manualReason, setManualReason] = React.useState("");
  const [manualPunches, setManualPunches] = React.useState<
    { type: PunchType; time: string }[]
  >([{ type: PunchType.IN, time: "" }]);
  const [manualSubmitting, setManualSubmitting] = React.useState(false);
  const [manualError, setManualError] = React.useState<string>("");
  const [manualSuccess, setManualSuccess] = React.useState<string>("");

  const fetchEmployee = React.useMemo(
    () =>
      useAttendanceFetch(
        setLocalLoading,
        setLocalError,
        setLocalInfo,
        setLocalRecords,
        () => employeeInput
      ),
    [employeeInput]
  );

  const importCsv = React.useMemo(
    () => useCsvImport(setLocalLoading, setLocalError, setLocalInfo),
    []
  );

  const searchByNameDomain = React.useMemo(
    () =>
      useEmployeeSearch(
        setLocalLoading,
        setLocalError,
        setLocalInfo,
        setSearchResults,
        setSearchDialogOpen,
        () => nameInput,
        () => domainInput,
        (id: string) => setEmployeeInput(id),
        () => fetchEmployee()
      ),
    [nameInput, domainInput, fetchEmployee]
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const last = window.localStorage.getItem("last_employee_id");
    if (last && last !== employeeInput) {
      setEmployeeInput(last);
      // fire and forget; don't await to keep UI responsive
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchEmployee();
    }
  }, []);

  React.useEffect(() => {
    if (localInfo) setInfoSnackOpen(true);
  }, [localInfo]);

  React.useEffect(() => {
    if (localError) setErrorSnackOpen(true);
  }, [localError]);

  const sortedRecords = React.useMemo(() => {
    const base = localRecords !== null ? localRecords : attendanceRecords;
    return base
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, localRecords]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.dateRange !== "all") count++;
    if (filters.hasMissedPunch !== undefined) count++;
    if (filters.finalisedForPayroll !== undefined) count++;
    return count;
  }, [filters]);

  const handleFiltersUpdate = React.useCallback(
    (newFilters: AttendanceFilterState) => {
      setFilters(newFilters);
      if (onFiltersChange) {
        onFiltersChange(
          newFilters.customStartDate,
          newFilters.customEndDate,
          newFilters.hasMissedPunch,
          newFilters.finalisedForPayroll
        );
      }
    },
    [onFiltersChange]
  );

  const handleOpenPunchDialog = () => {
    setPunchDialogOpen(true);
    setPunchType(PunchType.IN);
    setPunchDate("");
    setPunchTime("");
  };

  const handleClosePunchDialog = () => {
    setPunchDialogOpen(false);
  };

  const handleSubmitPunch = async () => {
    if (!onPunchRecord) return;
    // Prefer selected employee from input (manager use-case), fallback to self
    const employeeId =
      (employeeInput && employeeInput.trim()) ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem("employeeId")
        : null);

    if (!employeeId) {
      // Use toast instead of blocking alert
      setLocalError("Employee ID not found");
      setErrorSnackOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      // Build complete datetime from date and time inputs
      let isoTime: string | undefined = undefined;

      if (punchDate && punchDate.trim()) {
        // User specified a date
        const timeValue = punchTime && punchTime.trim() ? punchTime : "00:00";
        // Basic HH:MM validation
        const hhmmOk = /^([01]?\d|2[0-3]):[0-5]\d$/.test(timeValue);
        if (!hhmmOk) {
          setLocalError("Enter time in HH:MM (24h) format");
          setErrorSnackOpen(true);
          return;
        }
        const dateTimeStr = `${punchDate}T${timeValue}`;
        const date = new Date(dateTimeStr);
        if (!isNaN(date.getTime())) {
          isoTime = date.toISOString();
        }
      } else if (punchTime && punchTime.trim()) {
        // User only specified time, use today's date
        const hhmmOk = /^([01]?\d|2[0-3]):[0-5]\d$/.test(punchTime.trim());
        if (!hhmmOk) {
          setLocalError("Enter time in HH:MM (24h) format");
          setErrorSnackOpen(true);
          return;
        }
        const today = new Date().toISOString().split("T")[0];
        const dateTimeStr = `${today}T${punchTime}`;
        const date = new Date(dateTimeStr);
        if (!isNaN(date.getTime())) {
          isoTime = date.toISOString();
        }
      }
      // If neither date nor time provided, isoTime remains undefined (use server current time)
      // Submit a single punch record to the backend
      await onPunchRecord(employeeId, punchType, isoTime);
      // Success toast
      setLocalInfo("Punch recorded successfully");
      setInfoSnackOpen(true);
      handleClosePunchDialog();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to record punch:", error);

      // Display the actual error message from backend
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to record punch. Please try again.";
      setLocalError(errorMessage);
      setErrorSnackOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const openManualDialog = () => {
    setManualDialogOpen(true);
    setManualError("");
    setManualSuccess("");
    setSelectedRecordId("");
    setManualReason("");
    setManualPunches([{ type: PunchType.IN, time: "" }]);
  };

  const closeManualDialog = () => {
    if (manualSubmitting) return;
    setManualDialogOpen(false);
  };

  const addManualPunchRow = () => {
    setManualPunches((rows) => [
      ...rows,
      { type: rows.length % 2 === 0 ? PunchType.IN : PunchType.OUT, time: "" },
    ]);
  };

  const updateManualPunch = (
    idx: number,
    field: "type" | "time",
    value: any
  ) => {
    setManualPunches((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const removeManualPunch = (idx: number) => {
    setManualPunches((rows) => rows.filter((_, i) => i !== idx));
  };

  const submitManualCorrection = async () => {
    setManualError("");
    setManualSuccess("");
    const targetEmployeeId =
      (employeeInput && employeeInput.trim()) ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem("employeeId")
        : null);

    if (!targetEmployeeId) {
      setManualError("Employee ID not found");
      return;
    }
    if (!selectedRecordId) {
      setManualError("Please select an attendance record (date)");
      return;
    }
    const normalized = manualPunches
      .map((p) => {
        if (!p.time) return null;
        const dateFromRecord =
          sortedRecords.find((r) => r._id === selectedRecordId)?.date ||
          new Date().toISOString().split("T")[0];
        const dateTimeStr = `${dateFromRecord.split("T")[0]}T${p.time}`;
        const d = new Date(dateTimeStr);
        return isNaN(d.getTime())
          ? null
          : { type: p.type, time: d.toISOString() };
      })
      .filter(Boolean) as { type: PunchType; time: string }[];

    if (normalized.length === 0) {
      setManualError("Enter at least one valid punch time");
      return;
    }

    try {
      setManualSubmitting(true);
      const apiUrl = getApiBase();
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      } as Record<string, string>;
      const res = await fetch(`${apiUrl}/time/attendance/corrections`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          employeeId: targetEmployeeId,
          attendanceRecord: selectedRecordId,
          punches: normalized,
          reason: manualReason || "Manual attendance correction",
          source: "MANUAL",
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      setManualSuccess("Manual attendance correction submitted successfully.");
      onRefresh?.();
      setTimeout(() => setManualDialogOpen(false), 900);
    } catch (err: any) {
      setManualError(err?.message || "Failed to submit manual correction");
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <Box>
      <SectionHeading {...section} />
      <Card variant="outlined">
        <CardContent>
          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="text" width={220} height={32} />
              <Skeleton variant="rounded" height={300} />
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    Attendance records
                  </Typography>
                  {(localRecords !== null || pagination) && (
                    <Chip
                      label={`${localRecords !== null
                        ? localRecords.length
                        : pagination?.total ?? 0
                        } total`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
                {/* Controls toolbar */}
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", lg: "center" }}
                  flexWrap="wrap"
                  sx={{
                    gap: 1.5,
                    "& .MuiTextField-root": {
                      minWidth: { xs: "100%", sm: 180 },
                    },
                    "& .MuiButton-root": {
                      height: 40,
                    },
                  }}
                >
                  <TextField
                    size="small"
                    label="Employee ID"
                    aria-label="Employee ID"
                    value={employeeInput}
                    onChange={(e) => setEmployeeInput(e.target.value)}
                    placeholder="6929b38042db6408754efdde"
                    sx={{ minWidth: { xs: "100%", sm: 240 } }}
                    helperText="Enter ID (empty = fetch all)"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                        await fetchEmployee();
                      }
                    }}
                  />
                  <TextField
                    size="small"
                    label="Name"
                    aria-label="Employee Name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. John or Doe"
                    sx={{ minWidth: { xs: "100%", sm: 180 } }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                        await searchByNameDomain();
                      }
                    }}
                  />
                  <TextField
                    size="small"
                    label="Domain"
                    aria-label="Email Domain"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="e.g. company.com"
                    sx={{ minWidth: { xs: "100%", sm: 180 } }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                        await searchByNameDomain();
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={fetchEmployee}
                    aria-label="Fetch Attendance Records"
                    size="small"
                    disabled={localLoading}
                  >
                    {localLoading ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} /> Loading
                      </>
                    ) : (
                      "Fetch"
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={searchByNameDomain}
                    aria-label="Search Employees"
                    size="small"
                    disabled={localLoading}
                  >
                    {localLoading ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} /> Searching
                      </>
                    ) : (
                      "Search"
                    )}
                  </Button>
                  <Button
                    variant="text"
                    onClick={importCsv}
                    aria-label="Import CSV"
                    size="small"
                    disabled={localLoading}
                    title="Import server CSV (backend/data/punches.csv)"
                  >
                    Import CSV
                  </Button>
                  {onPunchRecord && (
                    <Tooltip title="Record a manual punch">
                      <span>
                        <Button
                          variant="contained"
                          startIcon={<AccessTimeIcon />}
                          onClick={handleOpenPunchDialog}
                          aria-label="Open Record Punch Dialog"
                          size="small"
                          disabled={localLoading}
                        >
                          Record Punch
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                  <Tooltip title="Submit a manual attendance correction">
                    <span>
                      <Button
                        variant="outlined"
                        onClick={openManualDialog}
                        aria-label="Open Manual Correction Dialog"
                        size="small"
                        disabled={localLoading}
                      >
                        Manual Correction
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>

              {localError && <Alert severity="error">{localError}</Alert>}
              {localInfo && <Alert severity="success">{localInfo}</Alert>}

              {/* Filters Component */}
              <AttendanceFilters
                filters={filters}
                onFiltersChange={handleFiltersUpdate}
                activeFiltersCount={activeFiltersCount}
              />

              {sortedRecords.length === 0 ? (
                <Alert severity="info">
                  No attendance records found for the selected period.
                </Alert>
              ) : (
                <Table size="small" aria-label="attendance records">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Punches</TableCell>
                      <TableCell>Total Work</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Exceptions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRecords.map((record) => (
                      <TableRow key={record._id} hover>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {record.punches.length === 0 ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No punches
                              </Typography>
                            ) : (
                              record.punches.map((punch, idx) => (
                                <Chip
                                  key={idx}
                                  size="small"
                                  label={`${punch.type}: ${formatTime(
                                    punch.time
                                  )}`}
                                  color={
                                    punch.type === PunchType.IN
                                      ? "primary"
                                      : "secondary"
                                  }
                                  variant="outlined"
                                />
                              ))
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDuration(record.totalWorkMinutes)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {record.hasMissedPunch && (
                              <Chip
                                size="small"
                                icon={<WarningIcon />}
                                label="Missed Punch"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                            {!record.finalisedForPayroll && (
                              <Chip
                                size="small"
                                icon={<ErrorIcon />}
                                label="Not Finalised"
                                color="error"
                                variant="outlined"
                              />
                            )}
                            {!record.hasMissedPunch &&
                              record.finalisedForPayroll && (
                                <Chip
                                  size="small"
                                  icon={<CheckCircleIcon />}
                                  label="Complete"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {record.exceptionIds.length > 0 ? (
                            <Chip
                              size="small"
                              label={`${record.exceptionIds.length} exception(s)`}
                              color="warning"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination Controls */}
              {pagination && onPageChange && onPageSizeChange && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mt: 2 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Showing {sortedRecords.length} of {pagination.total} records
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small">
                      <Select
                        value={pagination.limit}
                        onChange={(e) =>
                          onPageSizeChange(Number(e.target.value))
                        }
                        sx={{ minWidth: 100 }}
                      >
                        <MenuItem value={10}>10 / page</MenuItem>
                        <MenuItem value={20}>20 / page</MenuItem>
                        <MenuItem value={50}>50 / page</MenuItem>
                        <MenuItem value={100}>100 / page</MenuItem>
                      </Select>
                    </FormControl>
                    <Pagination
                      count={pagination.totalPages}
                      page={pagination.page}
                      onChange={(_, page) => onPageChange(page)}
                      color="primary"
                      showFirstButton
                      showLastButton
                      siblingCount={1}
                      boundaryCount={1}
                    />
                  </Stack>
                </Stack>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Punch Recording Dialog */}
      <Dialog
        open={punchDialogOpen}
        onClose={handleClosePunchDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Attendance Punch</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Punch Type</InputLabel>
              <Select
                value={punchType}
                label="Punch Type"
                aria-label="Punch Type"
                onChange={(e) => setPunchType(e.target.value as PunchType)}
              >
                <MenuItem value={PunchType.IN}>Clock In</MenuItem>
                <MenuItem value={PunchType.OUT}>Clock Out</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Date (optional)"
              type="date"
              aria-label="Punch Date"
              value={punchDate}
              onChange={(e) => setPunchDate(e.target.value)}
              helperText="Leave empty to use today's date"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              label="Time (optional)"
              type="time"
              aria-label="Punch Time"
              value={punchTime}
              onChange={(e) => setPunchTime(e.target.value)}
              helperText="Leave empty to use current time"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <Alert severity="info">
              {punchType === PunchType.IN
                ? "Recording a clock-in punch will mark the start of your work period."
                : "Recording a clock-out punch will mark the end of your work period."}
            </Alert>
            <Alert severity="warning">
              Note: Punching on holidays requires pre-approval. Regular workdays
              only.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePunchDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitPunch}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? "Recording..." : "Record Punch"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employee Search Results Dialog */}
      <Dialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Employee</DialogTitle>
        <DialogContent>
          {searchResults.length === 0 ? (
            <Alert severity="info">No matching employees found.</Alert>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {searchResults.map((e) => (
                <Card
                  key={e._id}
                  variant="outlined"
                  sx={{ cursor: "pointer" }}
                  onClick={async () => {
                    setEmployeeInput(e._id);
                    setSearchDialogOpen(false);
                    await fetchEmployee();
                  }}
                >
                  <CardContent sx={{ py: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" fontWeight={700}>
                        {e.firstName} {e.lastName}
                      </Typography>
                      {e.employeeNumber && (
                        <Chip size="small" label={e.employeeNumber} />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {e.email || "no-email"}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={e.position?.title || "No Position"}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={e.department?.name || "No Department"}
                        variant="outlined"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Manual Attendance Correction Dialog */}
      <Dialog
        open={manualDialogOpen}
        onClose={closeManualDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manual Attendance Correction</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Date (attendance record)</InputLabel>
              <Select
                label="Date (attendance record)"
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value as string)}
              >
                {sortedRecords.slice(0, 60).map((r) => (
                  <MenuItem key={r._id} value={r._id}>
                    {formatDate(r.date)} — {formatDuration(r.totalWorkMinutes)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle2">Punches to add</Typography>
            <Stack spacing={1}>
              {manualPunches.map((p, idx) => (
                <Stack
                  key={idx}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems="center"
                >
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={p.type}
                      label="Type"
                      onChange={(e) =>
                        updateManualPunch(
                          idx,
                          "type",
                          e.target.value as PunchType
                        )
                      }
                    >
                      <MenuItem value={PunchType.IN}>Clock In</MenuItem>
                      <MenuItem value={PunchType.OUT}>Clock Out</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    type="time"
                    size="small"
                    label="Time"
                    value={p.time}
                    onChange={(e) =>
                      updateManualPunch(idx, "time", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    color="error"
                    onClick={() => removeManualPunch(idx)}
                    disabled={manualPunches.length <= 1}
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
              <Button onClick={addManualPunchRow}>Add Punch</Button>
            </Stack>

            <TextField
              label="Reason"
              fullWidth
              multiline
              minRows={2}
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
            />

            {manualError && <Alert severity="error">{manualError}</Alert>}
            {manualSuccess && <Alert severity="success">{manualSuccess}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeManualDialog} disabled={manualSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={submitManualCorrection}
            disabled={manualSubmitting}
            variant="contained"
          >
            {manualSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toasts */}
      <Snackbar
        open={infoSnackOpen}
        autoHideDuration={3000}
        onClose={() => setInfoSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setInfoSnackOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {localInfo}
        </Alert>
      </Snackbar>
      <Snackbar
        open={errorSnackOpen}
        autoHideDuration={4000}
        onClose={() => setErrorSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setErrorSnackOpen(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {localError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function getAuthHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";
}

// Fetch helper bound to component via closure
// Placed after component to avoid re-creating utilities per render
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useAttendanceFetch(
  setLocalLoading: (v: boolean) => void,
  setLocalError: (v: string) => void,
  setLocalInfo: (v: string) => void,
  setLocalRecords: (r: AttendanceRecord[] | null) => void,
  getEmployeeInput: () => string
) {
  return async function fetchEmployee() {
    setLocalError("");
    setLocalInfo("");
    const id = getEmployeeInput();
    setLocalLoading(true);
    try {
      const apiUrl = getApiBase();
      const headers = getAuthHeader();
      const endpoint = id
        ? `${apiUrl}/time/attendance/records/${id}`
        : `${apiUrl}/time/attendance/records?limit=50`;
      const res = await fetch(endpoint, { headers, credentials: "include" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const payload = await res.json();
      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : payload?.data || [];
      setLocalRecords(rows as AttendanceRecord[]);
      if (typeof window !== "undefined" && id) {
        window.localStorage.setItem("last_employee_id", id);
      }
    } catch (err: any) {
      setLocalError(err?.message || "Failed to fetch");
      setLocalRecords([]);
    } finally {
      setLocalLoading(false);
    }
  };
}

function useCsvImport(
  setLocalLoading: (v: boolean) => void,
  setLocalError: (v: string) => void,
  setLocalInfo: (v: string) => void
) {
  return async function importCsv() {
    setLocalError("");
    setLocalInfo("");
    setLocalLoading(true);
    try {
      const apiUrl = getApiBase();
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      };
      const res = await fetch(`${apiUrl}/time/attendance/import-csv`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const payload = await res.json();
      setLocalInfo(`Imported ${payload?.imported ?? 0} record(s) from CSV`);
    } catch (err: any) {
      setLocalError(err?.message || "Failed to import CSV");
    } finally {
      setLocalLoading(false);
    }
  };
}

// Search employees by name (backend search) and optional domain (client filter)
function useEmployeeSearch(
  setLocalLoading: (v: boolean) => void,
  setLocalError: (v: string) => void,
  setLocalInfo: (v: string) => void,
  setSearchResults: (list: any[]) => void,
  setSearchDialogOpen: (v: boolean) => void,
  getNameInput: () => string,
  getDomainInput: () => string,
  setEmployeeId: (id: string) => void,
  fetchEmployee: () => Promise<void>
) {
  return async function searchByNameDomain() {
    setLocalError("");
    setLocalInfo("");
    setSearchResults([]);
    const name = (getNameInput() || "").trim();
    const domain = (getDomainInput() || "").trim().toLowerCase();
    if (!name && !domain) {
      setLocalError("Enter a name or a domain to search");
      return;
    }
    setLocalLoading(true);
    try {
      const apiUrl = getApiBase();
      const headers = getAuthHeader();
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "50");
      if (name) params.set("search", name);
      const res = await fetch(`${apiUrl}/employee?${params.toString()}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const payload = await res.json();
      let items: any[] = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];
      if (domain) {
        items = items.filter((e) => {
          const email = (e.email || "").toLowerCase();
          const at = email.indexOf("@");
          const d = at >= 0 ? email.slice(at + 1) : "";
          return (
            d === domain ||
            d.endsWith(`.${domain}`) ||
            email.includes(`@${domain}`)
          );
        });
      }

      if (items.length === 0) {
        setLocalError("No matching employees found");
        setSearchResults([]);
        setSearchDialogOpen(true);
        return;
      }

      if (items.length === 1) {
        const only = items[0];
        setEmployeeId(only._id);
        await fetchEmployee();
        setLocalInfo(
          `Loaded attendance for ${only.firstName} ${only.lastName} (${only.employeeNumber || only._id
          })`
        );
        return;
      }

      setSearchResults(items);
      setSearchDialogOpen(true);
    } catch (err: any) {
      setLocalError(err?.message || "Search failed");
    } finally {
      setLocalLoading(false);
    }
  };
}
