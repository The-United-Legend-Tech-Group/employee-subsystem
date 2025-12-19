"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { alpha, useTheme } from "@mui/material/styles";
import { SvgIconProps } from "@mui/material/SvgIcon";

import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TablePagination from "@mui/material/TablePagination";
import axios from "axios";
import TextField from "@mui/material/TextField";

import SectionHeading from "./SectionHeading";
import { CorrectionRequest, SectionDefinition } from "./types";
import { getAccessToken, getEmployeeIdFromCookie } from "@/lib/auth-utils";

const STATUS_COLORS: Record<
  string,
  "default" | "success" | "warning" | "error" | "info"
> = {
  APPROVED: "success",
  SUBMITTED: "info",
  PENDING: "info",
  REVIEW: "warning",
  REJECTED: "error",
  RETURNED: "warning",
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function formatDuration(minutes?: number) {
  if (!minutes) return "-";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs}h ${mins}m`;
  if (hrs) return `${hrs}h`;
  return `${mins}m`;
}

type AttendanceSectionProps = {
  section: SectionDefinition;
  history: CorrectionRequest[];
  pending: CorrectionRequest[];
  loading: boolean;
  managerQueueEnabled: boolean;
  lineManagerId?: string;
  onRefresh?: () => void;
};

export default function AttendanceSection({
  section,
  history,
  pending,
  loading,
  managerQueueEnabled,
  lineManagerId,
  onRefresh,
}: AttendanceSectionProps) {
  const recentHistory = React.useMemo(() => history.slice(0, 5), [history]);

  const pendingQueue = React.useMemo(() => pending.slice(0, 5), [pending]);

  const approvedCount = React.useMemo(
    () => history.filter((item) => item.status === "APPROVED").length,
    [history]
  );

  const rejectedCount = React.useMemo(
    () => history.filter((item) => item.status === "REJECTED").length,
    [history]
  );

  const metrics = React.useMemo(() => {
    const denominator = Math.max(history.length || 0, 1);
    return [
      {
        key: "total",
        label: "Total corrections",
        value: history.length,
        denominator: Math.max(history.length || 0, 1),
        color: "info" as const,
        icon: SummarizeRoundedIcon,
        descriptor: "Captured this period",
      },
      {
        key: "approved",
        label: "Approved",
        value: approvedCount,
        denominator,
        color: "success" as const,
        icon: TaskAltRoundedIcon,
        descriptor: "Ready for payroll",
      },
      {
        key: "rejected",
        label: "Rejected",
        value: rejectedCount,
        denominator,
        color: "error" as const,
        icon: CancelRoundedIcon,
        descriptor: "Declined corrections",
      },
      {
        key: "pending",
        label: "Pending review",
        value: pending.length,
        denominator,
        color: "warning" as const,
        icon: PendingActionsRoundedIcon,
        descriptor: "Awaiting manager action",
      },
    ];
  }, [history.length, approvedCount, rejectedCount, pending.length]);

  const [openAllDialog, setOpenAllDialog] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 25;

  const paginatedHistory = React.useMemo(() => {
    const start = page * rowsPerPage;
    return history.slice(start, start + rowsPerPage);
  }, [history, page]);

  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<any | null>(
    null
  );
  const [decisionLoading, setDecisionLoading] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [decisionError, setDecisionError] = React.useState<string | null>(null);

  async function submitReviewDecision(decision: "APPROVED" | "REJECTED") {
    if (!selectedRequest) return;

    if (decision === "REJECTED" && !rejectReason.trim()) {
      setDecisionError("Rejection reason is required");
      return;
    }

    try {
      setDecisionLoading(true);
      setDecisionError(null);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";
      const employeeId = getEmployeeIdFromCookie() || localStorage.getItem("employeeId");
      const token = getAccessToken();

      await axios.patch(
        `${apiUrl}/time/corrections/${selectedRequest._id}/review`,
        {
          approverId: employeeId,
          decision,
          approverRole: "HR_MANAGER",
          rejectionReason: decision === "REJECTED" ? rejectReason : undefined,
          applyToPayroll: true,
        },
        {
          headers: (token ? { Authorization: `Bearer ${token}` } : {}) as Record<string, string>,
          withCredentials: true,
        }
      );

      setReviewOpen(false);
      setOpenAllDialog(false);

      // You can later replace this with state update instead
      window.location.reload();
    } catch (err: any) {
      setDecisionError(
        err?.response?.data?.message || "Failed to submit decision"
      );
    } finally {
      setDecisionLoading(false);
    }
  }

  return (
    <Box>
      <SectionHeading {...section} />
      <Card variant="outlined">
        <CardContent>
          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="text" width={220} height={32} />
              <Skeleton variant="rounded" height={220} />
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2.5}
                sx={{ flexWrap: "wrap" }}
              >
                {metrics.map(({ key, ...metric }) => (
                  <MetricCard key={key} {...metric} />
                ))}
              </Stack>

              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 1.5 }}
                >
                  Recent correction activity
                </Typography>
                <Box
                  sx={{ mb: 1, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setPage(0);
                      setOpenAllDialog(true);
                    }}
                  >
                    View all corrections
                  </Button>
                  <Dialog
                    open={openAllDialog}
                    onClose={() => setOpenAllDialog(false)}
                    maxWidth="lg"
                    fullWidth
                  >
                    <DialogTitle>All Attendance Corrections</DialogTitle>

                    <DialogContent dividers>
                      {history.length === 0 ? (
                        <Alert severity="info">No corrections found.</Alert>
                      ) : (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Submitted</TableCell>
                              <TableCell>Employee</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell>Duration</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Manager</TableCell>
                              <TableCell>Notes</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paginatedHistory.map((row) => (
                              <TableRow
                                key={row._id}
                                hover
                                onClick={() => {
                                  setSelectedRequest(row);
                                  setRejectReason("");
                                  setDecisionError(null);
                                  setReviewOpen(true);
                                }}
                              >
                                <TableCell>
                                  {formatDate(
                                    row.appliesFromDate || row.submittedAt
                                  )}
                                </TableCell>
                                <TableCell>{row.employeeId || "—"}</TableCell>
                                <TableCell sx={{ textTransform: "capitalize" }}>
                                  {row.correctionType
                                    ? row.correctionType.toLowerCase()
                                    : "—"}
                                </TableCell>
                                <TableCell>
                                  {formatDuration(row.durationMinutes)}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={row.status || "N/A"}
                                    color={
                                      STATUS_COLORS[row.status || ""] ||
                                      "default"
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  {row.lineManagerId || "—"}
                                </TableCell>
                                <TableCell sx={{ maxWidth: 240 }}>
                                  <Typography variant="body2" noWrap>
                                    {row.rejectionReason || row.reason || "—"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </DialogContent>

                    <DialogActions sx={{ justifyContent: "space-between" }}>
                      <TablePagination
                        component="div"
                        count={history.length}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={[25]}
                      />
                      <Button onClick={() => setOpenAllDialog(false)}>
                        Close
                      </Button>
                    </DialogActions>
                  </Dialog>
                </Box>

                {recentHistory.length === 0 ? (
                  <Alert severity="info">
                    No corrections submitted in the selected period.
                  </Alert>
                ) : (
                  <Table size="small" aria-label="recent corrections">
                    <TableHead>
                      <TableRow>
                        <TableCell>Submitted</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Manager</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentHistory.map((row) => (
                        <TableRow key={row._id} hover>
                          <TableCell>
                            {formatDate(row.appliesFromDate || row.submittedAt)}
                          </TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>
                            {row.correctionType
                              ? row.correctionType.toLowerCase()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {formatDuration(row.durationMinutes)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.status || "N/A"}
                              color={
                                STATUS_COLORS[row.status || ""] || "default"
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{row.lineManagerId || "—"}</TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {row.rejectionReason || row.reason || "—"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>

              {managerQueueEnabled && (
                <>
                  <Divider flexItem />
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mb: 1.5 }}
                    >
                      Manager approval queue
                    </Typography>
                    {pendingQueue.length === 0 ? (
                      <Alert severity="success">
                        Your queue is clear. All submitted corrections are up to
                        date.
                      </Alert>
                    ) : (
                      <Table size="small" aria-label="manager queue">
                        <TableHead>
                          <TableRow>
                            <TableCell>Submitted</TableCell>
                            <TableCell>Employee</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingQueue.map((row) => (
                            <TableRow key={row._id} hover>
                              <TableCell>
                                {formatDate(
                                  row.appliesFromDate || row.submittedAt
                                )}
                              </TableCell>
                              <TableCell>{row.employeeId || "—"}</TableCell>
                              <TableCell sx={{ textTransform: "capitalize" }}>
                                {row.correctionType
                                  ? row.correctionType.toLowerCase()
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                {formatDuration(row.durationMinutes)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={row.status || "SUBMITTED"}
                                  color={
                                    STATUS_COLORS[row.status || ""] || "info"
                                  }
                                  variant="filled"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Box>
                </>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Attendance Correction</DialogTitle>

        <DialogContent dividers>
          {selectedRequest && (
            <Stack spacing={2}>
              <Typography>
                <b>Employee:</b> {selectedRequest.employeeId}
              </Typography>
              <Typography>
                <b>Type:</b> {selectedRequest.correctionType}
              </Typography>
              <Typography>
                <b>Date:</b>{" "}
                {formatDate(
                  selectedRequest.appliesFromDate || selectedRequest.submittedAt
                )}
              </Typography>
              <Typography>
                <b>Duration:</b>{" "}
                {formatDuration(selectedRequest.durationMinutes)}
              </Typography>
              <Typography>
                <b>Reason:</b> {selectedRequest.reason || "—"}
              </Typography>

              {decisionError && <Alert severity="error">{decisionError}</Alert>}

              <TextField
                label="Rejection Reason (required if rejecting)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Cancel</Button>

          <Button
            color="error"
            variant="outlined"
            disabled={decisionLoading}
            onClick={() => submitReviewDecision("REJECTED")}
          >
            Reject
          </Button>

          <Button
            color="success"
            variant="contained"
            disabled={decisionLoading}
            onClick={() => submitReviewDecision("APPROVED")}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

type MetricCardProps = {
  label: string;
  value: number;
  denominator: number;
  color: "primary" | "success" | "warning" | "error" | "info";
  icon: React.ComponentType<SvgIconProps>;
  descriptor: string;
};

function MetricCard({
  label,
  value,
  denominator,
  color,
  icon: Icon,
  descriptor,
}: MetricCardProps) {
  const theme = useTheme();
  const paletteColor = theme.palette[color] || theme.palette.info;
  const progress =
    denominator > 0
      ? Math.min(100, Math.round((value / denominator) * 100))
      : 0;
  const gradient = `linear-gradient(135deg, ${alpha(
    paletteColor.main,
    theme.palette.mode === "dark" ? 0.24 : 0.12
  )} 0%, ${alpha(
    paletteColor.main,
    theme.palette.mode === "dark" ? 0.1 : 0.04
  )} 100%)`;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 220,
        px: 2.5,
        py: 2,
        borderRadius: 3,
        backgroundImage: gradient,
        border: `1px solid ${alpha(
          paletteColor.main,
          theme.palette.mode === "dark" ? 0.5 : 0.2
        )}`,
        boxShadow: `0 15px 35px -25px ${alpha(
          paletteColor.dark || paletteColor.main,
          0.8
        )}`,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}
            color={alpha(theme.palette.text.secondary, 0.9)}
          >
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.3 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {descriptor}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(
              paletteColor.main,
              theme.palette.mode === "dark" ? 0.28 : 0.12
            ),
            border: `1px solid ${alpha(
              paletteColor.main,
              theme.palette.mode === "dark" ? 0.45 : 0.2
            )}`,
          }}
        >
          <Icon sx={{ color: paletteColor.main }} />
        </Box>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 999,
          backgroundColor: alpha(
            paletteColor.main,
            theme.palette.mode === "dark" ? 0.15 : 0.08
          ),
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
            backgroundImage: `linear-gradient(90deg, ${paletteColor.main} 0%, ${paletteColor.light || paletteColor.main
              } 100%)`,
          },
        }}
      />
    </Box>
  );
}
