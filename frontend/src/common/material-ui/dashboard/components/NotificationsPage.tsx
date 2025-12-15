'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import { alpha, useTheme } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import FilterListIcon from '@mui/icons-material/FilterList';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    deadline?: string;
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

export default function NotificationsPage() {
    const theme = useTheme();
    const [loading, setLoading] = React.useState(true);
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

    const fetchNotifications = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setLoading(false);
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
        try {
            const notifRes = await fetch(`${apiUrl}/notification/my-notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (notifRes.ok) {
                const data = await notifRes.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
        try {
            const res = await fetch(`${apiUrl}/notification/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n =>
                    n._id === id ? { ...n, isRead: true } : n
                ));
            }
        } catch (error) {
            console.error('Error marking notification as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
        try {
            const res = await fetch(`${apiUrl}/notification/read-all`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const [page, setPage] = React.useState(1);
    const ROWS_PER_PAGE = 5;

    const filteredNotifications = React.useMemo(() => {
        let result = notifications;

        // Apply filter
        if (filter === 'unread') {
            result = result.filter(n => !n.isRead);
        }

        // Sort: Unread first, then new to old
        return result.sort((a, b) => {
            if (a.isRead === b.isRead) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return a.isRead ? 1 : -1;
        });
    }, [notifications, filter]);

    const paginatedNotifications = React.useMemo(() => {
        const startIndex = (page - 1) * ROWS_PER_PAGE;
        return filteredNotifications.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [filteredNotifications, page]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Box sx={{ width: '100%', p: { xs: 2, md: 4 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Notifications
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Stay updated with important alerts and messages
                    </Typography>
                </Box>
                {unreadCount > 0 && !loading && (
                    <Button
                        variant="outlined"
                        startIcon={<CheckIcon />}
                        onClick={handleMarkAllAsRead}
                        size="small"
                    >
                        Mark all as read
                    </Button>
                )}
            </Stack>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                    <Chip
                        label="All"
                        clickable
                        color={filter === 'all' ? 'primary' : 'default'}
                        variant={filter === 'all' ? 'filled' : 'outlined'}
                        onClick={() => { setFilter('all'); setPage(1); }}
                    />
                    <Chip
                        label={`Unread (${unreadCount})`}
                        clickable
                        color={filter === 'unread' ? 'primary' : 'default'}
                        variant={filter === 'unread' ? 'filled' : 'outlined'}
                        onClick={() => { setFilter('unread'); setPage(1); }}
                    />
                </Box>

                {loading ? (
                    <List disablePadding>
                        {[...Array(3)].map((_, index) => (
                            <React.Fragment key={index}>
                                <ListItem sx={{ py: 2, px: 3, borderRadius: 2, mx: 1, my: 0.5 }}>
                                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                        <Skeleton variant="circular" width={24} height={24} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Skeleton variant="text" width="60%" height={28} sx={{ mb: 0.5 }} />}
                                        secondary={
                                            <Stack spacing={0.5}>
                                                <Skeleton variant="text" width="90%" height={20} />
                                                <Skeleton variant="text" width="40%" height={16} />
                                            </Stack>
                                        }
                                        secondaryTypographyProps={{ component: 'div' }}
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                ) : paginatedNotifications.length === 0 ? (
                    <Box sx={{ p: 8, textAlign: 'center' }}>
                        <NotificationsRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No notifications found
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                            {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
                        </Typography>
                    </Box>
                ) : (
                    <React.Fragment>
                        <List disablePadding>
                            {paginatedNotifications.map((notification, index) => (
                                <React.Fragment key={notification._id}>
                                    {/* Divider removed for rounded card style */}
                                    <ListItem
                                        alignItems="flex-start"
                                        secondaryAction={
                                            !notification.isRead && (
                                                <IconButton
                                                    edge="end"
                                                    aria-label="mark as read"
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                    sx={{ color: 'primary.main' }}
                                                >
                                                    <CheckCircleRoundedIcon />
                                                </IconButton>
                                            )
                                        }
                                        sx={{
                                            bgcolor: notification.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                                            transition: 'background-color 0.2s',
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.action.hover, 0.04),
                                            },
                                            py: 2,
                                            px: 3,
                                            borderRadius: 2,
                                            mx: 1, // Add some margin horizontally so it doesn't touch the edges if we round it
                                            my: 0.5, // Add some margin vertically to separate them slightly
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                            {getNotificationIcon(notification.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                                                        {notification.title}
                                                    </Typography>
                                                    {!notification.isRead && (
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled">
                                                        {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Typography>
                                                </Stack>
                                            }
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                        {filteredNotifications.length > ROWS_PER_PAGE && (
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                                <Pagination
                                    count={Math.ceil(filteredNotifications.length / ROWS_PER_PAGE)}
                                    page={page}
                                    onChange={handlePageChange}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </React.Fragment>
                )}
            </Card>
        </Box>
    );
}
