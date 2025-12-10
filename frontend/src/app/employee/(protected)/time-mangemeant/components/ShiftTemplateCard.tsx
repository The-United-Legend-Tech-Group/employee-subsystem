"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Box,
  alpha,
} from "@mui/material";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import TimelapseRoundedIcon from "@mui/icons-material/TimelapseRounded";
import AvTimerRoundedIcon from "@mui/icons-material/AvTimerRounded";

interface ShiftDefinition {
  _id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  punchPolicy?: string;
  graceInMinutes?: number;
  graceOutMinutes?: number;
  requiresApprovalForOvertime?: boolean;
  active?: boolean;
}

type ShiftTemplateCardProps = {
  shift: ShiftDefinition;
  onSelect?: () => void;
  selected?: boolean;
};

function computeShiftDurationMinutes(shift: ShiftDefinition) {
  if (!shift.startTime || !shift.endTime) {
    return 0;
  }
  const [startHour = 0, startMinute = 0] = shift.startTime
    .split(":")
    .map((part) => Number(part) || 0);
  const [endHour = 0, endMinute = 0] = shift.endTime
    .split(":")
    .map((part) => Number(part) || 0);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const diff = endTotal - startTotal;
  if (diff > 0) {
    return diff;
  }
  return diff + 24 * 60;
}

function formatDuration(minutes: number) {
  if (!minutes || Number.isNaN(minutes)) {
    return "0m";
  }
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  if (hours && remaining) {
    return `${hours}h ${remaining}m`;
  }
  if (hours) {
    return `${hours}h`;
  }
  return `${remaining}m`;
}

export default function ShiftTemplateCard({
  shift,
  onSelect,
  selected,
}: ShiftTemplateCardProps) {
  const durationMinutes = computeShiftDurationMinutes(shift);
  const durationLabel =
    durationMinutes > 0 ? formatDuration(durationMinutes) : "Not set";
  const requiresApproval = Boolean(shift.requiresApprovalForOvertime);
  const policyLabel = shift.punchPolicy ?? "Not configured";
  const startLabel = shift.startTime || "—";
  const endLabel = shift.endTime || "—";
  const graceIn = shift.graceInMinutes ?? 0;
  const graceOut = shift.graceOutMinutes ?? 0;

  return (
    <Card
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      variant="outlined"
      sx={(theme) => ({
        width: "100%",
        position: "relative",
        overflow: "hidden",
        borderLeft: 4,
        borderLeftColor: selected
          ? theme.palette.primary.dark
          : requiresApproval
          ? theme.palette.warning.main
          : theme.palette.primary.main,
        transition: "all 0.2s ease-in-out",
        cursor: onSelect ? "pointer" : "default",
        boxShadow: selected ? theme.shadows[12] : undefined,
        transform: selected ? "translateY(-4px)" : undefined,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[8],
          borderLeftColor: requiresApproval
            ? theme.palette.warning.dark
            : theme.palette.primary.dark,
        },
      })}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Header Section */}
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={2}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                gutterBottom
                noWrap
              >
                {shift.name || "Untitled template"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {policyLabel}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={requiresApproval ? "Approval required" : "Auto-applies"}
              variant="outlined"
              sx={(theme) => ({
                fontWeight: 600,
                flexShrink: 0,
                borderColor: requiresApproval
                  ? theme.palette.warning.main
                  : theme.palette.success.main,
                color: requiresApproval
                  ? theme.palette.warning.main
                  : theme.palette.success.main,
                backgroundColor: requiresApproval
                  ? alpha(theme.palette.warning.main, 0.1)
                  : alpha(theme.palette.success.main, 0.1),
              })}
            />
          </Stack>

          {/* Time and Grace Info Chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              variant="outlined"
              icon={<ScheduleRoundedIcon fontSize="small" />}
              label={`${startLabel} → ${endLabel}`}
            />
            <Chip
              size="small"
              variant="outlined"
              icon={<TimelapseRoundedIcon fontSize="small" />}
              label={durationLabel}
            />
            <Chip
              size="small"
              variant="outlined"
              icon={<AvTimerRoundedIcon fontSize="small" />}
              label={`Grace ${graceIn}m / ${graceOut}m`}
            />
          </Stack>

          {/* Description */}
          <Typography variant="body2" color="text.secondary">
            {requiresApproval
              ? "Manager approval required before overtime is applied."
              : "Overtime is automatically applied based on this template."}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
