'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Stack,
  TextField,
  Typography,
  FormControl,
  FormHelperText,
  OutlinedInput,
} from '@mui/material';

import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

interface Assessment {
  _id: string;
  interviewId: string;
  interviewerId: string;
  score: number;
  comments: string;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentFormData {
  score: number;
  comments: string;
}

export function AssessmentForms() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const [formData, setFormData] = useState<AssessmentFormData>({
    score: 5,
    comments: '',
  });

  // Fetch assessments on mount
  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await recruitmentApi.getMyAssessments();
      console.log('Fetched assessments:', response.data);
      setAssessments(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedback = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowFeedbackForm(true);
    setFormData({ score: 5, comments: '' });
  };

  const handleCloseFeedback = () => {
    setShowFeedbackForm(false);
    setSelectedAssessment(null);
    setFormData({ score: 5, comments: '' });
  };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssessment) {
      toast.error('No assessment selected');
      return;
    }

    // Validation
    if (formData.score < 1 || formData.score > 10) {
      toast.error('Score must be between 1 and 10');
      return;
    }

    if (!formData.comments.trim()) {
      toast.error('Comments are required');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        score: formData.score,
        comments: formData.comments.trim(),
      };

      console.log('Submitting assessment:', selectedAssessment._id);
      console.log('Payload:', payload);

      const response = await recruitmentApi.submitAssessment(selectedAssessment._id, payload);

      console.log('Assessment submitted successfully:', response.data);
      toast.success('Assessment submitted successfully!');
      handleCloseFeedback();

      // Refresh assessments list
      await fetchAssessments();
    } catch (error: any) {
      console.error('Failed to submit assessment:', error);

      let errorMsg = 'Failed to submit assessment';

      if (error?.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.message) {
          errorMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        } else if (data.error) {
          errorMsg = data.error;
        }
      } else if (error?.message) {
        errorMsg = error.message;
      }

      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAssessments = useMemo(() =>
    assessments.filter(a => a.score === 0),
    [assessments]
  );
  const completedAssessments = useMemo(() =>
    assessments.filter(a => a.score > 0),
    [assessments]
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Interview Assessments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Submit feedback and scores for interviews where you are a panel member
        </Typography>
      </Box>

      {/* Pending Assessments */}
      <Box>
        <Typography variant="h6" fontWeight={500} gutterBottom>
          Pending Assessments ({pendingAssessments.length})
        </Typography>
        {pendingAssessments.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No pending assessments
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {pendingAssessments.map((assessment) => (
              <Card key={assessment._id} variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip
                        icon={<PendingIcon />}
                        label="Pending"
                        color="warning"
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Created {new Date(assessment.createdAt).toLocaleDateString()}
                      </Typography>
                    </Stack>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Interview ID
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                        {assessment.interviewId}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<AssignmentIcon />}
                      onClick={() => handleOpenFeedback(assessment)}
                      fullWidth
                    >
                      Submit Assessment
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Completed Assessments */}
      <Box>
        <Typography variant="h6" fontWeight={500} gutterBottom>
          Completed Assessments ({completedAssessments.length})
        </Typography>
        {completedAssessments.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No completed assessments
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {completedAssessments.map((assessment) => (
              <Card key={assessment._id} variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Completed"
                        color="success"
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Submitted {new Date(assessment.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Stack>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Interview ID
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                        {assessment.interviewId}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Score
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {assessment.score}/10
                      </Typography>
                    </Box>

                    {assessment.comments && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Comments
                        </Typography>
                        <Typography variant="body2">
                          {assessment.comments}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Assessment Form Dialog */}
      <Dialog open={showFeedbackForm} onClose={handleCloseFeedback} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmitAssessment}>
          <DialogTitle>Submit Interview Assessment</DialogTitle>

          <DialogContent dividers>
            <Stack spacing={3}>
              {selectedAssessment && (
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Assessment ID
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {selectedAssessment._id}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Interview ID
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {selectedAssessment.interviewId}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Score */}
              <Typography variant="body2" sx={{ mb: 1 }}>Score (1-10)</Typography>
              <TextField
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                inputProps={{ min: 1, max: 10, step: 0.5 }}
                required
                fullWidth
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Rate the candidate from 1 (poor) to 10 (excellent)
              </Typography>

              {/* Comments */}
              <Typography variant="body2" sx={{ mb: 1 }}>Assessment Comments</Typography>
              <TextField
                multiline
                minRows={6}
                maxRows={12}
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                inputProps={{ maxLength: 4000, 'aria-label': 'assessment-comments' }}
                required
                fullWidth
                variant="outlined"
                sx={{ bgcolor: 'background.paper', mt: 0.5 }}
                helperText={(
                  <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>Include comprehensive feedback to help make hiring decisions</span>
                    <span>{formData.comments.length}/4000</span>
                  </span>
                )}
              />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseFeedback} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={16} />}
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}

