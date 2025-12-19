import { PageHeader } from '@/payroll/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/payroll/components/ui/card';
import { CheckCircle, AlertTriangle, Lock, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/payroll/components/ui/button';

function getAccessToken(): string {
  const raw = localStorage.getItem('access_token') || '';
  return raw.replace(/^Bearer\s+/i, '').replace(/^"+|"+$/g, '').trim();
}

function getAuthConfig() {
  const token = getAccessToken();

  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log('[ManagerDashboard] No localStorage token - relying on httpOnly cookies');
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as const;
}

export default function ManagerDashboard() {
  return (
    <div>
      <PageHeader
        title="Payroll Manager Dashboard"
        description="Approve payroll runs, resolve escalations, and manage payroll controls"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Payroll runs awaiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Escalations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              High priority issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Payroll Status
            </CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Unlocked</div>
            <p className="text-xs text-muted-foreground">PP-2024-01 active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
            <p className="text-xs text-muted-foreground">
              Total payroll amount
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manager responsibilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/employee/payroll/execution/runs">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Review Payroll for Approval
              </Button>
            </Link>
            <Link href="/employee/payroll/execution/Manager/escalations">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Resolve Escalated Issues
              </Button>
            </Link>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Pipeline</CardTitle>
            <CardDescription>Current workflow status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Specialist Review</span>
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
              <div className="h-2 rounded-full bg-primary" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Manager Approval</span>
                <span className="text-xs text-muted-foreground">
                  In Progress
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Finance Approval</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <div className="h-2 rounded-full bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
