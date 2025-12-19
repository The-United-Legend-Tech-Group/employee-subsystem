'use client';

import { useState, useEffect } from 'react';
import { recruitmentApi, OnboardingTaskDto } from '@/lib/api';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as PlusIcon,
  Delete as Trash2Icon,
  Visibility as EyeIcon,
  Close as XIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  Info as AlertCircleIcon
} from '@mui/icons-material';

interface TaskInput extends OnboardingTaskDto {
  id: string;
}

const SYSTEM_ROLES = [
  'department employee',
  'department head',
  'HR Manager',
  'HR Employee',
  'Payroll Specialist',
  'System Admin',
  'Legal & Policy Admin',
  'Recruiter',
  'Finance Staff',
  'HR Admin',
  'Payroll Manager',
];

export function OnboardingChecklists() {
  const toast = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [contractId, setContractId] = useState('');
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<TaskInput[]>([
    { id: '1', name: '', department: '', deadline: '', notes: '' }
  ]);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const response = await recruitmentApi.getAllOnboardingChecklists();
      setChecklists(response.data.checklists || []);
    } catch (error: any) {
      toast.error('Failed to load checklists');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = () => {
    setTasks([...tasks, {
      id: Date.now().toString(),
      name: '',
      department: '',
      deadline: '',
      notes: ''
    }]);
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const updateTask = (id: string, field: keyof OnboardingTaskDto, value: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      toast.error('Employee ID is required');
      return;
    }

    const validTasks = tasks.filter(task => task.name.trim() !== '');
    if (validTasks.length === 0) {
      toast.error('At least one task is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const checklistData = {
        employeeId,
        contractId: contractId || undefined,
        tasks: validTasks.map(({ id, ...task }) => task),
        notes: notes || undefined,
      };

      await recruitmentApi.createOnboardingChecklist(checklistData);
      toast.success('Onboarding checklist created successfully!');
      setShowCreateForm(false);

      // Reset form
      setEmployeeId('');
      setContractId('');
      setNotes('');
      setTasks([{ id: '1', name: '', department: '', deadline: '', notes: '' }]);

      fetchChecklists();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create checklist';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (employeeId: string | any, taskName: string, status: string) => {
    try {
      // Ensure we extract the MongoDB ID if employeeId is an object
      let empId = String(employeeId);

      if (typeof employeeId === 'object' && employeeId !== null) {
        // Prioritize MongoID (_id) for updates as requested
        if (employeeId._id) {
          empId = employeeId._id;
        } else if (employeeId.employeeNumber) {
          // Fallback to employeeNumber if _id is missing (though backend prefers ID)
          empId = employeeId.employeeNumber;
        }
      }

      await recruitmentApi.updateTaskStatus({
        employeeId: empId,
        taskName: taskName,
        status: status,
      });
      toast.success(`Task "${taskName}" updated to ${status.replace('_', ' ')}!`);

      // Refresh checklists and update selected checklist if modal is open
      const response = await recruitmentApi.getAllOnboardingChecklists();
      const newChecklists = response.data.checklists || [];
      setChecklists(newChecklists);

      // Update selected checklist if modal is open
      if (selectedChecklist) {
        const updatedChecklist = newChecklists.find(
          (item: any) => item.onboarding._id === selectedChecklist.onboarding._id
        );
        if (updatedChecklist) {
          setSelectedChecklist(updatedChecklist);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update task');
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6">Onboarding Checklists</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage onboarding task checklists for new hires
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusIcon />}
          onClick={() => setShowCreateForm(true)}
        >
          Create Checklist
        </Button>
      </Stack>

      {/* Checklist Templates */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Active Onboarding Checklists
          </Typography>

          {/* Required Documents Information */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                📄 Required Documents from Candidates
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                New hires must upload the following documents during onboarding:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Chip label="ID Document" size="small" color="primary" variant="outlined" />
                <Chip label="Certificates" size="small" color="primary" variant="outlined" />
                <Chip label="Signed Contract" size="small" color="success" variant="outlined" />
                <Chip label="Additional Documents" size="small" color="default" variant="outlined" />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Documents are automatically linked to tasks when uploaded through the compliance documents endpoint.
              </Typography>
            </CardContent>
          </Card>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {checklists.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No onboarding checklists yet. Create one to get started!
                </Typography>
              ) : (
                checklists.map((item: any) => {
                  const onboarding = item.onboarding;
                  const progress = item.progress;

                  return (
                    <Paper
                      key={onboarding._id}
                      variant="outlined"
                      sx={{ p: 2, '&:hover': { borderColor: 'primary.main' } }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Employee: {(onboarding.employeeId as any)?.employeeNumber || onboarding.employeeId}
                            </Typography>
                            <Chip
                              label={onboarding.completed ? 'Completed' : 'In Progress'}
                              color={onboarding.completed ? 'success' : 'primary'}
                              size="small"
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {progress.totalTasks} tasks • {progress.completedTasks} completed • {progress.pendingTasks} pending
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h5" color="primary" fontWeight="bold">
                            {progress.progressPercentage}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Complete
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress.progressPercentage}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Box>

                      {/* Task Breakdown */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                        <Box>
                          <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'success.50', color: 'success.main', border: 1, borderColor: 'success.main' }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {progress.completedTasks}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'success.dark' }}>
                              Completed
                            </Typography>
                          </Paper>
                        </Box>
                        <Box>
                          <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.50', color: 'warning.main', border: 1, borderColor: 'warning.main' }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {progress.inProgressTasks}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'warning.dark' }}>
                              In Progress
                            </Typography>
                          </Paper>
                        </Box>
                        <Box>
                          <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'background.paper', color: 'text.primary', border: 1, borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                              {progress.pendingTasks}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Pending
                            </Typography>
                          </Paper>
                        </Box>
                      </Box>

                      {/* Task List Preview */}
                      {onboarding.tasks && onboarding.tasks.length > 0 && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="caption" fontWeight="medium" color="text.secondary" gutterBottom>
                            Recent Tasks:
                          </Typography>
                          <Stack spacing={0.5} sx={{ mt: 1 }}>
                            {onboarding.tasks.slice(0, 3).map((task: any, idx: number) => (
                              <Stack key={idx} direction="row" spacing={1} alignItems="center">
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor:
                                      task.status === 'completed'
                                        ? 'success.main'
                                        : task.status === 'in_progress'
                                          ? 'warning.main'
                                          : 'grey.300',
                                  }}
                                />
                                <Typography variant="caption" color="text.primary">
                                  {task.name}
                                </Typography>
                                {task.department && (
                                  <Typography variant="caption" color="text.secondary">
                                    ({task.department})
                                  </Typography>
                                )}
                              </Stack>
                            ))}
                            {onboarding.tasks.length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                ... and {onboarding.tasks.length - 3} more
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      )}

                      {/* View Details Button */}
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Button
                          size="small"
                          startIcon={<EyeIcon />}
                          onClick={() => {
                            setSelectedChecklist(item);
                            setShowDetailsModal(true);
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Paper>
                  );
                })
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog
        open={showDetailsModal && selectedChecklist !== null}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedChecklist(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        {selectedChecklist && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">Onboarding Details</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Employee: {(selectedChecklist.onboarding.employeeId as any)?.employeeNumber || selectedChecklist.onboarding.employeeId}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedChecklist(null);
                  }}
                  size="small"
                >
                  <XIcon />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent>
              {/* Progress Overview */}
              <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', mb: 3, color: 'text.primary' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Progress Overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedChecklist.onboarding.completed ? 'All tasks completed' : 'Onboarding in progress'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {selectedChecklist.progress.progressPercentage}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Complete
                    </Typography>
                  </Box>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={selectedChecklist.progress.progressPercentage}
                  sx={{ height: 8, borderRadius: 1, mb: 2 }}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
                  <Box>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight="bold">{selectedChecklist.progress.totalTasks}</Typography>
                      <Typography variant="caption" color="text.secondary">Total Tasks</Typography>
                    </Paper>
                  </Box>
                  <Box>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'success.50', border: 1, borderColor: 'success.main', color: 'success.main' }}>
                      <Typography variant="h6" fontWeight="bold">{selectedChecklist.progress.completedTasks}</Typography>
                      <Typography variant="caption" sx={{ color: 'success.dark' }}>Completed</Typography>
                    </Paper>
                  </Box>
                  <Box>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'warning.50', border: 1, borderColor: 'warning.main', color: 'warning.main' }}>
                      <Typography variant="h6" fontWeight="bold">{selectedChecklist.progress.inProgressTasks}</Typography>
                      <Typography variant="caption" sx={{ color: 'warning.dark' }}>In Progress</Typography>
                    </Paper>
                  </Box>
                  <Box>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: 'background.paper', color: 'text.primary' }}>
                      <Typography variant="h6" fontWeight="bold">{selectedChecklist.progress.pendingTasks}</Typography>
                      <Typography variant="caption" color="text.secondary">Pending</Typography>
                    </Paper>
                  </Box>
                </Box>
              </Paper>

              {/* All Tasks */}
              <Box>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  All Tasks ({selectedChecklist.onboarding.tasks?.length || 0})
                </Typography>
                <Stack spacing={1.5}>
                  {selectedChecklist.onboarding.tasks?.map((task: any, idx: number) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor:
                          task.status === 'completed'
                            ? 'success.50'
                            : task.status === 'in_progress'
                              ? 'warning.50'
                              : 'background.paper',
                        color: 'text.primary',
                        borderColor:
                          task.status === 'completed'
                            ? 'success.main'
                            : task.status === 'in_progress'
                              ? 'warning.main'
                              : 'divider',
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack direction="row" spacing={1.5} sx={{ flex: 1 }}>
                          <Box sx={{ mt: 0.25 }}>
                            {task.status === 'completed' ? (
                              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                            ) : task.status === 'in_progress' ? (
                              <ClockIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                            ) : (
                              <AlertCircleIcon sx={{ color: 'grey.400', fontSize: 20 }} />
                            )}
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="subtitle2" fontWeight="medium">
                                {task.name}
                              </Typography>
                              <Chip
                                label={task.status?.replace('_', ' ') || 'pending'}
                                size="small"
                                color={
                                  task.status === 'completed'
                                    ? 'success'
                                    : task.status === 'in_progress'
                                      ? 'warning'
                                      : 'default'
                                }
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </Stack>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
                              {task.department && (
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Department:</strong> {task.department}
                                  </Typography>
                                </Box>
                              )}
                              {task.deadline && (
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              )}
                              {task.completedAt && (
                                <Box>
                                  <Typography variant="body2" color="success.dark">
                                    <strong>Completed:</strong> {new Date(task.completedAt).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {task.notes && (
                              <Paper variant="outlined" sx={{ mt: 1, p: 1, bgcolor: 'background.default' }}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Notes:</strong> {task.notes}
                                </Typography>
                              </Paper>
                            )}
                          </Box>
                        </Stack>

                        {task.status !== 'completed' && (
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={task.status || 'pending'}
                              onChange={(e) => {
                                handleUpdateTaskStatus(
                                  selectedChecklist.onboarding.employeeId,
                                  task.name,
                                  e.target.value
                                );
                              }}
                            >
                              <MenuItem value="pending">Pending</MenuItem>
                              <MenuItem value="in_progress">In Progress</MenuItem>
                              <MenuItem value="completed">Completed</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>

              {/* Timestamps */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                {selectedChecklist.onboarding.createdAt && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Created:</strong> {new Date(selectedChecklist.onboarding.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                {selectedChecklist.onboarding.completedAt && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Completed:</strong> {new Date(selectedChecklist.onboarding.completedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
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

      {/* Create Form Modal */}
      <Dialog
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Onboarding Checklist</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateChecklist} id="create-checklist-form">
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Employee Number</Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter employee number (e.g. EMP-1001)"
                    required
                    helperText="Required"
                    sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
                  />
                </Box>
              </Box>

              <Typography variant="body2" sx={{ mb: 1 }}>General Notes</Typography>
              <TextField
                fullWidth
                variant="outlined"
                multiline
                rows={1}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any general notes for the onboarding checklist"
                sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
              />

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Tasks <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>
                  <Button size="small" onClick={addTask}>
                    + Add Task
                  </Button>
                </Stack>

                <Stack spacing={2} sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                  {tasks.map((task, index) => (
                    <Paper key={task.id} variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Task {index + 1}
                        </Typography>
                        {tasks.length > 1 && (
                          <IconButton size="small" color="error" onClick={() => removeTask(task.id)}>
                            <Trash2Icon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>Task Name</Typography>
                          <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={task.name}
                            onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                            placeholder="e.g. Complete IT setup"
                            required
                            helperText="Required"
                            sx={{ '& .MuiInputBase-input': { padding: '8px 10px' } }}
                          />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>Department</Typography>
                            <FormControl fullWidth size="small">
                              <Select
                                value={task.department || ''}
                                onChange={(e) => updateTask(task.id, 'department', e.target.value)}
                                displayEmpty
                                variant="outlined"
                                size="small"
                                sx={{ '& .MuiSelect-select': { padding: '8px 10px' } }}
                              >
                                <MenuItem value="">Select department...</MenuItem>
                                {SYSTEM_ROLES.map((role) => (
                                  <MenuItem key={role} value={role}>
                                    {role}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>

                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>Deadline</Typography>
                            <TextField
                              fullWidth
                              variant="outlined"
                              type="date"
                              value={task.deadline || ''}
                              onChange={(e) => updateTask(task.id, 'deadline', e.target.value)}
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              sx={{ '& .MuiInputBase-input': { padding: '8px 10px' } }}
                            />
                          </Box>
                        </Box>

                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>Notes</Typography>
                          <TextField
                            fullWidth
                            variant="outlined"
                            multiline
                            rows={1}
                            value={task.notes || ''}
                            onChange={(e) => updateTask(task.id, 'notes', e.target.value)}
                            placeholder="Add any notes for this task"
                            size="small"
                            sx={{ '& .MuiInputBase-input': { padding: '8px 10px' } }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              setShowCreateForm(false);
              setEmployeeId('');
              setContractId('');
              setNotes('');
              setTasks([{ id: '1', name: '', department: '', deadline: '', notes: '' }]);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-checklist-form"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {isSubmitting ? 'Creating...' : 'Create Checklist'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

