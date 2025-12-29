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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function normalizeRole(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
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
  const [userRoles, setUserRoles] = React.useState<string[]>([]);

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

  const visibleTabItems = React.useMemo(() => {
    // If roles are unknown/empty treat user as least-privileged: only show sections
    // that have no `allowedRoles` (public) or explicitly include a null/empty list.
    const hasRoles = Array.isArray(userRoles) && userRoles.length > 0;
    return tabItems.filter((tab) => {
      const allowed = (tab as any).allowedRoles as string[] | undefined;
      if (!allowed || allowed.length === 0) return true; // public
      if (!hasRoles) return false; // protected and user has no roles -> hide
      // normalize allowed roles too
      const allowedNorm = allowed.map(normalizeRole).filter(Boolean);
      return userRoles.some((r) => allowedNorm.includes(r));
    });
  }, [tabItems, userRoles]);

  function hasAccess(section: SectionDefinition) {
    const allowed = (section as any).allowedRoles as string[] | undefined;
    if (!allowed || allowed.length === 0) return true;
    if (!userRoles || userRoles.length === 0) return false;
    const allowedNorm = allowed.map(normalizeRole).filter(Boolean);
    return userRoles.some((r) => allowedNorm.includes(r));
  }

  const [activeSection, setActiveSection] = React.useState<string>(
    tabItems[0]?.id ?? "overview"
  );

  React.useEffect(() => {
    setActiveSection((prev) =>
      visibleTabItems.some((tab) => tab.id === prev)
        ? prev
        : visibleTabItems[0]?.id ?? tabItems[0]?.id ?? "overview"
    );
  }, [visibleTabItems, tabItems]);

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
        const token =
          window.localStorage.getItem("access_token") ||
          getCookie("access_token");
        const employeeId = window.localStorage.getItem("employeeId");

        if (!token || !employeeId) {
          router.push("/employee/login");
          return;
        }

        setAuthToken(token);

        // Decode roles from token for client-side visibility filtering.
        // If token is missing or decode fails, keep roles empty (least privilege).
        try {
          if (token) {
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = parts[1];
              const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
              // atob may throw if input length invalid
              const json = atob(base64);
              const parsed = JSON.parse(json);
              // support multiple common shapes for roles
              const rawRoles: unknown =
                parsed?.roles ||
                parsed?.role ||
                parsed?.realm_access?.roles ||
                parsed?.user?.roles ||
                parsed?.authorities;

              let rolesArr: string[] = [];
              if (Array.isArray(rawRoles)) {
                rolesArr = rawRoles.map((r) => String(r || ""));
              } else if (typeof rawRoles === "string") {
                rolesArr = rawRoles.split(",").map((s) => s.trim());
              }

              // normalize: trim + lowercase
              const normalized = rolesArr.map(normalizeRole).filter(Boolean);

              setUserRoles(normalized);
              console.debug("TimeManagementClient: decoded roles", {
                raw: rawRoles,
                normalized,
              });
            }
          } else {
            setUserRoles([]);
            console.debug("TimeManagementClient: no token found");
          }
        } catch (e) {
          setUserRoles([]);
          console.warn("TimeManagementClient: failed to decode token roles", e);
        }

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

        const [
          shiftsRes,
          assignmentsRes,
          rulesRes,
          holidaysRes,
          attendanceRes,
          exceptionsRes,
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
          fetch(
            `${API_BASE}/time/attendance/records/${employeeId}?${attendanceParams}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).then(async (res) => {
            if (!res.ok)
              throw new Error(`Failed to fetch attendance: ${res.status}`);
            return res.json();
          }),
          secureFetch<TimeException[]>(
            `/time/exceptions/employee/${employeeId}`,
            [],
            fetchOptions
          ),
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
          // Fallback for non-paginated response
          setAttendanceRecords(coerceArray<AttendanceRecord>(attendanceRes));
        }

        setTimeExceptions(coerceArray<TimeException>(exceptionsRes));
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
          Authorization: `Bearer ${authToken}`,
        },
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
          {visibleTabItems.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.title} />
          ))}
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {activeSection === overviewSection.id &&
            (hasAccess(overviewSection) ? (
              <Box>
                <SectionHeading {...overviewSection} />
                <OverviewMetrics metrics={overviewMetrics} loading={loading} />
              </Box>
            ) : (
              <Alert severity="warning">
                You are not authorized to view this section.
              </Alert>
            ))}

          {activeSection === attendanceSection.id &&
            (hasAccess(attendanceSection) ? (
              <AttendanceSection
                section={attendanceSection}
                history={correctionHistory}
                pending={pendingCorrections}
                loading={loading}
                managerQueueEnabled={managerQueueEnabled}
              />
            ) : (
              <Alert severity="warning">
                You are not authorized to view this section.
              </Alert>
            ))}

          {activeSection === shiftsSection.id &&
            (hasAccess(shiftsSection) ? (
              <ShiftAssignmentsSection
                section={shiftsSection}
                assignments={shiftAssignments}
                shifts={shiftDefinitions}
                scheduleRules={scheduleRules}
                loading={loading}
              />
            ) : (
              <Alert severity="warning">
                You are not authorized to view this section.
              </Alert>
            ))}

          {activeSection === policiesSection.id &&
            (hasAccess(policiesSection) ? (
              <PolicyRulesSection
                section={policiesSection}
                shifts={shiftDefinitions}
                scheduleRules={scheduleRules}
                loading={loading}
                authToken={authToken}
                onRefresh={handleRefresh}
              />
            ) : (
              <Alert severity="warning">
                You are not authorized to view this section.
              </Alert>
            ))}

          {activeSection === attendanceRecordsSection.id &&
            (hasAccess(attendanceRecordsSection) ? (
              <AttendanceRecordsSection
                section={attendanceRecordsSection}
                attendanceRecords={attendanceRecords}
                loading={loading}
                onPunchRecord={handlePunchRecord}
                pagination={attendancePagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onFiltersChange={handleFiltersChange}
              />
            ) : (
              <Alert severity="warning">
                You are not authorized to view this section.
              </Alert>
            ))}

          {activeSection === exceptionsSection.id &&
            (hasAccess(exceptionsSection) ? (
              <ExceptionsSection
                section={exceptionsSection}
                holidays={holidays}
                payrollQueue={payrollQueue}
                loading={loading}
              />
            ) : (
              <Alert severity="warning">
                You are not authorized to view this section.
              </Alert>
            ))}

          {activeSection === timeExceptionsSection.id &&
            (hasAccess(timeExceptionsSection) ? (
              <TimeExceptionsSection
                section={timeExceptionsSection}
                exceptions={timeExceptions}
                loading={loading}
              />
            ) : (
              <Alert severity="warning">
                You are not authorized to view this section.
              </Alert>
            ))}
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
