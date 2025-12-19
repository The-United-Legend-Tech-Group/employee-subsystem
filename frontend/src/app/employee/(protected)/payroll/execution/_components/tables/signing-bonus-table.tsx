"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/payroll/components/ui/table"
import { Badge } from "@/payroll/components/ui/badge"
import { Button } from "@/payroll/components/ui/button"
import type { SigningBonus } from "@/payroll/libs/types"
import { Edit, CheckCircle, XCircle } from "lucide-react"

interface SigningBonusTableProps {
  bonuses: SigningBonus[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit: (bonus: SigningBonus) => void
}

export function SigningBonusTable({ bonuses, onApprove, onReject, onEdit }: SigningBonusTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-[#181e27]">
            <TableHead>Employee ID</TableHead>
            <TableHead>Employee Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Requested Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bonuses.map((bonus) => {
            const empId = typeof bonus.employeeId === 'object' ? bonus.employeeId._id : bonus.employeeId;
            const empName = typeof bonus.employeeId === 'object' ? bonus.employeeId.firstName || 'N/A' : 'N/A';
            const status = bonus.status ? bonus.status.toUpperCase() : 'N/A'; // Ensure status is not undefined

            return (
              <TableRow key={bonus._id}>
                <TableCell className="font-mono text-sm">{empId}</TableCell>
                <TableCell className="font-medium">{empName}</TableCell>
                <TableCell className="font-semibold">${bonus.givenAmount ? bonus.givenAmount.toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="text-sm">{bonus.createdAt ? new Date(bonus.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      bonus.status === "approved" ? "default" : bonus.status === "rejected" ? "destructive" : "secondary"
                    }
                  >
                    {status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {bonus.status === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => onEdit(bonus)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onApprove(bonus._id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReject(bonus._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {bonus.status !== "pending" && (
                      <span className="text-xs text-muted-foreground">
                        {bonus.status === "approved" ? "Approved" : "Rejected"}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
