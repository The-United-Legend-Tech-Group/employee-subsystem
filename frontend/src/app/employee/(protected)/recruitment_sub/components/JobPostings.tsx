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

export function JobPostings() {
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
            Job Posting
          </Typography>
          <Typography variant="body2" color="text.secondary">
            manage job openings
          </Typography>
        </Box>
      </Stack>

      {/* Job Requisitions List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress size={48} />
        </Box>
      ) : requisitions.length > 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {requisitions.map((req) => (
            <Card
              key={req._id}
              sx={{
                position: 'relative',
                border: '2px solid',
                borderColor: req.publishStatus === 'published' ? 'success.main' :
                  req.publishStatus === 'closed' ? 'error.main' : 'warning.main',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)'
                }
              }}
            >
              {/* Status Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 1
                }}
              >
                <Chip
                  label={req.publishStatus?.toUpperCase() || 'DRAFT'}
                  color={
                    req.publishStatus === 'published' ? 'success' :
                      req.publishStatus === 'closed' ? 'error' : 'warning'
                  }
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  {/* Header */}
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          bgcolor: 'primary.main',
                          borderRadius: 2,
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <WorkIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      <Box sx={{ flex: 1, pr: 6 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.3 }}>
                          {req.title || req.templateId?.title || 'Untitled Position'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {req.requisitionId}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Info Grid */}
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          bgcolor: 'action.hover',
                          borderRadius: 1.5,
                          p: 1,
                          display: 'flex'
                        }}
                      >
                        <LocationOnIcon fontSize="small" color="action" />
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        {req.location || 'Location not specified'}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          bgcolor: 'action.hover',
                          borderRadius: 1.5,
                          p: 1,
                          display: 'flex'
                        }}
                      >
                        <PeopleIcon fontSize="small" color="action" />
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        {req.openings || req.numberOfPositions || 1} Opening{(req.openings || req.numberOfPositions || 1) !== 1 ? 's' : ''}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          bgcolor: 'action.hover',
                          borderRadius: 1.5,
                          p: 1,
                          display: 'flex'
                        }}
                      >
                        <CalendarTodayIcon fontSize="small" color="action" />
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        {req.postingDate
                          ? new Date(req.postingDate).toLocaleDateString()
                          : 'No posting date'}
                      </Typography>
                    </Stack>

                    {req.expiryDate && (
                      <Alert
                        severity="warning"
                        variant="outlined"
                        sx={{
                          py: 0.5,
                          borderRadius: 2,
                          '& .MuiAlert-message': { py: 0 }
                        }}
                      >
                        <Typography variant="caption" fontWeight={600}>
                          Expires: {new Date(req.expiryDate).toLocaleDateString()}
                        </Typography>
                      </Alert>
                    )}
                  </Stack>

                  {/* Action Button */}
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(req)}
                    fullWidth
                    sx={{
                      mt: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.25,
                      borderRadius: 2,
                      boxShadow: 2
                    }}
                  >
                    Edit Requisition
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <Box sx={{ p: 12, textAlign: 'center' }}>
            <Box
              sx={{
                display: 'inline-flex',
                p: 3,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                mb: 2
              }}
            >
              <WorkIcon sx={{ fontSize: 48, color: 'action.disabled' }} />
            </Box>
            <Typography variant="h6" fontWeight={600} color="text.secondary" gutterBottom>
              No job requisitions yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Job requisitions will appear here once created.
            </Typography>
          </Box>
        </Card>
      )}

      {/* Create Requisition Form Modal */}
      <Dialog
        open={showForm}
        onClose={handleCloseForm}
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 3
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <WorkIcon sx={{ fontSize: 28 }} />
              <Typography variant="h5" fontWeight={600}>
                {editingRequisition ? 'Edit Job Requisition' : 'Create Job Requisition'}
              </Typography>
            </Stack>
            <IconButton onClick={handleCloseForm} size="small" sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 4, px: 3 }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            {!editingRequisition && (
              <>
                <TextField
                  label="Requisition ID"
                  value={formData.requisitionId}
                  onChange={(e) =>
                    setFormData({ ...formData, requisitionId: e.target.value })
                  }
                  placeholder="e.g., REQ-2024-001"
                  required
                  fullWidth
                />

                <FormControl fullWidth required>
                  <InputLabel>Job Template</InputLabel>
                  <Select
                    value={formData.templateId}
                    onChange={(e) =>
                      setFormData({ ...formData, templateId: e.target.value })
                    }
                    label="Job Template"
                  >
                    <MenuItem value="">Select a template</MenuItem>
                    {templates.map((template) => (
                      <MenuItem key={template._id} value={template._id}>
                        {template.title} - {template.department}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              <TextField
                label="Number of Openings"
                type="number"
                inputProps={{ min: 1 }}
                value={formData.openings}
                onChange={(e) =>
                  setFormData({ ...formData, openings: parseInt(e.target.value) })
                }
                required
                fullWidth
              />

              <TextField
                label="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., New York, NY"
                required
                fullWidth
              />
            </Box>

            <FormControl fullWidth required>
              <InputLabel>Publish Status</InputLabel>
              <Select
                value={formData.publishStatus}
                onChange={(e) =>
                  setFormData({ ...formData, publishStatus: e.target.value })
                }
                label="Publish Status"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <TextField
                label="Posting Date"
                type="datetime-local"
                value={formData.postingDate}
                onChange={(e) =>
                  setFormData({ ...formData, postingDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Expiry Date"
                type="datetime-local"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'action.hover' }}>
          <Button
            onClick={handleCloseForm}
            disabled={submitting}
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
            onClick={handleSubmit}
            disabled={submitting}
            variant="contained"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <WorkIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
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

