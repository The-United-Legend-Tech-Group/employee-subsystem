'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  Chip,
  Paper,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

interface CandidateOffersProps {
  // No props needed
}

export function CandidateOffers({ }: CandidateOffersProps) {
  const toast = useToast();
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');
  const [responseAction, setResponseAction] = useState<'accepted' | 'rejected' | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setLoading(true);
      const response = await recruitmentApi.getMyOffers();
      setOffers(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load offers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (offer: any) => {
    try {
      const response = await recruitmentApi.getOfferById(offer._id);
      setSelectedOffer(response.data);
      setShowDetailsModal(true);
    } catch (error: any) {
      toast.error('Failed to load offer details');
    }
  };

  const handleOpenResponseModal = (offer: any, action: 'accepted' | 'rejected') => {
    setSelectedOffer(offer);
    setResponseAction(action);
    setResponseNotes('');
    setShowResponseModal(true);
  };

  const handleRespondToOffer = async () => {
    if (!selectedOffer || !responseAction) return;

    try {
      setIsSubmitting(true);
      await recruitmentApi.candidateRespondOffer({
        offerId: selectedOffer._id,
        response: responseAction,
        notes: responseNotes || undefined,
      });

      toast.success(`Offer ${responseAction} successfully!`);
      setShowResponseModal(false);
      setShowDetailsModal(false);
      setSelectedOffer(null);
      setResponseNotes('');
      setResponseAction(null);
      fetchOffers(); // Refresh offers list
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${responseAction} offer`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (offer: any) => {
    const status = offer.applicantResponse || 'pending';
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: 'Pending Response',
      accepted: 'Accepted',
      rejected: 'Declined',
    };
    return (
      <span className={`text - xs px - 3 py - 1 rounded - full font - medium ${colors[status] || 'bg-gray-100 text-gray-700'} `}>
        {labels[status] || status}
      </span>
    );
  };

  const canRespond = (offer: any) => {
    return offer.finalStatus === 'sent' && offer.applicantResponse === 'pending';
  };

  const isExpired = (deadline: any) => {
    if (!deadline) return false;
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return false;
    // treat deadline as inclusive (end of day)
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay < new Date();
  };

  const getOfferDeadline = (offer: any) => {
    if (!offer) return undefined;
    // support variants of deadline field names
    return offer.deadline ?? offer.responseDeadline ?? offer.deadlineAt ?? offer.deadlineDate;
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <DescriptionIcon sx={{ fontSize: 24, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            My Job Offers
          </Typography>
        </Stack>

        {/* Offers List */}
        {loading ? (
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ py: 8 }}>
                <CircularProgress size={32} />
                <Typography color="text.secondary">Loading offers...</Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : offers.length > 0 ? (
          <Stack spacing={3}>
            {offers.map((offer) => {
              const expired = isExpired(getOfferDeadline(offer));
              const canRespondToOffer = canRespond(offer) && !expired;
              const status = offer.applicantResponse || 'pending';

              return (
                <Card
                  key={offer._id}
                  variant="outlined"
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <CardContent>
                    <Stack spacing={2.5}>
                      {/* Header with Role and Status */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              bgcolor: 'primary.50',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <DescriptionIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {offer.role}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Job Offer
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={status === 'pending' ? 'Pending Response' : status === 'accepted' ? 'Accepted' : 'Declined'}
                            color={status === 'pending' ? 'warning' : status === 'accepted' ? 'success' : 'error'}
                            size="small"
                          />
                          {expired && canRespond(offer) && (
                            <Chip label="Expired" color="error" size="small" variant="outlined" />
                          )}
                        </Stack>
                      </Stack>

                      <Divider />

                      {/* Compensation Summary */}
                      <Stack spacing={2}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Compensation Package
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                bgcolor: 'success.50',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <AttachMoneyIcon sx={{ fontSize: 20, color: 'success.main' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Annual Salary
                              </Typography>
                              <Typography variant="h6" fontWeight={600} color="success.main">
                                ${offer.grossSalary?.toLocaleString() || '0'}
                              </Typography>
                            </Box>
                          </Stack>
                          {offer.signingBonus > 0 && (
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 1.5,
                                  bgcolor: 'secondary.50',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <AttachMoneyIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Signing Bonus
                                </Typography>
                                <Typography variant="h6" fontWeight={600} color="secondary.main">
                                  ${offer.signingBonus?.toLocaleString()}
                                </Typography>
                              </Box>
                            </Stack>
                          )}
                        </Stack>
                      </Stack>

                      {/* Benefits */}
                      {offer.benefits && offer.benefits.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Benefits & Perks
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                            {offer.benefits.slice(0, 3).map((benefit: string, idx: number) => (
                              <Chip
                                key={idx}
                                label={benefit}
                                size="small"
                                variant="outlined"
                                color="success"
                                sx={{ mb: 1 }}
                              />
                            ))}
                            {offer.benefits.length > 3 && (
                              <Chip
                                label={`+ ${offer.benefits.length - 3} more`}
                                size="small"
                                variant="outlined"
                                sx={{ mb: 1 }}
                              />
                            )}
                          </Stack>
                        </Box>
                      )}

                      {/* Deadline */}
                      {getOfferDeadline(offer) && (
                        <Alert
                          severity={expired && canRespond(offer) ? 'error' : 'info'}
                          icon={<CalendarTodayIcon sx={{ fontSize: 20 }} />}
                          sx={{ borderRadius: 2 }}
                        >
                          <Typography variant="body2">
                            <strong>Response Deadline:</strong> {new Date(getOfferDeadline(offer)).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {expired && canRespond(offer) && ' (Expired)'}
                          </Typography>
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2, gap: 1 }}>
                    <Button
                      onClick={() => handleViewDetails(offer)}
                      variant="outlined"
                      size="medium"
                      startIcon={<DescriptionIcon sx={{ fontSize: 16 }} />}
                    >
                      View Details
                    </Button>
                    {canRespondToOffer && (
                      <>
                        <Box sx={{ flex: 1 }} />
                        <Button
                          onClick={() => handleOpenResponseModal(offer, 'rejected')}
                          variant="outlined"
                          color="error"
                          size="medium"
                          startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                        >
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleOpenResponseModal(offer, 'accepted')}
                          variant="contained"
                          color="success"
                          size="medium"
                          startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        >
                          Accept Offer
                        </Button>
                      </>
                    )}
                  </CardActions>
                </Card>
              );
            })}
          </Stack>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
                <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Box textAlign="center">
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No job offers yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    When you receive an offer, it will appear here
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Offer Details Modal - Material-UI Dialog */}
      <Dialog
        open={showDetailsModal && !!selectedOffer}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOffer(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <DescriptionIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="h6">Offer Details</Typography>
            </Stack>
            <IconButton
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedOffer(null);
              }}
              size="small"
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {selectedOffer && (
            <Stack spacing={3}>
              {/* Position Info */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Position Details
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Role
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedOffer.role}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>{getStatusBadge(selectedOffer)}</Box>
                  </Box>
                </Stack>
              </Paper>

              {/* Compensation Package */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Compensation Package
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AttachMoneyIcon sx={{ fontSize: 20, color: 'success.main' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Annual Gross Salary
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            ${selectedOffer.grossSalary?.toLocaleString() || '0'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    {selectedOffer.signingBonus > 0 && (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AttachMoneyIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Signing Bonus
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                              ${selectedOffer.signingBonus?.toLocaleString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )}
                  </Stack>

                  {selectedOffer.benefits && selectedOffer.benefits.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Benefits & Perks
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                        {selectedOffer.benefits.map((benefit: string, index: number) => (
                          <Chip
                            key={index}
                            label={`✓ ${benefit} `}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Paper>

              {/* Additional Details */}
              {selectedOffer.insurances && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Insurance Coverage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedOffer.insurances}
                  </Typography>
                </Paper>
              )}

              {selectedOffer.conditions && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Employment Conditions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedOffer.conditions}
                  </Typography>
                </Paper>
              )}

              {selectedOffer.content && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Additional Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedOffer.content}
                  </Typography>
                </Paper>
              )}

              {getOfferDeadline(selectedOffer) && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: 'warning.50',
                    borderColor: 'warning.main'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CalendarTodayIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Response Deadline
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(getOfferDeadline(selectedOffer)).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                      {isExpired(getOfferDeadline(selectedOffer)) && canRespond(selectedOffer) && (
                        <Typography variant="body2" color="error" fontWeight={500} sx={{ mt: 0.5 }}>
                          ⚠️ This offer has expired
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setShowDetailsModal(false);
              setSelectedOffer(null);
            }}
            variant="outlined"
          >
            Close
          </Button>
          {selectedOffer && canRespond(selectedOffer) && !isExpired(getOfferDeadline(selectedOffer)) && (
            <>
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleOpenResponseModal(selectedOffer, 'rejected');
                }}
                variant="outlined"
                color="error"
              >
                Decline Offer
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleOpenResponseModal(selectedOffer, 'accepted');
                }}
                variant="contained"
                color="success"
              >
                Accept Offer
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Response Confirmation Modal */}
      <Dialog
        open={showResponseModal && !!selectedOffer && !!responseAction}
        onClose={() => {
          setShowResponseModal(false);
          setResponseNotes('');
          setResponseAction(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme => theme.shadows[10]
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {responseAction === 'accepted' ? (
              <CheckCircleIcon sx={{ fontSize: 24, color: 'success.main' }} />
            ) : (
              <WarningIcon sx={{ fontSize: 24, color: 'error.main' }} />
            )}
            <Typography variant="h6" fontWeight={700} color={responseAction === 'accepted' ? 'success.main' : 'error.main'}>
              {responseAction === 'accepted' ? 'Accept Offer' : 'Decline Offer'}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedOffer && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  bgcolor: 'background.paper',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Position
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      {selectedOffer.role}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Annual Salary
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      ${selectedOffer.grossSalary?.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {responseAction === 'accepted' ? (
                <Alert
                  severity="success"
                  variant="standard"
                  icon={<CheckCircleIcon sx={{ fontSize: 20 }} />}
                  sx={{
                    borderRadius: 2,
                    '& .MuiAlert-message': { width: '100%' }
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Congratulations!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    By accepting this offer, you agree to the terms and conditions outlined in the offer letter. The HR team will contact you shortly specifically regarding contract signing.
                  </Typography>
                </Alert>
              ) : (
                <Alert
                  severity="error"
                  variant="standard"
                  icon={<WarningIcon sx={{ fontSize: 20 }} />}
                  sx={{ borderRadius: 2 }}
                >
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Are you sure?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Declining this offer is irreversible. Please confirm you wish to proceed with this decision.
                  </Typography>
                </Alert>
              )}

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{ mb: 1, display: 'block', ml: 0.5 }}
                >
                  {responseAction === 'accepted' ? 'Start Date / Notes (Optional)' : 'Reason for Declining (Optional)'}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder={responseAction === 'accepted' ? 'e.g. I am excited to join! My preferred start date is...' : 'Please kindly share your reason...'}
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      '& fieldset': {
                        borderColor: 'divider'
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                  helperText="Your comments will be shared with the hiring manager."
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setShowResponseModal(false);
              setResponseNotes('');
              setResponseAction(null);
            }}
            variant="text"
            color="inherit"
            disabled={isSubmitting}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRespondToOffer}
            variant="contained"
            color={responseAction === 'accepted' ? 'success' : 'error'}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              borderRadius: 2,
              px: 4,
              boxShadow: 2,
              fontWeight: 600
            }}
          >
            {isSubmitting
              ? 'Processing...'
              : `Confirm ${responseAction === 'accepted' ? 'Acceptance' : 'Decline'}`
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
