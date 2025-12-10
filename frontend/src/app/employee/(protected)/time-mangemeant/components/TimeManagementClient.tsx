"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import RefreshIcon from "@mui/icons-material/Refresh";

import AttendanceSection from "./AttendanceSection";
import ExceptionsSection from "./ExceptionsSection";
import OverviewMetrics from "./OverviewMetrics";
import PolicyRulesSection from "./PolicyRulesSection";
import SectionHeading from "./SectionHeading";
import ShiftAssignmentsSection from "./ShiftAssignmentsSection";
import {
  CorrectionRequest,
  HolidayDefinition,
  ScheduleRule,
  SectionDefinition,
  ShiftAssignment,
  ShiftDefinition,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";
const LINE_MANAGER_KEYS = ["lineManagerId", "managerId", "supervisorId"];
const HISTORY_LOOKBACK_MONTHS = 3;

type TimeManagementClientProps = {
  sections: SectionDefinition[];
};

type FetchOptions = {
  token: string;
};

function coerceArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as any).data)
  ) {
    return (payload as any).data as T[];
  }
  return [];
}

function buildSparkline(value: number): number[] {
  const base = Math.max(value, 1);
  return Array.from({ length: 7 }, (_, index) =>
    Math.max(0, base - (6 - index) * Math.max(1, Math.floor(base / 4)))
  );
}

export default function TimeManagementClient({
  sections,
}: TimeManagementClientProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [shiftDefinitions, setShiftDefinitions] = React.useState<
    ShiftDefinition[]
  >([]);
  const [shiftAssignments, setShiftAssignments] = React.useState<
    ShiftAssignment[]
  >([]);
  const [scheduleRules, setScheduleRules] = React.useState<ScheduleRule[]>([]);
  const [holidays, setHolidays] = React.useState<HolidayDefinition[]>([]);
  const [pendingCorrections, setPendingCorrections] = React.useState<
    CorrectionRequest[]
  >([]);
  const [correctionHistory, setCorrectionHistory] = React.useState<
    CorrectionRequest[]
  >([]);
  const [payrollQueue, setPayrollQueue] = React.useState<CorrectionRequest[]>(
    []
  );
  const [managerQueueEnabled, setManagerQueueEnabled] = React.useState(false);
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  const sectionMap = React.useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections]
  );

  const overviewSection = React.useMemo<SectionDefinition>(() => {
    return (
      sectionMap.get("overview") || {
        id: "overview",
        title: "Time operations overview",
        description:
          "Monitor shift coverage, correction workload, and payroll readiness in one dashboard.",
      }
    );
  }, [sectionMap]);

  const attendanceSection = React.useMemo<SectionDefinition>(() => {
    return (
      sectionMap.get("attendance") || {
        id: "attendance",
        title: "Attendance & corrections",
        description:
          "Track recent punches, submitted edits, and manager approvals tied to attendance.",
      }
    );
  }, [sectionMap]);

  const shiftsSection = React.useMemo<SectionDefinition>(() => {
    return (
      sectionMap.get("shifts") || {
        id: "shifts",
        title: "Shift assignments",
        description:
          "Review active shift templates and employee coverage over the current planning window.",
      }
    );
  }, [sectionMap]);

  const policiesSection = React.useMemo<SectionDefinition>(() => {
    return (
      sectionMap.get("policies") || {
        id: "policies",
        title: "Policies & rules",
        description:
          "Keep overtime approvals, punch policies, and schedule rules aligned with HR governance.",
      }
    );
  }, [sectionMap]);

  const exceptionsSection = React.useMemo<SectionDefinition>(() => {
    return (
      sectionMap.get("exceptions") || {
        id: "exceptions",
        title: "Exceptions & payroll readiness",
        description:
          "Surface holiday calendars and approved corrections awaiting payroll application.",
      }
    );
  }, [sectionMap]);

  const tabItems = React.useMemo(
    () => [
      overviewSection,
      attendanceSection,
      shiftsSection,
      policiesSection,
      exceptionsSection,
    ],
    [
      overviewSection,
      attendanceSection,
      shiftsSection,
      policiesSection,
      exceptionsSection,
    ]
  );

  const [activeSection, setActiveSection] = React.useState<string>(
    tabItems[0]?.id ?? "overview"
  );

  React.useEffect(() => {
    setActiveSection((prev) =>
      tabItems.some((tab) => tab.id === prev)
        ? prev
        : tabItems[0]?.id ?? "overview"
    );
  }, [tabItems]);

  const handleSectionChange = React.useCallback(
    (_event: React.SyntheticEvent, value: string) => {
      setActiveSection(value);
    },
    []
  );

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const token = window.localStorage.getItem("access_token");
        const employeeId = window.localStorage.getItem("employeeId");

        if (!token || !employeeId) {
          router.push("/employee/login");
          return;
        }

        setAuthToken(token);

        const managerId = LINE_MANAGER_KEYS.map((key) =>
          window.localStorage.getItem(key)
        ).find(Boolean);
        setManagerQueueEnabled(Boolean(managerId));

        setLoading(true);
        setError(null);

        const now = new Date();
        const startRange = new Date(
          now.getFullYear(),
          now.getMonth() - HISTORY_LOOKBACK_MONTHS,
          1
        );
        startRange.setHours(0, 0, 0, 0);
        const endRange = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endRange.setHours(23, 59, 59, 999);

        const fetchOptions: FetchOptions = { token };

        const [
          shiftsRes,
          assignmentsRes,
          rulesRes,
          holidaysRes,
          historyRes,
          pendingRes,
          payrollRes,
        ] = await Promise.all([
          secureFetch<ShiftDefinition[]>(`/time/shifts`, [], fetchOptions),
          secureFetch<ShiftAssignment[]>(
            `/time/shifts/employee/${employeeId}?start=${startRange.toISOString()}&end=${endRange.toISOString()}`,
            [],
            fetchOptions
          ),
          secureFetch<ScheduleRule[]>(`/time/schedule-rules`, [], fetchOptions),
          secureFetch<HolidayDefinition[]>(`/time/holidays`, [], fetchOptions),
          secureFetch<CorrectionRequest[]>(
            `/time/corrections/history/${employeeId}?startDate=${startRange.toISOString()}&endDate=${endRange.toISOString()}`,
            [],
            fetchOptions
          ),
          managerId
            ? secureFetch<CorrectionRequest[]>(
                `/time/corrections/pending/${managerId}`,
                [],
                fetchOptions
              )
            : Promise.resolve([]),
          secureFetch<CorrectionRequest[]>(
            `/time/corrections/approved/payroll`,
            [],
            fetchOptions
          ),
        ]);

        if (!isMounted) return;

        setShiftDefinitions(coerceArray<ShiftDefinition>(shiftsRes));
        setShiftAssignments(coerceArray<ShiftAssignment>(assignmentsRes));
        setScheduleRules(coerceArray<ScheduleRule>(rulesRes));
        setHolidays(coerceArray<HolidayDefinition>(holidaysRes));
        setCorrectionHistory(coerceArray<CorrectionRequest>(historyRes));
        setPendingCorrections(coerceArray<CorrectionRequest>(pendingRes));
        setPayrollQueue(coerceArray<CorrectionRequest>(payrollRes));
      } catch (err) {
        console.error("Failed to load time management data", err);
        if (isMounted) {
          setError("Unable to load time management data. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [router, refreshKey]);

  const overviewMetrics = React.useMemo(() => {
    const activeShifts = shiftDefinitions.filter(
      (shift) => shift.active !== false
    ).length;
    const upcomingShifts = shiftAssignments.filter((assignment) => {
      const shiftEnd = new Date(
        assignment.endDate || assignment.startDate
      ).getTime();
      return shiftEnd >= Date.now();
    }).length;
    const pendingCount = pendingCorrections.length;
    const payrollCount = payrollQueue.length;

    return [
      {
        title: "Active shift templates",
        value: `${activeShifts}`,
        interval: "Configured in system",
        trend: (activeShifts > 0 ? "up" : "neutral") as "up" | "neutral",
        data: buildSparkline(activeShifts),
      },
      {
        title: "Upcoming assignments",
        value: `${upcomingShifts}`,
        interval: "Next planning range",
        trend: (upcomingShifts > 0 ? "up" : "neutral") as "up" | "neutral",
        data: buildSparkline(upcomingShifts),
      },
      {
        title: "Pending corrections",
        value: `${pendingCount}`,
        interval: "Awaiting manager",
        trend: (pendingCount > 0 ? "down" : "neutral") as "down" | "neutral",
        data: buildSparkline(pendingCount),
      },
      {
        title: "Payroll ready items",
        value: `${payrollCount}`,
        interval: "Approved corrections",
        trend: (payrollCount > 0 ? "up" : "neutral") as "up" | "neutral",
        data: buildSparkline(payrollCount),
      },
    ];
  }, [shiftDefinitions, shiftAssignments, pendingCorrections, payrollQueue]);

  const handleRefresh = React.useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { sm: "100%", md: "1700px" },
        mx: "auto",
        py: 3,
        px: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography component="h1" variant="h4" fontWeight="bold">
              Time management workspace
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Designed around the backend services powering attendance, shifts,
              and payroll sync.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={
              loading ? <CircularProgress size={16} /> : <RefreshIcon />
            }
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh data
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Tabs
          value={activeSection}
          onChange={handleSectionChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Time management sections"
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          {tabItems.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.title} />
          ))}
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {activeSection === overviewSection.id && (
            <Box>
              <SectionHeading {...overviewSection} />
              <OverviewMetrics metrics={overviewMetrics} loading={loading} />
            </Box>
          )}

          {activeSection === attendanceSection.id && (
            <AttendanceSection
              section={attendanceSection}
              history={correctionHistory}
              pending={pendingCorrections}
              loading={loading}
              managerQueueEnabled={managerQueueEnabled}
            />
          )}

          {activeSection === shiftsSection.id && (
            <ShiftAssignmentsSection
              section={shiftsSection}
              assignments={shiftAssignments}
              shifts={shiftDefinitions}
              scheduleRules={scheduleRules}
              loading={loading}
            />
          )}

          {activeSection === policiesSection.id && (
            <PolicyRulesSection
              section={policiesSection}
              shifts={shiftDefinitions}
              scheduleRules={scheduleRules}
              loading={loading}
              authToken={authToken}
              onRefresh={handleRefresh}
            />
          )}

          {activeSection === exceptionsSection.id && (
            <ExceptionsSection
              section={exceptionsSection}
              holidays={holidays}
              payrollQueue={payrollQueue}
              loading={loading}
            />
          )}
        </Box>
      </Stack>
    </Box>
  );
}

async function secureFetch<T>(
  path: string,
  fallback: T,
  options: FetchOptions
): Promise<T | unknown> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${options.token}`,
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      window.localStorage.removeItem("access_token");
      window.location.href = "/employee/login";
      return fallback;
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const payload = await response.json();
    return payload as T;
  } catch (err) {
    console.warn(`Failed to fetch ${path}`, err);
    return fallback;
  }
}
