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
import type { SigningBonus } from "@/payroll/libs/types"

interface EditBonusModalProps {
  bonus: SigningBonus | null
  open: boolean
  onClose: () => void
  onSave: (id: string, amount: number) => void
}

export function EditBonusModal({ bonus, open, onClose, onSave }: EditBonusModalProps) {
  const [amount, setAmount] = useState(bonus?.givenAmount || 0)

  const empName = typeof bonus?.employeeId === 'object' ? bonus.employeeId.firstName || 'N/A' : 'N/A'
  const empId = typeof bonus?.employeeId === 'object' ? bonus.employeeId._id : bonus?.employeeId

  const handleSave = () => {
    if (bonus) {
      onSave(bonus._id, amount)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Signing Bonus</DialogTitle>
          <DialogDescription>Update the signing bonus amount for this employee</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Employee</Label>
            <div className="text-sm">
              <p className="font-medium">{empName}</p>
              <p className="text-muted-foreground">{empId}</p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Bonus Amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg">$</span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1"
              />
            </div>
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
