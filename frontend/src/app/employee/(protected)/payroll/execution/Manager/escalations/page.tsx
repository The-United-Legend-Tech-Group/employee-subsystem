"use client"

import { useState } from "react"

function getAccessToken(): string {
  const raw = localStorage.getItem('access_token') || '';
  return raw.replace(/^Bearer\s+/i, '').replace(/^"+|"+$/g, '').trim();
}

function getAuthConfig() {
  const token = getAccessToken();

  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log('[Escalations] No localStorage token - relying on httpOnly cookies');
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as const;
}
import { PageHeader } from "@/payroll/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/payroll/components/ui/card"
import { ExceptionsTable } from "@/payroll/components/tables/exceptions-table"
import { mockExceptions } from "@/payroll/libs/mock-data"
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/payroll/hooks/use-toast"

export default function EscalationsPage() {
  const [exceptions, setExceptions] = useState(mockExceptions.filter((e) => e.severity === "high"))
  const { toast } = useToast()

  const handleResolve = (id: string) => {
    setExceptions((prev) => prev.map((exc) => (exc.id === id ? { ...exc, status: "resolved" as const } : exc)))
    toast({
      title: "Escalation Resolved",
      description: "The escalated issue has been marked as resolved.",
    })
  }

  const pendingCount = exceptions.filter((e) => e.status === "pending").length
  const resolvedCount = exceptions.filter((e) => e.status === "resolved").length

  return (
    <div>
      <PageHeader
        title="Escalated Issues"
        description="Resolve high-priority irregularities that require manager attention"
      />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Escalations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Require manager decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground">Issues closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Escalations</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exceptions.length}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Manager Authority</CardTitle>
          <CardDescription>Actions available for escalated issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Override Decisions</h4>
              <p className="text-sm text-muted-foreground">
                Managers can override system validations and approve exceptions that fall outside standard parameters.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Special Approvals</h4>
              <p className="text-sm text-muted-foreground">
                Grant special approvals for complex scenarios like negative pay settlements or unusual bonus structures.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>High-Priority Escalations</CardTitle>
          <CardDescription>Issues requiring immediate manager attention</CardDescription>
        </CardHeader>
        <CardContent>
          <ExceptionsTable exceptions={exceptions} onResolve={handleResolve} />
        </CardContent>
      </Card>
    </div>
  )
}
