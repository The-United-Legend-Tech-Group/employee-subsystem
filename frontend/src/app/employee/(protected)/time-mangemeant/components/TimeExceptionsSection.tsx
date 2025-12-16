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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import SectionHeading from "./SectionHeading";
import {
  TimeException,
  TimeExceptionStatus,
  TimeExceptionType,
  SectionDefinition,
  SubmitCorrectionEssDto,
} from "./types";

/**
 * ESS Attendance Correction (SubmitCorrectionEssDto)
 * Backend endpoint:
 * POST /api/time/corrections/submit-ess
 */

type TimeExceptionsSectionProps = {
  section: SectionDefinition;
  exceptions: TimeException[];
  loading: boolean;
  employeeId: string;
  lineManagerId: string;
  onCreated?: () => void; // trigger parent refresh
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, reason?: string) => Promise<void>;
};

const EXCEPTION_TYPE_LABELS: Record<TimeExceptionType, string> = {
  [TimeExceptionType.MISSED_PUNCH]: "Missed Punch",
  [TimeExceptionType.LATE]: "Late Arrival",
  [TimeExceptionType.EARLY_LEAVE]: "Early Leave",
  [TimeExceptionType.SHORT_TIME]: "Short Time",
  [TimeExceptionType.OVERTIME_REQUEST]: "Overtime Request",
  [TimeExceptionType.MANUAL_ADJUSTMENT]: "Manual Adjustment",
};

const EXCEPTION_STATUS_CONFIG: Record<
  TimeExceptionStatus,
  { label: string; color: "default" | "success" | "warning" | "error" | "info" }
> = {
  [TimeExceptionStatus.OPEN]: { label: "Open", color: "warning" },
  [TimeExceptionStatus.PENDING]: { label: "Pending", color: "info" },
  [TimeExceptionStatus.APPROVED]: { label: "Approved", color: "success" },
  [TimeExceptionStatus.REJECTED]: { label: "Rejected", color: "error" },
  [TimeExceptionStatus.ESCALATED]: { label: "Escalated", color: "error" },
  [TimeExceptionStatus.RESOLVED]: { label: "Resolved", color: "success" },
};

export default function TimeExceptionsSection({
  section,
  exceptions,
  loading,
  employeeId,
  lineManagerId,
  onCreated,
  onApprove,
  onReject,
}: TimeExceptionsSectionProps) {
  const theme = useTheme();

  // Log props on mount and when they change
  React.useEffect(() => {
    console.log("📋 TimeExceptionsSection Props:", {
      employeeId,
      lineManagerId,
      hasOnCreated: !!onCreated,
      exceptionsCount: exceptions.length,
    });
  }, [employeeId, lineManagerId, onCreated, exceptions.length]);

  // ---------------- Dialog state ----------------
  const [openDialog, setOpenDialog] = React.useState(false);
  const [date, setDate] = React.useState("");
  const [durationMinutes, setDurationMinutes] = React.useState<number>(15);
  const [correctionType, setCorrectionType] = React.useState<"ADD" | "DEDUCT">(
    "ADD"
  );
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState({
    date: false,
    reason: false,
    duration: false,
  });

  const [attendanceRecordId, setAttendanceRecordId] = React.useState<
    string | null
  >(null);
  const [fetchingRecord, setFetchingRecord] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Validation
  const validateForm = React.useCallback(() => {
    const errors: string[] = [];

    if (!employeeId)
      errors.push("Employee ID is missing. Please refresh the page.");
    if (!date) errors.push("Date is required");
    if (!reason || reason.trim().length < 10)
      errors.push("Reason must be at least 10 characters");
    if (!durationMinutes || durationMinutes <= 0)
      errors.push("Duration must be greater than 0");
    if (durationMinutes > 480)
      errors.push("Duration cannot exceed 8 hours (480 minutes)");
    // Note: lineManagerId will be set to employeeId if not provided (self-approval or auto-routing)

    // Date validation - cannot be future date
    if (date) {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errors.push("Cannot submit correction for future dates");
      }
    }

    // Only check attendance record if date is set and not currently fetching
    if (date && !fetchingRecord && !attendanceRecordId) {
      errors.push("Valid attendance record is required for the selected date");
    }

    return errors;
  }, [
    date,
    reason,
    durationMinutes,
    attendanceRecordId,
    lineManagerId,
    fetchingRecord,
  ]);

  const isFormValid = React.useMemo(() => {
    return validateForm().length === 0;
  }, [validateForm]);

  // Fetch attendance record when date changes
  React.useEffect(() => {
    if (!date) {
      setAttendanceRecordId(null);
      return;
    }

    const fetchRecord = async () => {
      try {
        setFetchingRecord(true);
        setError(null);

        const API_URL =
          typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL
            : "http://localhost:50000";

        // Build an explicit full-day time window to avoid timezone mismatches
        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59.999`);
        const startISO = startOfDay.toISOString();
        const endISO = endOfDay.toISOString();

        console.log("🔍 Fetching attendance for:", {
          employeeId,
          date,
          startISO,
          endISO,
          url: `${API_URL}/time/attendance/records/${employeeId}?startDate=${encodeURIComponent(
            startISO
          )}&endDate=${encodeURIComponent(endISO)}&limit=1&page=1`,
        });

        const res = await fetch(
          `${API_URL}/time/attendance/records/${employeeId}?startDate=${encodeURIComponent(
            startISO
          )}&endDate=${encodeURIComponent(endISO)}&limit=1&page=1`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Attendance record fetch failed:", {
            status: res.status,
            statusText: res.statusText,
            error: errorText,
          });
          throw new Error(`Failed to fetch attendance record: ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ Attendance record response:", {
          data,
          dataType: Array.isArray(data) ? "array" : typeof data,
          length: Array.isArray(data) ? data.length : "N/A",
          hasData: data?.data ? "yes" : "no",
          hasRecords: data?.records ? "yes" : "no",
        });

        // Handle different response formats
        let record = null as any;
        if (Array.isArray(data)) {
          record = data[0];
        } else if (data?.data) {
          // Primary expected shape from backend: { data: AttendanceRecord[]; pagination: {...} }
          if (Array.isArray(data.data)) {
            record = data.data.find((r: any) => !!r?._id) || data.data[0];
          } else if (data.data?._id) {
            record = data.data;
          } else if (Array.isArray(data.data?.records)) {
            record =
              data.data.records.find((r: any) => !!r?._id) ||
              data.data.records[0];
          } else if (Array.isArray(data.data?.docs)) {
            record =
              data.data.docs.find((r: any) => !!r?._id) || data.data.docs[0];
          } else if (Array.isArray(data.data?.items)) {
            record =
              data.data.items.find((r: any) => !!r?._id) || data.data.items[0];
          }
        } else if (Array.isArray((data as any)?.records)) {
          record =
            (data as any).records.find((r: any) => !!r?._id) ||
            (data as any).records[0];
        } else if ((data as any)?._id) {
          record = data;
        }

        // Fallback: recursively search for first object that looks like an AttendanceRecord
        if (!record) {
          const seen = new Set<any>();
          const stack: any[] = [data];
          while (stack.length) {
            const node = stack.pop();
            if (!node || typeof node !== "object" || seen.has(node)) continue;
            seen.add(node);
            if (Array.isArray(node)) {
              for (const item of node) stack.push(item);
              continue;
            }
            // Heuristic: has _id and either date or punches/totalWorkMinutes
            if (
              node._id &&
              (node.date || node.punches || node.totalWorkMinutes !== undefined)
            ) {
              record = node;
              break;
            }
            for (const key of Object.keys(node)) stack.push((node as any)[key]);
          }
        }

        console.log("🔍 Extracted record:", record);

        if (!record?._id) {
          setAttendanceRecordId(null);
          setError(
            "No attendance record found for this date. Please ensure you have punched in/out on this date."
          );
        } else {
          setAttendanceRecordId(record._id);
          setError(null);
        }
      } catch (e: any) {
        console.error("Error fetching attendance record:", e);
        setAttendanceRecordId(null);
        setError(
          e.message || "Error fetching attendance record. Please try again."
        );
      } finally {
        setFetchingRecord(false);
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchRecord, 300);
    return () => clearTimeout(timeoutId);
  }, [date, employeeId]);

  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched({ date: true, reason: true, duration: true });

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload: SubmitCorrectionEssDto = {
        employeeId,
        attendanceRecord: attendanceRecordId!,
        durationMinutes,
        reason: reason.trim(),
        lineManagerId: lineManagerId || employeeId, // Fallback to self if no manager set
        correctionType,
        appliesFromDate: date,
      };

      const API_URL =
        typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL
          : "http://localhost:50000";
      const res = await fetch(`${API_URL}/time/corrections/submit-ess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Submission failed";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setSuccess(
        "Correction request submitted successfully and sent to your manager."
      );
      onCreated?.();

      // keep dialog open briefly to show confirmation
      setTimeout(() => {
        setOpenDialog(false);
        setDate("");
        setDurationMinutes(15);
        setReason("");
        setAttendanceRecordId(null);
        setSuccess(null);
        setTouched({ date: false, reason: false, duration: false });
      }, 1500);
    } catch (e: any) {
      setError(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    if (submitting) return;
    setOpenDialog(false);
    setError(null);
    setSuccess(null);
    setTouched({ date: false, reason: false, duration: false });
  };

  const sortedExceptions = React.useMemo(() => {
    return [...exceptions].sort((a, b) => {
      const p: Record<TimeExceptionStatus, number> = {
        OPEN: 1,
        PENDING: 2,
        ESCALATED: 3,
        APPROVED: 4,
        RESOLVED: 5,
        REJECTED: 6,
      } as any;
      return (p[a.status] || 99) - (p[b.status] || 99);
    });
  }, [exceptions]);

  return (
    <Box>
      <SectionHeading {...section} />

      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={() => setOpenDialog(true)}>
          Request attendance correction
        </Button>
      </Box>

      <Card variant="outlined">
        <CardContent>
          {loading ? (
            <Skeleton height={200} />
          ) : (
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.warning.main + "15",
                  }}
                >
                  <WarningAmberIcon color="warning" />
                  <Typography variant="h5" fontWeight="bold">
                    {
                      exceptions.filter(
                        (e) =>
                          e.status === TimeExceptionStatus.OPEN ||
                          e.status === TimeExceptionStatus.PENDING
                      ).length
                    }
                  </Typography>
                  <Typography variant="body2">Open / Pending</Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.success.main + "15",
                  }}
                >
                  <CheckCircleOutlineIcon color="success" />
                  <Typography variant="h5" fontWeight="bold">
                    {
                      exceptions.filter(
                        (e) =>
                          e.status === TimeExceptionStatus.APPROVED ||
                          e.status === TimeExceptionStatus.RESOLVED
                      ).length
                    }
                  </Typography>
                  <Typography variant="body2">Resolved</Typography>
                </Box>
              </Stack>

              {sortedExceptions.length === 0 ? (
                <Alert severity="success">No time exceptions recorded.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell align="right">Manager</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedExceptions.map((ex) => {
                      const cfg = EXCEPTION_STATUS_CONFIG[ex.status];
                      return (
                        <TableRow key={ex._id}>
                          <TableCell>
                            {EXCEPTION_TYPE_LABELS[ex.type]}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={cfg.label}
                              color={cfg.color}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{ex.reason || "-"}</TableCell>
                          <TableCell align="right" sx={{ minWidth: 160 }}>
                            {(ex.status === TimeExceptionStatus.OPEN ||
                              ex.status === TimeExceptionStatus.PENDING) && (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                justifyContent="flex-end"
                              >
                                <Tooltip title="Approve">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={async () => {
                                        try {
                                          if (onApprove) {
                                            await onApprove(ex._id);
                                          } else {
                                            const API_URL =
                                              typeof window !== "undefined" &&
                                              process.env.NEXT_PUBLIC_API_URL
                                                ? process.env
                                                    .NEXT_PUBLIC_API_URL
                                                : "http://localhost:50000";
                                            await fetch(
                                              `${API_URL}/time/corrections/${ex._id}/approve`,
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  lineManagerId,
                                                }),
                                              }
                                            );
                                          }
                                          onCreated?.();
                                        } catch (e) {
                                          console.error("Approve failed", e);
                                        }
                                      }}
                                    >
                                      <CheckCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={async () => {
                                        const note = prompt(
                                          "Optional rejection note:"
                                        );
                                        try {
                                          if (onReject) {
                                            await onReject(
                                              ex._id,
                                              note || undefined
                                            );
                                          } else {
                                            const API_URL =
                                              typeof window !== "undefined" &&
                                              process.env.NEXT_PUBLIC_API_URL
                                                ? process.env
                                                    .NEXT_PUBLIC_API_URL
                                                : "http://localhost:50000";
                                            await fetch(
                                              `${API_URL}/time/corrections/${ex._id}/reject`,
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  lineManagerId,
                                                  reason: note || undefined,
                                                }),
                                              }
                                            );
                                          }
                                          onCreated?.();
                                        } catch (e) {
                                          console.error("Reject failed", e);
                                        }
                                      }}
                                    >
                                      {/* Using a simple X via Unicode is not ideal; keep Close icon semantics */}
                                      {/* For a compact X look, we can still use outlined cancel icon */}
                                      <WarningAmberIcon
                                        fontSize="small"
                                        color="error"
                                      />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            )}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 240 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {ex.managerNotes || "—"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* ESS Correction Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Attendance Correction Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTouched((prev) => ({ ...prev, date: true }));
              }}
              required
              error={touched.date && !date}
              helperText={touched.date && !date ? "Date is required" : ""}
              inputProps={{
                max: new Date().toISOString().split("T")[0],
              }}
            />

            <TextField
              type="number"
              label="Duration (minutes)"
              value={durationMinutes}
              onChange={(e) => {
                setDurationMinutes(Number(e.target.value));
                setTouched((prev) => ({ ...prev, duration: true }));
              }}
              required
              error={
                touched.duration &&
                (durationMinutes <= 0 || durationMinutes > 480)
              }
              helperText={
                touched.duration && durationMinutes <= 0
                  ? "Duration must be greater than 0"
                  : touched.duration && durationMinutes > 480
                  ? "Duration cannot exceed 480 minutes (8 hours)"
                  : "Maximum 480 minutes (8 hours)"
              }
              inputProps={{ min: 1, max: 480, step: 15 }}
            />

            <TextField
              select
              label="Correction Type"
              value={correctionType}
              onChange={(e) => setCorrectionType(e.target.value as any)}
            >
              <MenuItem value="ADD">Add minutes</MenuItem>
              <MenuItem value="DEDUCT">Deduct minutes</MenuItem>
            </TextField>

            <TextField
              label="Reason"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setTouched((prev) => ({ ...prev, reason: true }));
              }}
              required
              error={touched.reason && (!reason || reason.trim().length < 10)}
              helperText={
                touched.reason && !reason
                  ? "Reason is required"
                  : touched.reason && reason.trim().length < 10
                  ? `Reason must be at least 10 characters (${
                      reason.trim().length
                    }/10)`
                  : `${reason.trim().length} characters`
              }
            />

            {fetchingRecord && (
              <Alert severity="info" icon={<CircularProgress size={20} />}>
                Checking attendance record…
              </Alert>
            )}
            {!fetchingRecord && attendanceRecordId && (
              <Alert severity="success">
                ✓ Attendance record found for this date
              </Alert>
            )}
            {!fetchingRecord && date && !attendanceRecordId && error && (
              <Alert severity="warning">
                {error}
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Tip: Make sure you have punched in/out on this date before
                  requesting a correction.
                </Typography>
              </Alert>
            )}
            {success && <Alert severity="success">{success}</Alert>}
            {error && !date && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid || submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
