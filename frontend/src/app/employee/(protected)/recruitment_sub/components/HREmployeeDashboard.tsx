'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SendIcon from '@mui/icons-material/Send';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InventoryIcon from '@mui/icons-material/Inventory';
import CircularProgress from '@mui/material/CircularProgress';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
import { JobPostings } from './JobPostings';
import { CandidateTracking } from './CandidateTracking';
import { InterviewScheduling } from './InterviewScheduling';
import { AllAssessments } from './AllAssessments';
import { RejectionNotifications } from './RejectionNotifications';
import { ResourceReservation } from './ResourceReservation';

type Tab = 'overview' | 'job-postings' | 'candidates' | 'interviews' | 'all-assessments' | 'notifications' | 'resources';
export function HREmployeeDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    }
  }, [activeTab]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const [appsRes, referralsRes] = await Promise.all([
        recruitmentApi.getAllApplications().catch(() => ({ data: [] })),
        recruitmentApi.getAllReferrals().catch(() => ({ data: [] }))
      ]);
      setApplications(appsRes.data || []);
      setReferrals(referralsRes.data || []);
      // TODO: Fetch interviews when API is available
      setInterviews([]);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: PeopleIcon },
    { id: 'job-postings' as Tab, label: 'Job Postings', icon: SendIcon },
    { id: 'candidates' as Tab, label: 'Candidate Tracking', icon: PeopleIcon },
    { id: 'interviews' as Tab, label: 'Interview Scheduling', icon: CalendarTodayIcon },
    { id: 'all-assessments' as Tab, label: 'Assessments & Scoring', icon: AssignmentIcon },
    { id: 'notifications' as Tab, label: 'Notifications', icon: SendIcon },
    { id: 'resources' as Tab, label: 'Resource Reservation', icon: InventoryIcon },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
            HR Employee Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage daily recruitment and onboarding activities
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Tab
                key={tab.id}
                value={tab.id}
                label={tab.label}
                icon={<IconComponent />}
                iconPosition="start"
                sx={{ textTransform: 'none', minHeight: 48 }}
              />
            );
          })}
        </Tabs>

        {/* Content */}
        {activeTab === 'overview' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {loading ? (
              <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <PeopleIcon color="primary" />
                      <Typography variant="h6">New Applications</Typography>
                    </Stack>
                    <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
                      {applications.filter(a => {
                        const created = new Date(a.createdAt);
                        const today = new Date();
                        return created.toDateString() === today.toDateString();
                      }).length}
                    </Typography>
                    <Stack spacing={1.5}>
                      {applications
                        .filter(a => a.status !== 'rejected')
                        .slice(0, 4)
                        .map((app, index) => (
                          <Box key={index} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="body2">
                              {app.candidateId?.firstName} {app.candidateId?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {app.currentStage || 'Pending'}
                            </Typography>
                          </Box>
                        ))}
                      {applications.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No applications yet
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <CalendarTodayIcon color="success" />
                      <Typography variant="h6">Scheduled Interviews</Typography>
                    </Stack>
                    <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
                      {interviews.length}
                    </Typography>
                    <Stack spacing={1.5}>
                      {interviews.slice(0, 3).map((interview, index) => {
                        const scheduleDate = interview.scheduledDate ? new Date(interview.scheduledDate) : null;
                        return (
                          <Box key={index} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="body2">
                              {interview.candidateId?.firstName || 'Candidate'} {interview.candidateId?.lastName || ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {interview.interviewType || 'Interview'} · {scheduleDate ? scheduleDate.toLocaleString() : 'TBD'}
                            </Typography>
                          </Box>
                        );
                      })}
                      {interviews.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No interviews scheduled
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <LocalOfferIcon color="secondary" />
                      <Typography variant="h6">Referral Candidates</Typography>
                    </Stack>
                    <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
                      {referrals.length}
                    </Typography>
                    <Stack spacing={1.5}>
                      {referrals.slice(0, 3).map((referral, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1.5,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="body2">
                            {referral.candidateId?.firstName || 'Candidate'} {referral.candidateId?.lastName || ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Referred by {referral.referredBy}
                          </Typography>
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              mt: 0.5,
                              px: 1,
                              py: 0.25,
                              bgcolor: 'secondary.light',
                              color: 'secondary.contrastText',
                              borderRadius: 0.5,
                              fontSize: '0.75rem'
                            }}
                          >
                            {referral.status}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </>
            )}
          </Box>
        )}

        {activeTab === 'job-postings' && <JobPostings />}
        {activeTab === 'candidates' && <CandidateTracking />}
        {activeTab === 'interviews' && <InterviewScheduling />}
        {activeTab === 'all-assessments' && <AllAssessments />}
        {activeTab === 'notifications' && <RejectionNotifications />}
        {activeTab === 'resources' && <ResourceReservation />}
      </Stack>
    </Box>
  );
}

