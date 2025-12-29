'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { recruitmentApi, organizationApi, OpenDepartment } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

export function JobTemplates() {
  const toast = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [openDepartments, setOpenDepartments] = useState<OpenDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showOpenPositions, setShowOpenPositions] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    qualifications: '',
    skills: '',
    description: ''
  });

  useEffect(() => {
    fetchTemplates();
    fetchOpenDepartments();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await recruitmentApi.getAllJobTemplates();
      setTemplates(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load job templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenDepartments = async () => {
    try {
      setLoadingDepts(true);
      const data = await organizationApi.getOpenDepartments();
      setOpenDepartments(data || []);
    } catch (error: any) {
      console.error('Failed to load open departments:', error);
      // Don't show error toast - this is optional data
    } finally {
      setLoadingDepts(false);
    }
  };

  const handleUseOpenPosition = (department: string, position: string) => {
    setFormData({
      ...formData,
      title: position,
      department: department
    });
    setShowCreateForm(true);
    toast.success(`Pre-filled: ${position} in ${department}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.department || !formData.qualifications || !formData.skills) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // Parse comma-separated strings into arrays
      const qualificationsArray = formData.qualifications
        .split(',')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      const skillsArray = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const templateData = {
        title: formData.title,
        department: formData.department,
        qualifications: qualificationsArray,
        skills: skillsArray,
        description: formData.description || undefined
      };

      await recruitmentApi.createJobTemplate(templateData);

      toast.success('Job template created successfully');
      setShowCreateForm(false);

      // Reset form
      setFormData({
        title: '',
        department: '',
        qualifications: '',
        skills: '',
        description: ''
      });

      // Refresh templates list
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create job template');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={600}>Job Description Templates</Typography>
          <Typography variant="body2" color="text.secondary">Define standardized templates for consistent job postings</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
        >
          Create Template
        </Button>
      </Stack>

      {/* Open Positions Section */}
      {!loadingDepts && openDepartments.length > 0 && (
        <Card variant="outlined" sx={{ bgcolor: 'primary.50', borderColor: 'primary.200' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} color="primary.main">🎯 Open Positions Needing Job Templates</Typography>
                <Typography variant="body2" color="text.secondary">Click a position to create a template based on actual hiring needs</Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setShowOpenPositions(!showOpenPositions)}
              >
                {showOpenPositions ? 'Hide' : 'Show'}
              </Button>
            </Stack>

            {showOpenPositions && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                {openDepartments.map((dept, deptIndex) => (
                  <Card key={deptIndex} variant="outlined" sx={{ bgcolor: 'white' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600} color="primary.main" sx={{ mb: 1.5 }}>
                        {dept.departmentName}
                      </Typography>

                      {/* Open Positions */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                          Open Positions ({dept.openPositions.length})
                        </Typography>
                        <Stack spacing={0.5}>
                          {dept.openPositions.map((position, idx) => (
                            <Chip
                              key={idx}
                              label={position}
                              size="small"
                              color="primary"
                              variant="outlined"
                              onClick={() => handleUseOpenPosition(dept.departmentName, position)}
                              sx={{
                                justifyContent: 'flex-start',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'primary.50' }
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>

                      {/* Recruiters */}
                      {dept.recruiters.length > 0 && (
                        <Box>
                          <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                            Recruiters ({dept.recruiters.length})
                          </Typography>
                          <Stack spacing={0.5}>
                            {dept.recruiters.map((recruiter, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  p: 0.5,
                                  borderRadius: 1,
                                  bgcolor: 'action.hover'
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor: 'success.light',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'white'
                                  }}
                                >
                                  {recruiter.name.charAt(0)}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" fontWeight={500} noWrap>
                                    {recruiter.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {recruiter.employeeNumber}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 12 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Template List */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {templates.length === 0 ? (
              <Box sx={{ gridColumn: { xs: '1', md: 'span 2' }, textAlign: 'center', py: 12 }}>
                <Typography color="text.secondary">
                  No job templates found. Create your first template to get started.
                </Typography>
              </Box>
            ) : (
              templates.map((template) => (
                <Card key={template._id} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>{template.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{template.department}</Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    {template.description && (
                      <Typography variant="body2" sx={{ mb: 2 }}>{template.description}</Typography>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Qualifications:</Typography>
                      <Stack spacing={0.5} component="ul" sx={{ pl: 2 }}>
                        {template.qualifications?.slice(0, 3).map((qual: string, index: number) => (
                          <Typography key={index} variant="body2" color="text.secondary" component="li">• {qual}</Typography>
                        ))}
                        {template.qualifications?.length > 3 && (
                          <Typography variant="body2" color="text.secondary" component="li">+ {template.qualifications.length - 3} more</Typography>
                        )}
                      </Stack>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Skills:</Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {template.skills?.slice(0, 5).map((skill: string, index: number) => (
                          <Chip key={index} label={skill} size="small" color="primary" variant="outlined" />
                        ))}
                        {template.skills?.length > 5 && (
                          <Chip label={`+${template.skills.length - 5} more`} size="small" variant="outlined" />
                        )}
                      </Stack>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>

          {/* Create Form Modal */}
          <Dialog
            open={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Create Job Template</Typography>
                <IconButton onClick={() => setShowCreateForm(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>Job Title</Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior Developer"
                      required
                      sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>Department</Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Engineering"
                      required
                      sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
                    />
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 1 }}>Job Description</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role and responsibilities..."
                  multiline
                  rows={1}
                  sx={{ '& .MuiInputBase-input': { padding: '10px 12px', whiteSpace: 'pre-wrap' } }}
                />

                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Qualifications</Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    placeholder="Enter qualifications separated by commas (e.g. Bachelor's degree in CS, 3+ years experience, Strong problem-solving)"
                    multiline
                    rows={1}
                    required
                    sx={{ '& .MuiInputBase-input': { padding: '10px 12px', whiteSpace: 'pre-wrap' } }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Separate each qualification with a comma
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Skills</Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="Enter skills separated by commas (e.g. JavaScript, React, Node.js, MongoDB)"
                    multiline
                    rows={1}
                    required
                    sx={{ '& .MuiInputBase-input': { padding: '10px 12px', whiteSpace: 'pre-wrap' } }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Separate each skill with a comma
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    title: '',
                    department: '',
                    qualifications: '',
                    skills: '',
                    description: ''
                  });
                }}
                disabled={submitting}
                color="inherit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                variant="contained"
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {submitting ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Stack>
  );
}

