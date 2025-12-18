'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

export function OfferManagement() {
  const toast = useToast();
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [pendingOffers, setPendingOffers] = useState<any[]>([]);
  const [offerHistory, setOfferHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      // In production, fetch offers from backend
      // const response = await recruitmentApi.getOffers();
      setPendingOffers([]);
      setOfferHistory([]);
    } catch (error: any) {
      toast.error('Failed to load offers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async (offerData: {
    applicationId: string;
    candidateId: string;
    hrEmployeeId: string;
    role: string;
    benefits?: string[];
    conditions?: string;
    insurances?: string;
    content?: string;
    deadline?: string;
  }) => {
    try {
      setIsSubmitting(true);
      await recruitmentApi.createOffer(offerData);
      toast.success('Offer created successfully!');
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveOffer = async (offerId: string, approved: boolean) => {
    try {
      setIsSubmitting(true);
      await recruitmentApi.approveOffer({
        offerId,
        status: approved ? 'approved' : 'rejected',
        comment: approved ? 'Approved' : 'Rejected',
      });
      toast.success(approved ? 'Offer approved!' : 'Offer rejected!');
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOffer = async (offerId: string) => {
    try {
      setIsSubmitting(true);
      await recruitmentApi.sendOffer({ offerId });
      toast.success('Offer sent to candidate!');
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Offer Management & Approvals
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review, approve, and send job offers to candidates
        </Typography>
      </Box>

      {/* Pending Approvals */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 3 }}>
            Pending Approvals
          </Typography>
          <Stack spacing={2}>
            {pendingOffers.map((offer) => (
              <Card key={offer.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {offer.candidateName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {offer.position}
                      </Typography>
                    </Box>
                    <Chip
                      label={offer.status}
                      color={offer.status === 'Approved' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Stack>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Salary</Typography>
                      <Typography variant="body2">{offer.salary}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Start Date</Typography>
                      <Typography variant="body2">{offer.startDate}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Submitted By</Typography>
                      <Typography variant="body2">{offer.submittedBy}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Submitted Date</Typography>
                      <Typography variant="body2">{offer.submittedDate}</Typography>
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedOffer(offer.id)}
                    >
                      View Details
                    </Button>
                    {offer.status === 'Pending Approval' && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckIcon />}
                          onClick={() => handleApproveOffer(offer.id, true)}
                          disabled={isSubmitting}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<CloseIcon />}
                          onClick={() => handleApproveOffer(offer.id, false)}
                          disabled={isSubmitting}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {offer.status === 'Approved' && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<SendIcon />}
                        onClick={() => handleSendOffer(offer.id)}
                        disabled={isSubmitting}
                      >
                        Send Offer Letter
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* E-Signature Management */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 3 }}>
            E-Signature Offer Letters
          </Typography>
          <Stack spacing={2}>
            {[
              { candidate: 'Jane Smith', position: 'Product Manager', status: 'Sent', sentDate: '2025-12-02' },
              { candidate: 'Alice Brown', position: 'UX Designer', status: 'Signed', signedDate: '2025-11-25' },
            ].map((letter, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'action.hover', borderRadius: 1, color: 'text.primary' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <DescriptionIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2">
                      {letter.candidate} - {letter.position}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {letter.status === 'Sent' ? `Sent: ${letter.sentDate}` : `Signed: ${letter.signedDate}`}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={letter.status}
                  color={letter.status === 'Signed' ? 'success' : 'primary'}
                  size="small"
                />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Offer History */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 3 }}>
            Offer History
          </Typography>
          <Stack spacing={2}>
            {offerHistory.map((offer) => (
              <Box key={offer.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'action.hover', borderRadius: 1, color: 'text.primary' }}>
                <Box>
                  <Typography variant="body2">{offer.candidateName}</Typography>
                  <Typography variant="caption" color="text.secondary">{offer.position}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={offer.status}
                    color={offer.status === 'Accepted' ? 'success' : 'error'}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {offer.status === 'Accepted' ? offer.acceptedDate : offer.declinedDate}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

