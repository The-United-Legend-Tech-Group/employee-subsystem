'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
// Removed unused import

export function JobRequisitions() {
  const toast = useToast();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState<any | null>(null);
  // employeeId no longer needed manually
  const [formData, setFormData] = useState({
    requisitionId: '',
    templateId: '',
    openings: 1,
    location: '',
    hiringManagerId: '', // Optional now, backend sets it from token
    publishStatus: 'draft',
    postingDate: '',
    expiryDate: '',
  });

  // Removed decryption logic as backend handles user ID from token

  useEffect(() => {
    fetchTemplates();
    fetchRequisitions();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await recruitmentApi.getAllJobTemplates();
      setTemplates(response.data || []);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load job templates');
    }
  };

  const fetchRequisitions = async () => {
    try {
      const response = await recruitmentApi.getAllRequisitions();
      setRequisitions(response.data || []);
    } catch (error: any) {
      console.error('Failed to load requisitions:', error);
      toast.error('Failed to load job requisitions');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (requisition: any) => {
    setEditingRequisition(requisition);
    setFormData({
      requisitionId: requisition.requisitionId || '',
      templateId: requisition.templateId?._id || requisition.templateId || '',
      openings: requisition.openings || requisition.numberOfPositions || 1,
      location: requisition.location || '',
      hiringManagerId: requisition.hiringManagerId?._id || requisition.hiringManagerId || '',
      publishStatus: requisition.publishStatus || 'draft',
      postingDate: requisition.postingDate ? new Date(requisition.postingDate).toISOString().slice(0, 16) : '',
      expiryDate: requisition.expiryDate ? new Date(requisition.expiryDate).toISOString().slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // hiringManagerId derived from token on backend

      if (editingRequisition) {
        // Update existing requisition
        await recruitmentApi.updateJobRequisition(editingRequisition.requisitionId, {
          openings: formData.openings,
          location: formData.location,
          publishStatus: formData.publishStatus,
          postingDate: formData.postingDate || undefined,
          expiryDate: formData.expiryDate || undefined,
        });
        toast.success('Job requisition updated successfully!');
      } else {
        // Create new requisition
        await recruitmentApi.createJobRequisition({
          requisitionId: formData.requisitionId,
          templateId: formData.templateId,
          openings: formData.openings,
          location: formData.location,
          publishStatus: formData.publishStatus,
          postingDate: formData.postingDate || undefined,
          expiryDate: formData.expiryDate || undefined,
        });
        toast.success('Job requisition created successfully!');
      }

      setShowForm(false);
      setEditingRequisition(null);
      setFormData({
        requisitionId: '',
        templateId: '',
        openings: 1,
        location: '',
        hiringManagerId: '',
        publishStatus: 'draft',
        postingDate: '',
        expiryDate: '',
      });
      fetchRequisitions();
    } catch (error: any) {
      console.error('Failed to save requisition:', error);
      toast.error(error.response?.data?.message || 'Failed to save job requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRequisition(null);
    setFormData({
      requisitionId: '',
      templateId: '',
      openings: 1,
      location: '',
      hiringManagerId: '',
      publishStatus: 'draft',
      postingDate: '',
      expiryDate: '',
    });
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Job Requisitions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage job openings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
        >
          Create Requisition
        </Button>
      </Stack>

      {/* Job Requisitions List */}
      <Card variant="outlined">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress />
          </Box>
        ) : requisitions.length > 0 ? (
          <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
            {requisitions.map((req) => (
              <Box key={req._id} sx={{ p: 3, '&:hover': { bgcolor: 'action.hover' } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <WorkIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body1" fontWeight={600}>
                        {req.title || req.templateId?.title || 'Untitled Position'}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Requisition ID: {req.requisitionId}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={req.publishStatus || 'draft'}
                      color={
                        req.publishStatus === 'published' ? 'success' :
                          req.publishStatus === 'closed' ? 'error' : 'warning'
                      }
                      size="small"
                    />
                    <IconButton
                      onClick={() => handleEdit(req)}
                      size="small"
                      color="primary"
                      title="Edit requisition"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {req.location || 'Not specified'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {req.openings || req.numberOfPositions || 1} Opening(s)
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {req.postingDate
                        ? new Date(req.postingDate).toLocaleDateString()
                        : 'No posting date'}
                    </Typography>
                  </Stack>
                </Box>

                {req.expiryDate && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Expires: {new Date(req.expiryDate).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ p: 12, textAlign: 'center' }}>
            <WorkIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1.5 }} />
            <Typography color="text.secondary">No job requisitions yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Create your first requisition to get started
            </Typography>
          </Box>
        )}
      </Card>

      {/* Create Requisition Form Modal */}
      <Dialog
        open={showForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingRequisition ? 'Edit Job Requisition' : 'Create Job Requisition'}
            </Typography>
            <IconButton onClick={handleCloseForm} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            {!editingRequisition && (
              <>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Requisition ID</Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={formData.requisitionId}
                    onChange={(e) =>
                      setFormData({ ...formData, requisitionId: e.target.value })
                    }
                    placeholder="e.g., REQ-2024-001"
                    required
                    sx={{ '& .MuiInputBase-input': { padding: '10px 12px' } }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Job Template</Typography>
                  <Select
                    fullWidth
                    value={formData.templateId}
                    onChange={(e) =>
                      setFormData({ ...formData, templateId: e.target.value })
                    }
                    displayEmpty
                    variant="outlined"
                    sx={{ '& .MuiSelect-select': { padding: '10px 12px' } }}
                  >
                    <MenuItem value="">Select a template</MenuItem>
                    {templates.map((template) => (
                      <MenuItem key={template._id} value={template._id}>
                        {template.title} - {template.department}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </>
            )}

            {editingRequisition && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Requisition ID:</strong> {editingRequisition.requisitionId}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>Template:</strong> {editingRequisition.templateId?.title || 'N/A'}
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Number of Openings</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={formData.openings}
                  onChange={(e) =>
                    setFormData({ ...formData, openings: parseInt(e.target.value) })
                  }
                  required
                  sx={{ '& .MuiInputBase-input': { padding: '8px 10px' } }}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Location</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., New York, NY"
                  required
                  sx={{ '& .MuiInputBase-input': { padding: '8px 10px' } }}
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Publish Status</Typography>
              <Select
                fullWidth
                value={formData.publishStatus}
                onChange={(e) =>
                  setFormData({ ...formData, publishStatus: e.target.value })
                }
                displayEmpty
                variant="outlined"
                sx={{ '& .MuiSelect-select': { padding: '10px 12px' } }}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Posting Date</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  type="datetime-local"
                  value={formData.postingDate}
                  onChange={(e) =>
                    setFormData({ ...formData, postingDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiInputBase-input': { padding: '8px 10px' } }}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Expiry Date</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  type="datetime-local"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiInputBase-input': { padding: '8px 10px' } }}
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseForm}
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
            {submitting
              ? (editingRequisition ? 'Updating...' : 'Creating...')
              : (editingRequisition ? 'Update Requisition' : 'Create Requisition')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
