'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import { alpha } from '@mui/material/styles';

// Icons
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';

import { EmployeeDashboard } from './components/EmployeeDashboard';
import { HREmployeeDashboard } from './components/HREmployeeDashboard';
import { HRManagerDashboard } from './components/HRManagerDashboard';
import { SystemAdminDashboard } from './components/SystemAdminDashboard';

type RoleType = 'employee' | 'hr_employee' | 'hr_manager' | 'system_admin';

export default function RecruitmentPage() {
  const [currentRole, setCurrentRole] = useState<RoleType>('employee');

  const roleLevels: Record<RoleType, number> = {
    employee: 0,
    hr_employee: 1,
    hr_manager: 2,
    system_admin: 3
  };

  const currentLevel = roleLevels[currentRole];

  const SectionHeader = ({ title, subtitle, icon: Icon, gradient }: any) => (
    <Box
      sx={{
        p: 3,
        background: gradient,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(4px)',
          display: 'flex'
        }}
      >
        <Icon sx={{ fontSize: 28 }} />
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '0.5px' }}>
          {title}
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', pb: 8 }}>

      {/* Sticky Role Selector Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: 1,
          borderColor: 'divider',
          py: 2,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', backgroundClip: 'text', textFillColor: 'transparent', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Recruitment Hub
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                VIEWING AS:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value as RoleType)}
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    fontWeight: 600
                  }}
                >
                  <MenuItem value="employee">Regular Employee</MenuItem>
                  <MenuItem value="hr_employee">HR Employee</MenuItem>
                  <MenuItem value="hr_manager">HR Manager</MenuItem>
                  <MenuItem value="system_admin">System Admin</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Stack spacing={4}>

          {/* System Admin Section - Level 3 */}
          <Collapse in={currentLevel >= 3} timeout={500}>
            <Paper
              elevation={4}
              sx={{
                overflow: 'hidden',
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <SectionHeader
                title="System Administration"
                subtitle="Global Configuration & Settings"
                icon={AdminPanelSettingsIcon}
                gradient="linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)"
              />
              <Box sx={{ p: 3, position: 'relative' }}>
                <SystemAdminDashboard />
              </Box>
            </Paper>
          </Collapse>

          {/* HR Manager Section - Level 2 */}
          <Collapse in={currentLevel >= 2} timeout={500}>
            <Paper
              elevation={4}
              sx={{
                overflow: 'hidden',
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <SectionHeader
                title="HR Management"
                subtitle="Approvals & Strategic Oversight"
                icon={SupervisorAccountIcon}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
              <Box sx={{ p: 3 }}>
                <HRManagerDashboard />
              </Box>
            </Paper>
          </Collapse>

          {/* HR Employee Section - Level 1 */}
          <Collapse in={currentLevel >= 1} timeout={500}>
            <Paper
              elevation={4}
              sx={{
                overflow: 'hidden',
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <SectionHeader
                title="HR Operations"
                subtitle="Recruitment Process & Candidates"
                icon={WorkIcon}
                gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              />
              <Box sx={{ p: 3 }}>
                <HREmployeeDashboard />
              </Box>
            </Paper>
          </Collapse>

          {/* Regular Employee Section - Level 0 */}
          <Collapse in={true} timeout={500}>
            <Paper
              elevation={4}
              sx={{
                overflow: 'hidden',
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <SectionHeader
                title="Personal Dashboard"
                subtitle="My Documents, Tasks & Applications"
                icon={PersonIcon}
                gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
              />
              <Box sx={{ p: 3 }}>
                <EmployeeDashboard />
              </Box>
            </Paper>
          </Collapse>

        </Stack>
      </Container>
    </Box>
  );
}
