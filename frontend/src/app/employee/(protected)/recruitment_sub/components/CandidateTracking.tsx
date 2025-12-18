'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import LabelIcon from '@mui/icons-material/Label';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import { recruitmentApi, employeeApi } from '@/lib/api';
import { useMutation } from '@/lib/hooks/useApi';
import { useToast } from '@/lib/hooks/useToast';

export function CandidateTracking() {
  const toast = useToast();
  const [showTagModal, setShowTagModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<Set<string>>(new Set());
  const [referralData, setReferralData] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterReferral, setFilterReferral] = useState('all');
  const [referrerName, setReferrerName] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // Fetch all applications with populated candidate data
      const [applicationsResponse, referralsResponse] = await Promise.all([
        recruitmentApi.getAllApplications(),
        recruitmentApi.getAllReferrals()
      ]);

      setCandidates(applicationsResponse.data || []);

      // Build referrals set and map from backend data
      const referralCandidateIds = new Set<string>();
      const referralMap = new Map<string, any>();
      (referralsResponse.data || []).forEach((referral: any) => {
        const candidateId = referral.candidateId?._id || referral.candidateId;
        if (candidateId) {
          const candidateIdStr = candidateId.toString();
          referralCandidateIds.add(candidateIdStr);
          referralMap.set(candidateIdStr, referral);
        }
      });
      setReferrals(referralCandidateIds);
      setReferralData(referralMap);
    } catch (error: any) {
      toast.error('Failed to load candidates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagAsReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !referrerName) {
      toast.error('Please enter employee number');
      return;
    }

    try {
      setIsSubmitting(true);
      const candidateId = selectedCandidate.candidateId?._id || selectedCandidate.candidateId;

      // Fetch employee by employee number
      const employee = await employeeApi.getEmployeeByEmployeeNumber(referrerName.trim());

      if (!employee || !employee._id) {
        toast.error('Employee not found with this number');
        setIsSubmitting(false);
        return;
      }

      const newReferral = await recruitmentApi.createReferral(candidateId, {
        referringEmployeeId: employee._id,
        candidateId: candidateId,
        role: referralNotes || 'Standard',
        level: referralNotes || 'Standard',
      });

      // Add to referrals set and map
      setReferrals(prev => {
        const next = new Set<string>();
        prev.forEach(v => next.add(v));
        next.add(candidateId);
        return next;
      });
      setReferralData(prev => {
        const next = new Map(prev);
        next.set(candidateId, { ...newReferral.data, referringEmployeeId: employee });
        return next;
      });
      toast.success(`Candidate tagged as referral by ${employee.employeeNumber ?? employee._id}`);
      setShowTagModal(false);
      setReferrerName('');
      setReferralNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to tag as referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveStage = async (applicationId: string, newStage: string) => {
    try {
      setIsSubmitting(true);
      await recruitmentApi.updateApplicationStatus(applicationId, { currentStage: newStage });
      toast.success('Application stage updated');
      await fetchCandidates();
    } catch (error: any) {
      console.error('Stage update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update stage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      setIsSubmitting(true);
      await recruitmentApi.sendApplicationNotification(selectedCandidate._id, {
        candidateId: selectedCandidate.candidateId?._id || selectedCandidate.candidateId,
        hrId: '673a1234567890abcdef5678',
        customMessage: rejectionMessage,
      });

      // Update application status to rejected
      await recruitmentApi.updateApplication(selectedCandidate._id, '673a1234567890abcdef5678', {
        status: 'rejected',
      });

      toast.success('Rejection notification sent successfully');
      setShowRejectionModal(false);
      setRejectionMessage('');
      fetchCandidates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send rejection notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stages = ['screening', 'department_interview', 'hr_interview', 'offer'];

  const stageLabels: Record<string, string> = {
    screening: 'Screening',
    department_interview: 'Department Interview',
    hr_interview: 'HR Interview',
    offer: 'Offer'
  };

  // Check if a candidate is a referral
  const isReferral = (candidate: any) => {
    const candidateId = candidate.candidateId?._id || candidate.candidateId;
    return referrals.has(candidateId);
  };

  // Check if a candidate is rejected
  const isRejected = (candidate: any) => {
    return candidate.status === 'rejected';
  };

  // Filter candidates based on selected filters
  const filteredCandidates = candidates.filter(candidate => {
    // Filter by position
    if (filterPosition !== 'all') {
      const jobTitle = candidate.requisitionId?.title ||
        candidate.requisitionId?.templateId?.title ||
        candidate.jobRequisitionId?.title ||
        candidate.jobRequisitionId?.templateId?.title || '';
      if (jobTitle !== filterPosition) {
        return false;
      }
    }

    // Filter by stage
    if (filterStage !== 'all') {
      if (candidate.currentStage !== filterStage) {
        return false;
      }
    }

    // Filter by referral status
    if (filterReferral !== 'all') {
      const isRef = isReferral(candidate);
      if (filterReferral === 'referrals' && !isRef) {
        return false;
      }
      if (filterReferral === 'non-referrals' && isRef) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Sort: Active candidates first, rejected candidates at bottom
    const aRejected = isRejected(a);
    const bRejected = isRejected(b);

    if (aRejected && !bRejected) return 1;
    if (!aRejected && bRejected) return -1;
    return 0;
  });

  const getStageMetrics = () => {
    const activeCandidates = candidates.filter(c => c.status !== 'rejected');
    const activeReferrals = activeCandidates.filter(c => isReferral(c));

    const metrics = {
      total: activeCandidates.length,
      screening: 0,
      department_interview: 0,
      hr_interview: 0,
      offer: 0,
      rejected: candidates.filter(c => c.status === 'rejected').length,
      referrals: activeReferrals.length
    };

    activeCandidates.forEach(c => {
      if (c.currentStage === 'screening') metrics.screening++;
      else if (c.currentStage === 'department_interview') metrics.department_interview++;
      else if (c.currentStage === 'hr_interview') metrics.hr_interview++;
      else if (c.currentStage === 'offer') metrics.offer++;
    });

    return metrics;
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Candidate Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track candidates through each stage of the hiring process
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
        {(() => {
          const metrics = getStageMetrics();
          const statCards = [
            { label: 'Total', value: metrics.total, color: 'primary.main', bgcolor: 'primary.light' },
            { label: 'Screening', value: metrics.screening, color: 'info.main', bgcolor: 'info.light' },
            { label: 'Dept. Interview', value: metrics.department_interview, color: 'secondary.main', bgcolor: 'secondary.light' },
            { label: 'HR Interview', value: metrics.hr_interview, color: 'warning.main', bgcolor: 'warning.light' },
            { label: 'Offer', value: metrics.offer, color: 'success.main', bgcolor: 'success.light' },
            { label: 'Referrals', value: metrics.referrals, color: 'secondary.dark', bgcolor: 'secondary.light' }
          ];
          return statCards.map((stat) => (
            <Card key={stat.label} variant="outlined" sx={{ borderColor: stat.color }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          ));
        })()}
      </Box>

      {/* Filter Bar */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Position Filter</InputLabel>
              <Select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                label="Position Filter"
              >
                <MenuItem value="all">All Positions</MenuItem>
                {/* Dynamically generate position options from candidates */}
                {Array.from(new Set(
                  candidates
                    .map(c => {
                      // Try to get title from requisitionId or jobRequisitionId
                      const title = c.requisitionId?.title ||
                        c.requisitionId?.templateId?.title ||
                        c.jobRequisitionId?.title ||
                        c.jobRequisitionId?.templateId?.title;
                      return title;
                    })
                    .filter(Boolean) // Remove null/undefined values
                )).sort().map((position: any) => (
                  <MenuItem key={position} value={position}>
                    {position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Stage Filter</InputLabel>
              <Select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                label="Stage Filter"
              >
                <MenuItem value="all">All Stages</MenuItem>
                {stages.map((stage) => (
                  <MenuItem key={stage} value={stage}>{stageLabels[stage]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Referral Filter</InputLabel>
              <Select
                value={filterReferral}
                onChange={(e) => setFilterReferral(e.target.value)}
                label="Referral Filter"
              >
                <MenuItem value="all">All Candidates</MenuItem>
                <MenuItem value="referrals">Referrals Only</MenuItem>
                <MenuItem value="non-referrals">Non-Referrals</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <Card
        variant="outlined"
        sx={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 12 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Loading candidates...
            </Typography>
          </Box>
        ) : filteredCandidates.length > 0 ? (
          <Stack spacing={2} sx={{ p: 2 }}>
            {filteredCandidates.map((candidate) => {
              const rejected = isRejected(candidate);
              return (
                <Card
                  key={candidate._id}
                  sx={{
                    border: '1px solid',
                    borderColor: rejected ? 'error.main' : 'divider',
                    borderLeft: '4px solid',
                    borderLeftColor: rejected ? 'error.main' : isReferral(candidate) ? 'secondary.main' : 'primary.main',
                    opacity: rejected ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                      {/* Header Row */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                textDecoration: rejected ? 'line-through' : 'none',
                                color: rejected ? 'text.disabled' : 'text.primary',
                                fontWeight: 600
                              }}
                            >
                              {candidate.candidateId?.firstName || ''} {candidate.candidateId?.lastName || ''}
                            </Typography>
                            {rejected && <Chip label="Rejected" size="small" color="error" />}
                          </Stack>
                          <Typography variant="body2" color={rejected ? 'text.disabled' : 'text.secondary'} sx={{ mb: 1 }}>
                            {candidate.candidateId?.email || ''}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                              label={`#${candidate.candidateId?.candidateNumber || 'N/A'}`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={stageLabels[candidate.currentStage] || candidate.currentStage || candidate.status}
                              size="small"
                              color={rejected ? 'error' :
                                candidate.currentStage === 'screening' ? 'info' :
                                  candidate.currentStage === 'department_interview' ? 'secondary' :
                                    candidate.currentStage === 'hr_interview' ? 'warning' :
                                      candidate.currentStage === 'offer' ? 'success' : 'default'
                              }
                            />
                            {isReferral(candidate) && (() => {
                              const candidateId = candidate.candidateId?._id || candidate.candidateId;
                              const referralInfo = referralData.get(candidateId);
                              const employeeNumber = referralInfo?.referringEmployeeId?.employeeNumber;
                              return (
                                <Chip
                                  icon={<LabelIcon />}
                                  label={employeeNumber ? `Referral by ${employeeNumber}` : 'Referral'}
                                  size="small"
                                  color="secondary"
                                />
                              );
                            })()}
                          </Stack>
                        </Box>

                        <Stack spacing={0.5} alignItems="flex-end">
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {candidate.requisitionId?.title ||
                              candidate.requisitionId?.templateId?.title ||
                              candidate.jobRequisitionId?.title ||
                              candidate.jobRequisitionId?.templateId?.title ||
                              'Position'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Applied: {new Date(candidate.createdAt).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* Actions Row */}
                      <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        {!rejected && !isReferral(candidate) && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            startIcon={<LabelIcon />}
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowTagModal(true);
                            }}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 500,
                              borderRadius: 2,
                              px: 2
                            }}
                          >
                            Tag as Referral
                          </Button>
                        )}

                        <FormControl size="small" sx={{ minWidth: 180 }}>
                          <Select
                            value={candidate.currentStage || ''}
                            onChange={(e) => handleMoveStage(candidate._id, e.target.value)}
                            disabled={isSubmitting || rejected}
                            displayEmpty
                            sx={{
                              borderRadius: 2,
                              bgcolor: 'background.paper'
                            }}
                          >
                            <MenuItem value="" disabled>Change Stage</MenuItem>
                            {stages.map((stage) => (
                              <MenuItem key={stage} value={stage}>
                                {stageLabels[stage]}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<EmailIcon />}
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowRejectionModal(true);
                          }}
                          disabled={isSubmitting || rejected}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <PersonAddIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No candidates found
            </Typography>
          </Box>
        )}
      </Card>

      {/* Tag as Referral Modal */}
      <Dialog
        open={showTagModal && !!selectedCandidate}
        onClose={() => {
          setShowTagModal(false);
          setReferrerName('');
          setReferralNotes('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 3
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <LabelIcon sx={{ fontSize: 28 }} />
            <Typography variant="h5" fontWeight={600}>Tag as Referral</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 4, px: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Tag this candidate as a referral to give them priority in the hiring process.
          </Alert>
          <Stack spacing={3} component="form" onSubmit={handleTagAsReferral}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Referring Employee Number *</Typography>
              <TextField
                value={referrerName}
                onChange={(e) => setReferrerName(e.target.value)}
                placeholder="Enter employee number (e.g., EMP-0001)"
                required
                fullWidth
                helperText="Enter the employee number who referred this candidate"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Level/Notes (Optional)</Typography>
              <TextField
                value={referralNotes}
                onChange={(e) => setReferralNotes(e.target.value)}
                placeholder="Add level or additional notes about the referral..."
                multiline
                rows={3}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'action.hover' }}>
          <Button
            onClick={() => {
              setShowTagModal(false);
              setReferrerName('');
              setReferralNotes('');
            }}
            disabled={isSubmitting}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTagAsReferral}
            variant="contained"
            color="secondary"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <LabelIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(118, 75, 162, 0.3)'
            }}
          >
            {isSubmitting ? 'Tagging...' : 'Tag as Referral'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Rejection Modal */}
      <Dialog
        open={showRejectionModal && !!selectedCandidate}
        onClose={() => {
          setShowRejectionModal(false);
          setRejectionMessage('');
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            py: 3
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <EmailIcon sx={{ fontSize: 28 }} />
              <Typography variant="h5" fontWeight={600}>Send Rejection Notification</Typography>
            </Stack>
            <IconButton
              onClick={() => {
                setShowRejectionModal(false);
                setRejectionMessage('');
              }}
              size="small"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 4, px: 3 }}>
          {selectedCandidate && (
            <Stack spacing={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)',
                  border: '1px solid',
                  borderColor: 'error.light',
                  borderRadius: 2
                }}
              >
                <CardContent sx={{ py: 2.5 }}>
                  <Typography variant="body1" sx={{ mb: 1.5 }}>
                    <strong>Candidate:</strong> {selectedCandidate.candidateId?.firstName || ''} {selectedCandidate.candidateId?.lastName || ''}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1.5 }}>
                    <strong>Position:</strong> {selectedCandidate.requisitionId?.title ||
                      selectedCandidate.requisitionId?.templateId?.title ||
                      selectedCandidate.jobRequisitionId?.title ||
                      selectedCandidate.jobRequisitionId?.templateId?.title ||
                      'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Current Stage:</strong> {stageLabels[selectedCandidate.currentStage] || selectedCandidate.currentStage}
                  </Typography>
                </CardContent>
              </Card>

              <Stack spacing={2} component="form" onSubmit={handleSendRejection}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Rejection Message *</Typography>
                <TextField
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                  placeholder="Enter a personalized rejection message for the candidate..."
                  required
                  multiline
                  rows={6}
                  fullWidth
                  helperText="This message will be sent to the candidate via notification system."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />

                <Alert
                  severity="warning"
                  variant="filled"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500
                  }}
                >
                  ⚠️ This will automatically update the candidate's status to "Rejected" and send them a notification.
                </Alert>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'action.hover' }}>
          <Button
            onClick={() => {
              setShowRejectionModal(false);
              setRejectionMessage('');
            }}
            disabled={isSubmitting}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendRejection}
            variant="contained"
            color="error"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <EmailIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            {isSubmitting ? 'Sending...' : 'Send Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

