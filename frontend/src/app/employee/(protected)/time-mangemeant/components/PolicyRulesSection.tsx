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
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import SectionHeading from "./SectionHeading";
import ShiftTemplateCard from "./ShiftTemplateCard";
import { ScheduleRule, SectionDefinition, ShiftDefinition } from "./types";

type PolicyRulesSectionProps = {
  section: SectionDefinition;
  shifts: ShiftDefinition[];
  scheduleRules: ScheduleRule[];
  loading: boolean;
};

type PolicyToggle = {
  label: string;
  enabled: boolean;
  hint?: string;
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
};

function PolicyInsightCard({ insight }: PolicyInsightCardProps) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
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
            {insight.toggles.map((toggle) => (
              <Box key={toggle.label}>
                <FormControlLabel
                  control={
                    <Switch checked={toggle.enabled} disabled size="small" />
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
            ))}
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
            label: "Enable overtime tracking",
            enabled: overtimeTrackingEnabled,
            hint: `${activeShifts.length} shift template(s) configured`,
          },
          {
            label: "Requires manager approval",
            enabled: approvalRequired > 0,
            hint: approvalRequired
              ? `${approvalRequired} template(s) expect pre-approval`
              : "No templates request approval",
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
            label: "Grace windows enforced",
            enabled: gracePolicyEnforced,
            hint: gracePolicyEnforced
              ? `Range ${formatMinutes(graceAverages.minIn)} - ${formatMinutes(
                  graceAverages.maxIn
                )} on clock-in`
              : "No grace windows configured",
          },
          {
            label: "Strict punch policy",
            enabled: strictPunchPolicy,
            hint: strictPunchPolicy
              ? "FIRST_LAST policy present"
              : "Multiple punch accumulation",
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
            label: "Allow weekend work",
            enabled: weekendEnabled,
            hint: weekendEnabled
              ? `${weekendRules.length} schedule rule(s) mention weekend coverage`
              : "No explicit weekend rule configured",
          },
          {
            label: "Requires manager approval",
            enabled: weekendEnabled && approvalRequired > 0,
            hint:
              weekendEnabled && approvalRequired > 0
                ? "Weekend overtime ties back to shift approvals"
                : "No weekend approval enforcement",
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
                  <PolicyInsightCard insight={insight} />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={6}>
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
                      <Stack spacing={2}>
                        {activeShifts.slice(0, 6).map((shift) => (
                          <ShiftTemplateCard key={shift._id} shift={shift} />
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

            <Grid item xs={12} md={6}>
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
    </Box>
  );
}
