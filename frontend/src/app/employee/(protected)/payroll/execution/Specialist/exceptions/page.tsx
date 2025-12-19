"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { getCookie } from '@/lib/auth-utils';

import { PageHeader } from "@/payroll/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/payroll/components/ui/card";
import { ExceptionsTable } from "@/payroll/components/tables/exceptions-table";
import { Button } from "@/payroll/components/ui/button";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { Exception } from "@/payroll/libs/types";
import { useToast } from "@/payroll/hooks/use-toast";
import { cn } from "@/payroll/libs/utils";

type Priority = "high" | "medium" | "low";

const classifyType = (msg: string): Exception["type"] => {
  const m = (msg || "").toLowerCase();
  if (m.includes("bank")) return "missing-bank";
  if (m.includes("negative")) return "negative-pay";
  if (m.includes("spike")) return "salary-spike";
  return "calculation-error";
};

const computePriority = (msg: string): Priority => {
  const m = (msg || "").toLowerCase();
  if (
    m.includes("missing bank") ||
    m.includes("bank details") ||
    m.includes("bank account") ||
    m.includes("negative") ||
    m.includes("exceeds gross")
  )
    return "high";

  if (
    m.includes("exceeds net") ||
    m.includes("irregular") ||
    m.includes("calculation") ||
    m.includes("pay grade")
  )
    return "medium";

  return "low";
};

/**
 * ✅ Cookie-first auth pattern:
 * Read token at request-time (NOT module scope) and attach Authorization header.
 * Uses withCredentials: true to prioritize httpOnly cookies.
 */
function getAccessToken(): string {
  const token = getCookie('access_token');
  return token ? token.replace(/^Bearer\s+/i, '').trim() : '';
}

function getAuthConfig() {
  const token = getAccessToken();

  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log('[Exceptions] No localStorage token - relying on httpOnly cookies');
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as const;
}

// Main page wrapper with Suspense boundary for useSearchParams
export default function ExceptionsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading exceptions…</div>}>
      <ExceptionsPageContent />
    </Suspense>
  );
}

function ExceptionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const payrollRunId =
    searchParams?.get("payrollRunId") ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("payrollRunId") || ""
      : "");

  const employeeIdFilter =
    searchParams?.get("employeeId") ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("employeeId")
      : null);

  const isEmployeeFiltered = Boolean(employeeIdFilter);

  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const fetchExceptions = async () => {
      try {
        setLoading(true);
        setError(null);

        const BACKEND_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:50000";

        // If opened directly without payrollRunId, use latest existing run
        if (!payrollRunId) {
          const runsRes = await axios.get(
            `${BACKEND_URL}/payroll/runs`,
            getAuthConfig()
          );
          const runs: any[] = Array.isArray(runsRes?.data) ? runsRes.data : [];

          if (!runs.length) {
            setError("No payroll runs found. Generate a draft first.");
            return;
          }

          // Prefer latest by createdAt if present; otherwise fall back to last item
          const latest =
            runs
              .slice()
              .sort((a, b) => {
                const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tb - ta;
              })[0] ?? runs[runs.length - 1];

          const latestId = latest?._id || latest?.payrollRunId || latest?.id;
          if (!latestId) {
            setError("Could not determine latest payroll run id.");
            return;
          }

          router.replace(
            `/payroll/specialist/exceptions?payrollRunId=${encodeURIComponent(
              String(latestId)
            )}`
          );
          return;
        }

        // GET /payroll/exceptions?payrollRunId=...&employeeId=...
        const res = await axios.get(`${BACKEND_URL}/payroll/exceptions`, {
          ...getAuthConfig(),
          params: {
            payrollRunId,
            employeeId: employeeIdFilter || undefined,
          },
        });

        const list: any[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.exceptions)
            ? res.data.exceptions
            : [];

        const flat: Exception[] = list.map((x: any, idx: number) => {
          const description = String(
            x?.description ?? x?.message ?? "Payroll exception detected"
          );
          const priority = computePriority(description);

          return {
            id: String(x?.id ?? `${x?.employeeId ?? "emp"}-${idx}`),
            employeeId: String(x?.employeeId ?? ""),
            type: classifyType(description),
            severity: priority, // UI priority
            description,
            status: "pending",
          };
        });

        setExceptions(flat);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load exceptions"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExceptions();
  }, [payrollRunId, employeeIdFilter, router]);

  const handleResolve = (id: string) => {
    setExceptions((prev) =>
      prev.map((exc) =>
        exc.id === id ? { ...exc, status: "resolved" as const } : exc
      )
    );

    toast({
      title: "Exception Resolved",
      description: "Marked as resolved (UI only).",
    });
  };

  const pendingScoped = useMemo(() => {
    let list = exceptions.filter((e) => e.status === "pending");
    if (employeeIdFilter) {
      list = list.filter(
        (e) => String(e.employeeId) === String(employeeIdFilter)
      );
    }
    return list;
  }, [exceptions, employeeIdFilter]);

  const highPriority = pendingScoped.filter((e) => e.severity === "high").length;
  const mediumPriority = pendingScoped.filter((e) => e.severity === "medium").length;
  const lowPriority = pendingScoped.filter((e) => e.severity === "low").length;

  const visible = useMemo(() => {
    let list = pendingScoped;
    if (priorityFilter) list = list.filter((e) => e.severity === priorityFilter);
    return list;
  }, [pendingScoped, priorityFilter]);

  if (loading)
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading exceptions…
      </div>
    );

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div>
      <PageHeader
        title="Payroll Exceptions"
        description="Review and resolve irregularities in the payroll data"
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => router.push("/payroll/specialist/draft")}
        >
          Back to Draft
        </Button>

        {isEmployeeFiltered && (
          <Button
            variant="secondary"
            onClick={() =>
              router.push(
                `/payroll/specialist/exceptions?payrollRunId=${encodeURIComponent(
                  payrollRunId
                )}`
              )
            }
          >
            Get all exceptions
          </Button>
        )}

        {priorityFilter && (
          <Button
            variant="secondary"
            onClick={() => setPriorityFilter(null)}
            className="ml-auto"
          >
            Clear priority filter
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => setPriorityFilter("high")}
          className={cn(
            "cursor-pointer transition",
            priorityFilter === "high" && "ring-2 ring-destructive"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriority}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => setPriorityFilter("medium")}
          className={cn(
            "cursor-pointer transition",
            priorityFilter === "medium" && "ring-2 ring-primary"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediumPriority}</div>
            <p className="text-xs text-muted-foreground">Should be reviewed</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => setPriorityFilter("low")}
          className={cn(
            "cursor-pointer transition",
            priorityFilter === "low" && "ring-2 ring-muted-foreground"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Priority</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowPriority}</div>
            <p className="text-xs text-muted-foreground">For information</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exception List</CardTitle>
          <CardDescription>
            {employeeIdFilter
              ? `Pending exceptions for Employee: ${employeeIdFilter}`
              : "All pending exceptions"}
            {priorityFilter ? ` • Priority: ${priorityFilter}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExceptionsTable exceptions={visible} onResolve={handleResolve} />
        </CardContent>
      </Card>
    </div>
  );
}
