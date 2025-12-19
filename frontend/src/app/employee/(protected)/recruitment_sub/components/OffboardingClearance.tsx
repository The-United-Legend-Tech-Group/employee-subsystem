'use client';

import { useState, useEffect } from 'react';
import { offboardingApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
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
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  Cancel as XCircleIcon,
  Close as XIcon,
  Info as AlertCircleIcon
} from '@mui/icons-material';


export function OffboardingClearance() {
  const toast = useToast();
  const [offboardingData, setOffboardingData] = useState<any[]>([]);
  const [terminationRequests, setTerminationRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);

  useEffect(() => {
    fetchOffboardingChecklists();
    fetchTerminationRequests();
  }, []);

  const fetchOffboardingChecklists = async () => {
    try {
      setLoading(true);
      const response = await offboardingApi.getAllOffboardingChecklists();
      if (response.data.success) {
        setOffboardingData(response.data.checklists || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch offboarding checklists:', error);
      toast.error(error.response?.data?.message || 'Failed to load offboarding checklists');
    } finally {
      setLoading(false);
    }
  };

  const fetchTerminationRequests = async () => {
    try {
      const response = await offboardingApi.getAllTerminationRequests();
      if (response.data) {
        setTerminationRequests(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Failed to fetch termination requests:', error);
      toast.error(error.response?.data?.message || 'Failed to load termination requests');
    }
  };

  const handleUpdateDepartmentStatus = async (checklistId: string, department: string, status: string) => {
    try {
      // Get approverId from user context - for now using a placeholder
      // TODO: Replace with actual logged-in user ID from auth context

      // Send the status as selected by the user. Do not introduce 'in_progress'.
      // When user selects 'under_review' it will be sent as 'under_review' (matches backend enum).
      
      await offboardingApi.processDepartmentSignOff({
        clearanceChecklistId: checklistId,
        department: department,
        status: status as 'approved' | 'rejected' | 'pending' | 'under_review',
        comments: undefined,
      });

      toast.success(`${department} status updated to ${status}!`);

      // Refresh checklists
      const response = await offboardingApi.getAllOffboardingChecklists();
      const newChecklists = response.data.checklists || [];
      setOffboardingData(newChecklists);

      // Update selected checklist if modal is open
      if (selectedChecklist) {
        const updatedChecklist = newChecklists.find(
          (item: any) => item.checklist._id === selectedChecklist.checklist._id
        );
        if (updatedChecklist) {
          setSelectedChecklist(updatedChecklist);
        }
      }

      // If not all clearances are done -> inform user. Do NOT auto-change termination status to 'under_review' here.
      try {
        const updatedItem = newChecklists.find((it: any) => it.checklist._id === checklistId);
        const allCleared = !!updatedItem?.progress?.allCleared;
        if (allCleared) {
          toast.success('All clearances completed — termination will be auto-approved by the server');
        } else {
          toast.info('Clearance updated. Some items remain pending or under review.');
        }
      } catch (err: any) {
        console.error('Error processing clearance update status:', err);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update status');
    }
  };

  // Helper function to check if termination date has expired
  const isTerminationDateExpired = (terminationDate: string | null | undefined): boolean => {
    if (!terminationDate) return false;
    const termDate = new Date(terminationDate);
    const now = new Date();
    return termDate < now;
  };

  const handleUpdateEquipmentReturn = async (checklistId: string, equipmentName: string, returned: boolean) => {
    try {
      if (!equipmentName) {
        toast.error('Equipment name is required');
        return;
      }

      // Get updatedById from user context - for now using a placeholder
      // TODO: Replace with actual logged-in user ID from auth context
      const updatedById = '507f1f77bcf86cd799439011'; // Placeholder

      await offboardingApi.updateEquipmentReturn({
        clearanceChecklistId: checklistId,
        equipmentName: equipmentName,
        returned: returned,
        updatedById: updatedById,
      });

      toast.success(`Equipment "${equipmentName}" marked as ${returned ? 'returned' : 'pending'}!`);

      // Refresh checklists
      const response = await offboardingApi.getAllOffboardingChecklists();
      const newChecklists = response.data.checklists || [];
      setOffboardingData(newChecklists);

      // Update selected checklist if modal is open
      if (selectedChecklist) {
        const updatedChecklist = newChecklists.find(
          (item: any) => item.checklist._id === selectedChecklist.checklist._id
        );
        if (updatedChecklist) {
          setSelectedChecklist(updatedChecklist);
        }
      }

      // Inform user about overall clearance state. Do not auto-set termination to 'under_review' here.
      try {
        const updatedItem = newChecklists.find((it: any) => it.checklist._id === checklistId);
        const allCleared = !!updatedItem?.progress?.allCleared;
        if (allCleared) {
          toast.success('All clearances completed — termination will be auto-approved by the server');
        } else {
          toast.info('Equipment status updated. Some items or departments still pending.');
        }
      } catch (err: any) {
        console.error('Error processing equipment update status:', err);
      }
    } catch (error: any) {
      console.error('Equipment update error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update equipment status');
    }
  };

  const handleUpdateAccessCardReturn = async (checklistId: string, cardReturned: boolean) => {
    try {
      await offboardingApi.updateAccessCardReturn({
        clearanceChecklistId: checklistId,
        cardReturned: cardReturned,
      });

      toast.success(`Access card marked as ${cardReturned ? 'returned' : 'pending'}!`);

      // Refresh checklists
      const response = await offboardingApi.getAllOffboardingChecklists();
      const newChecklists = response.data.checklists || [];
      setOffboardingData(newChecklists);

      // Update selected checklist if modal is open
      if (selectedChecklist) {
        const updatedChecklist = newChecklists.find(
          (item: any) => item.checklist._id === selectedChecklist.checklist._id
        );
        if (updatedChecklist) {
          setSelectedChecklist(updatedChecklist);
        }
      }

      // Inform user about overall clearance state. Do not auto-set termination to 'under_review' here.
      try {
        const updatedItem = newChecklists.find((it: any) => it.checklist._id === checklistId);
        const allCleared = !!updatedItem?.progress?.allCleared;
        console.log('Updated item for access card:', allCleared);
        if (allCleared) {
          toast.success('All clearances completed — termination will be auto-approved by the server');
        } else {
          toast.info('Access card status updated. Some items or departments still pending.');
        }
      } catch (err: any) {
        console.error('Error processing access card update status:', err);
      }
    } catch (error: any) {
      console.error('Access card update error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update access card status');
    }
  };

  const handleApproveTermination = async (terminationId: string, employeeName: string) => {
    try {
      await offboardingApi.approveTermination({
        terminationRequestId: terminationId,
        status: 'approved',
        hrComments: 'All clearance requirements completed. Approved for final settlement.',
      });

      toast.success(`Termination approved for ${employeeName}. Employee is now ready for system access revocation.`);

      // Refresh data
      await fetchOffboardingChecklists();
      await fetchTerminationRequests();
    } catch (error: any) {
      console.error('Termination approval error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to approve termination');
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6">Offboarding Clearance</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage multi-department clearances and asset recovery. Create checklists from the Termination Reviews tab.
          </Typography>
        </Box>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : offboardingData.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No offboarding checklists found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Checklists will appear here when termination reviews are initiated
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {offboardingData.map((item: any) => {
            const checklist = item.checklist;
            const termination = item.termination;
            const employee = item.employee;
            const progress = item.progress;

            if (!checklist || !termination) return null;

            const totalClearances = progress.totalClearances;
            const clearedCount = progress.clearedCount;
            const allCleared = progress.allCleared;

            // Get overall status from backend (in_progress, fully_cleared, clearance_issues)
            const overallStatus = checklist.overallStatus || 'in_progress';
            const isFullyCleared = overallStatus === 'fully_cleared';
            const hasClearanceIssues = overallStatus === 'clearance_issues';

            // Check if termination date has expired
            const isExpired = isTerminationDateExpired(termination.terminationDate);

            // Determine chip label and color based on overall status
            let statusLabel = 'In Progress';
            let statusColor: 'warning' | 'success' | 'error' = 'warning';
            
            if (isFullyCleared) {
              statusLabel = 'Fully Cleared';
              statusColor = 'success';
            } else if (hasClearanceIssues) {
              statusLabel = 'Clearance Issues';
              statusColor = 'error';
            }

            return (
              <Card key={checklist._id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {employee ? `${employee.firstName} ${employee.lastName}` : 'Employee'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {termination.employeeId ? termination.employeeId.toString().slice(-8) : 'N/A'} · {typeof employee?.department === 'string' ? employee.department : employee?.department?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Working Day: {termination.terminationDate ? new Date(termination.terminationDate).toLocaleDateString() : 'TBD'}
                      </Typography>
                    </Box>
                    <Chip
                      label={statusLabel}
                      color={statusColor}
                      size="small"
                    />
                  </Stack>

                  {/* Show warning if termination date has expired */}
                  {isExpired && (
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: 'error.50',
                        borderLeft: 4,
                        borderColor: 'error.main'
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AlertCircleIcon sx={{ color: 'error.main', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium" color="error.main">
                            Termination Date Expired - Checklist Locked
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            This offboarding checklist is now locked. No further updates are allowed. The employee is ready for system access revocation.
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  )}

                  <Box mb={3}>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">Clearance Progress</Typography>
                      <Typography variant="body2">{clearedCount} of {totalClearances} departments</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={progress.progress}
                      color={allCleared ? 'success' : 'warning'}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  {/* Department Clearances */}
                  <Box mb={3}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>Department Sign-offs</Typography>
                    {(checklist.items || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No department clearances recorded</Typography>
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                        {(checklist.items || []).map((clearance: any, index: number) => {
                          const isCleared = clearance.status === 'approved';
                          const isRejected = clearance.status === 'rejected';
                          const isUnderReview = clearance.status === 'under_review';
                          const isPending = clearance.status === 'pending';
                          const deptLabel = typeof clearance.department === 'string'
                            ? clearance.department
                            : clearance.department?.name || (clearance.department?._id ? String(clearance.department._id) : 'Department');

                          return (
                            <Box key={index}>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 2,
                                  bgcolor: isCleared ? 'success.50' : isRejected ? 'error.50' : isUnderReview ? 'info.50' : 'warning.50',
                                  borderColor: isCleared ? 'success.200' : isRejected ? 'error.200' : isUnderReview ? 'info.200' : 'warning.200'
                                }}
                              >
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    {isCleared ? (
                                      <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                    ) : isRejected ? (
                                      <XCircleIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                    ) : isUnderReview ? (
                                      <ClockIcon sx={{ fontSize: 16, color: 'info.main' }} />
                                    ) : (
                                      <ClockIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                    )}
                                    <Typography variant="body2">{deptLabel} {clearance.status}</Typography>
                                  </Stack>
                                  <Chip
                                    label={isCleared ? 'Cleared' : isRejected ? 'Rejected' : isUnderReview ? 'Under Review' : 'Pending'}
                                    size="small"
                                    color={isCleared ? 'success' : isRejected ? 'error' : isUnderReview ? 'info' : 'warning'}
                                  />
                                </Stack>
                                {clearance.updatedBy && (
                                  <Typography variant="caption" color="text.secondary">By: {clearance.updatedBy}</Typography>
                                )}
                                {clearance.comments && (
                                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{clearance.comments}</Typography>
                                )}
                                {clearance.updatedAt && (
                                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                    {new Date(clearance.updatedAt).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Paper>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>

                  {/* Assets */}
                  <Box mb={3}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>Asset Recovery</Typography>
                    {(checklist.equipmentList || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No equipment recorded</Typography>
                    ) : (
                      <Stack spacing={1}>
                        {(checklist.equipmentList || []).map((asset: any, index: number) => {
                          const isReturned = asset.returned === true;
                          return (
                            <Paper
                              key={index}
                              variant="outlined"
                              sx={{ p: 2, bgcolor: 'action.hoverZZz', color: 'text.primary' }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {isReturned ? (
                                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  ) : (
                                    <ClockIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                  )}
                                  <Typography variant="body2">{typeof asset.name === 'string' ? asset.name : asset.name?.name || 'Equipment'}</Typography>
                                </Stack>
                                <Box textAlign="right">
                                  <Chip
                                    label={isReturned ? 'Returned' : 'Pending'}
                                    size="small"
                                    color={isReturned ? 'success' : 'warning'}
                                  />
                                  {asset.condition && (
                                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Condition: {typeof asset.condition === 'string' ? asset.condition : asset.condition?.name || 'N/A'}</Typography>
                                  )}
                                </Box>
                              </Stack>
                            </Paper>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>

                  {/* Access Card */}
                  {checklist.cardReturned !== undefined && (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', mb: 3, color: 'text.primary' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          {checklist.cardReturned ? (
                            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          ) : (
                            <ClockIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          )}
                          <Typography variant="body2">Access Card</Typography>
                        </Stack>
                        <Chip
                          label={checklist.cardReturned ? 'Returned' : 'Pending'}
                          size="small"
                          color={checklist.cardReturned ? 'success' : 'warning'}
                        />
                      </Stack>
                    </Paper>
                  )}

                  {/* Actions */}
                  <Stack direction="row" spacing={1} sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        console.log('Setting selected checklist:', item);
                        setSelectedChecklist(item);
                        setShowDetailsModal(true);
                      }}
                    >
                      View Checklist
                    </Button>
                    {!allCleared && (
                      <Button variant="contained" size="small">
                        Send Reminder
                      </Button>
                    )}
                    {allCleared && (
                      <Chip
                        label="✓ Auto-Approved - Ready for Access Revocation"
                        color="success"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Checklist Details Modal */}
      <Dialog
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedChecklist(null);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedChecklist && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">
                    Offboarding Checklist Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedChecklist.employee ? `${selectedChecklist.employee.firstName} ${selectedChecklist.employee.lastName}` : 'Employee'}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedChecklist(null);
                  }}
                >
                  <XIcon />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent>
              {/* Progress Summary */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Clearance Progress</Typography>
                  <Typography variant="body2">{selectedChecklist.progress.clearedCount} of {selectedChecklist.progress.totalClearances} departments</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={selectedChecklist.progress.progress}
                  color={selectedChecklist.progress.allCleared ? 'success' : 'warning'}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>

              {/* Employee Info */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Employee Information</Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>ID:</strong> {selectedChecklist.termination.employeeId ? selectedChecklist.termination.employeeId.toString().slice(-8) : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Department:</strong> {typeof selectedChecklist.employee?.department === 'string' ? selectedChecklist.employee.department : selectedChecklist.employee?.department?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Working Day:</strong> {selectedChecklist.termination.terminationDate ? new Date(selectedChecklist.termination.terminationDate).toLocaleDateString() : 'TBD'}
                  </Typography>
                </Stack>
              </Box>

              {/* Department Clearances with Status Update */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Department Sign-offs</Typography>
                
                {/* Show warning if termination date has expired */}
                {isTerminationDateExpired(selectedChecklist.termination?.terminationDate) && (
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: 'error.50',
                      borderLeft: 4,
                      borderColor: 'error.main'
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AlertCircleIcon sx={{ color: 'error.main', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" fontWeight="medium" color="error.main">
                          Termination Date Expired - Checklist Locked
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          The termination date ({new Date(selectedChecklist.termination.terminationDate).toLocaleDateString()}) has passed. This checklist is now locked and cannot be modified. The termination request has been automatically approved.
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                )}
                
                <Stack spacing={2}>
                  {(selectedChecklist.checklist.items || []).map((clearance: any, index: number) => {
                    const isApproved = clearance.status === 'approved';
                    const isRejected = clearance.status === 'rejected';
                    const isUnderReview = clearance.status === 'under_review';
                    const isPending = clearance.status === 'pending';
                    const deptLabel = typeof clearance.department === 'string'
                      ? clearance.department
                      : clearance.department?.name || (clearance.department?._id ? String(clearance.department._id) : 'Department');

                    return (
                      <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: isApproved ? 'success.50' : isRejected ? 'error.50' : isUnderReview ? 'info.50' : 'warning.50',
                          borderColor: isApproved ? 'success.200' : isRejected ? 'error.200' : isUnderReview ? 'info.200' : 'warning.200'
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                              {isApproved ? (
                                <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                              ) : isRejected ? (
                                <XCircleIcon sx={{ fontSize: 20, color: 'error.main' }} />
                              ) : isUnderReview ? (
                                <ClockIcon sx={{ fontSize: 20, color: 'info.main' }} />
                              ) : (
                                <ClockIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                              )}
                              <Typography variant="subtitle2">{deptLabel} {clearance.status}</Typography>
                              <Chip
                                label={isApproved ? 'Approved' : isRejected ? 'Rejected' : isUnderReview ? 'Under Review' : 'Pending'}
                                size="small"
                                color={isApproved ? 'success' : isRejected ? 'error' : isUnderReview ? 'info' : 'warning'}
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </Stack>

                            {clearance.comments && (
                              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                {clearance.comments}
                              </Typography>
                            )}

                            {clearance.updatedBy && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Updated by: {clearance.updatedBy}
                              </Typography>
                            )}

                            {clearance.updatedAt && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Last updated: {new Date(clearance.updatedAt).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>

                          {/* Status Dropdown - Only show when status is not final (approved/rejected) AND termination not expired */}
                          {!(isApproved || isRejected) && !isTerminationDateExpired(selectedChecklist.termination?.terminationDate) && (
                            (() => {
                              const options: { value: string; label: string }[] = isUnderReview
                                ? [
                                    { value: 'under_review', label: 'Under Review' },
                                    { value: 'approved', label: 'Approved' },
                                    { value: 'rejected', label: 'Rejected' },
                                  ]
                                : [
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'under_review', label: 'Under Review' },
                                    { value: 'approved', label: 'Approved' },
                                    { value: 'rejected', label: 'Rejected' },
                                  ];

                              return (
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                  <Select
                                    value={clearance.status || 'pending'}
                                    onChange={(e) => {
                                      handleUpdateDepartmentStatus(
                                        selectedChecklist.checklist._id,
                                        deptLabel,
                                        e.target.value
                                      );
                                    }}
                                  >
                                    {options.map((opt) => (
                                      <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              );
                            })()
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>

              {/* Equipment List */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Equipment & Assets</Typography>
                <Stack spacing={2}>
                  {(selectedChecklist.checklist.equipmentList || []).map((asset: any, index: number) => {
                    const isReturned = asset.returned === true;
                    return (
                      <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: isReturned ? 'success.50' : 'warning.50',
                          borderColor: isReturned ? 'success.200' : 'warning.200'
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                            {isReturned ? (
                              <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                            ) : (
                              <ClockIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                            )}
                            <Box>
                              <Typography variant="body2">{typeof asset.name === 'string' ? asset.name : asset.name?.name || 'Equipment'}</Typography>
                              {asset.condition && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {typeof asset.condition === 'string' ? asset.condition : asset.condition?.name || 'N/A'}
                                </Typography>
                              )}
                            </Box>
                          </Stack>

                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={isReturned ? 'Returned' : 'Pending'}
                              size="small"
                              color={isReturned ? 'success' : 'warning'}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isReturned}
                                  disabled={isTerminationDateExpired(selectedChecklist.termination?.terminationDate)}
                                  onChange={(e) => {
                                    const equipName = typeof asset.name === 'string' ? asset.name : asset.name?.name || 'Equipment';
                                    handleUpdateEquipmentReturn(
                                      selectedChecklist.checklist._id,
                                      equipName,
                                      e.target.checked
                                    );
                                  }}
                                  color={isReturned ? 'success' : 'warning'}
                                />
                              }
                              label=""
                              sx={{ m: 0 }}
                            />
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>

              {/* Access Card */}
              {selectedChecklist.checklist.cardReturned !== undefined && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: selectedChecklist.checklist.cardReturned ? 'success.50' : 'warning.50',
                    borderColor: selectedChecklist.checklist.cardReturned ? 'success.200' : 'warning.200'
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      {selectedChecklist.checklist.cardReturned ? (
                        <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                      ) : (
                        <ClockIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                      )}
                      <Typography variant="body2">Access Card</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={selectedChecklist.checklist.cardReturned ? 'Returned' : 'Pending'}
                        size="small"
                        color={selectedChecklist.checklist.cardReturned ? 'success' : 'warning'}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedChecklist.checklist.cardReturned}
                            disabled={isTerminationDateExpired(selectedChecklist.termination?.terminationDate)}
                            onChange={(e) => {
                              handleUpdateAccessCardReturn(
                                selectedChecklist.checklist._id,
                                e.target.checked
                              );
                            }}
                            color={selectedChecklist.checklist.cardReturned ? 'success' : 'warning'}
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </DialogContent>

            <DialogActions>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedChecklist(null);
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  );
}

