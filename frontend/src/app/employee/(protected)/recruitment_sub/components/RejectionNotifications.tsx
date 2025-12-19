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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import EmailIcon from '@mui/icons-material/Email';
import DescriptionIcon from '@mui/icons-material/Description';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

export function RejectionNotifications() {
  const toast = useToast();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [pendingRejections, setPendingRejections] = useState<any[]>([]);
  const [rejectionTemplates, setRejectionTemplates] = useState<any[]>([]);
  const [sentRejections, setSentRejections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRejections();
  }, []);

  useEffect(() => {
    const templates = [
      {
        id: 1,
        name: 'Post-Screening Rejection',
        subject: 'Update on Your Application',
        content: 'Thank you for your interest in the [Position] role. After careful review of your application, we have decided to move forward with other candidates whose experience more closely aligns with our current needs...',
      },
      {
        id: 2,
        name: 'Post-Interview Rejection',
        subject: 'Update Regarding Your Interview',
        content: 'Thank you for taking the time to interview for the [Position] role. We enjoyed learning more about your background and experience. After careful consideration, we have decided to move forward with another candidate...',
      },
      {
        id: 3,
        name: 'General Rejection',
        subject: 'Application Status Update',
        content: 'Thank you for your application for the [Position] role at our company. While we were impressed with your qualifications, we have decided to pursue other candidates at this time...',
      },
    ];
    setRejectionTemplates(templates);
  }, []);

  const fetchRejections = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API when available
      setPendingRejections([
        {
          id: 1,
          candidate: 'Bob Wilson',
          position: 'Senior Developer',
          stage: 'Technical Interview',
          reason: 'Skills not aligned',
        },
        {
          id: 2,
          candidate: 'Carol Davis',
          position: 'Product Manager',
          stage: 'Screening',
          reason: 'Insufficient experience',
        },
      ]);
      setSentRejections([
        {
          id: 3,
          candidate: 'David Lee',
          position: 'UX Designer',
          sentDate: '2025-12-01',
          template: 'Post-Interview Rejection',
        },
      ]);
    } catch (error: any) {
      toast.error('Failed to load rejection data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Rejection Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Send automated, respectful rejection notifications using templates
        </Typography>
      </Box>

      {/* Pending Rejections */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 3 }}>
            Pending Rejections
          </Typography>
          <Stack spacing={2}>
            {pendingRejections.map((item) => (
              <Card key={item.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {item.candidate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.position} · {item.stage}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reason: {item.reason}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<EmailIcon />}
                      onClick={() => setShowTemplateModal(true)}
                    >
                      Send Rejection
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Rejection Templates */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={500}>
              Rejection Email Templates
            </Typography>
            <Button color="primary" size="small">
              + Create Template
            </Button>
          </Stack>
          <Stack spacing={2}>
            {rejectionTemplates.map((template) => (
              <Card key={template.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Subject: {template.subject}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowTemplateModal(true);
                      }}
                    >
                      Preview
                    </Button>
                  </Stack>
                  <Typography variant="body2" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {template.content}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Sent Rejections History */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 3 }}>
            Recently Sent Rejections
          </Typography>
          <Stack spacing={2}>
            {sentRejections.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'action.hover', borderRadius: 1, color: 'text.primary' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <EmailIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2">
                      {item.candidate} - {item.position}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Template: {item.template} · Sent: {item.sentDate}
                    </Typography>
                  </Box>
                </Stack>
                <Chip label="Sent" color="success" size="small" />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Template/Send Modal */}
      <Dialog
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={500}>
            Send Rejection Email
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Template</InputLabel>
              <Select label="Select Template">
                <MenuItem value="">Select a template...</MenuItem>
                {rejectionTemplates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Subject"
              fullWidth
              defaultValue={selectedTemplate?.subject || 'Update on Your Application'}
            />

            <Box>
              <TextField
                label="Email Body"
                multiline
                rows={8}
                fullWidth
                defaultValue={selectedTemplate?.content || 'Thank you for your interest...'}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Use [Position] and [Candidate] placeholders which will be automatically replaced
              </Typography>
            </Box>

            <Alert icon={<DescriptionIcon />} severity="info">
              This email will be sent from the HR department with a professional, respectful tone
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setShowTemplateModal(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

