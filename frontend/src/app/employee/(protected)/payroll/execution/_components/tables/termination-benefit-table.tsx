"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/payroll/components/ui/table"
import { Badge } from "@/payroll/components/ui/badge"
import { Button } from "@/payroll/components/ui/button"
import type { TerminationBenefit } from "@/payroll/libs/types"
import { Edit, CheckCircle, XCircle } from "lucide-react"

interface TerminationBenefitTableProps {
  benefits: TerminationBenefit[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit: (benefit: TerminationBenefit) => void
}

export function TerminationBenefitTable({ benefits, onApprove, onReject, onEdit }: TerminationBenefitTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-[#181e27]">
            <TableHead>Employee ID</TableHead>
            <TableHead>Employee Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {benefits.map((benefit) => {
            const empId = typeof benefit.employeeId === 'object' && benefit.employeeId ? benefit.employeeId._id : benefit.employeeId
            const empName = typeof benefit.employeeId === 'object' && benefit.employeeId ? benefit.employeeId.firstName || 'N/A' : 'N/A'
            return (
            <TableRow key={benefit._id}>
              <TableCell className="font-mono text-sm">{empId}</TableCell>
              <TableCell className="font-medium">{empName}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  Termination
                </Badge>
              </TableCell>
              <TableCell className="font-semibold">${benefit.givenAmount ? benefit.givenAmount.toLocaleString() : 'N/A'}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    benefit.status === "approved"
                      ? "default"
                      : benefit.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {benefit.status ? benefit.status.toUpperCase() : "Unknown"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {benefit.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => onEdit(benefit)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onApprove(benefit._id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onReject(benefit._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {benefit.status !== "pending" && (
                    <span className="text-xs text-muted-foreground">
                      {benefit.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
