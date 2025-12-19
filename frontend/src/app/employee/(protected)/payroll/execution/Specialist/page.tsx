import { PageHeader } from '@/payroll/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/payroll/components/ui/card';
import { FileCheck, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/payroll/components/ui/button';

export default function SpecialistDashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Payroll Specialist Dashboard"
        description="Manage pre-payroll reviews, initiate payroll runs, and handle exceptions"
      />

      {/* Top Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-colors duration-200 hover:bg-[#1E40AF] hover:text-white bg-[#0c1017]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileCheck className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs">Bonuses & terminations</p>
          </CardContent>
        </Card>

        <Card className="transition-colors duration-200 hover:bg-[#1E40AF] hover:text-white bg-[#0c1017]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Payroll</CardTitle>
            <Play className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs">Currently processing</p>
          </CardContent>
        </Card>

        <Card className="transition-colors duration-200 hover:bg-[#1E40AF] hover:text-white  bg-[#0c1017]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <AlertTriangle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs">Require attention</p>
          </CardContent>
        </Card>

        <Card className="transition-colors duration-200 hover:bg-[#1E40AF] hover:text-white bg-[#0c1017]">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approval Status</CardTitle>
            <CheckCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ready</div>
            <p className="text-xs">To send for approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
       <Card className='bg-[#0c1017]'>
  <CardHeader>
    <CardTitle>Quick Actions</CardTitle>
    <CardDescription>Common payroll specialist tasks</CardDescription>
  </CardHeader>
  <CardContent className="space-y-2">
    <Link
      href="/employee/payroll/execution/Specialist/pre-payroll"
      className="flex items-center w-full px-3 py-2 rounded-md border hover:bg-[#1E40AF] hover:text-white transition-colors"
    >
      <FileCheck className="mr-2 h-4 w-4" />
      Review Signing Bonuses & Terminations
    </Link>

    <Link
      href="/employee/payroll/execution/Specialist/draft"
      className="flex items-center w-full px-3 py-2 rounded-md border hover:bg-[#1E40AF] hover:text-white transition-colors"
    >
      <Play className="mr-2 h-4 w-4" />
      Start Payroll Run
    </Link>

   
  </CardContent>
</Card> 

      </div>
    </div>
  );
}
