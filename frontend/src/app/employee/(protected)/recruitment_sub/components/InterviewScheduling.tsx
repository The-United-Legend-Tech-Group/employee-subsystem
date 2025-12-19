import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { recruitmentApi, employeeApi, organizationApi, OpenDepartment } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

interface InterviewFormData {
  applicationId: string;
  stage: 'hr_interview' | 'department_interview';
  scheduledDate: string;
  method: 'onsite' | 'video' | 'phone';
  panel: string[];
  videoLink: string;
}

export function InterviewScheduling() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [panelInput, setPanelInput] = useState('');
  const [panelMembers, setPanelMembers] = useState<{ number: string; id: string; name: string; department?: string }[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [openDepartments, setOpenDepartments] = useState<OpenDepartment[]>([]);
  const [showRecruiters, setShowRecruiters] = useState(false);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState<InterviewFormData>({
    applicationId: '',
    stage: 'hr_interview',
    scheduledDate: '',
    method: 'video',
    panel: [],
    videoLink: '',
  });

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const response = await recruitmentApi.getAllApplications();
      setApplications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load candidates');
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchAllInterviews = async () => {
    try {
      setLoadingInterviews(true);
      const allApps = await recruitmentApi.getAllApplications();
      const interviewPromises = (allApps.data || []).map(async (app: any) => {
        try {
          const response = await recruitmentApi.getInterviewsByApplication(app._id);
          return (response.data || []).map((interview: any) => ({
            ...interview,
            applicationId: app,
          }));
        } catch (error) {
          return [];
        }
      });
      const interviewArrays = await Promise.all(interviewPromises);
      const allInterviews = interviewArrays.flat();
      setInterviews(allInterviews);
      // Debug: log fetched interviews to help diagnose missing status in UI
      // Remove this in production if not needed
      // eslint-disable-next-line no-console
      console.debug('InterviewScheduling: fetched interviews', allInterviews);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoadingInterviews(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchAllInterviews();
  }, []);

  const handleOpen = async (appId: string = '', stage: any = 'hr_interview') => {
    setFormData({
      ...formData,
      applicationId: appId,
      stage: (stage === 'hr_interview' || stage === 'department_interview') ? stage : 'hr_interview',
    });
    setOpen(true);

    // Fetch open departments when dialog opens (if not already loaded)
    if (openDepartments.length === 0) {
      try {
        const data = await organizationApi.getOpenDepartments();
        setOpenDepartments(data || []);
      } catch (error) {
        console.error('Failed to load recruiters:', error);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      applicationId: '',
      stage: 'hr_interview',
      scheduledDate: '',
      method: 'video',
      panel: [],
      videoLink: '',
    });
    setPanelInput('');
    setPanelMembers([]);
  };

  const handleAddPanelMember = async () => {
    const trimmed = panelInput.trim();
    if (!trimmed) {
      toast.error('Please enter an employee number');
      return;
    }

    if (panelMembers.some((m) => m.number === trimmed || m.id === trimmed)) {
      toast.warning('This employee is already added');
      return;
    }

    try {
      const employee = await employeeApi.getEmployeeByEmployeeNumber(trimmed) as any;
      if (!employee || !employee._id) {
        toast.error('Employee not found');
        return;
      }

      const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employeeNumber;
      const newMember = { number: employee.employeeNumber, id: employee._id, name: employeeName };
      setPanelMembers([...panelMembers, newMember]);
      setFormData({ ...formData, panel: [...formData.panel, employee._id] });
      setPanelInput('');
      toast.success(`Added ${employeeName}`);
    } catch (error: any) {
      toast.error('Failed to find employee');
    }
  };

  const handleRemovePanelMember = (employeeId: string) => {
    const updatedMembers = panelMembers.filter((m) => m.id !== employeeId);
    setPanelMembers(updatedMembers);
    setFormData({ ...formData, panel: updatedMembers.map((m) => m.id) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in');
      return;
    }

    if (!formData.applicationId) {
      toast.error('Please select a candidate');
      return;
    }
    if (!formData.scheduledDate) {
      toast.error('Date and time is required');
      return;
    }
    if (formData.panel.length === 0) {
      toast.error('At least one panel member is required');
      return;
    }
    if (formData.method === 'video' && !formData.videoLink) {
      toast.error('Video link is required');
      return;
    }

    try {
      setSubmitting(true);
      const scheduledDateIso = new Date(formData.scheduledDate).toISOString();
      const payload = {
        applicationId: formData.applicationId,
        stage: formData.stage,
        scheduledDate: scheduledDateIso,
        method: formData.method,
        panel: formData.panel,
        videoLink: formData.method === 'video' ? formData.videoLink.trim() : undefined,
      };

      await recruitmentApi.createInterview(payload);
      toast.success('Interview scheduled successfully!');
      handleClose();
      await fetchAllInterviews();
    } catch (error: any) {
      toast.error('Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateInterviewStatus = async (interviewId: string, newStatus: string) => {
    try {
      await recruitmentApi.updateInterview(interviewId, { status: newStatus });
      toast.success(`Interview marked as ${newStatus}`);
      await fetchAllInterviews();
    } catch (error: any) {
      toast.error('Failed to update interview status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Stage labels consistent with CandidateTracking
  const stageLabels: Record<string, string> = {
    screening: 'Screening',
    department_interview: 'Department Interview',
    hr_interview: 'HR Interview',
    offer: 'Offer'
  };

  // Filter for candidates in interview stages
  const eligibleApplications = applications.filter(app => {
    const isInterviewStage = app.currentStage === 'hr_interview' || app.currentStage === 'department_interview';
    const isNotRejected = app.status !== 'rejected';
    if (!isInterviewStage || !isNotRejected) return false;

    // Search filter
    const name = `${app.candidateId?.firstName} ${app.candidateId?.lastName}`.toLowerCase();
    if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;

    // Position filter
    if (filterPosition !== 'all') {
      const title = app.requisitionId?.title || app.requisitionId?.templateId?.title || app.jobRequisitionId?.title || '';
      if (title !== filterPosition) return false;
    }

    return true;
  });

  // Get unique positions for filter
  const positions = Array.from(new Set(
    applications
      .map(app => app.requisitionId?.title || app.requisitionId?.templateId?.title || app.jobRequisitionId?.title)
      .filter(Boolean)
  )).sort();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Interview Scheduling
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process candidates ready for interviews
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<CalendarMonthIcon />} onClick={() => handleOpen()}>
          Manual Schedule
        </Button>
      </Stack>

      <Stack spacing={3}>
        {/* Filters */}
        <Stack direction="row" spacing={2}>
          <TextField
            placeholder="Search candidate name..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Position Filter</InputLabel>
            <Select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              label="Position Filter"
            >
              <MenuItem value="all">All Positions</MenuItem>
              {positions.map((pos: any) => (
                <MenuItem key={pos} value={pos}>{pos}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Candidate List Table */}
        <Card variant="outlined">
          {loadingApps ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Loading candidates...
              </Typography>
            </Box>
          ) : eligibleApplications.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Target Stage</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eligibleApplications.map((app) => (
                    <TableRow key={app._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {app.candidateId?.firstName} {app.candidateId?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {app.candidateId?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {app.requisitionId?.title || app.requisitionId?.templateId?.title || app.jobRequisitionId?.title || 'Unknown Position'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={app.requisitionId?.department || app.requisitionId?.templateId?.department || app.jobRequisitionId?.department || 'Not specified'}
                          size="small"
                          variant="filled"
                          sx={{ bgcolor: 'primary.50', color: 'primary.main', fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stageLabels[app.currentStage] || app.currentStage}
                          size="small"
                          color={app.currentStage === 'hr_interview' ? 'warning' : 'secondary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpen(app._id, app.currentStage)}
                          >
                            Schedule
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Typography variant="body1" color="text.secondary">
                No candidates found waiting for interviews
              </Typography>
            </Box>
          )}
        </Card>

        {/* Scheduled Interviews List */}
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Scheduled Interviews
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Card variant="outlined">
            {loadingInterviews ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  Loading interviews...
                </Typography>
              </Box>
            ) : interviews.filter(int => filterStatus === 'all' || int.status === filterStatus).length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Candidate</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Scheduled Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {interviews
                      .filter(int => filterStatus === 'all' || int.status === filterStatus)
                      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                      .map((interview) => (
                        <TableRow key={interview._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {interview.applicationId?.candidateId?.firstName} {interview.applicationId?.candidateId?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {interview.applicationId?.requisitionId?.title || 'Unknown Position'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={stageLabels[interview.stage] || interview.stage}
                              size="small"
                              color={interview.stage === 'hr_interview' ? 'warning' : 'secondary'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" textTransform="capitalize">
                              {interview.method}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(interview.scheduledDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(interview.scheduledDate).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={interview.status || 'scheduled'}
                              size="small"
                              color={getStatusColor(interview.status || 'scheduled') as any}
                              sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {interview.status === 'scheduled' && (
                                <>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    onClick={() => handleUpdateInterviewStatus(interview._id, 'completed')}
                                  >
                                    Complete
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleUpdateInterviewStatus(interview._id, 'cancelled')}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {interview.status === 'cancelled' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                  onClick={() => handleUpdateInterviewStatus(interview._id, 'scheduled')}
                                >
                                  Reschedule
                                </Button>
                              )}
                              {interview.status === 'completed' && (
                                <Chip label="Completed" size="small" color="success" variant="outlined" />
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="body1" color="text.secondary">
                  No interviews found
                </Typography>
              </Box>
            )}
          </Card>
        </Box>
      </Stack>

      {/* Create Interview Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Schedule Interview</DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2.5}>
              <FormControl fullWidth required>
                <InputLabel id="application-select-label">Select Candidate</InputLabel>
                <Select
                  labelId="application-select-label"
                  value={formData.applicationId}
                  label="Select Candidate"
                  onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                >
                  {applications.filter(app => (app.currentStage === 'hr_interview' || app.currentStage === 'department_interview') && app.status !== 'rejected').map((app) => (
                    <MenuItem key={app._id} value={app._id}>
                      {app.candidateId?.firstName} {app.candidateId?.lastName} - {app.requisitionId?.title || app.requisitionId?.templateId?.title || app.jobRequisitionId?.title}
                    </MenuItem>
                  ))}
                  {applications.filter(app => (app.currentStage === 'hr_interview' || app.currentStage === 'department_interview') && app.status !== 'rejected').length === 0 && (
                    <MenuItem disabled>No eligible candidates found</MenuItem>
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Interview Stage</InputLabel>
                <Select
                  value={formData.stage}
                  label="Interview Stage"
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                >
                  <MenuItem value="hr_interview">HR Interview</MenuItem>
                  <MenuItem value="department_interview">Department Interview</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Interview Method</InputLabel>
                <Select
                  value={formData.method}
                  label="Interview Method"
                  onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                >
                  <MenuItem value="video">Video Call</MenuItem>
                  <MenuItem value="onsite">On-site</MenuItem>
                  <MenuItem value="phone">Phone Call</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Interview Date & Time"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              {formData.method === 'video' && (
                <TextField
                  label="Video Link"
                  type="url"
                  value={formData.videoLink}
                  onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  required={formData.method === 'video'}
                  fullWidth
                />
              )}

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">
                    Panel Members *
                  </Typography>
                  {openDepartments.length > 0 && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setShowRecruiters(!showRecruiters)}
                    >
                      {showRecruiters ? 'Hide' : 'Show'} Available Recruiters
                    </Button>
                  )}
                </Stack>

                {/* Available Recruiters Helper */}
                {showRecruiters && openDepartments.length > 0 && (
                  <Card variant="outlined" sx={{ mb: 2, bgcolor: 'success.50', borderColor: 'success.200' }}>
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        💡 Click to add a recruiter to the panel:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 240, overflowY: 'auto' }}>
                        {openDepartments.flatMap((dept) =>
                          dept.recruiters.map((recruiter, idx) => (
                            <Box
                              key={`${dept.departmentName}-${idx}`}
                              onClick={async () => {
                                const trimmed = recruiter.employeeNumber.trim();
                                if (panelMembers.some((m) => m.number === trimmed)) {
                                  toast.warning('This employee is already added');
                                  return;
                                }
                                try {
                                  const employee = await employeeApi.getEmployeeByEmployeeNumber(trimmed) as any;
                                  if (!employee || !employee._id) {
                                    toast.error('Employee not found');
                                    return;
                                  }
                                  const newMember = {
                                    number: employee.employeeNumber,
                                    id: employee._id,
                                    name: recruiter.name,
                                    department: dept.departmentName
                                  };
                                  setPanelMembers([...panelMembers, newMember]);
                                  setFormData({ ...formData, panel: [...formData.panel, employee._id] });
                                  toast.success(`Added ${recruiter.name}`);
                                } catch (error: any) {
                                  toast.error('Failed to add employee');
                                }
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'white',
                                cursor: 'pointer',
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: 'grey.50', borderColor: 'success.main', transform: 'translateX(4px)' }
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  bgcolor: 'success.light',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: 'white'
                                }}
                              >
                                {recruiter.name.charAt(0).toUpperCase()}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight={500}>
                                  {recruiter.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {recruiter.employeeNumber} • {dept.departmentName}
                                </Typography>
                              </Box>
                            </Box>
                          ))
                        )}
                        {openDepartments.every(dept => dept.recruiters.length === 0) && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No recruiters available
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {panelMembers.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {panelMembers.map((member) => (
                      <Card
                        key={member.id}
                        variant="outlined"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          pr: 0.5,
                          bgcolor: 'success.50',
                          borderColor: 'success.200',
                          borderRadius: 2
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'white'
                          }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                            {member.name}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                            <Typography variant="caption" color="text.secondary">
                              {member.number}
                            </Typography>
                            {member.department && (
                              <>
                                <Typography variant="caption" color="text.secondary">•</Typography>
                                <Chip
                                  label={member.department}
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '0.65rem',
                                    bgcolor: 'primary.100',
                                    color: 'primary.dark',
                                    fontWeight: 600,
                                    '& .MuiChip-label': { px: 0.75 }
                                  }}
                                />
                              </>
                            )}
                          </Stack>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemovePanelMember(member.id)}
                          sx={{ ml: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Card>
                    ))}
                  </Box>
                )}

                <Stack direction="row" spacing={1}>
                  <TextField
                    value={panelInput}
                    onChange={(e) => setPanelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPanelMember();
                      }
                    }}
                    placeholder="Enter employee number"
                    size="small"
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddPanelMember}
                    disabled={!panelInput.trim()}
                  >
                    Add
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={16} />}
            >
              {submitting ? 'Creating...' : 'Create Interview'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

