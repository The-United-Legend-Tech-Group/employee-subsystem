'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import RefreshIcon from '@mui/icons-material/Refresh';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

interface Application {
  _id: string;
  candidateId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  currentStage: 'screening' | 'department_interview' | 'hr_interview' | 'offer';
  status: string;
  createdAt: string;
  updatedAt: string;
  timeToHire?: number | null; // Days from application to hire
}

interface JobRequisition {
  _id: string;
  requisitionId: string;
  openings: number;
  location?: string;
  publishStatus: string;
  postingDate?: string;
  expiryDate?: string;
  templateId?: {
    _id: string;
    title: string;
    department: string;
    description?: string;
    qualifications?: string[];
    skills?: string[];
  };
  applications?: Application[];
}

const STAGE_CONFIG = {
  screening: {
    label: 'Screening',
    color: 'bg-blue-100 text-blue-700',
    icon: '📋',
    order: 1
  },
  department_interview: {
    label: 'Department Interview',
    color: 'bg-purple-100 text-purple-700',
    icon: '👥',
    order: 2
  },
  hr_interview: {
    label: 'HR Interview',
    color: 'bg-yellow-100 text-yellow-700',
    icon: '🎯',
    order: 3
  },
  offer: {
    label: 'Offer',
    color: 'bg-green-100 text-green-700',
    icon: '✅',
    order: 4
  }
};

export function RecruitmentProcessView() {
  const toast = useToast();
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    fetchAllJobsWithApplications();
  }, []);

  const fetchAllJobsWithApplications = async () => {
    try {
      setLoading(true);
      const response = await recruitmentApi.getAllPublishedRequisitions();
      const jobsData = response.data || [];

      // Fetch applications for each job
      const jobsWithApplications = await Promise.all(
        jobsData.map(async (job: JobRequisition) => {
          try {
            const appsResponse = await recruitmentApi.getApplicationsByRequisition(job._id);
            const applications = appsResponse.data || [];

            // Fetch time-to-hire for applications in offer or hired status
            const applicationsWithTimeToHire = await Promise.all(
              applications.map(async (app: Application) => {
                if (app.status === 'hired' || app.status === 'offer') {
                  try {
                    const historyResponse = await recruitmentApi.getApplicationHistory(app._id);
                    return {
                      ...app,
                      timeToHire: historyResponse.data.timeToHire
                    };
                  } catch (error) {
                    console.error(`Failed to fetch history for application ${app._id}:`, error);
                    return app;
                  }
                }
                return app;
              })
            );

            return {
              ...job,
              applications: applicationsWithTimeToHire
            };
          } catch (error) {
            console.error(`Failed to fetch applications for job ${job._id}:`, error);
            return {
              ...job,
              applications: []
            };
          }
        })
      );

      setJobs(jobsWithApplications);
      toast.success(`Loaded ${jobsWithApplications.length} job requisitions`);
    } catch (error: any) {
      toast.error('Failed to load recruitment data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const getStageStats = (applications: Application[]) => {
    const stats = {
      screening: 0,
      department_interview: 0,
      hr_interview: 0,
      offer: 0,
      total: applications?.length || 0
    };

    applications?.forEach(app => {
      if (app.currentStage && stats.hasOwnProperty(app.currentStage)) {
        stats[app.currentStage]++;
      }
    });

    return stats;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; label: string }> = {
      submitted: { color: 'info', label: 'Submitted' },
      in_process: { color: 'primary', label: 'In Process' },
      offer: { color: 'warning', label: 'Offer Stage' },
      hired: { color: 'success', label: 'Hired' },
      rejected: { color: 'error', label: 'Rejected' },
      // Legacy statuses for backward compatibility
      under_review: { color: 'primary', label: 'Under Review' },
      interview_scheduled: { color: 'secondary', label: 'Interview Scheduled' },
      offer_made: { color: 'warning', label: 'Offer Made' },
      accepted: { color: 'success', label: 'Accepted' },
      withdrawn: { color: 'default', label: 'Withdrawn' }
    };

    const config = statusConfig[status] || { color: 'default' as const, label: status };
    return (
      <Chip label={config.label} size="small" color={config.color} />
    );
  };

  const getAggregateStats = (jobs: JobRequisition[]) => {
    const stats = {
      totalJobs: jobs.length,
      totalApplications: 0,
      screening: 0,
      department_interview: 0,
      hr_interview: 0,
      offer: 0,
      totalOpenings: 0,
      acceptedOffers: 0
    } as any;

    jobs.forEach(job => {
      stats.totalOpenings += job.openings || 0;
      (job.applications || []).forEach((app) => {
        stats.totalApplications++;
        if (app.currentStage && stats.hasOwnProperty(app.currentStage)) {
          stats[app.currentStage]++;
        }
        if (app.status === 'accepted' || app.status === 'offer_made') {
          stats.acceptedOffers++;
        }
      });
    });

    return stats as {
      totalJobs: number;
      totalApplications: number;
      screening: number;
      department_interview: number;
      hr_interview: number;
      offer: number;
      totalOpenings: number;
      acceptedOffers: number;
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>Recruitment Process</Typography>
          <Typography variant="body2" color="text.secondary">
            Track all job requisitions and candidate applications through hiring stages
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              <strong>{jobs.length}</strong> Active Jobs
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Button size="small" onClick={fetchAllJobsWithApplications} startIcon={<RefreshIcon />}>Refresh</Button>
          </Stack>
        </Box>
      </Stack>

      {/* Aggregate Summary */}
      <Card variant="outlined">
        <CardContent>
          {(() => {
            const agg = getAggregateStats(jobs);
            const fillRate = agg.totalOpenings > 0 ? Math.round((agg.acceptedOffers / agg.totalOpenings) * 100) : 0;
            return (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Overview</Typography>
                  <Chip label={`Jobs: ${agg.totalJobs}`} size="small" />
                  <Chip label={`Applications: ${agg.totalApplications}`} size="small" />
                  <Chip label={`Openings: ${agg.totalOpenings}`} size="small" />
                  <Chip label={`Filled: ${agg.acceptedOffers}`} size="small" color={fillRate >= 50 ? 'success' : 'default'} />
                </Stack>
                <Box sx={{ width: 280 }}>
                  <Typography variant="caption" color="text.secondary">Fill Rate</Typography>
                  <LinearProgress variant="determinate" value={fillRate} sx={{ height: 8, borderRadius: 2, mt: 0.5 }} />
                  <Typography variant="caption" sx={{ ml: 1 }}>{fillRate}%</Typography>
                </Box>
              </Stack>
            );
          })()}
        </CardContent>
      </Card>

      {/* Stage Legend */}
      <Card
        variant="outlined"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderColor: 'transparent'
        }}
      >
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2, opacity: 0.9, fontWeight: 600 }}>Hiring Stages</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {Object.entries(STAGE_CONFIG).map(([key, config]) => (
              <Stack key={key} direction="row" spacing={1} alignItems="center">
                <span style={{ fontSize: '1.2rem' }}>{config.icon}</span>
                <Chip
                  label={config.label}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                />
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Stack spacing={2}>
        {jobs.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Box textAlign="center" py={6}>
                <WorkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                <Typography color="text.secondary">No active job requisitions found</Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => {
            const isExpanded = expandedJobs.has(job._id);
            const stats = getStageStats(job.applications || []);

            return (
              <Card
                key={job._id}
                variant="outlined"
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    borderColor: 'primary.main'
                  }
                }}
              >
                {/* Job Header */}
                <CardContent
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    background: isExpanded ? 'linear-gradient(to right, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.03))' : 'transparent',
                    transition: 'background 0.3s ease'
                  }}
                  onClick={() => toggleJobExpansion(job._id)}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={1.5} sx={{ flex: 1 }}>
                      <IconButton
                        size="small"
                        sx={{
                          mt: 0.5,
                          bgcolor: isExpanded ? 'primary.main' : 'action.hover',
                          color: isExpanded ? 'white' : 'text.primary',
                          '&:hover': {
                            bgcolor: isExpanded ? 'primary.dark' : 'action.selected'
                          }
                        }}
                      >
                        {isExpanded ? (
                          <ExpandMoreIcon />
                        ) : (
                          <ChevronRightIcon />
                        )}
                      </IconButton>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {job.templateId?.title || 'Position'}
                          </Typography>
                          <Chip
                            label={`${job.openings || 0} Opening${(job.openings || 0) !== 1 ? 's' : ''}`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip
                            label={job.publishStatus === 'published' ? 'Active' : job.publishStatus}
                            size="small"
                            color={job.publishStatus === 'published' ? 'success' : 'default'}
                          />
                        </Stack>
                        <Stack direction="row" spacing={2.5} sx={{ flexWrap: 'wrap' }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <WorkIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                              {job.templateId?.department || 'Department'}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <PeopleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                              {stats.total} Application{stats.total !== 1 ? 's' : ''}
                            </Typography>
                          </Stack>
                          {job.location && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                📍 {job.location}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                    </Stack>

                    {/* Stage Summary */}
                    <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                      {Object.entries(STAGE_CONFIG).map(([key, config]) => {
                        const count = stats[key as keyof typeof stats];
                        if (count === 0) return null;
                        return (
                          <Chip
                            key={key}
                            label={`${config.icon} ${count}`}
                            size="small"
                            sx={{
                              bgcolor: config.color.includes('blue') ? 'primary.light' :
                                config.color.includes('purple') ? 'secondary.light' :
                                  config.color.includes('yellow') ? 'warning.light' : 'success.light',
                              color: config.color.includes('blue') ? 'primary.dark' :
                                config.color.includes('purple') ? 'secondary.dark' :
                                  config.color.includes('yellow') ? 'warning.dark' : 'success.dark'
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Stack>
                </CardContent>

                {/* Job progress and last activity */}
                <Box sx={{ px: 2, pb: 2 }}>
                  {(() => {
                    const totalOpenings = job.openings || 0;
                    const acceptedForJob = (job.applications || []).filter(a => a.status === 'accepted' || a.status === 'offer_made').length;
                    const fillPercent = totalOpenings > 0 ? Math.round((acceptedForJob / totalOpenings) * 100) : 0;
                    const lastApp = (job.applications || []).reduce((acc: string | undefined, a) => {
                      if (!acc) return a.updatedAt;
                      return new Date(acc) < new Date(a.updatedAt) ? a.updatedAt : acc;
                    }, undefined as string | undefined);

                    return (
                      <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">Last activity: {lastApp ? new Date(lastApp).toLocaleString() : '—'}</Typography>
                          <Typography variant="body2" color="text.secondary">{fillPercent}% filled</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={fillPercent} sx={{ height: 8, borderRadius: 2 }} />
                      </Stack>
                    );
                  })()}
                </Box>

                {/* Applications List */}
                <Collapse in={isExpanded} timeout="auto">
                  <Box
                    sx={{
                      borderTop: 1,
                      borderColor: 'divider',
                      background: 'linear-gradient(to bottom, rgba(102, 126, 234, 0.02), rgba(118, 75, 162, 0.02))',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {stats.total === 0 ? (
                      <Box p={3} textAlign="center">
                        <Typography color="text.secondary">
                          No applications yet for this position
                        </Typography>
                      </Box>
                    ) : (
                      <Box p={3}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                          Applications ({stats.total})
                        </Typography>
                        <Stack spacing={1.5}>
                          {job.applications?.map((application) => (
                            <Card
                              key={application._id}
                              variant="outlined"
                              sx={{
                                bgcolor: 'background.paper',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  boxShadow: 3,
                                  borderColor: 'primary.main',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
                                    <Box sx={{ flex: 1 }}>
                                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={500}>
                                          {application.candidateId ? `${application.candidateId.firstName} ${application.candidateId.lastName}` : 'Candidate'}
                                        </Typography>
                                        <Chip
                                          label={`${STAGE_CONFIG[application.currentStage]?.icon || ''} ${STAGE_CONFIG[application.currentStage]?.label || application.currentStage}`}
                                          size="small"
                                          sx={{
                                            bgcolor: STAGE_CONFIG[application.currentStage]?.color.includes('blue') ? 'primary.light' :
                                              STAGE_CONFIG[application.currentStage]?.color.includes('purple') ? 'secondary.light' :
                                                STAGE_CONFIG[application.currentStage]?.color.includes('yellow') ? 'warning.light' : 'success.light',
                                            color: STAGE_CONFIG[application.currentStage]?.color.includes('blue') ? 'primary.dark' :
                                              STAGE_CONFIG[application.currentStage]?.color.includes('purple') ? 'secondary.dark' :
                                                STAGE_CONFIG[application.currentStage]?.color.includes('yellow') ? 'warning.dark' : 'success.dark'
                                          }}
                                        />
                                        {getStatusBadge(application.status)}
                                      </Stack>
                                      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                                        <Typography variant="body2" color="text.secondary">{(application.candidateId as any)?.personalEmail || 'N/A'}</Typography>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                          <AccessTimeIcon sx={{ fontSize: 12 }} />
                                          <Typography variant="body2" color="text.secondary">
                                            Applied {new Date(application.createdAt).toLocaleDateString()}
                                          </Typography>
                                        </Stack>
                                      </Stack>
                                    </Box>
                                  </Stack>
                                  <Button
                                    onClick={() => setSelectedApplication(application)}
                                    variant="contained"
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                  >
                                    View Details
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Card>
            );
          })
        )}
      </Stack>

      {/* Application Details Modal */}
      <Dialog
        open={!!selectedApplication}
        onClose={() => setSelectedApplication(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Application Details</Typography>
            <IconButton onClick={() => setSelectedApplication(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Candidate</Typography>
                <Typography variant="body1">
                  {selectedApplication.candidateId ? `${selectedApplication.candidateId.firstName} ${selectedApplication.candidateId.lastName}` : 'Candidate'}
                </Typography>
                <Typography variant="body2" color="text.secondary">{(selectedApplication.candidateId as any)?.personalEmail || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Current Stage</Typography>
                <Chip
                  label={`${STAGE_CONFIG[selectedApplication.currentStage]?.icon} ${STAGE_CONFIG[selectedApplication.currentStage]?.label}`}
                  sx={{
                    bgcolor: STAGE_CONFIG[selectedApplication.currentStage]?.color.includes('blue') ? 'primary.light' :
                      STAGE_CONFIG[selectedApplication.currentStage]?.color.includes('purple') ? 'secondary.light' :
                        STAGE_CONFIG[selectedApplication.currentStage]?.color.includes('yellow') ? 'warning.light' : 'success.light',
                    color: STAGE_CONFIG[selectedApplication.currentStage]?.color.includes('blue') ? 'primary.dark' :
                      STAGE_CONFIG[selectedApplication.currentStage]?.color.includes('purple') ? 'secondary.dark' :
                        STAGE_CONFIG[selectedApplication.currentStage]?.color.includes('yellow') ? 'warning.dark' : 'success.dark'
                  }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                <Box>{getStatusBadge(selectedApplication.status)}</Box>
              </Box>
              {selectedApplication.timeToHire !== undefined && selectedApplication.timeToHire !== null && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>⏱️ Time to Hire</Typography>
                  <Chip
                    label={`${selectedApplication.timeToHire} days`}
                    color={selectedApplication.timeToHire < 14 ? 'success' : selectedApplication.timeToHire < 30 ? 'warning' : 'default'}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    From application submission to {selectedApplication.status === 'hired' ? 'hired' : 'offer'}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Application Date</Typography>
                <Typography variant="body1">{new Date(selectedApplication.createdAt).toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Last Updated</Typography>
                <Typography variant="body1">{new Date(selectedApplication.updatedAt).toLocaleString()}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

