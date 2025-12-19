"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/payroll/components/ui/table";
import { Badge } from "@/payroll/components/ui/badge";
import { Button } from "@/payroll/components/ui/button";
import type { Exception } from "@/payroll/libs/types";
import { CheckCircle } from "lucide-react";

interface ExceptionsTableProps {
  exceptions: Exception[];
  onResolve: (id: string) => void;
}

export function ExceptionsTable({ exceptions, onResolve }: ExceptionsTableProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "salary-spike":
        return "Salary Spike";
      case "missing-bank":
        return "Missing Bank Account";
      case "negative-pay":
        return "Negative Pay";
      case "calculation-error":
        return "Calculation Error";
      default:
        return type;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Employee ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exceptions.map((exception) => (
            <TableRow key={exception.id}>
              <TableCell className="font-mono text-sm">
                {exception.employeeId}
              </TableCell>

              <TableCell>
                <Badge variant="outline">{getTypeLabel(exception.type)}</Badge>
              </TableCell>

              <TableCell>
                <Badge variant={getSeverityColor(exception.severity)}>
                  {exception.severity}
                </Badge>
              </TableCell>

              <TableCell className="max-w-md text-sm text-muted-foreground">
                {exception.description}
              </TableCell>

              <TableCell>
                <Badge
                  variant={
                    exception.status === "resolved" ? "default" : "secondary"
                  }
                >
                  {exception.status}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                {exception.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolve(exception.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
