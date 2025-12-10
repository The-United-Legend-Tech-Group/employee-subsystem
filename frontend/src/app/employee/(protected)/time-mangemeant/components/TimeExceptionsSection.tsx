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
import { useTheme } from "@mui/material/styles";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingIcon from "@mui/icons-material/Pending";

import SectionHeading from "./SectionHeading";
import {
  TimeException,
  TimeExceptionStatus,
  TimeExceptionType,
  SectionDefinition,
} from "./types";

type TimeExceptionsSectionProps = {
  section: SectionDefinition;
  exceptions: TimeException[];
  loading: boolean;
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

export default function TimeExceptionsSection({
  section,
  exceptions,
  loading,
}: TimeExceptionsSectionProps) {
  const theme = useTheme();

  const sortedExceptions = React.useMemo(() => {
    return [...exceptions].sort((a, b) => {
      // Sort by status priority: OPEN > PENDING > ESCALATED > others
      const statusPriority: Record<TimeExceptionStatus, number> = {
        [TimeExceptionStatus.OPEN]: 1,
        [TimeExceptionStatus.PENDING]: 2,
        [TimeExceptionStatus.ESCALATED]: 3,
        [TimeExceptionStatus.APPROVED]: 4,
        [TimeExceptionStatus.RESOLVED]: 5,
        [TimeExceptionStatus.REJECTED]: 6,
      };

      const aPriority = statusPriority[a.status as TimeExceptionStatus] || 99;
      const bPriority = statusPriority[b.status as TimeExceptionStatus] || 99;

      return aPriority - bPriority;
    });
  }, [exceptions]);

  const openExceptions = React.useMemo(() => {
    return exceptions.filter(
      (ex) =>
        ex.status === TimeExceptionStatus.OPEN ||
        ex.status === TimeExceptionStatus.PENDING
    );
  }, [exceptions]);

  const resolvedExceptions = React.useMemo(() => {
    return exceptions.filter(
      (ex) =>
        ex.status === TimeExceptionStatus.RESOLVED ||
        ex.status === TimeExceptionStatus.APPROVED
    );
  }, [exceptions]);

  const exceptionsByType = React.useMemo(() => {
    const counts: Partial<Record<TimeExceptionType, number>> = {};
    exceptions.forEach((ex) => {
      counts[ex.type] = (counts[ex.type] || 0) + 1;
    });
    return counts;
  }, [exceptions]);

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
              {/* Summary Cards */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{ flexWrap: "wrap" }}
              >
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 200,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.warning.main + "15",
                    border: `1px solid ${theme.palette.warning.main}40`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WarningAmberIcon color="warning" />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {openExceptions.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Open exceptions
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 200,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.success.main + "15",
                    border: `1px solid ${theme.palette.success.main}40`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineIcon color="success" />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {resolvedExceptions.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Resolved exceptions
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 200,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.info.main + "15",
                    border: `1px solid ${theme.palette.info.main}40`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ErrorOutlineIcon color="info" />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {exceptions.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total exceptions
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>

              {/* Exception Types Breakdown */}
              {Object.keys(exceptionsByType).length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ mb: 1 }}
                  >
                    Exception Types
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.entries(exceptionsByType).map(([type, count]) => (
                      <Chip
                        key={type}
                        label={`${
                          EXCEPTION_TYPE_LABELS[type as TimeExceptionType]
                        }: ${count}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Exceptions Table */}
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 1.5 }}
                >
                  All time exceptions
                </Typography>
                {sortedExceptions.length === 0 ? (
                  <Alert severity="success">
                    No time exceptions recorded. All attendance is clean.
                  </Alert>
                ) : (
                  <Table size="small" aria-label="time exceptions">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Employee</TableCell>
                        <TableCell>Attendance Record</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Assigned To</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedExceptions.map((exception) => {
                        const statusConfig = EXCEPTION_STATUS_CONFIG[
                          exception.status as TimeExceptionStatus
                        ] || {
                          label: exception.status,
                          color: "default" as const,
                        };

                        return (
                          <TableRow key={exception._id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {EXCEPTION_TYPE_LABELS[exception.type]}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {exception.employeeId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontFamily: "monospace",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {exception.attendanceRecordId.slice(-8)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={statusConfig.label}
                                color={statusConfig.color}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {exception.assignedTo}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ maxWidth: 200 }}
                                noWrap
                              >
                                {exception.reason || "-"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
