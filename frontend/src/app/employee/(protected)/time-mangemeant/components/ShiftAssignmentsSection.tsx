"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import SectionHeading from "./SectionHeading";
import {
  ScheduleRule,
  SectionDefinition,
  ShiftAssignment,
  ShiftDefinition,
} from "./types";

const STATUS_MAP: Record<
  string,
  { label: string; color: "default" | "success" | "warning" | "error" | "info" }
> = {
  ACTIVE: { label: "Active", color: "success" },
  PENDING: { label: "Pending", color: "info" },
  COMPLETED: { label: "Completed", color: "default" },
  SUSPENDED: { label: "Suspended", color: "warning" },
  CANCELLED: { label: "Cancelled", color: "error" },
};

type ShiftAssignmentsSectionProps = {
  section: SectionDefinition;
  assignments: ShiftAssignment[];
  shifts: ShiftDefinition[];
  scheduleRules: ScheduleRule[];
  loading: boolean;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function getShiftExtras(definition?: ShiftDefinition) {
  if (!definition) return null;
  return {
    approval: definition.requiresApprovalForOvertime
      ? "Approval required for overtime"
      : "Standard overtime",
    coverage: `${definition.startTime} → ${definition.endTime}`,
    graceIn: definition.graceInMinutes ?? 0,
    graceOut: definition.graceOutMinutes ?? 0,
  };
}

export default function ShiftAssignmentsSection({
  section,
  assignments,
  shifts,
  scheduleRules,
  loading,
}: ShiftAssignmentsSectionProps) {
  const shiftLookup = React.useMemo(() => {
    const map = new Map<string, ShiftDefinition>();
    shifts.forEach((shift) => map.set(shift._id, shift));
    return map;
  }, [shifts]);

  const scheduleLookup = React.useMemo(() => {
    const map = new Map<string, ScheduleRule>();
    scheduleRules.forEach((rule) => map.set(rule._id, rule));
    return map;
  }, [scheduleRules]);

  const upcomingAssignments = React.useMemo(() => {
    const now = Date.now();
    return assignments
      .slice()
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
      .filter(
        (assignment) =>
          new Date(assignment.endDate || assignment.startDate).getTime() >= now
      )
      .slice(0, 6)
      .map((assignment) => {
        const definition = shiftLookup.get(assignment.shiftId);
        const scheduleRule = assignment.scheduleRuleId
          ? scheduleLookup.get(assignment.scheduleRuleId)
          : undefined;
        return {
          ...assignment,
          shiftName: definition?.name || "Unassigned shift",
          shiftExtras: getShiftExtras(definition),
          scheduleName: scheduleRule?.name,
          schedulePattern: scheduleRule?.pattern,
        };
      });
  }, [assignments, shiftLookup, scheduleLookup]);

  return (
    <Box>
      <SectionHeading {...section} />
      <Card variant="outlined">
        <CardContent>
          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="text" width={240} height={32} />
              <Skeleton variant="rounded" height={220} />
            </Stack>
          ) : upcomingAssignments.length === 0 ? (
            <Alert severity="info">
              No shift assignments available for the selected employee.
            </Alert>
          ) : (
            <Table size="small" aria-label="shift assignments">
              <TableHead>
                <TableRow>
                  <TableCell>Shift</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Window</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Schedule rule</TableCell>
                  <TableCell>Overtime</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingAssignments.map((assignment) => {
                  const statusMeta = STATUS_MAP[assignment.status] || {
                    label: assignment.status,
                    color: "default" as const,
                  };

                  // Determine assignment scope
                  const assignmentScope = assignment.employeeId
                    ? "Employee"
                    : assignment.departmentId
                    ? "Department"
                    : assignment.positionId
                    ? "Position"
                    : "Unknown";

                  const assignmentTarget =
                    assignment.employeeId ||
                    assignment.departmentId ||
                    assignment.positionId ||
                    "-";

                  return (
                    <TableRow key={assignment._id} hover>
                      <TableCell>
                        <Typography fontWeight="bold">
                          {assignment.shiftName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Starts {formatDate(assignment.startDate)}
                          {assignment.endDate
                            ? ` · Ends ${formatDate(assignment.endDate)}`
                            : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="column" spacing={0.25}>
                          <Chip
                            size="small"
                            label={assignmentScope}
                            color={
                              assignmentScope === "Employee"
                                ? "primary"
                                : assignmentScope === "Department"
                                ? "secondary"
                                : "default"
                            }
                            variant="outlined"
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.7rem",
                            }}
                          >
                            {typeof assignmentTarget === "string"
                              ? assignmentTarget.slice(-8)
                              : assignmentTarget}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {assignment.shiftExtras ? (
                          <Stack direction="column" spacing={0.5}>
                            <Typography variant="body2">
                              {assignment.shiftExtras.coverage}
                            </Typography>
                            {assignment.shiftExtras && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Grace in/out:{" "}
                                {assignment.shiftExtras?.graceIn ?? 0}m /{" "}
                                {assignment.shiftExtras?.graceOut ?? 0}m
                              </Typography>
                            )}
                          </Stack>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusMeta.label}
                          color={statusMeta.color}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {assignment.scheduleName ? (
                          <Tooltip
                            title={assignment.schedulePattern || ""}
                            placement="top-start"
                          >
                            <Chip
                              size="small"
                              label={assignment.scheduleName}
                              variant="outlined"
                              color="info"
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No pattern attached
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {assignment.shiftExtras?.approval || "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
