"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/payroll/components/ui/dialog"
import { Button } from "@/payroll/components/ui/button"
import { Input } from "@/payroll/components/ui/input"
import { Label } from "@/payroll/components/ui/label"
import type { PayrollPeriod } from "@/payroll/libs/types"

interface EditPeriodModalProps {
  period: PayrollPeriod | null
  open: boolean
  onClose: () => void
  onSave: (startDate: string, endDate: string) => void
}

export function EditPeriodModal({ period, open, onClose, onSave }: EditPeriodModalProps) {
  const [startDate, setStartDate] = useState(period?.startDate || "")
  const [endDate, setEndDate] = useState(period?.endDate || "")

  const handleSave = () => {
    onSave(startDate, endDate)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Payroll Period</DialogTitle>
          <DialogDescription>Update the payroll period date range</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
