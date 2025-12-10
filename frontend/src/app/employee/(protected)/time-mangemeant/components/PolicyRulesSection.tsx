"use client";

import * as React from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AvTimerRoundedIcon from "@mui/icons-material/AvTimerRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import TimelapseRoundedIcon from "@mui/icons-material/TimelapseRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import SectionHeading from "./SectionHeading";
import ShiftTemplateCard from "./ShiftTemplateCard";
import { ScheduleRule, SectionDefinition, ShiftDefinition } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

const HOLIDAY_TYPES = ["NATIONAL", "ORGANIZATIONAL", "WEEKLY_REST"] as const;

const WEEKDAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
] as const;

type ShiftFormState = {
  name: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  active: boolean;
  graceInMinutes: number;
};

type HolidayFormState = {
  type: (typeof HOLIDAY_TYPES)[number];
  name: string;
  startDate: string;
  endDate: string;
  weeklyDays: number[];
  weeklyFrom: string;
  weeklyTo: string;
  active: boolean;
  contractStart: string;
  probationEnd: string;
  financialYearStart: string;
};

type ScheduleRuleFormState = {
  name: string;
  pattern: string;
  shiftTypes: string;
  startDate: string;
  endDate: string;
  active: boolean;
};

type ShiftToggleAction = {
  kind: "shift";
  preset?: Partial<ShiftFormState>;
  helperText?: string;
};

type WeekendToggleAction = {
  kind: "weekend";
  preset?: Partial<HolidayFormState>;
  helperText?: string;
};

type ScheduleRuleToggleAction = {
  kind: "rule";
  preset?: Partial<ScheduleRuleFormState>;
  helperText?: string;
};

type InfoToggleAction = {
  kind: "info";
  message: string;
};

type PolicyToggleAction =
  | ShiftToggleAction
  | WeekendToggleAction
  | ScheduleRuleToggleAction
  | InfoToggleAction;

type ActivePolicyAction =
  | (ShiftToggleAction & { label: string })
  | (WeekendToggleAction & { label: string })
  | (ScheduleRuleToggleAction & { label: string });

const createDefaultShiftForm = (): ShiftFormState => ({
  name: "",
  shiftType: "",
  startTime: "09:00",
  endTime: "17:00",
  active: true,
  graceInMinutes: 0,
});

const createDefaultHolidayForm = (): HolidayFormState => ({
  type: "WEEKLY_REST",
  name: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  weeklyDays: [0, 6],
  weeklyFrom: "",
  weeklyTo: "",
  active: true,
  contractStart: "",
  probationEnd: "",
  financialYearStart: "",
});

const createDefaultScheduleRuleForm = (): ScheduleRuleFormState => ({
  name: "",
  pattern: "",
  shiftTypes: "",
  startDate: "",
  endDate: "",
  active: true,
});

type PolicyRulesSectionProps = {
  section: SectionDefinition;
  shifts: ShiftDefinition[];
  scheduleRules: ScheduleRule[];
  loading: boolean;
  authToken?: string | null;
  onRefresh?: () => void;
};

type PolicyToggle = {
  id: string;
  label: string;
  enabled: boolean;
  hint?: string;
  action?: PolicyToggleAction;
};

type PolicyMetric = {
  label: string;
  value: string;
};

type PolicyInsight = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  avatarColor: string;
  toggles: PolicyToggle[];
  metrics: PolicyMetric[];
  chips?: Array<{
    label: string;
    color?:
      | "default"
      | "primary"
      | "secondary"
      | "success"
      | "warning"
      | "info"
      | "error";
  }>;
};

function parsePattern(pattern?: string) {
  if (!pattern) return null;
  try {
    return JSON.parse(pattern);
  } catch (error) {
    return pattern;
  }
}

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

function formatMinutes(minutes: number) {
  if (!minutes || Number.isNaN(minutes)) {
    return "0m";
  }
  return `${Math.round(minutes)}m`;
}

function determinePunchPolicy(shifts: ShiftDefinition[]) {
  const tally = shifts.reduce<Record<string, number>>((acc, shift) => {
    if (!shift.punchPolicy) {
      return acc;
    }
    const key = shift.punchPolicy;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  let topPolicy: string | null = null;
  let maxCount = 0;

  for (const [policy, count] of Object.entries(tally)) {
    if (count > maxCount) {
      topPolicy = policy;
      maxCount = count;
    }
  }

  return topPolicy;
}

type PunchPolicySummary = {
  policy: string;
  count: number;
};

function punchPolicyBreakdown(shifts: ShiftDefinition[]): PunchPolicySummary[] {
  if (shifts.length === 0) {
    return [];
  }

  const summary = shifts.reduce<Record<string, number>>((acc, shift) => {
    const key = shift.punchPolicy ?? "Not configured";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(summary)
    .map(([policy, count]) => ({ policy, count }))
    .sort((a, b) => b.count - a.count);
}

function detectWeekendRules(rules: ScheduleRule[]) {
  const keywordPattern =
    /(weekend|week-end|saturday|sunday|rest day|day off|off day)/i;

  return rules.filter((rule) => {
    if (!rule) {
      return false;
    }
    if (keywordPattern.test(rule.name ?? "")) {
      return true;
    }
    if (rule.pattern && keywordPattern.test(rule.pattern)) {
      return true;
    }
    const parsed = parsePattern(rule.pattern);
    if (parsed && typeof parsed === "object") {
      const serialized = JSON.stringify(parsed).toLowerCase();
      return keywordPattern.test(serialized);
    }
    return false;
  });
}

function describePattern(rule: ScheduleRule) {
  if (!rule.pattern) {
    return "No pattern defined";
  }

  const parsed = parsePattern(rule.pattern);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const typed = parsed as Record<string, unknown>;
    const parts: string[] = [];

    if (typeof typed.frequency === "string" && typed.frequency.length > 0) {
      parts.push(`Repeats ${typed.frequency}`);
    }

    if (Array.isArray(typed.days) && typed.days.length > 0) {
      parts.push(`Days ${typed.days.join(", ")}`);
    }

    if (typeof typed.description === "string" && typed.description) {
      parts.push(typed.description);
    }

    if (typeof typed.type === "string" && typed.type) {
      parts.push(typed.type);
    }

    if (parts.length > 0) {
      return parts.join(" · ");
    }
  }

  if (typeof parsed === "string") {
    return parsed;
  }

  return rule.pattern;
}

type PolicyInsightCardProps = {
  insight: PolicyInsight;
  onToggle?: (insightId: string, toggle: PolicyToggle) => void;
  disableInteractions?: boolean;
};

function PolicyInsightCard({
  insight,
  onToggle,
  disableInteractions,
}: PolicyInsightCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", px: 0, boxSizing: "border-box" }}
    >
      <CardContent sx={{ px: 2 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                bgcolor: (theme) => {
                  const palette =
                    (theme.palette as Record<string, any>)[
                      insight.avatarColor
                    ] ?? theme.palette.primary;
                  const mainColor =
                    typeof palette === "object" && palette?.main
                      ? palette.main
                      : theme.palette.primary.main;
                  return alpha(mainColor, 0.12);
                },
                color: (theme) => {
                  const palette =
                    (theme.palette as Record<string, any>)[
                      insight.avatarColor
                    ] ?? theme.palette.primary;
                  return (
                    (typeof palette === "object" && palette?.main) ||
                    theme.palette.primary.main
                  );
                },
                width: 40,
                height: 40,
              }}
            >
              {insight.icon}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {insight.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {insight.description}
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1.5}>
            {insight.toggles.map((toggle) => {
              const toggleDisabled = (() => {
                if (!onToggle) return true;
                if (toggle.action?.kind === "info") {
                  return false;
                }
                return disableInteractions || !toggle.action;
              })();

              return (
                <Box key={toggle.id}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={toggle.enabled}
                        size="small"
                        disabled={toggleDisabled}
                        onClick={(event) => event.preventDefault()}
                        onChange={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (toggleDisabled) {
                            return;
                          }
                          onToggle?.(insight.id, toggle);
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {toggle.label}
                      </Typography>
                    }
                  />
                  {toggle.hint ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ pl: 4.5 }}
                    >
                      {toggle.hint}
                    </Typography>
                  ) : null}
                </Box>
              );
            })}
          </Stack>

          <Grid container spacing={1.5}>
            {insight.metrics.map((metric) => (
              <Grid item xs={12} sm={6} key={metric.label}>
                <Typography variant="caption" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {metric.value}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {insight.chips && insight.chips.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {insight.chips.map((chip) => (
                <Chip
                  key={chip.label}
                  size="small"
                  variant="outlined"
                  color={chip.color}
                  label={chip.label}
                />
              ))}
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function PolicyRulesSection({
  section,
  shifts,
  scheduleRules,
  loading,
  authToken,
  onRefresh,
}: PolicyRulesSectionProps) {
  const activeShifts = React.useMemo(
    () => shifts.filter((shift) => shift.active !== false),
    [shifts]
  );

  const approvalRequired = React.useMemo(
    () =>
      activeShifts.filter((shift) => shift.requiresApprovalForOvertime).length,
    [activeShifts]
  );

  const graceAverages = React.useMemo(() => {
    if (activeShifts.length === 0) {
      return {
        avgIn: 0,
        avgOut: 0,
        minIn: 0,
        maxIn: 0,
        minOut: 0,
        maxOut: 0,
      };
    }

    const inValues = activeShifts.map((shift) => shift.graceInMinutes ?? 0);
    const outValues = activeShifts.map((shift) => shift.graceOutMinutes ?? 0);

    const sum = (values: number[]) =>
      values.reduce((acc, value) => acc + value, 0);
    const range = (values: number[]) => ({
      min: Math.min(...values),
      max: Math.max(...values),
    });

    const inRange = range(inValues);
    const outRange = range(outValues);

    return {
      avgIn: sum(inValues) / activeShifts.length,
      avgOut: sum(outValues) / activeShifts.length,
      minIn: inRange.min,
      maxIn: inRange.max,
      minOut: outRange.min,
      maxOut: outRange.max,
    };
  }, [activeShifts]);

  const shiftDurations = React.useMemo(() => {
    const minutes = activeShifts.map(computeShiftDurationMinutes);
    if (minutes.length === 0) {
      return {
        longest: 0,
        shortest: 0,
        average: 0,
      };
    }

    const longest = Math.max(...minutes);
    const shortest = Math.min(...minutes);
    const average =
      minutes.reduce((acc, value) => acc + value, 0) / minutes.length;

    return { longest, shortest, average };
  }, [activeShifts]);

  const dominantPunchPolicy = React.useMemo(
    () => determinePunchPolicy(activeShifts),
    [activeShifts]
  );

  const weekendRules = React.useMemo(
    () => detectWeekendRules(scheduleRules),
    [scheduleRules]
  );

  const [activeAction, setActiveAction] =
    React.useState<ActivePolicyAction | null>(null);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  }>({ open: false, message: "", severity: "info" });

  const [selectedShiftId, setSelectedShiftId] = React.useState<string | null>(
    null
  );

  const selectedShift = React.useMemo(
    () => activeShifts.find((s) => s._id === selectedShiftId) ?? null,
    [selectedShiftId, activeShifts]
  );

  const selectedShiftInfo = React.useMemo(() => {
    if (!selectedShift) {
      return null;
    }

    return {
      duration: formatDuration(computeShiftDurationMinutes(selectedShift)),
      schedule: `${selectedShift.startTime ?? "—"} → ${
        selectedShift.endTime ?? "—"
      }`,
      punchPolicy: selectedShift.punchPolicy ?? "Not configured",
      requiresApproval: Boolean(selectedShift.requiresApprovalForOvertime),
      graceIn: selectedShift.graceInMinutes ?? 0,
      graceOut: selectedShift.graceOutMinutes ?? 0,
    };
  }, [selectedShift]);

  React.useEffect(() => {
    if (activeShifts.length === 0) {
      if (selectedShiftId !== null) {
        setSelectedShiftId(null);
      }
      return;
    }

    const hasSelected = activeShifts.some(
      (shift) => shift._id === selectedShiftId
    );

    if (!hasSelected) {
      setSelectedShiftId(activeShifts[0]._id);
    }
  }, [activeShifts, selectedShiftId]);

  const tokenReady = Boolean(authToken);

  const handleSnackbarClose = React.useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") {
        return;
      }
      setSnackbar((prev) => ({ ...prev, open: false }));
    },
    []
  );

  const handlePolicyToggle = React.useCallback(
    (_insightId: string, toggle: PolicyToggle) => {
      if (toggle.action?.kind === "info") {
        setSnackbar({
          open: true,
          severity: "info",
          message: toggle.action.message,
        });
        return;
      }

      if (!toggle.action) {
        setSnackbar({
          open: true,
          severity: "info",
          message:
            "This toggle reflects backend state and is not configurable here.",
        });
        return;
      }

      if (!tokenReady) {
        setSnackbar({
          open: true,
          severity: "warning",
          message: "Please sign in again to configure policies.",
        });
        return;
      }

      setActiveAction({ ...toggle.action, label: toggle.label });
    },
    [tokenReady]
  );

  const policyInsights = React.useMemo<PolicyInsight[]>(() => {
    const overtimeTrackingEnabled = activeShifts.length > 0;
    const gracePolicyEnforced = activeShifts.some(
      (shift) =>
        (shift.graceInMinutes ?? 0) > 0 || (shift.graceOutMinutes ?? 0) > 0
    );
    const strictPunchPolicy = activeShifts.some(
      (shift) => shift.punchPolicy === "FIRST_LAST"
    );

    const weekendEnabled = weekendRules.length > 0;

    return [
      {
        id: "overtime",
        title: "Overtime policy",
        description:
          "Derived from shift definitions served by the time subsystem.",
        icon: <AccessTimeRoundedIcon fontSize="small" />,
        avatarColor: "primary",
        toggles: [
          {
            id: "enableOvertime",
            label: "Enable overtime tracking",
            enabled: overtimeTrackingEnabled,
            hint: `${activeShifts.length} shift template(s) configured`,
            action: {
              kind: "shift",
              helperText:
                "Creates a shift template via POST /time/shifts with the minimum required fields.",
              preset: { active: true },
            },
          },
          {
            id: "requireOvertimeApproval",
            label: "Requires manager approval",
            enabled: approvalRequired > 0,
            hint: approvalRequired
              ? `${approvalRequired} template(s) expect pre-approval`
              : "No templates request approval",
            action: {
              kind: "info",
              message:
                "Manager approval flags are maintained in the shift documents and are currently read-only from this workspace.",
            },
          },
        ],
        metrics: [
          {
            label: "Longest shift",
            value: formatDuration(shiftDurations.longest),
          },
          {
            label: "Average shift length",
            value: formatDuration(shiftDurations.average),
          },
        ],
        chips: [
          {
            label: `${approvalRequired}/${activeShifts.length} need approval`,
            color: approvalRequired > 0 ? "warning" : "default",
          },
          dominantPunchPolicy
            ? {
                label: `Primary punch policy: ${dominantPunchPolicy}`,
                color: "info",
              }
            : undefined,
        ].filter(Boolean) as PolicyInsight["chips"],
      },
      {
        id: "lateness",
        title: "Lateness policy",
        description:
          "Uses grace windows and punch policies enforced via attendance service.",
        icon: <WarningAmberRoundedIcon fontSize="small" />,
        avatarColor: "warning",
        toggles: [
          {
            id: "graceWindows",
            label: "Grace windows enforced",
            enabled: gracePolicyEnforced,
            hint: gracePolicyEnforced
              ? `Range ${formatMinutes(graceAverages.minIn)} - ${formatMinutes(
                  graceAverages.maxIn
                )} on clock-in`
              : "No grace windows configured",
            action: {
              kind: "shift",
              helperText:
                "Provide grace minutes when creating a shift template to enforce lateness windows.",
              preset: { graceInMinutes: 5 },
            },
          },
          {
            id: "strictPunchPolicy",
            label: "Strict punch policy",
            enabled: strictPunchPolicy,
            hint: strictPunchPolicy
              ? "FIRST_LAST policy present"
              : "Multiple punch accumulation",
            action: {
              kind: "info",
              message:
                "Punch policy adjustments require backend support. Tracking remains read-only here.",
            },
          },
        ],
        metrics: [
          {
            label: "Average grace (in)",
            value: formatMinutes(graceAverages.avgIn),
          },
          {
            label: "Average grace (out)",
            value: formatMinutes(graceAverages.avgOut),
          },
        ],
        chips: [
          graceAverages.maxOut
            ? {
                label: `Checkout grace up to ${formatMinutes(
                  graceAverages.maxOut
                )}`,
                color: "default",
              }
            : undefined,
          graceAverages.maxIn
            ? {
                label: `Check-in grace up to ${formatMinutes(
                  graceAverages.maxIn
                )}`,
                color: "default",
              }
            : undefined,
        ].filter(Boolean) as PolicyInsight["chips"],
      },
      {
        id: "weekend",
        title: "Weekend work policy",
        description:
          "Summarises schedule rules that reference weekend or rest patterns.",
        icon: <CalendarMonthRoundedIcon fontSize="small" />,
        avatarColor: "secondary",
        toggles: [
          {
            id: "allowWeekend",
            label: "Allow weekend work",
            enabled: weekendEnabled,
            hint: weekendEnabled
              ? `${weekendRules.length} schedule rule(s) mention weekend coverage`
              : "No explicit weekend rule configured",
            action: {
              kind: "weekend",
              helperText:
                "Publishes a WEEKLY_REST holiday window through POST /time/holidays.",
              preset: { weeklyDays: [0, 6] },
            },
          },
          {
            id: "weekendApproval",
            label: "Requires manager approval",
            enabled: weekendEnabled && approvalRequired > 0,
            hint:
              weekendEnabled && approvalRequired > 0
                ? "Weekend overtime ties back to shift approvals"
                : "No weekend approval enforcement",
            action: {
              kind: "info",
              message:
                "Weekend approvals mirror the underlying shift templates. Configure shifts that require approval to change this state.",
            },
          },
        ],
        metrics: [
          {
            label: "Weekend rules configured",
            value: `${weekendRules.length}`,
          },
          {
            label: "Primary pattern",
            value: weekendRules[0] ? describePattern(weekendRules[0]) : "None",
          },
        ],
        chips: weekendRules.length
          ? [
              {
                label: weekendRules[0].name,
                color: weekendRules[0].active === false ? "default" : "success",
              },
            ]
          : undefined,
      },
    ];
  }, [
    activeShifts,
    approvalRequired,
    shiftDurations,
    dominantPunchPolicy,
    graceAverages,
    weekendRules,
  ]);

  const punchPolicies = React.useMemo(
    () => punchPolicyBreakdown(activeShifts),
    [activeShifts]
  );

  const activeRulesCount = React.useMemo(
    () => scheduleRules.filter((rule) => rule.active !== false).length,
    [scheduleRules]
  );

  const upcomingRules = React.useMemo(
    () =>
      scheduleRules.filter((rule) => {
        if (!rule.startDate) return false;
        const startMs = new Date(rule.startDate).getTime();
        return Number.isFinite(startMs) && startMs > Date.now();
      }),
    [scheduleRules]
  );

  return (
    <Box>
      <SectionHeading {...section} />
      {loading ? (
        <Stack spacing={3}>
          <Skeleton variant="text" width={280} height={36} />
          <Grid container spacing={3}>
            {[0, 1, 2].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Skeleton variant="rounded" height={240} />
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={3}>
            {[0, 1].map((item) => (
              <Grid item xs={12} md={6} key={item}>
                <Skeleton variant="rounded" height={280} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      ) : (
        <Stack spacing={4}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Policy overview
            </Typography>
            <Grid container spacing={3}>
              {policyInsights.map((insight) => (
                <Grid item xs={12} md={4} key={insight.id}>
                  <PolicyInsightCard
                    insight={insight}
                    onToggle={handlePolicyToggle}
                    disableInteractions={loading || !tokenReady}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} lg={7}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Shift templates
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Live data from `/time/shifts` exposes active definitions
                        and grace windows.
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Active templates
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {activeShifts.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Source: /time/shifts
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Require approval
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {approvalRequired}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={
                              activeShifts.length === 0
                                ? 0
                                : Math.min(
                                    100,
                                    Math.round(
                                      (approvalRequired / activeShifts.length) *
                                        100
                                    )
                                  )
                            }
                            sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Overtime requires sign-off
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Unique punch policies
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {punchPolicies.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Based on shift punchPolicy
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {activeShifts.length === 0 ? (
                      <Alert severity="info">
                        No active shifts configured yet.
                      </Alert>
                    ) : (
                      <Stack spacing={2} sx={{ "& > *": { width: "100%" } }}>
                        {activeShifts.slice(0, 6).map((shift) => (
                          <ShiftTemplateCard
                            key={shift._id}
                            shift={shift}
                            onSelect={() => setSelectedShiftId(shift._id)}
                            selected={selectedShiftId === shift._id}
                          />
                        ))}
                      </Stack>
                    )}

                    {punchPolicies.length ? (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Punch policy coverage
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ mt: 0.5 }}
                        >
                          {punchPolicies.map((policy) => (
                            <Chip
                              key={policy.policy}
                              size="small"
                              variant="outlined"
                              label={`${policy.policy}: ${policy.count}`}
                            />
                          ))}
                        </Stack>
                      </Box>
                    ) : null}
                  </Stack>
                </CardContent>
                <CardActions
                  sx={{ justifyContent: "space-between", px: 3, pb: 2 }}
                >
                  <Chip
                    color="info"
                    label={`${activeShifts.length} active templates`}
                    variant="outlined"
                  />
                  <Chip
                    color={approvalRequired > 0 ? "warning" : "default"}
                    label={`${approvalRequired} need overtime approval`}
                    variant="outlined"
                  />
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Schedule rules
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pulled from `/time/schedule-rules` to describe rotation
                        patterns.
                      </Typography>
                    </Box>

                    {/* Detail pane for selected shift */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Shift details
                      </Typography>
                      {selectedShiftInfo ? (
                        <Stack spacing={1.5} sx={{ mt: 1 }}>
                          <Box>
                            <Typography fontWeight={600} noWrap>
                              {selectedShift?.name || "Unnamed shift"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {selectedShiftInfo.punchPolicy}
                            </Typography>
                          </Box>

                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Duration
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedShiftInfo.duration}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Schedule
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedShiftInfo.schedule}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Grace (in)
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedShiftInfo.graceIn}m
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Grace (out)
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {selectedShiftInfo.graceOut}m
                              </Typography>
                            </Grid>
                          </Grid>

                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              size="small"
                              variant="outlined"
                              label={selectedShiftInfo.schedule}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              color={
                                selectedShiftInfo.requiresApproval
                                  ? "warning"
                                  : "success"
                              }
                              label={
                                selectedShiftInfo.requiresApproval
                                  ? "Approval required"
                                  : "Auto-applied"
                              }
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`Punch: ${selectedShiftInfo.punchPolicy}`}
                            />
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            {selectedShiftInfo.requiresApproval
                              ? "Managers must approve overtime before logging hours for this template."
                              : "This template automatically tracks overtime without approvals."}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Select a shift on the left to view expanded details.
                        </Typography>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Active rules
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {activeRulesCount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Source: /time/schedule-rules
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Weekend patterns
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {weekendRules.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Detected via keyword scanning
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Upcoming start dates
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {upcomingRules.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Future effective rules
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {scheduleRules.length === 0 ? (
                      <Alert severity="info">
                        No schedule rules have been published.
                      </Alert>
                    ) : (
                      <Grid container spacing={2}>
                        {scheduleRules.slice(0, 6).map((rule) => (
                          <Grid item xs={12} key={rule._id}>
                            <Box
                              sx={{
                                px: 2,
                                py: 1.75,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                              >
                                <Typography
                                  fontWeight="bold"
                                  sx={{ flexGrow: 1 }}
                                >
                                  {rule.name}
                                </Typography>
                                <Chip
                                  size="small"
                                  color={
                                    rule.active === false
                                      ? "default"
                                      : "success"
                                  }
                                  label={
                                    rule.active === false
                                      ? "Inactive"
                                      : "Active"
                                  }
                                  variant="outlined"
                                />
                                {upcomingRules.some(
                                  (upcoming) => upcoming._id === rule._id
                                ) ? (
                                  <Chip
                                    size="small"
                                    color="info"
                                    label="Upcoming"
                                    variant="outlined"
                                  />
                                ) : null}
                              </Stack>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {describePattern(rule)}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                              >
                                {rule.shiftTypes?.length ? (
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`Shift types: ${rule.shiftTypes.join(
                                      ", "
                                    )}`}
                                  />
                                ) : null}
                                {rule.startDate ? (
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`Start ${rule.startDate}`}
                                  />
                                ) : null}
                                {rule.endDate ? (
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`End ${rule.endDate}`}
                                  />
                                ) : null}
                              </Stack>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                </CardContent>
                <CardActions
                  sx={{ justifyContent: "space-between", px: 3, pb: 2 }}
                >
                  <Chip
                    color="info"
                    label={`${scheduleRules.length} total rules`}
                    variant="outlined"
                  />
                  <Chip
                    color={weekendRules.length > 0 ? "success" : "default"}
                    label={`${weekendRules.length} weekend pattern(s)`}
                    variant="outlined"
                  />
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}
      {tokenReady ? (
        <PolicyActionDialog
          open={Boolean(activeAction)}
          action={activeAction}
          token={authToken ?? ""}
          onClose={() => setActiveAction(null)}
          onSuccess={(message) => {
            onRefresh?.();
            setSnackbar({
              open: true,
              severity: "success",
              message,
            });
          }}
        />
      ) : null}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

type PolicyActionDialogProps = {
  open: boolean;
  action: ActivePolicyAction | null;
  token: string;
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

function PolicyActionDialog({
  open,
  action,
  token,
  onClose,
  onSuccess,
}: PolicyActionDialogProps) {
  const [shiftForm, setShiftForm] = React.useState<ShiftFormState>(() =>
    createDefaultShiftForm()
  );
  const [holidayForm, setHolidayForm] = React.useState<HolidayFormState>(() =>
    createDefaultHolidayForm()
  );
  const [ruleForm, setRuleForm] = React.useState<ScheduleRuleFormState>(() =>
    createDefaultScheduleRuleForm()
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setError(null);
    setSubmitting(false);

    if (!action) {
      return;
    }

    if (action.kind === "shift") {
      setShiftForm({ ...createDefaultShiftForm(), ...action.preset });
    } else if (action.kind === "weekend") {
      setHolidayForm({ ...createDefaultHolidayForm(), ...action.preset });
    } else if (action.kind === "rule") {
      setRuleForm({ ...createDefaultScheduleRuleForm(), ...action.preset });
    }
  }, [action]);

  const isShift = action?.kind === "shift";
  const isWeekend = action?.kind === "weekend";
  const isRule = action?.kind === "rule";

  const handleSubmit = async () => {
    if (!action) {
      return;
    }

    if (!token) {
      setError("Missing authentication token. Please sign in again.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (action.kind === "shift") {
        if (!shiftForm.name.trim() || !shiftForm.shiftType.trim()) {
          throw new Error("Shift name and shift type are required.");
        }
        if (!/^\d{2}:\d{2}$/.test(shiftForm.startTime)) {
          throw new Error("Provide a valid start time in HH:MM format.");
        }
        if (!/^\d{2}:\d{2}$/.test(shiftForm.endTime)) {
          throw new Error("Provide a valid end time in HH:MM format.");
        }

        const payload = {
          name: shiftForm.name.trim(),
          shiftType: shiftForm.shiftType.trim(),
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          active: shiftForm.active,
          graceInMinutes: Number.isFinite(shiftForm.graceInMinutes)
            ? Number(shiftForm.graceInMinutes)
            : 0,
        };

        await postJson(token, "/time/shifts", payload);
        onSuccess?.("Shift template created successfully.");
        onClose();
        return;
      }

      if (action.kind === "weekend") {
        if (!holidayForm.startDate) {
          throw new Error("Start date is required for weekend coverage.");
        }
        if (!holidayForm.type) {
          throw new Error("Select a holiday type.");
        }
        if (holidayForm.weeklyDays.length === 0) {
          throw new Error("Select at least one weekday for weekend rules.");
        }

        const payload: Record<string, unknown> = {
          type: holidayForm.type,
          startDate: holidayForm.startDate,
          active: holidayForm.active,
          weeklyDays: holidayForm.weeklyDays,
        };

        if (holidayForm.name.trim()) payload.name = holidayForm.name.trim();
        if (holidayForm.endDate) payload.endDate = holidayForm.endDate;
        if (holidayForm.weeklyFrom) payload.weeklyFrom = holidayForm.weeklyFrom;
        if (holidayForm.weeklyTo) payload.weeklyTo = holidayForm.weeklyTo;
        if (holidayForm.contractStart)
          payload.contractStart = holidayForm.contractStart;
        if (holidayForm.probationEnd)
          payload.probationEnd = holidayForm.probationEnd;
        if (holidayForm.financialYearStart)
          payload.financialYearStart = holidayForm.financialYearStart;

        await postJson(token, "/time/holidays", payload);
        onSuccess?.("Weekend rule submitted successfully.");
        onClose();
        return;
      }

      if (action.kind === "rule") {
        if (!ruleForm.name.trim()) {
          throw new Error("Schedule rule name is required.");
        }

        const shiftTypes = ruleForm.shiftTypes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        const payload: Record<string, unknown> = {
          name: ruleForm.name.trim(),
          active: ruleForm.active,
        };

        if (ruleForm.pattern.trim()) payload.pattern = ruleForm.pattern.trim();
        if (shiftTypes.length) payload.shiftTypes = shiftTypes;
        if (ruleForm.startDate) payload.startDate = ruleForm.startDate;
        if (ruleForm.endDate) payload.endDate = ruleForm.endDate;

        await postJson(token, "/time/schedule-rules", payload);
        onSuccess?.("Schedule rule created successfully.");
        onClose();
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit policy changes.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWeeklyDay = (value: number) => {
    setHolidayForm((prev) => {
      const exists = prev.weeklyDays.includes(value);
      const weeklyDays = exists
        ? prev.weeklyDays.filter((day) => day !== value)
        : [...prev.weeklyDays, value];
      weeklyDays.sort((a, b) => a - b);
      return { ...prev, weeklyDays };
    });
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth>
      <DialogTitle>{action?.label ?? "Configure policy"}</DialogTitle>
      <DialogContent dividers>
        {action?.helperText ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {action.helperText}
          </Alert>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {isShift ? (
          <Stack spacing={2}>
            <TextField
              label="Shift name"
              value={shiftForm.name}
              onChange={(event) =>
                setShiftForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Shift type ID"
              helperText="Provide an existing ShiftType document identifier"
              value={shiftForm.shiftType}
              onChange={(event) =>
                setShiftForm((prev) => ({
                  ...prev,
                  shiftType: event.target.value,
                }))
              }
              fullWidth
              required
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start time"
                type="time"
                value={shiftForm.startTime}
                onChange={(event) =>
                  setShiftForm((prev) => ({
                    ...prev,
                    startTime: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End time"
                type="time"
                value={shiftForm.endTime}
                onChange={(event) =>
                  setShiftForm((prev) => ({
                    ...prev,
                    endTime: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Grace minutes (clock-in)"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={shiftForm.graceInMinutes}
              onChange={(event) =>
                setShiftForm((prev) => ({
                  ...prev,
                  graceInMinutes: Number(event.target.value) || 0,
                }))
              }
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={shiftForm.active}
                  onChange={(_, checked) =>
                    setShiftForm((prev) => ({ ...prev, active: checked }))
                  }
                />
              }
              label="Shift is active"
            />
          </Stack>
        ) : null}

        {isWeekend ? (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="holiday-type-label">Holiday type</InputLabel>
              <Select
                labelId="holiday-type-label"
                value={holidayForm.type}
                label="Holiday type"
                onChange={(event) =>
                  setHolidayForm((prev) => ({
                    ...prev,
                    type: event.target.value as HolidayFormState["type"],
                  }))
                }
              >
                {HOLIDAY_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start date"
                type="date"
                value={holidayForm.startDate}
                onChange={(event) =>
                  setHolidayForm((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              <TextField
                label="End date"
                type="date"
                value={holidayForm.endDate}
                onChange={(event) =>
                  setHolidayForm((prev) => ({
                    ...prev,
                    endDate: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Display name"
              value={holidayForm.name}
              onChange={(event) =>
                setHolidayForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              fullWidth
            />
            <Box>
              <FormLabel component="legend">Weekend days</FormLabel>
              <FormGroup row>
                {WEEKDAY_OPTIONS.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={holidayForm.weeklyDays.includes(day.value)}
                        onChange={() => toggleWeeklyDay(day.value)}
                      />
                    }
                    label={day.label}
                  />
                ))}
              </FormGroup>
              {holidayForm.weeklyDays.length === 0 ? (
                <FormHelperText error>
                  Select at least one day to describe the weekend rule.
                </FormHelperText>
              ) : null}
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Weekly from"
                type="date"
                value={holidayForm.weeklyFrom}
                onChange={(event) =>
                  setHolidayForm((prev) => ({
                    ...prev,
                    weeklyFrom: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Weekly to"
                type="date"
                value={holidayForm.weeklyTo}
                onChange={(event) =>
                  setHolidayForm((prev) => ({
                    ...prev,
                    weeklyTo: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Contract start (optional)"
                type="date"
                value={holidayForm.contractStart}
                onChange={(event) =>
                  setHolidayForm((prev) => ({
                    ...prev,
                    contractStart: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Probation end (optional)"
                type="date"
                value={holidayForm.probationEnd}
                onChange={(event) =>
                  setHolidayForm((prev) => ({
                    ...prev,
                    probationEnd: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Financial year start (optional)"
              type="date"
              value={holidayForm.financialYearStart}
              onChange={(event) =>
                setHolidayForm((prev) => ({
                  ...prev,
                  financialYearStart: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={holidayForm.active}
                  onChange={(_, checked) =>
                    setHolidayForm((prev) => ({ ...prev, active: checked }))
                  }
                />
              }
              label="Rule is active"
            />
          </Stack>
        ) : null}

        {isRule ? (
          <Stack spacing={2}>
            <TextField
              label="Rule name"
              value={ruleForm.name}
              onChange={(event) =>
                setRuleForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Pattern (optional)"
              value={ruleForm.pattern}
              onChange={(event) =>
                setRuleForm((prev) => ({
                  ...prev,
                  pattern: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Shift types (comma separated)"
              value={ruleForm.shiftTypes}
              onChange={(event) =>
                setRuleForm((prev) => ({
                  ...prev,
                  shiftTypes: event.target.value,
                }))
              }
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start date"
                type="date"
                value={ruleForm.startDate}
                onChange={(event) =>
                  setRuleForm((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End date"
                type="date"
                value={ruleForm.endDate}
                onChange={(event) =>
                  setRuleForm((prev) => ({
                    ...prev,
                    endDate: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={ruleForm.active}
                  onChange={(_, checked) =>
                    setRuleForm((prev) => ({ ...prev, active: checked }))
                  }
                />
              }
              label="Rule is active"
            />
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !action}
          variant="contained"
        >
          {submitting ? <CircularProgress size={18} /> : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

async function postJson(
  token: string,
  path: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let reason = `Request failed (${response.status})`;
    const text = await response.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        if (data?.message) {
          reason = Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message;
        } else {
          reason = text;
        }
      } catch (error) {
        reason = text;
      }
    }
    throw new Error(reason);
  }
}
