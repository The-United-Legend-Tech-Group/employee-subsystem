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
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import PunchClockRoundedIcon from "@mui/icons-material/PunchClockRounded";
import WorkHistoryRoundedIcon from "@mui/icons-material/WorkHistoryRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";

import AttendanceSection from "./AttendanceSection";
import AttendanceRecordsSection from "./AttendanceRecordsSection";
import ExceptionsSection from "./ExceptionsSection";
import TimeExceptionsSection from "./TimeExceptionsSection";
import OverviewMetrics from "./OverviewMetrics";
import PolicyRulesSection from "./PolicyRulesSection";
import SectionHeading from "./SectionHeading";
import ShiftAssignmentsSection from "./ShiftAssignmentsSection";
import {
  AttendanceRecord,
  CorrectionRequest,
  HolidayDefinition,
  PunchType,
  ScheduleRule,
  SectionDefinition,
  ShiftAssignment,
  ShiftDefinition,
  TimeException,
} from "./types";
import { decryptData } from "@/common/utils/encryption";
import { getAccessToken, getEmployeeIdFromCookie } from "@/lib/auth-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";
const LINE_MANAGER_KEYS = ["lineManagerId", "managerId", "supervisorId"];
const HISTORY_LOOKBACK_MONTHS = 12;

type TimeManagementClientProps = {
  sections: SectionDefinition[];
};

type FetchOptions = {
  token?: string | null;
};

function coerceArray<T>(payload: unknown): T[] {
  console.log("🔄 coerceArray input:", {
    payload,
    type: typeof payload,
    isArray: Array.isArray(payload),
  });

  if (Array.isArray(payload)) {
    console.log("✅ Direct array with", payload.length, "items");
    return payload as T[];
  }
  if (
    payload &&
    typeof payload === "object" &&
    (Array.isArray((payload as any).data) ||
      Array.isArray((payload as any).items) ||
      Array.isArray((payload as any).records) ||
      Array.isArray((payload as any).docs))
  ) {
    const anyPayload = payload as any;
    if (Array.isArray(anyPayload.data)) {
      console.log(
        "✅ Found array in .data with",
        anyPayload.data.length,
        "items"
      );
      return anyPayload.data as T[];
    }
    if (Array.isArray(anyPayload.items)) {
      console.log(
        "✅ Found array in .items with",
        anyPayload.items.length,
        "items"
      );
      return anyPayload.items as T[];
    }
    if (Array.isArray(anyPayload.records)) {
      console.log(
        "✅ Found array in .records with",
        anyPayload.records.length,
        "items"
      );
      return anyPayload.records as T[];
    }
    if (Array.isArray(anyPayload.docs)) {
      console.log(
        "✅ Found array in .docs with",
        anyPayload.docs.length,
        "items"
      );
      return anyPayload.docs as T[];
    }
  }
  // Fallback: search shallow properties for first array
  if (payload && typeof payload === "object") {
    for (const key of Object.keys(payload as any)) {
      const v = (payload as any)[key];
      if (Array.isArray(v)) {
        console.log(`✅ Found array in .${key} with`, v.length, "items");
        return v as T[];
      }
    }
  }
  console.log("⚠️ No array found, returning empty array");
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
  const [attendanceRecords, setAttendanceRecords] = React.useState<
    AttendanceRecord[]
  >([]);
  const [attendancePagination, setAttendancePagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [attendanceFilters, setAttendanceFilters] = React.useState({
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    hasMissedPunch: undefined as boolean | undefined,
    finalisedForPayroll: undefined as boolean | undefined,
  });
  const [timeExceptions, setTimeExceptions] = React.useState<TimeException[]>(
    []
  );
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
  const [employeeId, setEmployeeId] = React.useState<string>("");
  const [lineManagerId, setLineManagerId] = React.useState<string>("");

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

  const attendanceRecordsSection = React.useMemo<SectionDefinition>(() => {
    return (
      sectionMap.get("attendance-records") || {
        id: "attendance-records",
        title: "Attendance records & punches",
        description:
          "View and record employee clock in/out punches and daily attendance tracking.",
      }
    );
  }, [sectionMap]);

  const timeExceptionsSection = React.useMemo<SectionDefinition>(() => {
    return (
      sectionMap.get("time-exceptions") || {
        id: "time-exceptions",
        title: "Time exceptions",
        description:
          "Monitor and resolve attendance exceptions including missed punches, late arrivals, and overtime requests.",
      }
    );
  }, [sectionMap]);

  const tabItems = React.useMemo(
    () => [
      overviewSection,
      attendanceSection,
      attendanceRecordsSection,
      shiftsSection,
      policiesSection,
      exceptionsSection,
      timeExceptionsSection,
    ],
    [
      overviewSection,
      attendanceSection,
      attendanceRecordsSection,
      shiftsSection,
      policiesSection,
      exceptionsSection,
      timeExceptionsSection,
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

  // Load static data (shifts, rules, holidays) - only on mount and refresh
  React.useEffect(() => {
    let isMounted = true;

    const loadStaticData = async () => {
      try {
        const token = getAccessToken();
        const fetchOptions: FetchOptions = { token: token || undefined };

        const [shiftsRes, rulesRes, holidaysRes] = await Promise.all([
          secureFetch<ShiftDefinition[]>(`/time/shifts`, [], fetchOptions),
          secureFetch<ScheduleRule[]>(`/time/schedule-rules`, [], fetchOptions),
          secureFetch<HolidayDefinition[]>(`/time/holidays`, [], fetchOptions),
        ]);

        if (!isMounted) return;

        setShiftDefinitions(coerceArray<ShiftDefinition>(shiftsRes));
        setScheduleRules(coerceArray<ScheduleRule>(rulesRes));
        setHolidays(coerceArray<HolidayDefinition>(holidaysRes));
      } catch (err) {
        console.error("Failed to load static time management data", err);
      }
    };

    loadStaticData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]); // Only refresh when user clicks refresh

  // Load dynamic data (attendance, corrections, assignments)
  React.useEffect(() => {
    let isMounted = true;

    const resolveEmployeeId = async (): Promise<string | null> => {
      const isHex24 = (v: string) => /^[a-fA-F0-9]{24}$/.test(v);

      // First priority: Try to get from cookie (set by backend auth)
      const cookieEmployeeId = getEmployeeIdFromCookie();
      if (cookieEmployeeId && isHex24(cookieEmployeeId)) {
        console.log("✅ Got employeeId from cookie:", cookieEmployeeId);
        return cookieEmployeeId;
      }

      // Fallback: Try direct employeeId from localStorage
      const raw = window.localStorage.getItem("employeeId");
      if (raw && isHex24(raw)) {
        console.log("✅ Got employeeId from localStorage:", raw);
        return raw;
      }

      // If looks like encrypted payload (JSON with iv/data), attempt decrypt using access token
      const token = getAccessToken() || "";
      if (raw && token) {
        try {
          const maybeObj = JSON.parse(raw);
          if (
            maybeObj &&
            typeof maybeObj === "object" &&
            "iv" in maybeObj &&
            "data" in maybeObj
          ) {
            const decrypted = await decryptData(raw, token);
            if (decrypted && isHex24(decrypted)) {
              console.log("✅ Got employeeId from decrypted localStorage:", decrypted);
              return decrypted;
            }
          }
        } catch (_e) {
          // not JSON, skip
        }
      }

      // Try parsed object forms
      const tryKeys = ["employee", "user", "profile"];
      for (const key of tryKeys) {
        const val = window.localStorage.getItem(key);
        if (!val) continue;
        try {
          const obj = JSON.parse(val);
          if (obj && typeof obj === "object") {
            if (typeof obj.employeeId === "string" && isHex24(obj.employeeId)) {
              console.log(`✅ Got employeeId from localStorage.${key}.employeeId:`, obj.employeeId);
              return obj.employeeId;
            }
            if (obj._id && typeof obj._id === "string" && isHex24(obj._id)) {
              console.log(`✅ Got employeeId from localStorage.${key}._id:`, obj._id);
              return obj._id;
            }
            if (obj.id && typeof obj.id === "string" && isHex24(obj.id)) {
              console.log(`✅ Got employeeId from localStorage.${key}.id:`, obj.id);
              return obj.id;
            }
          }
        } catch (_e) {
          // ignore JSON parse errors
        }
      }

      // Fallback: if raw exists and looks like quoted or wrapped, attempt to strip quotes
      if (raw) {
        const stripped = raw.replace(/[^a-fA-F0-9]/g, "");
        if (isHex24(stripped)) {
          console.log("✅ Got employeeId from stripped localStorage:", stripped);
          return stripped;
        }
      }

      console.warn("❌ Could not resolve employeeId from any source", {
        cookieEmployeeId,
        localStorageEmployeeId: raw,
        hasToken: !!token,
      });
      return null;
    };

    const loadDynamicData = async () => {
      try {
        const token = getAccessToken();
        const employeeId = await resolveEmployeeId();

        if (!employeeId) {
          setError(
            "Missing employee identity. Please ensure your profile is loaded."
          );
          setLoading(false);
          return;
        }

        setAuthToken(token || null);
        setEmployeeId(employeeId);

        const managerId = LINE_MANAGER_KEYS.map((key) =>
          window.localStorage.getItem(key)
        ).find(Boolean);
        setManagerQueueEnabled(Boolean(managerId));
        setLineManagerId(managerId || "");

        // Debug: Log all localStorage to help identify the issue
        console.log("🔐 TimeManagementClient - User Context:", {
          employeeId,
          lineManagerId: managerId || "none",
          hasToken: !!token,
          localStorage: {
            employeeId: window.localStorage.getItem("employeeId"),
            access_token: !!window.localStorage.getItem("access_token"),
            lineManagerId: window.localStorage.getItem("lineManagerId"),
            managerId: window.localStorage.getItem("managerId"),
            supervisorId: window.localStorage.getItem("supervisorId"),
          },
        });

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

        const fetchOptions: FetchOptions = { token: token || undefined };

        // Build attendance query params
        const attendanceParams = new URLSearchParams({
          page: attendancePagination.page.toString(),
          limit: attendancePagination.limit.toString(),
        });

        if (attendanceFilters.startDate) {
          attendanceParams.append("startDate", attendanceFilters.startDate);
        }
        if (attendanceFilters.endDate) {
          attendanceParams.append("endDate", attendanceFilters.endDate);
        }
        if (attendanceFilters.hasMissedPunch !== undefined) {
          attendanceParams.append(
            "hasMissedPunch",
            attendanceFilters.hasMissedPunch.toString()
          );
        }
        if (attendanceFilters.finalisedForPayroll !== undefined) {
          attendanceParams.append(
            "finalisedForPayroll",
            attendanceFilters.finalisedForPayroll.toString()
          );
        }

        console.log("🔍 Fetching corrections history:", {
          employeeId,
          employeeIdType: typeof employeeId,
          employeeIdLength: employeeId.length,
          startRange: startRange.toISOString(),
          endRange: endRange.toISOString(),
          fullUrl: `${API_BASE}/time/corrections/history/${employeeId}?startDate=${startRange.toISOString()}&endDate=${endRange.toISOString()}`,
        });

        const [
          assignmentsRes,
          attendanceRes,
          exceptionsRes,
          historyRes,
          pendingRes,
          payrollRes,
        ] = await Promise.all([
          secureFetch<ShiftAssignment[]>(
            `/time/shifts/assignments?start=${startRange.toISOString()}&end=${endRange.toISOString()}`,
            [],
            fetchOptions
          ),
          fetch(
            `${API_BASE}/time/attendance/records/${employeeId}?${attendanceParams}`,
            {
              headers: (token ? { Authorization: `Bearer ${token}` } : {}) as Record<string, string>,
              credentials: "include",
            }
          ).then(async (res) => {
            if (!res.ok)
              throw new Error(`Failed to fetch attendance: ${res.status}`);
            return res.json();
          }),
          // Fetch exceptions for employee (new backend route)
          secureFetch<TimeException[]>(
            `/time/exceptions/employee/${employeeId}`,
            [],
            fetchOptions
          ),
          // Try without date filters first to see if ANY corrections exist
          secureFetch<CorrectionRequest[]>(
            `/time/corrections/history/${employeeId}`,
            [],
            fetchOptions
          ),
          // Also try with date filters
          // secureFetch<CorrectionRequest[]>(
          //   `/time/corrections/history/${employeeId}?startDate=${startRange.toISOString()}&endDate=${endRange.toISOString()}`,
          //   [],
          //   fetchOptions
          // ),
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

        console.log("📦 Raw corrections history response:", historyRes);
        console.log("📦 Raw pending corrections response:", pendingRes);

        if (!isMounted) return;

        setShiftAssignments(coerceArray<ShiftAssignment>(assignmentsRes));

        // Handle paginated attendance response
        if (
          attendanceRes &&
          typeof attendanceRes === "object" &&
          "data" in attendanceRes &&
          "pagination" in attendanceRes
        ) {
          setAttendanceRecords((attendanceRes as any).data || []);
          setAttendancePagination(
            (attendanceRes as any).pagination || {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            }
          );
        } else {
          setAttendanceRecords(coerceArray<AttendanceRecord>(attendanceRes));
        }

        setTimeExceptions(coerceArray<TimeException>(exceptionsRes));

        const historyArray = coerceArray<CorrectionRequest>(historyRes);
        const pendingArray = coerceArray<CorrectionRequest>(pendingRes);
        const payrollArray = coerceArray<CorrectionRequest>(payrollRes);

        console.log(
          "✅ Coerced corrections history:",
          historyArray.length,
          "items"
        );
        console.log(
          "✅ Coerced pending corrections:",
          pendingArray.length,
          "items"
        );
        console.log("✅ Sample history item:", historyArray[0]);

        setCorrectionHistory(historyArray);
        setPendingCorrections(pendingArray);
        setPayrollQueue(payrollArray);
      } catch (err) {
        console.error("Failed to load time management data", err);
        console.error("❌ Error details:", {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
        if (isMounted) {
          setError(
            `Unable to load time management data: ${err instanceof Error ? err.message : String(err)
            }`
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDynamicData();

    return () => {
      isMounted = false;
    };
  }, [
    router,
    refreshKey,
    attendancePagination.page,
    attendancePagination.limit,
    attendanceFilters.startDate,
    attendanceFilters.endDate,
    attendanceFilters.hasMissedPunch,
    attendanceFilters.finalisedForPayroll,
  ]);

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
    const openExceptions = timeExceptions.filter(
      (ex) => ex.status === "OPEN" || ex.status === "PENDING"
    ).length;
    const recentAttendance = attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date).getTime();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return recordDate >= weekAgo;
    }).length;

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
      {
        title: "Open exceptions",
        value: `${openExceptions}`,
        interval: "Requiring attention",
        trend: (openExceptions > 0 ? "down" : "neutral") as "down" | "neutral",
        data: buildSparkline(openExceptions),
      },
      {
        title: "Recent attendance",
        value: `${recentAttendance}`,
        interval: "Last 7 days",
        trend: (recentAttendance > 0 ? "up" : "neutral") as "up" | "neutral",
        data: buildSparkline(recentAttendance),
      },
    ];
  }, [
    shiftDefinitions,
    shiftAssignments,
    pendingCorrections,
    payrollQueue,
    timeExceptions,
    attendanceRecords,
  ]);

  const handleRefresh = React.useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const handlePageChange = React.useCallback((newPage: number) => {
    setAttendancePagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = React.useCallback((newSize: number) => {
    setAttendancePagination((prev) => ({ ...prev, page: 1, limit: newSize }));
  }, []);

  const handleFiltersChange = React.useCallback(
    (
      startDate?: string,
      endDate?: string,
      hasMissedPunch?: boolean,
      finalisedForPayroll?: boolean
    ) => {
      setAttendanceFilters({
        startDate,
        endDate,
        hasMissedPunch,
        finalisedForPayroll,
      });
      // Reset to page 1 when filters change
      setAttendancePagination((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const handlePunchRecord = React.useCallback(
    async (employeeId: string, type: PunchType, time?: string) => {
      if (!authToken) {
        throw new Error("Not authenticated");
      }

      // Build request body, only include time if provided
      const requestBody: {
        employeeId: string;
        type: PunchType;
        time?: string;
      } = {
        employeeId,
        type,
      };

      // Only add time field if it's provided and not empty
      if (time && time.trim()) {
        requestBody.time = time;
      }

      const response = await fetch(`${API_BASE}/time/attendance/punch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {} as Record<string, string>),
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Punch error response:", errorText);

        // Try to parse error message from backend
        try {
          const errorJson = JSON.parse(errorText);
          const message =
            errorJson.message ||
            errorJson.error ||
            `Failed to record punch: ${response.status}`;
          throw new Error(message);
        } catch (parseError) {
          // If JSON parsing fails, throw generic error
          throw new Error(`Failed to record punch: ${response.status}`);
        }
      }

      // Refresh data after successful punch
      handleRefresh();
    },
    [authToken, handleRefresh]
  );

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
            <Tab
              key={tab.id}
              value={tab.id}
              label={tab.title}
              icon={
                typeof tab.icon === "string" || React.isValidElement(tab.icon)
                  ? tab.icon
                  : undefined
              }
              iconPosition="start"
            />
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
              lineManagerId={lineManagerId}
              onRefresh={handleRefresh}
            />
          )}

          {activeSection === shiftsSection.id && (
            <ShiftAssignmentsSection
              section={shiftsSection}
              assignments={shiftAssignments}
              shifts={shiftDefinitions}
              scheduleRules={scheduleRules}
              loading={loading}
              onRefresh={handleRefresh}
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

          {activeSection === attendanceRecordsSection.id && (
            <AttendanceRecordsSection
              section={attendanceRecordsSection}
              attendanceRecords={attendanceRecords}
              loading={loading}
              onPunchRecord={handlePunchRecord}
              onRefresh={handleRefresh}
              pagination={attendancePagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onFiltersChange={handleFiltersChange}
            />
          )}

          {activeSection === exceptionsSection.id && (
            <ExceptionsSection
              section={exceptionsSection}
              holidays={holidays}
              loading={loading}
            />
          )}

          {activeSection === timeExceptionsSection.id && (
            <TimeExceptionsSection
              section={timeExceptionsSection}
              exceptions={timeExceptions}
              loading={loading}
              employeeId={employeeId}
              lineManagerId={lineManagerId}
              onCreated={handleRefresh}
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
  options?: FetchOptions
): Promise<T | unknown> {
  try {
    const headers: Record<string, string> = {};
    if (options?.token) headers.Authorization = `Bearer ${options.token}`;
    console.log(`🌐 Fetching ${path}`, { hasToken: !!options?.token });
    const response = await fetch(`${API_BASE}${path}`, {
      headers,
      credentials: "include",
      cache: "no-store",
    });

    console.log(`📡 Response for ${path}:`, {
      status: response.status,
      ok: response.ok,
    });

    if (response.status === 401) {
      // Allow unauthenticated usage for public/testing endpoints
      console.warn(`401 for ${path} — continuing without auth`);
      return fallback;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error response for ${path}:`, errorText);
      throw new Error(`Request failed: ${response.status} - ${errorText}`);
    }

    const payload = await response.json();
    console.log(`✅ Payload for ${path}:`, payload);
    return payload as T;
  } catch (err) {
    console.warn(`Failed to fetch ${path}`, err);
    return fallback;
  }
}
