'use client';

import { useState, useEffect } from 'react';
import { recruitmentApi, offboardingApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
import { MyApprovals } from './MyApprovals';
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  LinearProgress,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Description as FileTextIcon,
  CloudUpload as UploadIcon,
  Info as AlertCircleIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  Add as AddIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { AssessmentForms } from './AssessmentForms';
import { decryptData } from '../../../../../common/utils/encryption';
import axios from 'axios';

export function EmployeeDashboard() {
  const toast = useToast();
  const [showResignationForm, setShowResignationForm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAssessmentForms, setShowAssessmentForms] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showOffboarding, setShowOffboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState('');
  const [contractId, setContractId] = useState('6939bf651a58f444b8e539cd'); // TODO: Get from auth/contract data
  const [resignationData, setResignationData] = useState({
    reason: '',
    employeeComments: '',
    proposedLastWorkingDay: ''
  });
  const [resignationStatus, setResignationStatus] = useState<any[]>([]);
  const [isSubmittingResignation, setIsSubmittingResignation] = useState(false);

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<{
    governmentId: File | null;
    employmentContract: File | null;
    certifications: File | null;
  }>({
    governmentId: null,
    employmentContract: null,
    certifications: null,
  });
  const [fetchedDocuments, setFetchedDocuments] = useState<any[]>([]);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const encryptedId = localStorage.getItem('employeeId');

        if (token && encryptedId) {
          const decryptedId = await decryptData(encryptedId, token);
          if (decryptedId) {
            setEmployeeId(decryptedId);
            fetchOnboardingChecklist(decryptedId);
            fetchResignationStatus(decryptedId);
            fetchComplianceDocuments(decryptedId);
          }
        }
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      }
    };

    initializeDashboard();
  }, []);

  const fetchOnboardingChecklist = async (id?: string) => {
    try {
      setLoading(true);
      const targetId = id || employeeId;
      if (!targetId) return;

      const response = await recruitmentApi.getOnboardingChecklist({ employeeId: targetId });
      if (response.data.success) {
        setOnboardingData(response.data.onboarding);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No checklist found is an expected state, silent return
        setOnboardingData(null);
        return;
      }
      console.error('Failed to fetch onboarding checklist:', error);
      toast.error(error.response?.data?.message || 'Failed to load onboarding checklist');
    } finally {
      setLoading(false);
    }
  };

  const fetchResignationStatus = async (id?: string) => {
    try {
      const targetId = id || employeeId;
      if (!targetId) return;

      const response = await offboardingApi.trackResignationStatus({ employeeId: targetId });
      if (response.data) {
        setResignationStatus(Array.isArray(response.data) ? response.data : [response.data]);
      }
    } catch (error: any) {
      console.error('Failed to fetch resignation status:', error);
      // Don't show error toast for empty results
    }
  };

  const fetchComplianceDocuments = async (id?: string) => {
    try {
      const targetId = id || employeeId;
      // We pass employeeId to the API, so backend can use it if provided
      const response = await recruitmentApi.getComplianceDocuments(targetId);
      if (response.data) {
        setFetchedDocuments(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resignationData.reason || resignationData.reason.length < 20) {
      toast.error('Resignation reason must be at least 20 characters long');
      return;
    }

    try {
      setIsSubmittingResignation(true);
      await offboardingApi.submitResignation({
        employeeId,
        contractId,
        reason: resignationData.reason,
        employeeComments: resignationData.employeeComments,
        proposedLastWorkingDay: resignationData.proposedLastWorkingDay
      });

      toast.success('Resignation submitted successfully');
      setShowResignationForm(false);
      setResignationData({
        reason: '',
        employeeComments: '',
        proposedLastWorkingDay: ''
      });

      // Refresh resignation status
      fetchResignationStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit resignation');
      console.error(error);
    } finally {
      setIsSubmittingResignation(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const task = onboardingTasks.find((t: any) => t._id === taskId);
      if (!task) {
        toast.error('Task not found');
        return;
      }

      await recruitmentApi.updateTaskStatus({
        employeeId,
        taskName: task.name,
        status: status as string,
      });
      toast.success('Task status updated successfully');
      fetchOnboardingChecklist();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update task status');
    }
  };


  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: 'governmentId' | 'employmentContract' | 'certifications'
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    const maxSize = fileType === 'employmentContract' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Validate file type
    const allowedTypes = fileType === 'employmentContract'
      ? ['application/pdf']
      : ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload the correct format.');
      return;
    }

    try {
      // Map frontend file types to backend DocumentType enum values
      const typeMap: Record<string, string> = {
        'governmentId': 'id',
        'employmentContract': 'contract',
        'certifications': 'certificate'
      };

      const backendType = typeMap[fileType] || 'cv'; // Default fallback if needed

      // Upload to backend
      await recruitmentApi.uploadComplianceDocuments({
        employeeId,
        documentTypes: [backendType],
      }, [file]);

      // Update state
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: null
      }));
      toast.success(`${file.name} uploaded successfully`);
      fetchComplianceDocuments();
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }

    // Reset input
    event.target.value = '';
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      // Use env var or default to localhost:3000
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/recruitment/documents/${documentId}/view`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch document';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Failed to view document:', error);
      toast.error(error.message || 'Failed to view document');
    }
  };

  const onboardingTasks = onboardingData?.tasks || [];
  const completedTasks = onboardingTasks.filter((t: any) => t.status === 'completed').length;
  const totalTasks = onboardingTasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" color="text.primary" gutterBottom>
          Employee Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your onboarding and employment status
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper variant="outlined" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={showOnboarding ? 0 : showAssessmentForms ? 1 : showApprovals ? 2 : showOffboarding ? 3 : 0}
          onChange={(_, value) => {
            setShowOnboarding(value === 0);
            setShowAssessmentForms(value === 1);
            setShowApprovals(value === 2);
            setShowOffboarding(value === 3);
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Onboarding" />
          <Tab label="Assessments" />
          <Tab label="Approvals" />
          <Tab label="Offboarding" />
        </Tabs>
      </Paper>

      {/* Approvals Section */}
      {showApprovals && <MyApprovals />}


      {/* Assessment Forms Section */}
      {showAssessmentForms && (
        <AssessmentForms />
      )}

      {/* Onboarding Section */}
      {showOnboarding && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6">Onboarding Progress</Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete all tasks to finish your onboarding
                </Typography>
              </Box>
              <Button size="small" color="inherit" onClick={() => setShowOnboarding(false)}>
                Dismiss
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : !onboardingData ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">No onboarding checklist found</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Please contact HR to set up your onboarding tasks
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Overall Progress
                    </Typography>
                    <Typography variant="body2">
                      {completedTasks} of {totalTasks} completed
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color="success"
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>

                <Stack spacing={1.5}>
                  {onboardingTasks.map((task: any) => {
                    const isCompleted = task.status === 'completed';
                    const isInProgress = task.status === 'in_progress';

                    return (
                      <Paper
                        key={task._id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          bgcolor: isCompleted
                            ? 'action.hover'
                            : isInProgress
                              ? 'warning.light'
                              : 'background.paper',
                          color: isCompleted
                            ? 'text.primary'
                            : isInProgress
                              ? 'warning.contrastText'
                              : 'text.primary',
                          borderColor: isCompleted
                            ? 'success.main'
                            : isInProgress
                              ? 'warning.main'
                              : 'divider',
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Box sx={{ mt: 0.25 }}>
                            {isCompleted ? (
                              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                            ) : isInProgress ? (
                              <ClockIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                            ) : (
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  border: 2,
                                  borderColor: 'grey.300',
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                color: isCompleted ? 'text.secondary' : 'text.primary',
                              }}
                            >
                              {task.name}
                            </Typography>
                            {task.department && (
                              <Typography variant="caption" color="text.secondary">
                                Department: {task.department}
                              </Typography>
                            )}
                            {task.deadline && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Deadline: {new Date(task.deadline).toLocaleDateString()}
                              </Typography>
                            )}
                            {task.notes && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {task.notes}
                              </Typography>
                            )}
                          </Box>
                          <Stack direction="row" spacing={1}>
                            {!isCompleted && !isInProgress && (
                              <Button
                                size="small"
                                color="warning"
                                onClick={() => handleUpdateTaskStatus(task._id, 'in_progress')}
                              >
                                Start
                              </Button>
                            )}
                            {!isCompleted && (
                              <Button
                                size="small"
                                color="success"
                                onClick={() => handleUpdateTaskStatus(task._id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>

                {onboardingData.notes && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>Notes: </strong>
                    {onboardingData.notes}
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Upload */}
      {showOnboarding && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Document Upload
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload required documents to complete your onboarding
            </Typography>

            <Stack spacing={3}>
              {/* Government ID */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Government-issued ID
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  {fetchedDocuments.filter((d: any) => d.type === 'id').map((doc: any) => (
                    <Paper key={doc._id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <FileTextIcon color="primary" />
                        <Box>
                          <Typography variant="body2">{doc.filePath.split(/[/\\]/).pop()}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDocument(doc._id)}
                        sx={{ ml: 2 }}
                      >
                        View
                      </Button>
                    </Paper>
                  ))}
                </Stack>

                <input
                  type="file"
                  id="governmentId-upload"
                  accept="application/pdf,image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'governmentId')}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => document.getElementById('governmentId-upload')?.click()}
                  fullWidth
                  sx={{
                    borderStyle: 'dashed',
                    py: 2,
                    color: 'text.secondary',
                    borderColor: 'grey.300',
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                  }}
                >
                  Add Document
                </Button>
              </Box>

              {/* Employment Contract */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Signed Employment Contract
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  {fetchedDocuments.filter((d: any) => d.type === 'contract').map((doc: any) => (
                    <Paper key={doc._id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <FileTextIcon color="primary" />
                        <Box>
                          <Typography variant="body2">{doc.filePath.split(/[/\\]/).pop()}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDocument(doc._id)}
                        sx={{ ml: 2 }}
                      >
                        View
                      </Button>
                    </Paper>
                  ))}
                </Stack>

                <input
                  type="file"
                  id="employmentContract-upload"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'employmentContract')}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => document.getElementById('employmentContract-upload')?.click()}
                  fullWidth
                  sx={{
                    borderStyle: 'dashed',
                    py: 2,
                    color: 'text.secondary',
                    borderColor: 'grey.300',
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                  }}
                >
                  Add Document
                </Button>
              </Box>

              {/* Certifications */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Professional Certifications
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  {fetchedDocuments.filter((d: any) => d.type === 'certificate').map((doc: any) => (
                    <Paper key={doc._id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <FileTextIcon color="primary" />
                        <Box>
                          <Typography variant="body2">{doc.filePath.split(/[/\\]/).pop()}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDocument(doc._id)}
                        sx={{ ml: 2 }}
                      >
                        View
                      </Button>
                    </Paper>
                  ))}
                </Stack>

                <input
                  type="file"
                  id="certifications-upload"
                  accept="application/pdf,image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'certifications')}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => document.getElementById('certifications-upload')?.click()}
                  fullWidth
                  sx={{
                    borderStyle: 'dashed',
                    py: 2,
                    color: 'text.secondary',
                    borderColor: 'grey.300',
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                  }}
                >
                  Add Document
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Resignation Request (moved to Offboarding tab) */}
      {showOffboarding && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resignation Request
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Submit a resignation request if you wish to leave the company
            </Typography>

            {!showResignationForm ? (
              <Button
                variant="contained"
                color="error"
                onClick={() => setShowResignationForm(true)}
              >
                Submit Resignation Request
              </Button>
            ) : (
              <Box component="form" onSubmit={handleSubmitResignation}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>Proposed Last Working Date</Typography>
                    <TextField
                      type="date"
                      value={resignationData.proposedLastWorkingDay}
                      onChange={(e) => setResignationData({ ...resignationData, proposedLastWorkingDay: e.target.value })}
                      fullWidth
                      helperText="Optional"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>Reason for Resignation</Typography>
                    <TextField
                      multiline
                      rows={1}
                      required
                      value={resignationData.reason}
                      onChange={(e) => setResignationData({ ...resignationData, reason: e.target.value })}
                      placeholder="Please provide a detailed reason for your resignation (minimum 20 characters)..."
                      fullWidth
                      helperText={`${resignationData.reason.length} / 20 characters (Required)`}
                      error={resignationData.reason.length > 0 && resignationData.reason.length < 20}
                      variant="outlined"
                      sx={{ '& .MuiInputBase-input': { padding: '10px 12px', whiteSpace: 'pre-wrap' } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>Additional Comments</Typography>
                    <TextField
                      multiline
                      rows={1}
                      value={resignationData.employeeComments}
                      onChange={(e) => setResignationData({ ...resignationData, employeeComments: e.target.value })}
                      placeholder="Any additional comments or feedback..."
                      fullWidth
                      helperText="Optional"
                      variant="outlined"
                      sx={{ '& .MuiInputBase-input': { padding: '10px 12px', whiteSpace: 'pre-wrap' } }}
                    />
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setShowResignationForm(false);
                        setResignationData({ reason: '', employeeComments: '', proposedLastWorkingDay: '' });
                      }}
                      disabled={isSubmittingResignation}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="error"
                      fullWidth
                      disabled={isSubmittingResignation || resignationData.reason.length < 20}
                      startIcon={isSubmittingResignation ? <CircularProgress size={16} /> : null}
                    >
                      {isSubmittingResignation ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resignation Status */}
      {showOffboarding && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              My Resignation Requests
            </Typography>
            <Stack spacing={1.5}>
              {resignationStatus.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No resignation requests found</Typography>
                </Box>
              ) : (
                resignationStatus.map((request, index) => {
                  const statusColors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
                    pending: 'warning',
                    approved: 'success',
                    rejected: 'error',
                  };
                  const statusText = request.status || 'pending';

                  return (
                    <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Box>
                          <Typography variant="body2">
                            Submitted on {new Date(request.createdAt || request.initiatedDate).toLocaleDateString()}
                          </Typography>
                          {request.effectiveDate && (
                            <Typography variant="body2" color="text.secondary">
                              Effective date: {new Date(request.effectiveDate).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={statusText}
                          color={statusColors[statusText] || 'default'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Reason:</strong> {request.reason}
                      </Typography>
                      {request.employeeComments && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Comments:</strong> {request.employeeComments}
                        </Typography>
                      )}
                    </Paper>
                  );
                })
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Important Reminders */}
      {showOnboarding && (
        <Alert severity="info" variant="outlined" icon={<AlertCircleIcon />}>
          <AlertTitle>Important Reminders</AlertTitle>
          <List dense>
            <ListItem disablePadding>
              <ListItemText primary="Complete all onboarding tasks before your start date" />
            </ListItem>
            <ListItem disablePadding>
              <ListItemText primary="Upload all required documents within 48 hours" />
            </ListItem>
            <ListItem disablePadding>
              <ListItemText primary="Review the employee handbook in your dashboard" />
            </ListItem>
            <ListItem disablePadding>
              <ListItemText primary="Set up your email and system access on Day 1" />
            </ListItem>
          </List>
        </Alert>
      )}
    </Stack>
  );
}
