'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import WarningIcon from '@mui/icons-material/Warning';
import DescriptionIcon from '@mui/icons-material/Description';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
// Grid replaced by Stack/Box for responsive layout
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Paper from '@mui/material/Paper';
import { offboardingApi, employeeApi } from '@/lib/api';

import { useToast } from '@/lib/hooks/useToast';

export function TerminationReviews() {
  const toast = useToast();
  const [showInitiateForm, setShowInitiateForm] = useState(false);
  const [terminationRequests, setTerminationRequests] = useState<any[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Record<string, { employeeNumber?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected'>('approved');
  const [hrComments, setHrComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingChecklist, setCreatingChecklist] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [employeeDetailsMap, setEmployeeDetailsMap] = useState<Record<string, any>>({});
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  // Form state for initiating termination
  const [formData, setFormData] = useState({
    employeeNumber: '',
    reason: '',
    initiator: '',
    employeeComments: '',
    hrComments: '',
  });

  useEffect(() => {
    fetchTerminationRequests();
  }, []);

  const fetchTerminationRequests = async () => {
    try {
      setLoading(true);
      const response = await offboardingApi.getAllTerminationRequests();
      const requests = response.data && Array.isArray(response.data) ? response.data : [];

      // Fetch employee numbers for any employeeIds we don't already have
      const uniqueEmployeeIds = Array.from(new Set(requests.map((r: any) => r.employeeId).filter(Boolean)));
      const idsToFetch = uniqueEmployeeIds.filter((id) => !employeeMap[id]);

      if (idsToFetch.length > 0) {
        console.log('Fetching employee data for IDs:', idsToFetch);
        const promises = idsToFetch.map(async (id) => {
          try {
            const emp = await employeeApi.getEmployeebyId(id);
            console.log('Fetched employee:', id, emp);
            return { id, employeeNumber: emp?.profile?.employeeNumber };
          } catch (err) {
            console.error('Failed to fetch employee for id', id, err);
            return { id, employeeNumber: undefined };
          }
        });
        const results = await Promise.all(promises);
        console.log('Employee fetch results:', results);
        const newEmployeeMap: Record<string, { employeeNumber?: string }> = { ...employeeMap };
        results.forEach((r) => {
          if (r && r.id) newEmployeeMap[r.id] = { employeeNumber: r.employeeNumber };
        });
        console.log('Updated employee map:', newEmployeeMap);
        setEmployeeMap(newEmployeeMap);
      }

      // Set termination requests after fetching employee data
      setTerminationRequests(requests);
    } catch (error: any) {
      console.error('Failed to fetch termination requests:', error);
      toast.error(error.response?.data?.message || 'Failed to load termination requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApprovalModal = (request: any, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setHrComments('');
    setShowApprovalModal(true);
  };

  const handleApproveReject = async () => {
    if (!selectedRequest) return;

    try {
      setIsSubmitting(true);
      const status = approvalAction === 'approved' ? 'approved' : 'rejected';
      await offboardingApi.approveTermination({
        terminationRequestId: selectedRequest._id,
        status,
        hrComments: hrComments.trim() || undefined,
      });

      toast.success(`Termination request ${approvalAction} successfully`);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setHrComments('');
      fetchTerminationRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${approvalAction} termination request`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateTermination = async () => {
    // Validate required fields
    if (!formData.employeeNumber || !formData.reason || !formData.initiator) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await offboardingApi.initiateTerminationReview({
        employeeNumber: formData.employeeNumber.trim(),
        reason: formData.reason.trim(),
        initiator: formData.initiator.trim(),
        employeeComments: formData.employeeComments.trim() || undefined,
        hrComments: formData.hrComments.trim() || undefined,
      });

      toast.success('Termination review initiated successfully! Employee termination benefits created and department notifications sent.');
      setShowInitiateForm(false);
      setFormData({
        employeeNumber: '',
        reason: '',
        initiator: '',
        employeeComments: '',
        hrComments: '',
      });
      fetchTerminationRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate termination review');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChecklist = async (terminationRequestId: string) => {
    try {
      setCreatingChecklist(terminationRequestId);
      await offboardingApi.initiateOffboardingChecklist({
        terminationId: terminationRequestId,
        comments: undefined,
      });
      toast.success('Offboarding checklist created successfully!');
      fetchTerminationRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create checklist');
      console.error(error);
    } finally {
      setCreatingChecklist(null);
    }
  };

  // Fetch and show full employee details for a request
  const handleViewDetails = async (request: any) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
    const empId = request?.employeeId;
    if (!empId) return;
    if (employeeDetailsMap[empId]) return; // already cached

    try {
      setDetailsLoading(true);
      const resp = await employeeApi.getEmployeebyId(empId);
      // normalize: backend may return { profile: {...} } or the profile directly
      const full = resp?.profile ? resp.profile : (resp?.data ? (resp.data.profile || resp.data) : resp);
      setEmployeeDetailsMap((prev) => ({ ...prev, [empId]: full }));
    } catch (err) {
      console.error('Error loading employee details for', empId, err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedRequest(null);
  };

  const handleSendReminder = async (terminationRequestId: string) => {
    try {
      setSendingReminder(terminationRequestId);
      const response = await offboardingApi.sendOffboardingReminder(terminationRequestId);
      
      toast.success(
        `${response.data.remindersSent} reminder(s) sent to pending departments`
      );
      
      if (response.data.pendingDepartments.length > 0) {
        console.log('Pending departments:', response.data.pendingDepartments);
        console.log('Unreturned items:', response.data.unreturnedItems);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reminder');
      console.error(error);
    } finally {
      setSendingReminder(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6" gutterBottom>Termination Reviews</Typography>
          <Typography variant="body2" color="text.secondary">Review and initiate termination processes based on performance data</Typography>
        </Box>
        <Button
          onClick={() => setShowInitiateForm(true)}
          variant="contained"
          color="error"
          startIcon={<WarningIcon />}
        >
          Create Termination
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Termination Requests</Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={6}>
              <CircularProgress />
            </Box>
          ) : terminationRequests.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography color="text.secondary">No termination requests found</Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>Termination requests will appear here when initiated</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {terminationRequests.map((request) => (
                <Card key={request._id} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle1">
                          {employeeMap[request.employeeId]?.employeeNumber
                            ? `Employee: ${employeeMap[request.employeeId].employeeNumber}`
                            : `Employee ID: ${request.employeeId?.toString().slice(-8)}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Contract: {request.contractId?.toString().slice(-8)}</Typography>
                      </Box>
                      <Chip
                        label={request.status}
                        size="small"
                        color={
                          request.status === 'approved'
                            ? 'success'
                            : request.status === 'rejected'
                              ? 'error'
                              : 'warning'
                        }
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Reason</Typography>
                        <Typography variant="body2">{request.reason}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Type</Typography>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{request.initiator || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Termination Date</Typography>
                        <Typography variant="body2">
                          {request.terminationDate ? new Date(request.terminationDate).toLocaleDateString() : 'TBD'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Submitted</Typography>
                        <Typography variant="body2">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>

                    {request.employeeComments && (
                      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, color: 'text.primary' }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Employee Comments:</Typography>
                        <Typography variant="body2">{request.employeeComments}</Typography>
                      </Box>
                    )}

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Button
                        onClick={() => handleViewDetails(request)}
                        variant="outlined"
                        size="small"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => handleCreateChecklist(request._id)}
                        disabled={creatingChecklist === request._id}
                        variant="contained"
                        color="primary"
                        size="small"
                      >
                        {creatingChecklist === request._id ? 'Creating...' : 'Create Checklist'}
                      </Button>
                      {request.status === 'approved' && (
                        <Button
                          onClick={() => handleSendReminder(request._id)}
                          disabled={sendingReminder === request._id}
                          variant="outlined"
                          color="warning"
                          size="small"
                          startIcon={sendingReminder === request._id ? <CircularProgress size={16} /> : undefined}
                        >
                          {sendingReminder === request._id ? 'Sending...' : 'Send Reminder'}
                        </Button>
                      )}
                      {request.status === 'approved' && (
                        <Button
                          onClick={() => toast.info('Offboarding feature in Clearance tab')}
                          variant="contained"
                          size="small"
                        >
                          Proceed to Offboarding
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen && !!selectedRequest}
        onClose={() => !detailsLoading && handleCloseDetails()}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pr: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
            <Box>
              <Typography variant="h6">Termination & Employee Details</Typography>
              <Typography variant="body2" color="text.secondary">View termination request and employee profile</Typography>
            </Box>
            <Box>
              <IconButton onClick={handleCloseDetails} disabled={detailsLoading} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
            </Box>
          ) : selectedRequest ? (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ width: { md: '41%' } }}>
                {/* Employee Card - polished */}
                {selectedRequest.employeeId ? (
                  (() => {
                    const emp = employeeDetailsMap[selectedRequest.employeeId];
                    if (!emp) return <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}><Typography variant="body2" color="text.secondary">No employee data available</Typography></Paper>;
                    const initials = ((emp.firstName || '')[0] || '') + ((emp.lastName || '')[0] || '');
                    const fullName = ((emp.firstName || emp.fullName?.firstName || '') + ' ' + (emp.lastName || emp.fullName?.lastName || '')).trim();
                    const statusLabel = (emp.status || 'N/A').toString();
                    const chipColor = statusLabel.toUpperCase() === 'ACTIVE' ? 'success' : statusLabel.toUpperCase() === 'TERMINATED' ? 'error' : 'default';

                    return (
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ width: 80, height: 80, fontSize: 28 }}>{initials.toUpperCase()}</Avatar>
                          <Box>
                            <Typography variant="h6">{fullName || 'Unnamed'}</Typography>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>{emp.employeeNumber || 'Employee number N/A'}</Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip label={statusLabel} size="small" color={chipColor as any} sx={{ textTransform: 'capitalize' }} />
                            </Box>
                          </Box>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                          <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Email</Typography><Typography variant="body2">{emp.workEmail || emp.personalEmail || 'N/A'}</Typography></Box>
                          <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography variant="body2">{emp.phoneNumber || 'N/A'}</Typography></Box>
                          <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body2">{emp.department?.name || 'N/A'}</Typography></Box>
                          <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Position</Typography><Typography variant="body2">{emp.position?.title || 'N/A'}</Typography></Box>
                          <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Date of Hire</Typography><Typography variant="body2">{emp.dateOfHire ? new Date(emp.dateOfHire).toLocaleDateString() : 'N/A'}</Typography></Box>
                          <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Contract Type</Typography><Typography variant="body2">{emp.contractType || 'N/A'}</Typography></Box>
                        </Stack>
                      </Paper>
                    );
                  })()
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}><Typography variant="body2" color="text.secondary">No employee selected</Typography></Paper>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                {/* Termination Details - polished */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">Termination</Typography>
                        <Typography variant="body2" color="text.secondary">Request details and context</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">ID: {selectedRequest._id}</Typography>
                    </Stack>

                    <Divider />

                    <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Status</Typography><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{selectedRequest.status}</Typography></Box>
                      <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Type</Typography><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{selectedRequest.initiator || 'N/A'}</Typography></Box>
                      <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Termination Date</Typography><Typography variant="body2">{selectedRequest.terminationDate ? new Date(selectedRequest.terminationDate).toLocaleDateString() : 'TBD'}</Typography></Box>
                      <Box sx={{ width: '50%' }}><Typography variant="caption" color="text.secondary">Submitted</Typography><Typography variant="body2">{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}</Typography></Box>
                      <Box sx={{ width: '100%' }}><Typography variant="caption" color="text.secondary">Reason</Typography><Typography variant="body2">{selectedRequest.reason || 'N/A'}</Typography></Box>
                      {selectedRequest.employeeComments && (<Box sx={{ width: '100%' }}><Typography variant="caption" color="text.secondary">Employee Comments</Typography><Typography variant="body2">{selectedRequest.employeeComments}</Typography></Box>)}
                      {selectedRequest.hrComments && (<Box sx={{ width: '100%' }}><Typography variant="caption" color="text.secondary">HR Comments</Typography><Typography variant="body2">{selectedRequest.hrComments}</Typography></Box>)}
                    </Stack>
                  </Stack>
                </Paper>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        {/* single top-right close button used for a cleaner appearance */}
      </Dialog>

      {/* Approval/Rejection Modal */}
      <Dialog
        open={showApprovalModal && !!selectedRequest}
        onClose={() => !isSubmitting && setShowApprovalModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalAction === 'approved' ? 'Approve' : 'Reject'} Termination Request
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, color: 'text.primary' }}>
                <Typography variant="body2" color="text.secondary">
                  {employeeMap[selectedRequest.employeeId]?.employeeNumber
                    ? `Employee: ${employeeMap[selectedRequest.employeeId].employeeNumber}`
                    : `Employee ID: ${selectedRequest.employeeId?.toString().slice(-8)}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">Reason: {selectedRequest.reason}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  HR Comments{approvalAction === 'rejected' ? ' *' : ''}
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={4}
                  value={hrComments}
                  onChange={(e) => setHrComments(e.target.value)}
                  placeholder={approvalAction === 'rejected' ? 'Please provide reason for rejection...' : 'Optional comments...'}
                  required={approvalAction === 'rejected'}
                  sx={{
                    '& .MuiInputBase-input': {
                      padding: '10px 12px',
                      whiteSpace: 'pre-wrap',
                    },
                  }}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowApprovalModal(false);
              setSelectedRequest(null);
              setHrComments('');
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApproveReject}
            disabled={isSubmitting || (approvalAction === 'rejected' && !hrComments.trim())}
            variant="contained"
            color={approvalAction === 'approved' ? 'success' : 'error'}
            startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
          >
            {isSubmitting ? 'Processing...' : `Confirm ${approvalAction === 'approved' ? 'Approval' : 'Rejection'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Initiate Form Modal */}
      <Dialog
        open={showInitiateForm}
        onClose={() => setShowInitiateForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningIcon color="error" />
            <span>Initiate Termination Review</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} component="form" sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Employee Number *</Typography>
              <TextField
                fullWidth
                placeholder="Enter employee number (e.g., EMP001)"
                helperText="Enter the employee number (contract will be automatically found)"
                value={formData.employeeNumber}
                onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Termination Reason *</Typography>
              <TextField
                fullWidth
                variant="outlined"
                multiline
                rows={1}
                placeholder="Enter termination reason (e.g., Performance Issues, Misconduct, Redundancy)"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                sx={{
                  '& .MuiInputBase-input': {
                    padding: '10px 12px',
                    whiteSpace: 'pre-wrap',
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Initiator *</Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.initiator}
                  onChange={(e) => setFormData({ ...formData, initiator: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">Select who is initiating...</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Employee Comments</Typography>
              <TextField
                fullWidth
                variant="outlined"
                multiline
                rows={1}
                placeholder="Optional employee comments"
                value={formData.employeeComments}
                onChange={(e) => setFormData({ ...formData, employeeComments: e.target.value })}
                sx={{
                  '& .MuiInputBase-input': {
                    padding: '10px 12px',
                    whiteSpace: 'pre-wrap',
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>HR Comments</Typography>
              <TextField
                fullWidth
                variant="outlined"
                multiline
                rows={1}
                placeholder="Optional HR comments"
                value={formData.hrComments}
                onChange={(e) => setFormData({ ...formData, hrComments: e.target.value })}
                sx={{
                  '& .MuiInputBase-input': {
                    padding: '10px 12px',
                    whiteSpace: 'pre-wrap',
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Supporting Documentation (Optional)</Typography>
              <Box sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3,
                textAlign: 'center'
              }}>
                <DescriptionIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Upload performance reviews, warnings, etc.</Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowInitiateForm(false);
              setFormData({
                employeeNumber: '',
                reason: '',
                initiator: '',
                employeeComments: '',
                hrComments: '',
              });
            }}
            disabled={isSubmitting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleInitiateTermination}
            disabled={isSubmitting || !formData.employeeNumber || !formData.reason || !formData.initiator}
            variant="contained"
            color="error"
            startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}