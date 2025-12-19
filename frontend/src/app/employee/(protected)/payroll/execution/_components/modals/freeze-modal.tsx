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
import { Textarea } from "@/payroll/components/ui/textarea"
import { Label } from "@/payroll/components/ui/label"

interface FreezeModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  action: "freeze" | "unfreeze"
}

export function FreezeModal({ open, onClose, onConfirm, action }: FreezeModalProps) {
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    onConfirm(reason)
    setReason("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{action === "freeze" ? "Freeze Payroll" : "Unfreeze Payroll"}</DialogTitle>
          <DialogDescription>
            {action === "freeze"
              ? "Lock the payroll to prevent any further changes."
              : "Unlock the payroll to allow modifications."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Required for unfreezing)</Label>
            <Textarea
              id="reason"
              placeholder={action === "freeze" ? "Optional reason for freezing..." : "Why are you unfreezing?"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required={action === "unfreeze"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant={action === "freeze" ? "destructive" : "default"}
            disabled={action === "unfreeze" && !reason.trim()}
          >
            {action === "freeze" ? "Freeze" : "Unfreeze"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
