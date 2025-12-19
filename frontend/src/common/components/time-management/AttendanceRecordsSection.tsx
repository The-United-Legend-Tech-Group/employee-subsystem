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

  const sortedRecords = React.useMemo(() => {
    return attendanceRecords
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords]);

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

      await onPunchRecord(employeeId, punchType, isoTime);
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
                  {pagination && (
                    <Chip
                      label={`${pagination.total} total`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
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
    </Box>
  );
}
