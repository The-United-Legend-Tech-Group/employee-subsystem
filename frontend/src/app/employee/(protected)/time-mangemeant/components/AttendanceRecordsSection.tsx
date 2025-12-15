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

    const employeeId =
      typeof window !== "undefined"
        ? window.localStorage.getItem("employeeId")
        : null;

    if (!employeeId) {
      alert("Employee ID not found");
      return;
    }
    setSubmitting(true);
    try {
      // Build complete datetime from date and time inputs
      let isoTime: string | undefined = undefined;

      if (punchDate && punchDate.trim()) {
        // User specified a date
        const timeValue = punchTime && punchTime.trim() ? punchTime : "00:00";
        const dateTimeStr = `${punchDate}T${timeValue}`;
        const date = new Date(dateTimeStr);
        if (!isNaN(date.getTime())) {
          isoTime = date.toISOString();
        }
      } else if (punchTime && punchTime.trim()) {
        // User only specified time, use today's date
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
      handleClosePunchDialog();
    } catch (error) {
      console.error("Failed to record punch:", error);

      // Display the actual error message from backend
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to record punch. Please try again.";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
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
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    Attendance records
                  </Typography>
                  {(localRecords !== null || pagination) && (
                    <Chip
                      label={`${
                        localRecords !== null
                          ? localRecords.length
                          : pagination?.total ?? 0
                      } total`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    label="Employee ID"
                    value={employeeInput}
                    onChange={(e) => setEmployeeInput(e.target.value)}
                    placeholder="6929b38042db6408754efdde"
                    sx={{ minWidth: 260 }}
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
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. John or Doe"
                    sx={{ minWidth: 180 }}
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
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="e.g. company.com"
                    sx={{ minWidth: 180 }}
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
                    disabled={localLoading}
                    title="Import server CSV (backend/data/punches.csv)"
                  >
                    Import CSV
                  </Button>
                  {onPunchRecord && (
                    <Button
                      variant="contained"
                      startIcon={<AccessTimeIcon />}
                      onClick={handleOpenPunchDialog}
                    >
                      Record Punch
                    </Button>
                  )}
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
    </Box>
  );
}

async function getAuthHeader() {
  if (typeof window === "undefined") return {} as Record<string, string>;
  const token = window.localStorage.getItem("access_token");
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
      const headers = await getAuthHeader();
      const endpoint = id
        ? `${apiUrl}/time/attendance/records/${id}`
        : `${apiUrl}/time/attendance/records?limit=50`;
      const res = await fetch(endpoint, { headers });
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
        ...(await getAuthHeader()),
      };
      const res = await fetch(`${apiUrl}/time/attendance/import-csv`, {
        method: "POST",
        headers,
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
      const headers = await getAuthHeader();
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "50");
      if (name) params.set("search", name);
      const res = await fetch(`${apiUrl}/employee?${params.toString()}`, {
        headers,
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
          `Loaded attendance for ${only.firstName} ${only.lastName} (${
            only.employeeNumber || only._id
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
