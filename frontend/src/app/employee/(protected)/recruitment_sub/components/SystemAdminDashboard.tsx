'use client';

import { useState, useEffect } from 'react';
import { recruitmentApi, offboardingApi, notificationApi } from '@/lib/api';
import type { Notification } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Avatar,
  Alert,
  IconButton
} from '@mui/material';
import {
  Shield as ShieldIcon,
  VpnKey as KeyIcon,
  PersonOff as UserXIcon,
  PersonAdd as UserCheckIcon,
  DnsRounded as ServerIcon,
  Storage as DatabaseIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

export function SystemAdminDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'provisioning' | 'revocation'>('provisioning');
  const [employeesReadyForRevocation, setEmployeesReadyForRevocation] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onboardingNotifications, setOnboardingNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    // Fetch notifications on mount and when switching to provisioning tab
    if (activeTab === 'provisioning') {
      fetchNotifications();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'revocation') {
      fetchEmployeesReadyForRevocation();
    }
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const data = await notificationApi.getMyNotifications();
      setNotifications(data);

      // Filter for onboarding-related notifications for System Admin
      const onboardingTasks = data.filter(
        n => n.relatedModule === 'Recruitment' &&
          (n.title.includes('Onboarding') || n.message.includes('onboarding')) &&
          !n.isRead
      );
      setOnboardingNotifications(onboardingTasks);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      toast.error(error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchEmployeesReadyForRevocation = async () => {
    try {
      setLoading(true);
      const response = await offboardingApi.getEmployeesReadyForRevocation();
      setEmployeesReadyForRevocation(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch employees ready for revocation:', error);
      toast.error(error.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (terminationRequestId: string, employeeName: string) => {
    try {
      await offboardingApi.revokeSystemAccess({
        terminationRequestId,
        revocationReason: 'All clearance requirements completed - system admin revoked access',
      });
      toast.success(`System access revoked successfully for ${employeeName}`);
      fetchEmployeesReadyForRevocation();
    } catch (error: any) {
      console.error('Failed to revoke access:', error);
      toast.error(error.response?.data?.message || 'Failed to revoke system access');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      toast.success('Task acknowledged');
      fetchNotifications(); // Refresh notifications
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      toast.error(error.response?.data?.message || 'Failed to update notification');
    }
  };

  const systemStats = [
    { label: 'Active Users', value: '248', icon: UserCheckIcon, color: '#10b981' },
    { label: 'Pending Provisioning', value: onboardingNotifications.length.toString(), icon: KeyIcon, color: '#3b82f6' },
    { label: 'Pending Revocation', value: employeesReadyForRevocation.length.toString(), icon: UserXIcon, color: '#ef4444' },
    { label: 'System Uptime', value: '99.9%', icon: ServerIcon, color: '#a855f7' },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" color="text.primary" gutterBottom>
          System Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage system access provisioning and revocation
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        {systemStats.map((stat) => (
          <Card variant="outlined" key={stat.label}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.5 }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>
                  <stat.icon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ px: 1 }}
        >
          <Tab
            icon={<UserCheckIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Access Provisioning"
            value="provisioning"
          />
          <Tab
            icon={<UserXIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Access Revocation"
            value="revocation"
          />
        </Tabs>
      </Paper>

      {/* Provisioning Tab */}
      {activeTab === 'provisioning' && (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pending Onboarding Tasks
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New employees requiring IT/Admin setup
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<NotificationsIcon />}
                  onClick={fetchNotifications}
                  disabled={notificationsLoading}
                >
                  Refresh
                </Button>
              </Stack>

              {notificationsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : onboardingNotifications.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    All caught up!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No pending onboarding tasks at the moment
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {onboardingNotifications.map((notification) => {
                    // Extract employee info from the notification message
                    const messageMatch = notification.message.match(/employee\s+(\S+)/i);
                    const employeeIdentifier = messageMatch ? messageMatch[1] : 'Unknown';

                    // Extract tasks from message
                    const tasksMatch = notification.message.match(/Tasks:\s*([^.]+)/);
                    const tasksText = tasksMatch ? tasksMatch[1].trim() : 'IT and Admin tasks';

                    // Extract deadline if available
                    const deadlineMatch = notification.message.match(/Deadline:\s*([^.]+)/);
                    const deadline = deadlineMatch ? deadlineMatch[1].trim() : 'ASAP';

                    // Extract notes if available
                    const notesMatch = notification.message.match(/Notes:\s*([^.]+(?:\.[^.]+)*?)\.?$/);
                    const notes = notesMatch ? notesMatch[1].trim() : null;

                    return (
                      <Paper key={notification._id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1">Employee: {employeeIdentifier}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {notification.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Deadline: {deadline}
                            </Typography>
                          </Box>
                          <Chip
                            label={notification.type}
                            color={notification.type === 'Alert' ? 'error' : notification.type === 'Warning' ? 'warning' : 'info'}
                            size="small"
                          />
                        </Stack>

                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            {notification.message}
                          </Typography>
                        </Alert>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Required Tasks:
                          </Typography>
                          <Typography variant="body2">
                            {tasksText}
                          </Typography>
                        </Box>

                        {notes && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Additional Notes:
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              {notes}
                            </Typography>
                          </Box>
                        )}

                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleMarkAsRead(notification._id)}
                          >
                            Mark as Complete
                          </Button>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Systems
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                {[
                  'Email (O365)',
                  'SSO',
                  'Payroll System',
                  'GitHub',
                  'Jira',
                  'Confluence',
                  'Slack',
                  'Salesforce',
                  'HubSpot',
                  'Figma',
                  'AWS Console',
                  'VPN Access',
                ].map((system) => (
                  <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }} key={system}>
                    <DatabaseIcon fontSize="small" color="action" />
                    <Typography variant="body2">{system}</Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Revocation Tab */}
      {activeTab === 'revocation' && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Employees Ready for System Access Revocation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              All clearance requirements completed. Click "Revoke Access" to terminate system access.
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : employeesReadyForRevocation.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                <UserCheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No employees pending revocation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All employees with completed clearance checklists have been processed
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {employeesReadyForRevocation.map((item) => {
                  const employee = item.employee;
                  const termination = item.terminationRequest;
                  const checklist = item.clearanceChecklist;

                  return (
                    <Paper key={termination._id} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1">
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.workEmail || employee.personalEmail}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {employee.department?.name || 'N/A'} · ID: {termination.employeeId.toString().slice(-8)}
                          </Typography>
                        </Box>
                        <Chip label="Ready for Revocation" color="error" size="small" />
                      </Stack>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          ✓ All Clearance Requirements Met:
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                          <Chip
                            label={`${checklist.items.length} Departments Approved`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                          <Chip
                            label={`${checklist.equipmentList.length} Equipment Returned`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                          <Chip
                            label="Access Card Returned"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Stack>
                      </Box>

                      {termination.terminationDate && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                          Termination Date: {new Date(termination.terminationDate).toLocaleDateString()}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="error"
                          fullWidth
                          size="small"
                          startIcon={<UserXIcon />}
                          onClick={() =>
                            handleRevokeAccess(
                              termination._id,
                              `${employee.firstName} ${employee.lastName}`
                            )
                          }
                        >
                          Revoke System Access
                        </Button>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {/* Automated Scheduling */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Automated Access Management
          </Typography>
          <Stack spacing={2}>
            <Paper
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                border: 1,
                borderColor: 'success.main'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <UserCheckIcon sx={{ color: 'success.main', mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Automatic Provisioning Enabled
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    System access is automatically provisioned on employee start date
                  </Typography>
                </Box>
                <Button size="small" color="success">
                  Configure
                </Button>
              </Stack>
            </Paper>

            <Paper
              sx={{
                p: 2,
                bgcolor: 'error.light',
                color: 'error.contrastText',
                border: 1,
                borderColor: 'error.main'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <UserXIcon sx={{ color: 'error.main', mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Automatic Revocation Enabled
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    System access is automatically revoked on employee exit date
                  </Typography>
                </Box>
                <Button size="small" color="error">
                  Configure
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Stack spacing={1.5}>
            {[
              { action: 'Access provisioned', user: 'Alice Brown', system: 'All systems', time: '1 hour ago', type: 'provision' },
              { action: 'Access revoked', user: 'Bob Martin', system: 'All systems', time: '3 hours ago', type: 'revocation' },
              { action: 'Access provisioned', user: 'Carol Davis', system: 'Email, SSO', time: '5 hours ago', type: 'provision' },
              { action: 'Access modified', user: 'David Lee', system: 'GitHub', time: '1 day ago', type: 'modification' },
            ].map((activity, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover', color: 'text.primary' }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      mt: 1,
                      bgcolor:
                        activity.type === 'provision'
                          ? 'success.main'
                          : activity.type === 'revocation'
                            ? 'error.main'
                            : 'primary.main',
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      {activity.action} for {activity.user}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.system} · {activity.time}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

