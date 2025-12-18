'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import WorkIcon from '@mui/icons-material/Work';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
import { JobTemplates } from './JobTemplates';
import { JobRequisitions } from './JobRequisitions';
import { RecruitmentProcessView } from './RecruitmentProcessView';
import { OffersAndApprovals } from './OffersAndApprovals';
import { OnboardingChecklists } from './OnboardingChecklists';
import { TerminationReviews } from './TerminationReviews';
import { OffboardingClearance } from './OffboardingClearance';
import HRContracts from './HRContracts';

type Tab = 'overview' | 'job-templates' | 'job-requisitions' | 'recruitment' | 'offers' | 'contracts' | 'onboarding' | 'offboarding';

export function HRManagerDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState([
    { label: 'Open Positions', value: '0', icon: WorkIcon, color: 'primary.main' },
    { label: 'Active Candidates', value: '0', icon: PeopleIcon, color: 'success.main' },
    { label: 'Pending Offers', value: '0', icon: DescriptionIcon, color: 'warning.main' },
    { label: 'New Hires (This Month)', value: '0', icon: PersonAddIcon, color: 'secondary.main' },
  ]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [requisitionsRes, applicationsRes] = await Promise.all([
        recruitmentApi.getAllPublishedRequisitions().catch(() => ({ data: [] })),
        recruitmentApi.getAllApplications().catch(() => ({ data: [] }))
      ]);

      const requisitions = requisitionsRes.data || [];
      const applications = applicationsRes.data || [];

      // Calculate stats
      const openPositions = requisitions.filter((r: any) => r.publishStatus === 'published').length;
      const activeCandidates = applications.filter((a: any) => a.status !== 'rejected').length;
      const pendingOffers = applications.filter((a: any) => a.currentStage === 'offer' && a.status !== 'accepted').length;

      const thisMonth = new Date();
      const newHires = applications.filter((a: any) => {
        if (a.status === 'accepted' && a.updatedAt) {
          const updated = new Date(a.updatedAt);
          return updated.getMonth() === thisMonth.getMonth() && updated.getFullYear() === thisMonth.getFullYear();
        }
        return false;
      }).length;

      setStats([
        { label: 'Open Positions', value: openPositions.toString(), icon: WorkIcon, color: 'primary.main' },
        { label: 'Active Candidates', value: activeCandidates.toString(), icon: PeopleIcon, color: 'success.main' },
        { label: 'Pending Offers', value: pendingOffers.toString(), icon: DescriptionIcon, color: 'warning.main' },
        { label: 'New Hires (This Month)', value: newHires.toString(), icon: PersonAddIcon, color: 'secondary.main' },
      ]);

      // Build recent activities from applications
      const activities = applications
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4)
        .map((app: any) => {
          const timeAgo = getTimeAgo(new Date(app.updatedAt));
          const jobTitle = app.requisitionId?.templateId?.title || 'Position';
          let action = 'Application updated';
          if (app.status === 'accepted') action = 'Offer accepted';
          else if (app.status === 'offer_made') action = 'Job offer made';
          else if (app.currentStage === 'hr_interview') action = 'HR interview scheduled';
          else if (app.currentStage === 'department_interview') action = 'Department interview scheduled';

          return { action, role: jobTitle, time: timeAgo };
        });

      setRecentActivities(activities);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: TrendingUpIcon },
    { id: 'job-templates' as Tab, label: 'Job Templates', icon: DescriptionIcon },
    { id: 'job-requisitions' as Tab, label: 'Job Requisitions', icon: WorkIcon },
    { id: 'recruitment' as Tab, label: 'Recruitment Process', icon: PeopleIcon },
    { id: 'offers' as Tab, label: 'Offers & Approvals', icon: CheckCircleIcon },
    { id: 'contracts' as Tab, label: 'Contracts', icon: DescriptionIcon },
    { id: 'onboarding' as Tab, label: 'Onboarding', icon: PersonAddIcon },
    { id: 'offboarding' as Tab, label: 'Offboarding', icon: ExitToAppIcon },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          HR Manager Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage recruitment, onboarding, and offboarding processes
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={tab.label}
              icon={<tab.icon />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Overview */}
      {activeTab === 'overview' && (
        <Stack spacing={3}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            {stats.map((stat) => (
              <Card key={stat.label} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: stat.color, borderRadius: 2, p: 1.5, display: 'flex' }}>
                      <stat.icon sx={{ fontSize: 32, color: 'primary.contrastText' }} />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
                  Recent Activities
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => (
                        <Stack key={index} direction="row" spacing={2} sx={{ pb: 2, borderBottom: index < recentActivities.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                          <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%', mt: 1 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2">{activity.action}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.role} · {activity.time}
                            </Typography>
                          </Box>
                        </Stack>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No recent activities
                      </Typography>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={2}>
                  {[
                    { task: 'Review pending offers', priority: 'High', action: () => setActiveTab('offers') },
                    { task: 'Check new applications', priority: 'Medium', action: () => setActiveTab('recruitment') },
                    { task: 'Review job requisitions', priority: 'Medium', action: () => setActiveTab('job-requisitions') },
                    { task: 'Update job templates', priority: 'Low', action: () => setActiveTab('job-templates') },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                      onClick={item.action}
                    >
                      <Typography variant="body2">{item.task}</Typography>
                      <Chip
                        label={item.priority}
                        color={item.priority === 'High' ? 'error' : item.priority === 'Medium' ? 'warning' : 'success'}
                        size="small"
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      )}

      {activeTab === 'job-templates' && <JobTemplates />}
      {activeTab === 'job-requisitions' && <JobRequisitions />}
      {activeTab === 'recruitment' && <RecruitmentProcessView />}
      {activeTab === 'offers' && <OffersAndApprovals />}
      {activeTab === 'contracts' && <HRContracts />}
      {activeTab === 'onboarding' && <OnboardingChecklists />}
      {activeTab === 'offboarding' && (
        <Stack spacing={3}>
          <TerminationReviews />
          <OffboardingClearance />
        </Stack>
      )}
    </Stack>
  );
}

