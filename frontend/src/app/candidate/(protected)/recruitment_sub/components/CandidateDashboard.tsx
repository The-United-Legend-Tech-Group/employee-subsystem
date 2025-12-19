'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Button,
  CircularProgress,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Work as WorkIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { recruitmentApi } from '@/lib/api';
import { useMutation } from '@/lib/hooks/useApi';
import { useToast } from '@/lib/hooks/useToast';
import { decryptData } from '@/common/utils/encryption';
import CandidateContracts from './CandidateContracts';
import { CandidateOffers } from './CandidateOffers';

export default function CandidateDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [openJobs, setOpenJobs] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });
  const [detailJob, setDetailJob] = useState<any | null>(null);
  const [candidateId, setCandidateId] = useState<string>('');

  const [consent, setConsent] = useState(false);
  const fetchApplications = async () => {
    try {
      const apps = await recruitmentApi.getMyApplications();
      setMyApplications(apps.data || []);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        const encryptedCandidateId = localStorage.getItem('candidateId');

        if (!token || !encryptedCandidateId) {
          router.push('/candidate/login');
          return;
        }

        const decryptedId = await decryptData(encryptedCandidateId, token);
        setCandidateId(decryptedId);

        const jobs = await recruitmentApi.getAllPublishedRequisitions();
        setOpenJobs(jobs.data || []);

        await fetchApplications();
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to load recruitment data');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const createApplication = useMutation(recruitmentApi.createApplication, {
    onSuccess: () => {
      toast.success('Application submitted');
      setShowApplicationForm(false);
      setFormData({ fullName: '', email: '', phone: '' });
      setCvFile(null);
      setConsent(false);
      fetchApplications();
    },
    onError: (e) => toast.error(e?.message || 'Failed to submit'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 5 * 1024 * 1024) {
      toast.error('File must be <5MB');
      return;
    }
    setCvFile(f);
    if (f) toast.success('CV uploaded');
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    if (!cvFile) {
      toast.error('Please upload CV');
      return;
    }

    try {
      // 1. Upload CV
      await recruitmentApi.uploadCVDocument({
        candidateId: candidateId,
        documentType: 'cv',
        fileUrl: '', // Backend handles path
        fileName: cvFile.name
      }, cvFile);

      // 2. Submit Application
      await createApplication.execute({ requisitionId: selectedJob.requisitionId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to process application');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>Candidate Recruitment</Typography>
            <Typography color="text.secondary">Browse opportunities, track applications, and manage offers</Typography>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ '& > *': { flex: 1 } }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <WorkIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Active Applications</Typography>
                    <Typography variant="h5" fontWeight={700}>{myApplications.length}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <NotificationsIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Open Positions</Typography>
                    <Typography variant="h5" fontWeight={700}>{openJobs.length}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CheckCircleIcon color="success" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Interviews Scheduled</Typography>
                    <Typography variant="h5" fontWeight={700}>{myApplications.filter(a => a.status === 'Interview').length}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Card>
            <CardContent>
              <CandidateOffers />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <CandidateContracts />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>My Applications</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
              ) : myApplications.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 6 }}>No applications yet</Typography>
              ) : (
                <Stack spacing={2}>
                  {myApplications.map(app => (
                    <Card key={app._id} variant="outlined">
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {app.requisitionId?.templateId?.title || app.requisitionId?.requisitionId || 'Position'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Applied on {new Date(app.createdAt).toLocaleDateString()}</Typography>
                          </Box>
                          <Chip label={app.status} color={app.status === 'Interview' ? 'info' : app.status === 'Offer' ? 'success' : app.status === 'Rejected' ? 'error' : 'default'} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Stage: {app.currentStage || 'Under Review'}</Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Open Positions</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
              ) : openJobs.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 6 }}>No open positions</Typography>
              ) : (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
                  {openJobs.map(job => {
                    // Access template data if it exists (when templateId is populated)
                    const template = job.templateId || {};
                    const title = template.title || job.title || 'Position Available';
                    const department = template.department || job.department || 'Not specified';
                    const location = job.location || 'Not specified';

                    const isApplied = myApplications.some(app =>
                      (app.jobRequisitionId?._id === job._id) || (app.jobRequisitionId === job._id) || (app.requisitionId === job._id)
                    );

                    return (
                      <Card key={job._id} variant="outlined" sx={{ minWidth: 260, flex: 1, opacity: isApplied ? 0.7 : 1, bgcolor: isApplied ? 'action.hover' : 'background.paper' }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">Department: {department}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">Location: {location}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">Openings: {job.openings || 1}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <Button variant="outlined" onClick={() => setDetailJob({ ...job, title, department })}>View Details</Button>
                            <Button
                              variant="contained"
                              disabled={isApplied}
                              onClick={() => {
                                setSelectedJob({ ...job, title, department });
                                setShowApplicationForm(true);
                              }}
                            >
                              {isApplied ? 'Applied' : 'Apply Now'}
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>

          {showApplicationForm && selectedJob && (
            <Box sx={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.5)', p: 3, zIndex: 1400 }}>
              <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, width: '100%', maxWidth: 640, p: 3 }}>
                <Typography variant="h6" gutterBottom>Apply for {selectedJob.title}</Typography>
                <form onSubmit={handleSubmitApplication}>
                  <Stack spacing={2}>
                    <Button variant="outlined" component="label">{cvFile ? `CV: ${cvFile.name}` : 'Upload CV *'}<input type="file" hidden accept=".pdf,.doc,.docx" onChange={handleFileChange} /></Button>
                    <FormControlLabel
                      control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
                      label={<Typography variant="body2" color="text.secondary">I agree to the processing of my personal data for recruitment purposes</Typography>}
                    />
                    <Stack direction="row" spacing={2}>
                      <Button variant="outlined" fullWidth onClick={() => { setShowApplicationForm(false); setSelectedJob(null); setCvFile(null); setConsent(false); }}>Cancel</Button>
                      <Button
                        variant="contained"
                        type="submit"
                        fullWidth
                        disabled={createApplication.loading || !consent}
                        sx={{
                          '&.Mui-disabled': {
                            bgcolor: '#e0e0e0',
                            color: '#757575'
                          }
                        }}
                      >
                        {createApplication.loading ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              </Box>
            </Box>
          )}

          {/* Job Details Dialog (styled like Onboarding details modal) */}
          <Dialog open={!!detailJob} onClose={() => setDetailJob(null)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{detailJob?.title || detailJob?.templateId?.title || 'Job Position'}</Typography>
                  <Typography variant="body2" color="text.secondary">{detailJob?.subtitle || ''}</Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  {(detailJob?.department || detailJob?.templateId?.department) && <Chip label={detailJob?.department || detailJob?.templateId?.department} size="small" />}
                  {detailJob?.location && <Chip label={detailJob.location} size="small" />}
                </Stack>
              </Stack>
            </DialogTitle>

            <DialogContent dividers>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Overview</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {detailJob?.summary || detailJob?.description || detailJob?.templateId?.description || 'No description available.'}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 220 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                      <Paper variant="outlined" sx={{ p: 1.25, textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold">{detailJob?.openings || detailJob?.numberOfPositions || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">Openings</Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.25, textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold">{detailJob?.postingDate ? new Date(detailJob.postingDate).toLocaleDateString() : detailJob?.postedAt ? new Date(detailJob.postedAt).toLocaleDateString() : '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">Posted</Typography>
                      </Paper>
                    </Box>

                    {detailJob?.salaryRange && (
                      <Paper variant="outlined" sx={{ p: 1.25, textAlign: 'center', mt: 1 }}>
                        <Typography variant="body2" fontWeight={600}>${detailJob.salaryRange.min?.toLocaleString()} - ${detailJob.salaryRange.max?.toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.secondary">Salary Range</Typography>
                      </Paper>
                    )}
                  </Box>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Required Skills</Typography>
                <Stack spacing={1}>
                  {(detailJob?.templateId?.skills || detailJob?.skills || detailJob?.responsibilities || []).length > 0 ? (
                    (detailJob?.templateId?.skills || detailJob?.skills || detailJob?.responsibilities || []).map((r: any, i: number) => (
                      <Typography key={i} variant="body2">• {r}</Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">Not provided.</Typography>
                  )}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Qualifications</Typography>
                <Stack spacing={1}>
                  {(detailJob?.templateId?.qualifications || detailJob?.qualifications || detailJob?.requirements || []).length > 0 ? (
                    (detailJob?.templateId?.qualifications || detailJob?.qualifications || detailJob?.requirements || []).map((r: any, i: number) => (
                      <Typography key={i} variant="body2">• {r}</Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">Not specified.</Typography>
                  )}
                </Stack>
              </Paper>
            </DialogContent>

            <DialogActions>
              <Button
                variant="outlined"
                onClick={() => setDetailJob(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setSelectedJob(detailJob);
                  setShowApplicationForm(true);
                  setDetailJob(null);
                  setConsent(false);
                }}
                variant="contained"
              >
                Apply
              </Button>
            </DialogActions>
          </Dialog>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Updates</Typography>
              <Stack spacing={2}>
                {[{ title: 'Interview Scheduled', message: 'Interview scheduled for Dec 10, 2025', time: '2 hours ago', type: 'success' }, { title: 'Application Under Review', message: 'Your application is under review', time: '1 day ago', type: 'info' }].map((u, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', mt: 1, bgcolor: u.type === 'success' ? 'success.main' : 'info.main' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{u.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{u.message}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.time}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
