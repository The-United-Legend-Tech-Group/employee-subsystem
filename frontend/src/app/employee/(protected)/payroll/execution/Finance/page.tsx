import { PageHeader } from '@/payroll/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/payroll/components/ui/card';
import { CheckCircle, DollarSign, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/payroll/components/ui/button';

export default function FinanceDashboard() {
  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        description="Final payroll approvals and financial oversight"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Awaiting final sign-off
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
            <p className="text-xs text-muted-foreground">January 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Payroll runs this year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">YoY Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">Compared to 2023</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Finance team responsibilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/employee/payroll/execution/runs">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                View Payroll History To Approve Drafts
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest processed payrolls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">PP-2023-12</p>
                <p className="text-xs text-muted-foreground">December 2023</p>
              </div>
              <p className="text-sm font-bold">$2.3M</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">PP-2023-11</p>
                <p className="text-xs text-muted-foreground">November 2023</p>
              </div>
              <p className="text-sm font-bold">$2.2M</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">PP-2023-10</p>
                <p className="text-xs text-muted-foreground">October 2023</p>
              </div>
              <p className="text-sm font-bold">$2.1M</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
