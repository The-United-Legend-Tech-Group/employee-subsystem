import { useState, useEffect } from 'react';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
// Removed unused import
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Grid
} from '@mui/material';
import {
  Description as FileTextIcon,
  Add as PlusIcon,
  AttachMoney as DollarSignIcon,
  CalendarToday as CalendarIcon,
  Person as UserIcon,
  CheckCircle as CheckCircleIcon,
  Close as XIcon
} from '@mui/icons-material';

export function OffersAndApprovals() {
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproverModal, setShowApproverModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [offerDetails, setOfferDetails] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // employeeId no longer needed manually

  const [formData, setFormData] = useState({
    applicationId: '',
    candidateId: '',
    // hrEmployeeId removed - handled by backend token
    role: '',
    benefits: [] as string[],
    conditions: '',
    insurances: '',
    content: '',
    deadline: '',
  });

  const [benefitInput, setBenefitInput] = useState('');

  const [approverData, setApproverData] = useState({
    employeeId: '',
    role: '',
  });

  // Decryption logic removed as backend handles user ID from token

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offersResponse, applicationsResponse] = await Promise.all([
        recruitmentApi.getAllOffers(),
        recruitmentApi.getAllApplications()
      ]);

      setOffers(offersResponse.data || []);

      // Filter applications to only show those at "offer" stage
      const offerStageApps = (applicationsResponse.data || []).filter(
        (app: any) => app.currentStage === 'offer'
      );
      setApplications(offerStageApps);
    } catch (error: any) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationChange = (applicationId: string) => {
    const selectedApp = applications.find((app) => app._id === applicationId);
    if (selectedApp) {
      setFormData((prev) => ({
        ...prev,
        applicationId,
        candidateId: selectedApp.candidateId?._id || selectedApp.candidateId,
        role: selectedApp.requisitionId?.templateId?.title || selectedApp.requisitionId?.title || '',
      }));
    }
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()],
      }));
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // hrId validation removed as it is handled by backend token


    try {
      setIsSubmitting(true);
      await recruitmentApi.createOffer({
        ...formData,
        // hrEmployeeId is derived from token in backend
      });
      toast.success('Offer created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to create offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      applicationId: '',
      candidateId: '',
      // hrEmployeeId removed
      role: '',
      benefits: [],
      conditions: '',
      insurances: '',
      content: '',
      deadline: '',
    });
    setBenefitInput('');
  };

  const handleAddApprover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !approverData.employeeId) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await recruitmentApi.addOfferApprover({
        offerId: selectedOffer._id,
        employeeId: approverData.employeeId,
        role: approverData.role,
      });
      toast.success('Approver added successfully');
      setShowApproverModal(false);
      setApproverData({ employeeId: '', role: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add approver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (offer: any) => {
    try {
      setLoading(true);
      const response = await recruitmentApi.getOfferById(offer._id);
      setOfferDetails(response.data);
      setShowDetailsModal(true);
    } catch (error: any) {
      toast.error('Failed to load offer details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = async (offer: any) => {
    try {
      setIsSubmitting(true);
      await recruitmentApi.sendOffer({
        offerId: offer._id,
      });
      toast.success('Offer sent to candidate successfully!');
      fetchData(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (offer: any) => {
    const status = offer.finalStatus || 'pending';
    const colorMap: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      sent: 'info',
    };
    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={colorMap[status] || 'default'}
        size="small"
      />
    );
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6">Offers & Approvals</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage job offers for candidates
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusIcon />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Offer
        </Button>
      </Stack>

      {/* Offers List */}
      <Card variant="outlined">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, gap: 2 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading offers...</Typography>
          </Box>
        ) : offers.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Salary</TableCell>
                  <TableCell>Signing Bonus</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {offer.candidateId?.firstName || ''} {offer.candidateId?.lastName || ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{offer.candidateId?.email || ''}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{offer.role || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <DollarSignIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{offer.grossSalary || 0}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <DollarSignIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="body2">{offer.signingBonus || 0}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{getStatusBadge(offer)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewDetails(offer)}
                        >
                          View Details
                        </Button>
                        {offer.finalStatus !== 'sent' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                setSelectedOffer(offer);
                                setShowApproverModal(true);
                              }}
                            >
                              Add Approver
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleSendOffer(offer)}
                              disabled={isSubmitting}
                              title="Send offer to candidate"
                            >
                              Send Offer
                            </Button>
                          </>
                        )}
                        {offer.finalStatus === 'sent' && (
                          <Chip label="Offer Sent" size="small" />
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FileTextIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">No offers created yet</Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>Create your first offer to get started</Typography>
          </CardContent>
        )}
      </Card>

      {/* Create Offer Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <FileTextIcon color="primary" />
            <Typography variant="h6">Create Job Offer</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Application Selection */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Select Candidate (Offer Stage Only) *</Typography>
                <Select
                  fullWidth
                  value={formData.applicationId}
                  onChange={(e) => handleApplicationChange(e.target.value)}
                  displayEmpty
                  variant="outlined"
                  sx={{ '& .MuiSelect-select': { padding: '10px 12px' } }}
                >
                  <MenuItem value="">Select a candidate...</MenuItem>
                  {applications.map((app) => (
                    <MenuItem key={app._id} value={app._id}>
                      {app.candidateId?.firstName || ''} {app.candidateId?.lastName || ''} -{' '}
                      {app.requisitionId?.templateId?.title || app.requisitionId?.title || 'N/A'}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Only candidates at the "Offer" stage are shown
                </Typography>
              </Box>

              {/* Role */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Role/Position *</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
                />
              </Box>

              {/* Benefits */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>Benefits</Typography>
                <Stack direction="row" spacing={1} mb={1}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                    placeholder="Add a benefit and press Enter"
                    size="small"
                    sx={{ '& .MuiInputBase-input': { padding: '8px 10px' } }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddBenefit}
                  >
                    Add
                  </Button>
                </Stack>
                {formData.benefits.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {formData.benefits.map((benefit, index) => (
                      <Chip
                        key={index}
                        label={benefit}
                        onDelete={() => handleRemoveBenefit(index)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Conditions */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Conditions</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={1}
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  placeholder="Employment conditions..."
                  sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
                />
              </Box>

              {/* Insurances */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Insurance Coverage</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={formData.insurances}
                  onChange={(e) => setFormData({ ...formData, insurances: e.target.value })}
                  placeholder="e.g., Health, Dental, Vision"
                  sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
                />
              </Box>

              {/* Content */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Additional Content</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={1}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Additional offer details..."
                  sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
                />
              </Box>

              {/* Deadline */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Response Deadline</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiInputBase-input': { padding: '8px 10px' } }}
                />
              </Box>

            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {isSubmitting ? 'Creating...' : 'Create Offer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Approver Modal */}
      <Dialog
        open={showApproverModal && !!selectedOffer}
        onClose={() => {
          setShowApproverModal(false);
          setApproverData({ employeeId: '', role: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <UserIcon color="primary" />
            <Typography variant="h6">Add Approver</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOffer && (
            <>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover', color: 'text.primary' }}>
                <Typography variant="body2" color="text.secondary">Adding approver for:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {selectedOffer.candidateId?.firstName || ''} {selectedOffer.candidateId?.lastName || ''} - {selectedOffer.role}
                </Typography>
              </Paper>

              <Stack spacing={3}>
                <TextField
                  fullWidth
                  required
                  label="Employee Number"
                  value={approverData.employeeId}
                  onChange={(e) => setApproverData({ ...approverData, employeeId: e.target.value })}
                  placeholder="Enter employee number (e.g. EMP-123)"
                  helperText="Enter the employee number"
                />
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowApproverModal(false);
              setApproverData({ employeeId: '', role: '' });
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddApprover}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {isSubmitting ? 'Adding...' : 'Add Approver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Offer Details Modal */}
      <Dialog
        open={showDetailsModal && !!offerDetails}
        onClose={() => {
          setShowDetailsModal(false);
          setOfferDetails(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <FileTextIcon color="primary" />
            <Typography variant="h6">Offer Details</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {offerDetails && (
            <Stack spacing={3}>
              {/* Candidate Info */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', color: 'text.primary' }}>
                <Typography variant="subtitle2" fontWeight="medium" gutterBottom>Candidate Information</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Name</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {offerDetails.candidateId?.firstName || ''} {offerDetails.candidateId?.lastName || ''}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{offerDetails.candidateId?.email || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Position</Typography>
                    <Typography variant="body2" fontWeight="medium">{offerDetails.role || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Box mt={0.5}>{getStatusBadge(offerDetails)}</Box>
                  </Box>
                </Box>
              </Paper>

              {/* Compensation */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', color: 'text.primary' }}>
                <Typography variant="subtitle2" fontWeight="medium" gutterBottom>Compensation Package</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DollarSignIcon sx={{ color: 'success.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Gross Salary</Typography>
                      <Typography variant="h6" fontWeight="bold">${offerDetails.grossSalary || 0}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DollarSignIcon sx={{ color: 'secondary.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Signing Bonus</Typography>
                      <Typography variant="h6" fontWeight="bold">${offerDetails.signingBonus || 0}</Typography>
                    </Box>
                  </Stack>
                </Box>
                {offerDetails.benefits && offerDetails.benefits.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>Benefits</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1}>
                      {offerDetails.benefits.map((benefit: string, index: number) => (
                        <Chip key={index} label={benefit} size="small" color="success" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>

              {/* Approvers Status */}
              <Box>
                <Typography variant="subtitle2" fontWeight="medium" gutterBottom>Approval Status</Typography>
                {offerDetails.approvers && offerDetails.approvers.length > 0 ? (
                  <Stack spacing={2}>
                    {offerDetails.approvers.map((approver: any, index: number) => {
                      const statusColorMap: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
                        pending: 'warning',
                        approved: 'success',
                        rejected: 'error',
                      };
                      const isPending = approver.status === 'pending';

                      return (
                        <Paper
                          key={index}
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: isPending ? 'warning.light' : 'action.hover',
                            borderWidth: 2,
                            borderColor: isPending ? 'warning.main' : 'divider',
                            color: isPending ? 'warning.contrastText' : 'text.primary'
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between">
                            <Box flex={1}>
                              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                <UserIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" fontWeight="medium">
                                  {approver.employeeId?.firstName || ''} {approver.employeeId?.lastName || 'Unknown'}
                                </Typography>
                                <Chip label={approver.role} size="small" sx={{ height: 20 }} />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {approver.employeeId?.workEmail || 'No email'}
                              </Typography>
                              {approver.comment && (
                                <Typography variant="caption" color="text.secondary" display="block" mt={1} fontStyle="italic">
                                  "{approver.comment}"
                                </Typography>
                              )}
                            </Box>
                            <Box textAlign="right">
                              <Chip
                                label={approver.status === 'pending' ? '⏳ Pending' : approver.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                color={statusColorMap[approver.status] || 'default'}
                                size="small"
                              />
                              {approver.actionDate && (
                                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                  {new Date(approver.actionDate).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : (
                  <Paper variant="outlined" sx={{ textAlign: 'center', py: 4, bgcolor: 'action.hover', color: 'text.primary' }}>
                    <UserIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No approvers added yet</Typography>
                    <Typography variant="caption" color="text.secondary" mt={0.5}>Add approvers to start the approval process</Typography>
                  </Paper>
                )}
              </Box>

              {/* Additional Details */}
              <Stack spacing={2}>
                {offerDetails.conditions && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>Conditions</Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', color: 'text.primary' }}>
                      <Typography variant="body2" color="text.secondary">{offerDetails.conditions}</Typography>
                    </Paper>
                  </Box>
                )}
                {offerDetails.insurances && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>Insurance Coverage</Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', color: 'text.primary' }}>
                      <Typography variant="body2" color="text.secondary">{offerDetails.insurances}</Typography>
                    </Paper>
                  </Box>
                )}
                {offerDetails.content && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>Additional Content</Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', color: 'text.primary' }}>
                      <Typography variant="body2" color="text.secondary">{offerDetails.content}</Typography>
                    </Paper>
                  </Box>
                )}
                {offerDetails.deadline && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', color: 'text.primary' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Response Deadline</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {new Date(offerDetails.deadline).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setShowDetailsModal(false);
              setOfferDetails(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

