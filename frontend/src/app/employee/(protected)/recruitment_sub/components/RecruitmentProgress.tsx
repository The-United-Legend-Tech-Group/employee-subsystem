'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { recruitmentApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

export function RecruitmentProgress() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // Aggregate data from multiple endpoints
      // const jobs = await recruitmentApi.getAllPublishedRequisitions();
      setMetrics({});
    } catch (error: any) {
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };
  const positions = [
    {
      id: 1,
      title: 'Senior Software Developer',
      department: 'Engineering',
      totalCandidates: 24,
      byStage: {
        Screening: 8,
        'Technical Test': 6,
        'Technical Interview': 5,
        'Manager Interview': 3,
        Offer: 2,
      },
      daysOpen: 15,
      progress: 45,
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      totalCandidates: 18,
      byStage: {
        Screening: 12,
        'First Interview': 4,
        'Panel Interview': 2,
        Offer: 0,
      },
      daysOpen: 22,
      progress: 30,
    },
    {
      id: 3,
      title: 'UX Designer',
      department: 'Design',
      totalCandidates: 15,
      byStage: {
        Screening: 5,
        'Portfolio Review': 6,
        Interview: 3,
        Offer: 1,
      },
      daysOpen: 10,
      progress: 60,
    },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" color="text.primary" gutterBottom>Recruitment Progress Monitor</Typography>
        <Typography variant="body2" color="text.secondary">Track recruitment progress across all open positions</Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TrendingUpIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Active Positions</Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>{positions.length}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PeopleIcon sx={{ color: 'success.main' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Total Candidates</Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>
                  {positions.reduce((sum, p) => sum + p.totalCandidates, 0)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AccessTimeIcon sx={{ color: 'warning.main' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Avg. Days Open</Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>
                  {Math.round(positions.reduce((sum, p) => sum + p.daysOpen, 0) / positions.length)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Position Details */}
      <Stack spacing={2}>
        {positions.map((position) => (
          <Card key={position.id} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6">{position.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{position.department}</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" color="text.secondary">Days Open</Typography>
                  <Typography variant="h6">{position.daysOpen}</Typography>
                </Box>
              </Stack>

              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Overall Progress</Typography>
                  <Typography variant="body2">{position.progress}%</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={position.progress}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.primary" sx={{ mb: 1.5 }}>
                  Candidates by Stage ({position.totalCandidates} total):
                </Typography>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(5, 1fr)'
                  },
                  gap: 1.5
                }}>
                  {Object.entries(position.byStage).map(([stage, count]) => (
                    <Card key={stage} variant="outlined" sx={{ bgcolor: 'action.hover', color: 'text.primary' }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          {stage}
                        </Typography>
                        <Typography variant="h5">{count}</Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>

              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  variant="text"
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  View All Candidates →
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

