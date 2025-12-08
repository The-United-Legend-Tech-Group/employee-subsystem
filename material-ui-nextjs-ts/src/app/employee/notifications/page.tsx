'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import CircularProgress from '@mui/material/CircularProgress';
import CircleIcon from '@mui/icons-material/Circle';
import Divider from '@mui/material/Divider';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';

import AppNavbar from '../../../dashboard/components/AppNavbar';
import Header from '../../../dashboard/components/Header';
import SideMenu from '../../../dashboard/components/SideMenu';
import AppTheme from '../../../shared-theme/AppTheme';
import {
    chartsCustomizations,
    dataGridCustomizations,
    datePickersCustomizations,
    treeViewCustomizations,
} from '../../../dashboard/theme/customizations';

const xThemeComponents = {
    ...chartsCustomizations,
    ...dataGridCustomizations,
    ...datePickersCustomizations,
    ...treeViewCustomizations,
};

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'Alert':
            return <ErrorRoundedIcon color="error" />;
        case 'Warning':
            return <WarningRoundedIcon color="warning" />;
        case 'Success':
            return <CheckCircleRoundedIcon color="success" />;
        case 'Info':
        default:
            return <InfoRoundedIcon color="info" />;
    }
};

export default function NotificationsPage(props: { disableCustomTheme?: boolean }) {
    const router = useRouter();
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [employee, setEmployee] = React.useState<any>(null); // Simplified for SideMenu

    React.useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('access_token');
            const employeeId = localStorage.getItem('employeeId');

            if (!token || !employeeId) {
                router.push('/employee/login');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            try {
                // Fetch Employee Profile for SideMenu
                const profileRes = await fetch(`${apiUrl}/employee/${employeeId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setEmployee(data.profile);
                }

                // Fetch Notifications
                const notifRes = await fetch(`${apiUrl}/notification/my-notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (notifRes.ok) {
                    const data = await notifRes.json();
                    setNotifications(data);
                } else {
                    console.error('Failed to fetch notifications');
                }

            } catch (error) {
                console.error('Error fetching data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <AppTheme {...props} themeComponents={xThemeComponents}>
            <CssBaseline enableColorScheme />
            <Box sx={{ display: 'flex' }}>
                <SideMenu user={employee ? {
                    name: `${employee.firstName} ${employee.lastName}`,
                    email: employee.workEmail || employee.personalEmail,
                    image: employee.profilePictureUrl || '/static/images/avatar/7.jpg'
                } : undefined} />
                <AppNavbar />
                <Box
                    component="main"
                    sx={(theme) => ({
                        flexGrow: 1,
                        backgroundColor: theme.vars
                            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                            : alpha(theme.palette.background.default, 1),
                        overflow: 'auto',
                        height: '100vh',
                    })}
                >
                    <Stack
                        spacing={2}
                        sx={{
                            alignItems: 'center',
                            mx: 3,
                            pb: 5,
                            mt: { xs: 8, md: 0 },
                        }}
                    >
                        <Header notificationPath="/employee/notifications" />
                        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
                            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                                Notifications
                            </Typography>
                            <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 'sm' }}>
                                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                                    {notifications.length === 0 ? (
                                        <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                                            <Stack alignItems="center" spacing={1}>
                                                <NotificationsRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                                                <ListItemText
                                                    primary="No notifications"
                                                    secondary="You're all caught up!"
                                                    primaryTypographyProps={{ align: 'center', variant: 'h6', color: 'text.secondary' }}
                                                    secondaryTypographyProps={{ align: 'center' }}
                                                />
                                            </Stack>
                                        </ListItem>
                                    ) : (
                                        notifications.map((notification, index) => (
                                            <React.Fragment key={notification._id}>
                                                <ListItem
                                                    alignItems="flex-start"
                                                    sx={(theme) => ({
                                                        bgcolor: notification.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                                                        transition: 'background-color 0.2s',
                                                        '&:hover': {
                                                            bgcolor: alpha(theme.palette.action.active, 0.04),
                                                        },
                                                        py: 2,
                                                    })}
                                                >
                                                    <ListItemIcon sx={{ mt: 0.5, minWidth: 48 }}>
                                                        {getNotificationIcon(notification.type)}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                                                                <Typography variant="subtitle1" fontWeight={notification.isRead ? 'medium' : 'bold'} sx={{ lineHeight: 1.2 }}>
                                                                    {notification.title}
                                                                </Typography>
                                                                <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                    </Typography>
                                                                    {!notification.isRead && (
                                                                        <CircleIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                                                                    )}
                                                                </Stack>
                                                            </Stack>
                                                        }
                                                        secondary={
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ display: 'block', mt: 0.5, lineHeight: 1.5 }}
                                                            >
                                                                {notification.message}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                                {index < notifications.length - 1 && <Divider component="li" variant="inset" />}
                                            </React.Fragment>
                                        ))
                                    )}
                                </List>
                            </Card>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </AppTheme>
    );
}
