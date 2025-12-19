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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

export function HiringProcessTemplates() {
  const toast = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processTemplates, setProcessTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProcessTemplates();
  }, []);

  const fetchProcessTemplates = async () => {
    try {
      setLoading(true);
      // Mock data - API endpoint not yet available
      setProcessTemplates([
        {
          id: 1,
          name: 'Standard Engineering Hiring',
          stages: ['Screening', 'Technical Test', 'Technical Interview', 'Manager Interview', 'Offer', 'Hired'],
          defaultDuration: '4-6 weeks',
        },
        {
          id: 2,
          name: 'Executive Hiring',
          stages: ['Screening', 'First Interview', 'Panel Interview', 'Background Check', 'Offer', 'Hired'],
          defaultDuration: '6-8 weeks',
        },
      ]);
    } catch (error: any) {
      toast.error('Failed to load hiring process templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={600}>Hiring Process Templates</Typography>
          <Typography variant="body2" color="text.secondary">Establish standardized hiring stages with automatic progress tracking</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
        >
          Create Process
        </Button>
      </Stack>

      {/* Process Templates */}
      <Stack spacing={2}>
        {processTemplates.map((process) => (
          <Card key={process.id} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>{process.name}</Typography>
                  <Typography variant="body2" color="text.secondary">Duration: {process.defaultDuration}</Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" color="success">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>

              <Box>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1.5 }}>Hiring Stages:</Typography>
                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                  {process.stages.map((stage: string, index: number) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={`${index + 1}. ${stage}`}
                        color="primary"
                        variant="outlined"
                        sx={{ whiteSpace: 'nowrap' }}
                      />
                      {index < process.stages.length - 1 && (
                        <ArrowForwardIcon fontSize="small" color="action" />
                      )}
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Progress is automatically calculated: {(100 / process.stages.length).toFixed(0)}% per stage
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Create Form Modal */}
      <Dialog
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Create Hiring Process Template</Typography>
            <IconButton onClick={() => setShowCreateForm(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label="Process Name"
              placeholder="e.g. Standard Engineering Hiring"
              fullWidth
            />

            <TextField
              label="Expected Duration"
              placeholder="e.g. 4-6 weeks"
              fullWidth
            />

            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 2 }}>Hiring Stages</Typography>
              <Stack spacing={2}>
                {['Screening', 'Interview', 'Offer', 'Hired'].map((stage, index) => (
                  <Stack key={index} direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ minWidth: 32 }}>{index + 1}.</Typography>
                    <TextField
                      defaultValue={stage}
                      size="small"
                      fullWidth
                    />
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}\n              </Stack>
              <Button
                startIcon={<AddIcon />}
                sx={{ mt: 1 }}
                size="small"
              >
                Add Stage
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCreateForm(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
          >
            Create Process
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

