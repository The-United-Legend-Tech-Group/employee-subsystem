'use client';

import { useState, useEffect } from 'react';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
import {
    Box,
    Typography,
    Stack,
    Card,
    CardContent,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    Description as DescriptionIcon,
    AttachMoney as MoneyIcon,
    CardGiftcard as BonusIcon
} from '@mui/icons-material';

interface Approver {
    employeeId: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    actionDate?: string;
    comment?: string;
    _id: string;
}

interface Offer {
    _id: string;
    role: string;
    finalStatus: string;
    grossSalary?: number;
    signingBonus?: number;
    benifitsum?: number;
    deadline?: string;
    candidateId: {
        firstName: string;
        lastName: string;
    };
    approvers: Approver[];
    cvDocuments?: Array<{
        _id: string;
        fileName: string;
        type: string;
    }>;
}

export function MyApprovals() {
    const toast = useToast();
    const [approvals, setApprovals] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvalDialog, setApprovalDialog] = useState<{
        open: boolean;
        offer: Offer | null;
        status: 'approved' | 'rejected';
        comment: string;
    }>({
        open: false,
        offer: null,
        status: 'approved',
        comment: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchApprovals();
    }, []);

    const handleViewCV = async (documentId: string, fileName: string) => {
        try {
            const response = await recruitmentApi.viewDocument(documentId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Clean up the URL after opening
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error: any) {
            toast.error(`Failed to open ${fileName}`);
            console.error(error);
        }
    };

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const response = await recruitmentApi.getMyApprovals();
            setApprovals(response.data || []);
        } catch (error: any) {
            console.error('Failed to fetch approvals:', error);
            toast.error('Failed to load your pending approvals');
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (offer: Offer, status: 'approved' | 'rejected') => {
        setApprovalDialog({
            open: true,
            offer,
            status,
            comment: ''
        });
    };

    const handleSubmitAction = async () => {
        if (!approvalDialog.offer) return;

        try {
            setSubmitting(true);
            await recruitmentApi.approveOffer({
                offerId: approvalDialog.offer._id,
                status: approvalDialog.status,
                comment: approvalDialog.comment
            });

            toast.success(`Offer ${approvalDialog.status} successfully`);
            setApprovalDialog(prev => ({ ...prev, open: false }));
            fetchApprovals(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || `Failed to ${approvalDialog.status} offer`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Filter to only show pending approvals for me?
    // The backend endpoint returns offers where I am an approver (any status).
    // Ideally we sort/filter: Pending first.

    // For now display all, but highlight pending actions.

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="h6" gutterBottom>
                    My Approvals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Review and take action on pending offer approvals
                </Typography>
            </Box>

            {approvals.length === 0 ? (
                <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                        <Typography color="text.secondary">
                            No offers require your approval at this time.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Stack spacing={2}>
                    {approvals.map((offer) => {
                        // Find my specific status
                        // We need to know who "I" am. The list is fetched for ME.
                        // But we don't have my ID handy here unless we decode token again or pass it.
                        // Wait, the UI just shows the offer.
                        // How do we know which "Approver" entry corresponds to me to show MY status?
                        // Simple: We check all approver entries. Actually, we might have multiple if added twice (unlikely).
                        // Usually we assume the user knows their role or we just show the Offer status.

                        // Pending Check:
                        // Since we can't easily identify "my" entry without ID, we'll iterate.
                        // A better way is if the backend returned "myStatus".
                        // But for now, we'll list the offer and allow action.
                        // The Action will fail in backend if I've already voted (or update it).

                        // Let's rely on the user to know. 
                        // Or better: Filter on client side if we had ID.

                        // We'll show the whole Approvers list status to give context.

                        return (
                            <Card key={offer._id} variant="outlined">
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {offer.role}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Candidate: {offer.candidateId?.firstName} {offer.candidateId?.lastName}
                                            </Typography>

                                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                <Chip
                                                    label={`Status: ${offer.finalStatus}`}
                                                    size="small"
                                                    color={offer.finalStatus === 'approved' ? 'success' : offer.finalStatus === 'rejected' ? 'error' : 'default'}
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        </Box>

                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<CancelIcon />}
                                                onClick={() => handleActionClick(offer, 'rejected')}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                startIcon={<CheckIcon />}
                                                onClick={() => handleActionClick(offer, 'approved')}
                                            >
                                                Approve
                                            </Button>
                                        </Stack>
                                    </Stack>

                                    {/* Offer Details Section */}
                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 1.5 }}>
                                            Offer Details:
                                        </Typography>

                                        <Stack spacing={1.5}>
                                            {/* Salary Information */}
                                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                                {offer.grossSalary && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                        <Typography variant="caption" color="text.secondary">Gross Salary:</Typography>
                                                        <Typography variant="body2" fontWeight="bold">${offer.grossSalary.toLocaleString()}</Typography>
                                                    </Box>
                                                )}

                                                {offer.signingBonus && offer.signingBonus > 0 && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <BonusIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                                        <Typography variant="caption" color="text.secondary">Signing Bonus:</Typography>
                                                        <Typography variant="body2" fontWeight="bold">${offer.signingBonus.toLocaleString()}</Typography>
                                                    </Box>
                                                )}

                                                {offer.benifitsum && offer.benifitsum > 0 && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <BonusIcon sx={{ fontSize: 16, color: 'info.main' }} />
                                                        <Typography variant="caption" color="text.secondary">Benefits Value:</Typography>
                                                        <Typography variant="body2" fontWeight="bold">${offer.benifitsum.toLocaleString()}</Typography>
                                                    </Box>
                                                )}
                                            </Stack>

                                            {/* CV Documents */}
                                            {offer.cvDocuments && offer.cvDocuments.length > 0 && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                                        Candidate CV:
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                                        {offer.cvDocuments.map((doc) => (
                                                            <Button
                                                                key={doc._id}
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<DescriptionIcon />}
                                                                onClick={() => handleViewCV(doc._id, doc.fileName)}
                                                                sx={{ fontSize: '0.75rem' }}
                                                            >
                                                                View CV
                                                            </Button>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}

                                            {/* Deadline */}
                                            {offer.deadline && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CalendarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                                    <Typography variant="caption" color="text.secondary">Response Deadline:</Typography>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {new Date(offer.deadline).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Box>

                                    {/* Approvers List Summary */}
                                    <Box sx={{ mt: 2, bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                                        <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 1 }}>
                                            Approval Chain Status:
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            {offer.approvers.map((ap, idx) => (
                                                <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="caption">
                                                        {ap.role} {ap.status !== 'pending' && `(${new Date(ap.actionDate || '').toLocaleDateString()})`}
                                                    </Typography>
                                                    <Chip
                                                        label={ap.status}
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                        color={ap.status === 'approved' ? 'success' : ap.status === 'rejected' ? 'error' : 'warning'}
                                                    />
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}

            {/* Action Dialog */}
            <Dialog open={approvalDialog.open} onClose={() => setApprovalDialog(prev => ({ ...prev, open: false }))} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {approvalDialog.status === 'approved' ? 'Approve Offer' : 'Reject Offer'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="body2" gutterBottom>
                            You are about to <strong>{approvalDialog.status}</strong> the offer for
                            {approvalDialog.offer?.candidateId?.firstName} ({approvalDialog.offer?.role}).
                        </Typography>

                        <TextField
                            label="Comments (Optional)"
                            multiline
                            rows={3}
                            fullWidth
                            variant="outlined"
                            value={approvalDialog.comment}
                            onChange={(e) => setApprovalDialog(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder="Add any improved conditions or reasons..."
                            sx={{ mt: 2 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setApprovalDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
                    <Button
                        onClick={handleSubmitAction}
                        variant="contained"
                        color={approvalDialog.status === 'approved' ? 'success' : 'error'}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
