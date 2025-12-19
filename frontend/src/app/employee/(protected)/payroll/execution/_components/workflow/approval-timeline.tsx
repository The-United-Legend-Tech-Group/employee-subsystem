"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/payroll/components/ui/card"
import { Badge } from "@/payroll/components/ui/badge"
import type { ApprovalWorkflow } from "@/payroll/libs/types"
import { CheckCircle, Clock, XCircle } from "lucide-react"

interface ApprovalTimelineProps {
  workflow: ApprovalWorkflow
}

export function ApprovalTimeline({ workflow }: ApprovalTimelineProps) {
  const steps = [
    {
      name: "Specialist Review",
      status: workflow.specialistApproval
        ? workflow.specialistApproval.approved
          ? "approved"
          : "rejected"
        : workflow.status === "pending-specialist"
          ? "in-progress"
          : "pending",
      approval: workflow.specialistApproval,
    },
    {
      name: "Manager Approval",
      status: workflow.managerApproval
        ? workflow.managerApproval.approved
          ? "approved"
          : "rejected"
        : workflow.status === "pending-manager"
          ? "in-progress"
          : "pending",
      approval: workflow.managerApproval,
    },
    {
      name: "Finance Approval",
      status: workflow.financeApproval
        ? workflow.financeApproval.approved
          ? "approved"
          : "rejected"
        : workflow.status === "pending-finance"
          ? "in-progress"
          : "pending",
      approval: workflow.financeApproval,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Timeline</CardTitle>
        <CardDescription>Workflow progress and approvals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      step.status === "approved"
                        ? "bg-green-500"
                        : step.status === "rejected"
                          ? "bg-red-500"
                          : step.status === "in-progress"
                            ? "bg-primary"
                            : "bg-muted"
                    }`}
                  >
                    {step.status === "approved" ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : step.status === "rejected" ? (
                      <XCircle className="h-5 w-5 text-white" />
                    ) : step.status === "in-progress" ? (
                      <Clock className="h-5 w-5 text-white" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-white" />
                    )}
                  </div>
                  {index < steps.length - 1 && <div className="h-12 w-0.5 bg-border mt-2" />}
                </div>

                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{step.name}</h4>
                    <Badge
                      variant={
                        step.status === "approved"
                          ? "default"
                          : step.status === "rejected"
                            ? "destructive"
                            : step.status === "in-progress"
                              ? "default"
                              : "secondary"
                      }
                    >
                      {step.status}
                    </Badge>
                  </div>
                  {step.approval && (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        By: <span className="font-medium text-foreground">{step.approval.by}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Date: <span className="text-foreground">{new Date(step.approval.date).toLocaleString()}</span>
                      </p>
                      {step.approval.comments && (
                        <p className="text-muted-foreground">
                          Comments: <span className="text-foreground">{step.approval.comments}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
