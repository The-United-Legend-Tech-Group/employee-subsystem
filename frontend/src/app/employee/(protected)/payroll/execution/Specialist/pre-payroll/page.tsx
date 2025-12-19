"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/payroll/components/layout/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/payroll/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/payroll/components/ui/card";
import { SigningBonusTable } from "@/payroll/components/tables/signing-bonus-table";
import { TerminationBenefitTable } from "@/payroll/components/tables/termination-benefit-table";
import { EditBonusModal } from "@/payroll/components/modals/edit-bonus-modal";
import { EditBenefitModal } from "@/payroll/components/modals/edit-benefit-modal";
import { ApprovalModal } from "@/payroll/components/modals/approval-modal";
import type { SigningBonus, TerminationBenefit } from "@/payroll/libs/types";
import { useToast } from "@/payroll/hooks/use-toast";
import axios from "axios";
import { Box, CircularProgress } from "@mui/material";
import { getCookie } from '@/lib/auth-utils';

/**
 * ✅ Cookie-first auth pattern:
 * Read token at request-time (NOT module scope) and attach Authorization header.
 * Uses withCredentials: true to prioritize httpOnly cookies.
 */
function getAccessToken(): string {
  const token = getCookie('access_token');
  return token ? token.replace(/^Bearer\s+/i, '').trim() : '';
}

function getAuthConfig() {
  const token = getAccessToken();

  // Don't throw - cookies may still be valid via withCredentials
  if (!token) {
    console.log('[PrePayrollReview] No localStorage token - relying on httpOnly cookies');
  }

  return {
    withCredentials: true, // Primary: send httpOnly cookies
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  } as const;
}

export default function PrePayrollReviewPage() {
  const [bonuses, setBonuses] = useState<SigningBonus[]>([]);
  const [benefits, setBenefits] = useState<TerminationBenefit[]>([]);
  const [editingBonus, setEditingBonus] = useState<SigningBonus | null>(null);
  const [editingBenefit, setEditingBenefit] =
    useState<TerminationBenefit | null>(null);
  const [approvalAction, setApprovalAction] = useState<{
    type: "bonus" | "benefit";
    action: "approve" | "reject";
    id: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:50000";

  const fetchBonuses = async () => {
    try {
      setLoading(true);

      const bonusesResponse = await axios.get<SigningBonus[]>(
        `${BACKEND_URL}/execution/draft/signing-bonuses`,
        getAuthConfig()
      );

      const filteredBonuses = bonusesResponse.data.filter(
        (bonus) =>
          bonus.employeeId !== null &&
          (typeof bonus.employeeId === "object"
            ? (bonus.employeeId as any)?._id
            : bonus.employeeId)
      );

      setBonuses(filteredBonuses);
    } catch (error) {
      console.error("Failed to fetch signing bonuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBenefits = async () => {
    try {
      const benefitsResponse = await axios.get<TerminationBenefit[]>(
        `${BACKEND_URL}/execution/draft/terminations`,
        getAuthConfig()
      );

      const filteredBenefits = benefitsResponse.data.filter(
        (benefit) =>
          benefit.employeeId !== null &&
          (typeof benefit.employeeId === "object"
            ? (benefit.employeeId as any)?._id
            : benefit.employeeId)
      );

      setBenefits(filteredBenefits);
    } catch (error) {
      console.error("Failed to fetch termination benefits:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        await fetchBonuses();
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("Failed to fetch signing bonuses:", error.message);
          toast({
            title: "Error",
            description: `Failed to fetch signing bonuses: ${error.message}`,
            variant: "destructive",
          });
        } else {
          console.error("Failed to fetch signing bonuses:", error);
        }
      }

      try {
        await fetchBenefits();
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("Failed to fetch termination benefits:", error.message);
          toast({
            title: "Error",
            description: `Failed to fetch termination benefits: ${error.message}`,
            variant: "destructive",
          });
        } else {
          console.error("Failed to fetch termination benefits:", error);
        }
      }

      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApproveBonus = (id: string) => {
    setApprovalAction({ type: "bonus", action: "approve", id });
  };

  const handleRejectBonus = (id: string) => {
    setApprovalAction({ type: "bonus", action: "reject", id });
  };

  const handleApproveBenefit = (id: string) => {
    setApprovalAction({ type: "benefit", action: "approve", id });
  };

  const handleRejectBenefit = (id: string) => {
    setApprovalAction({ type: "benefit", action: "reject", id });
  };

  const confirmApproval = async () => {
    if (!approvalAction) return;

    try {
      if (approvalAction.type === "bonus") {
        if (approvalAction.action === "approve") {
          await axios.patch(
            `${BACKEND_URL}/execution/draft/signing-bonus/approve`,
            { signingBonusId: approvalAction.id },
            getAuthConfig()
          );
        } else {
          await axios.patch(
            `${BACKEND_URL}/execution/draft/signing-bonus/reject`,
            { signingBonusId: approvalAction.id },
            getAuthConfig()
          );
        }

        await fetchBonuses();

        toast({
          title:
            approvalAction.action === "approve"
              ? "Bonus Approved"
              : "Bonus Rejected",
          description: `Signing bonus has been ${approvalAction.action === "approve" ? "approved" : "rejected"
            } successfully.`,
        });
      } else {
        if (approvalAction.action === "approve") {
          await axios.patch(
            `${BACKEND_URL}/execution/draft/termination/approve`,
            { terminationRecordId: approvalAction.id },
            getAuthConfig()
          );
        } else {
          await axios.patch(
            `${BACKEND_URL}/execution/draft/termination/reject`,
            { terminationRecordId: approvalAction.id },
            getAuthConfig()
          );
        }

        await fetchBenefits();

        toast({
          title:
            approvalAction.action === "approve"
              ? "Benefit Approved"
              : "Benefit Rejected",
          description: `Termination benefit has been ${approvalAction.action === "approve" ? "approved" : "rejected"
            } successfully.`,
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast({
          title: "Error",
          description: `Failed to process approval: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to process approval",
          variant: "destructive",
        });
      }
    }

    setApprovalAction(null);
  };

  const handleSaveBonus = async (id: string, amount: number) => {
    try {
      await axios.patch(
        `${BACKEND_URL}/execution/draft/signingBonus/edit-amount`,
        {
          EmployeesigningBonusId: id,
          newAmount: amount,
        },
        getAuthConfig()
      );

      await fetchBonuses();

      toast({
        title: "Bonus Updated",
        description: "Signing bonus amount has been updated successfully.",
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast({
          title: "Error",
          description: `Failed to update bonus: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update bonus",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveBenefit = async (id: string, amount: number) => {
    try {
      await axios.patch(
        `${BACKEND_URL}/execution/draft/termination/edit-amount`,
        {
          EmployeeTerminationId: id,
          newAmount: amount,
        },
        getAuthConfig()
      );

      await fetchBenefits();

      toast({
        title: "Benefit Updated",
        description: "Termination benefit amount has been updated successfully.",
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast({
          title: "Error",
          description: `Failed to update benefit: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update benefit",
          variant: "destructive",
        });
      }
    }
  };

  const pendingBonuses = bonuses.filter((b) => b.status === "pending").length;
  const pendingBenefits = benefits.filter((b) => b.status === "pending").length;

  // Get unique employee IDs for signing bonuses
  const uniqueEmployeeBonuses = bonuses.filter((bonus, index, self) => {
    const bonusEmpId =
      typeof bonus.employeeId === "object"
        ? (bonus.employeeId as any)?._id
        : bonus.employeeId;

    const findEmpId = (b: SigningBonus) =>
      typeof b.employeeId === "object"
        ? (b.employeeId as any)?._id
        : b.employeeId;

    return index === self.findIndex((b) => findEmpId(b) === bonusEmpId);
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={100} />
      </Box>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pre-Payroll Review"
        description="Review and approve signing bonuses and termination benefits before payroll processing"
      />

      <div className="grid gap-6 md:grid-cols-2 mb-8 ">
        <Card className="bg-[#0c1017] p-4 rounded-lg">
          <CardHeader>
            <CardTitle>Signing Bonuses</CardTitle>
            <CardDescription>{pendingBonuses} pending review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {uniqueEmployeeBonuses.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total employees with bonuses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0c1017] p-4 rounded-lg">
          <CardHeader>
            <CardTitle>Termination Benefits</CardTitle>
            <CardDescription>{pendingBenefits} pending review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{benefits.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total requests
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bonuses" className="space-y-6">
        <TabsList className="bg-[#0c1017]">
          <TabsTrigger value="bonuses">
            Signing Bonuses ({pendingBonuses})
          </TabsTrigger>
          <TabsTrigger value="benefits">
            Termination Benefits ({pendingBenefits})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bonuses" className="space-y-4">
          <SigningBonusTable
            bonuses={bonuses}
            onApprove={handleApproveBonus}
            onReject={handleRejectBonus}
            onEdit={setEditingBonus}
          />
        </TabsContent>

        <TabsContent value="benefits" className="space-y-4">
          <TerminationBenefitTable
            benefits={benefits}
            onApprove={handleApproveBenefit}
            onReject={handleRejectBenefit}
            onEdit={setEditingBenefit}
          />
        </TabsContent>
      </Tabs>

      <EditBonusModal
        bonus={editingBonus}
        open={!!editingBonus}
        onClose={() => setEditingBonus(null)}
        onSave={handleSaveBonus}
      />

      <EditBenefitModal
        benefit={editingBenefit}
        open={!!editingBenefit}
        onClose={() => setEditingBenefit(null)}
        onSave={handleSaveBenefit}
      />

      <ApprovalModal
        open={!!approvalAction}
        onClose={() => setApprovalAction(null)}
        onConfirm={confirmApproval}
        title={
          approvalAction?.action === "approve"
            ? "Confirm Approval"
            : "Confirm Rejection"
        }
        description={`Are you sure you want to ${approvalAction?.action} this ${approvalAction?.type === "bonus"
            ? "signing bonus"
            : "termination benefit"
          }?`}
        confirmText={approvalAction?.action === "approve" ? "Approve" : "Reject"}
        isRejection={approvalAction?.action === "reject"}
      />
    </div>
  );
}