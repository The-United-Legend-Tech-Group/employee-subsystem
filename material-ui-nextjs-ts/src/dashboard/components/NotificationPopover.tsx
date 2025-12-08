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
                        overflow: 'visible', // For arrow
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        '&:before': { // Arrow
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
                <Box sx={{ position: 'relative', zIndex: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Box sx={{ p: 2, pb: 1 }}>
                        <Typography variant="h6">Notifications</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">No notifications</Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {notifications.map((notification) => (
                                    <ListItem
                                        key={notification._id}
                                        alignItems="flex-start"
                                        sx={(theme) => ({
                                            bgcolor: notification.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.action.active, 0.04),
                                            },
                                        })}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                            {getNotificationIcon(notification.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" fontWeight={notification.isRead ? 'medium' : 'bold'}>
                                                    {notification.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <React.Fragment>
                                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                                                        {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                </React.Fragment>
                                            }
                                        />
                                        {!notification.isRead && (
                                            <CircleIcon sx={{ fontSize: 8, color: 'primary.main', mt: 1 }} />
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                </Box>
            </Popover>
        </React.Fragment>
    );
}
