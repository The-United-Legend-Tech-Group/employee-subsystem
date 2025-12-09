import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import CircleIcon from '@mui/icons-material/Circle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import MenuButton from './MenuButton';

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

export default function NotificationPopover() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const fetchNotifications = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

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
        }
    };

    // Initial fetch to get badge count potentially
    React.useEffect(() => {
        fetchNotifications();
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
        event.stopPropagation();
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
        try {
            const res = await fetch(`${apiUrl}/notification/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Optimistic update
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
                // Optimistic update
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    return (
        <React.Fragment>
            <MenuButton
                onClick={handleClick}
                aria-label="Open notifications"
                aria-controls={open ? 'notification-popover' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
            >
                <Badge badgeContent={unreadCount} color="error" variant="dot" invisible={unreadCount === 0}>
                    <NotificationsRoundedIcon />
                </Badge>
            </MenuButton>
            <Popover
                id="notification-popover"
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        width: 360,
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        borderRadius: 3, // More rounded popover
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1, bgcolor: 'background.paper', borderRadius: 3 }}>
                    <Box sx={{ p: 2, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Notifications</Typography>
                        {notifications.length > 0 && notifications.some(n => !n.isRead) && (
                            <Typography
                                variant="caption"
                                color="primary"
                                onClick={handleMarkAllAsRead}
                                sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                            >
                                Mark all read
                            </Typography>
                        )}
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">No notifications</Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {/* Sort: Unread first, then Read (max 3) */}
                                {[
                                    ...notifications.filter(n => !n.isRead).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
                                    ...notifications.filter(n => n.isRead).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)
                                ].map((notification) => (
                                    <ListItem
                                        key={notification._id}
                                        alignItems="flex-start"
                                        secondaryAction={
                                            !notification.isRead && (
                                                <IconButton
                                                    edge="end"
                                                    aria-label="mark as read"
                                                    size="small"
                                                    onClick={(e) => handleMarkAsRead(notification._id, e)}
                                                    sx={{ ml: 1, color: 'primary.main', bgcolor: 'transparent', '&:hover': { bgcolor: 'action.hover' } }}
                                                >
                                                    <CheckCircleRoundedIcon fontSize="small" />
                                                </IconButton>
                                            )
                                        }
                                        sx={(theme) => ({
                                            bgcolor: notification.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                                            mx: 1, // Margin for floating effect
                                            my: 0.5,
                                            width: 'auto',
                                            borderRadius: 2, // Rounded items
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.action.focus, 0.08),
                                                transform: 'translateY(-1px)',
                                            },
                                            p: 1.5, // More compact padding
                                            pr: notification.isRead ? 1.5 : 5, // Make room for secondary action if unread
                                        })}
                                    >
                                        <ListItemIcon sx={{ minWidth: 32, mt: 0.25 }}>
                                            {getNotificationIcon(notification.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ fontWeight: notification.isRead ? 400 : 700, fontSize: '0.875rem', mb: 0.5 }}>
                                                    {notification.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <React.Fragment>
                                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem', opacity: 0.7 }}>
                                                        {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                </React.Fragment>
                                            }
                                            sx={{ m: 0 }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                    <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>
                            View all notifications
                        </Typography>
                    </Box>
                </Box>
            </Popover>
        </React.Fragment>
    );
}
