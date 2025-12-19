'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import dayjs, { Dayjs } from 'dayjs';

// Icons
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

export interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    deadline?: string;
}

function ServerDay(props: PickersDayProps & { highlightedDays?: number[], notifications?: Notification[] }) {
    const { highlightedDays = [], day, outsideCurrentMonth, notifications = [], ...other } = props;

    // Find notifications for this day
    const dayNotifs = notifications.filter(n =>
        n.deadline && dayjs(n.deadline).isSame(day, 'day')
    );

    const hasEvents = dayNotifs.length > 0;

    // Determine closest deadline color
    // Red: <= 2 days from now (if future or today)
    // Orange: <= 5 days
    // Blue: > 5 days or past

    let badgeColor = 'primary';
    if (hasEvents) {
        const today = dayjs();
        const diff = (day as Dayjs).diff(today, 'day');
        if (diff < 0) badgeColor = 'default'; // Past
        else if (diff <= 2) badgeColor = 'error';
        else if (diff <= 5) badgeColor = 'warning';
        else badgeColor = 'info';
    }

    return (
        <Badge
            key={props.day.toString()}
            overlap="circular"
            badgeContent={hasEvents ? dayNotifs.length : undefined}
            color={badgeColor as any}
            sx={{
                '& .MuiBadge-badge': {
                    right: 4,
                    top: 4,
                    fontSize: '0.6rem',
                    minWidth: '14px',
                    height: '14px',
                    padding: 0
                }
            }}
        >
            <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
        </Badge>
    );
}

interface CalendarClientProps {
    initialNotifications: Notification[];
}

export default function CalendarClient({ initialNotifications }: CalendarClientProps) {
    const theme = useTheme();
    const [value, setValue] = React.useState<Dayjs | null>(dayjs());
    const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications);
    const [selectedDateEvents, setSelectedDateEvents] = React.useState<Notification[]>([]);

    React.useEffect(() => {
        setNotifications(initialNotifications);
    }, [initialNotifications]);

    React.useEffect(() => {
        if (!value) return;

        // Filter events for selected date
        const events = notifications.filter(n =>
            n.deadline && dayjs(n.deadline).isSame(value, 'day')
        );
        setSelectedDateEvents(events);
    }, [value, notifications]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'Alert': return <ErrorRoundedIcon color="error" />;
            case 'Warning': return <WarningRoundedIcon color="warning" />;
            case 'Success': return <CheckCircleRoundedIcon color="success" />;
            default: return <InfoRoundedIcon color="info" />;
        }
    };

    const getUrgencyColor = (deadline: string) => {
        const d = dayjs(deadline);
        const today = dayjs();
        const diff = d.diff(today, 'day');

        if (d.isBefore(today, 'day')) return 'default'; // Past
        if (diff <= 2) return 'error';
        if (diff <= 5) return 'warning';
        return 'info';
    };

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Calendar & Schedule
            </Typography>

            <Grid container spacing={3}>
                {/* Top Section: Calendar & Legend */}
                <Grid size={{ xs: 12 }}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                        <CardContent sx={{ p: 0 }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start" justifyContent="center">
                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DateCalendar
                                            value={value}
                                            onChange={(newValue) => setValue(newValue as Dayjs | null)}
                                            showDaysOutsideCurrentMonth
                                            fixedWeekNumber={6}
                                            slots={{
                                                day: ServerDay,
                                            }}
                                            slotProps={{
                                                day: {
                                                    notifications,
                                                } as any,
                                            }}
                                            sx={{
                                                width: '100%',
                                                maxWidth: '800px',
                                                '& .MuiPickersCalendarHeader-root': {
                                                    pl: 4,
                                                    pr: 4,
                                                    pt: 2,
                                                    mb: 2,
                                                },
                                                '& .MuiPickersArrowSwitcher-root': {
                                                    gap: 1,
                                                },
                                                '& .MuiDayCalendar-weekDayLabel': {
                                                    width: 50,
                                                    height: 50,
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                },
                                                '& .MuiPickersDay-root': {
                                                    width: 50,
                                                    height: 50,
                                                    fontSize: '1rem',
                                                    m: 0.5,
                                                },
                                                '& .MuiPickersYear-yearButton': {
                                                    fontSize: '1.2rem',
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Box>

                                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                                <Box sx={{ minWidth: 200, pt: { xs: 0, md: 4 } }}>
                                    <Typography variant="subtitle2" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                                        Legend
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                                            <Typography variant="body2">Due within 2 days</Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                                            <Typography variant="body2">Due within 5 days</Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'info.main' }} />
                                            <Typography variant="body2">Future / Information</Typography>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Bottom Section: Events List */}
                <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                <EventRoundedIcon color="primary" />
                                <Typography variant="h6" fontWeight="bold">
                                    {value ? `Events for ${value.format('MMMM D, YYYY')}` : 'Events'}
                                </Typography>
                            </Stack>

                            <Box sx={{ width: '100%' }}>
                                {selectedDateEvents.length > 0 ? (
                                    <Grid container spacing={2}>
                                        {selectedDateEvents.map((event) => (
                                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={event._id}>
                                                <Card
                                                    variant="outlined"
                                                    sx={{
                                                        height: '100%',
                                                        p: 2,
                                                        borderLeft: '4px solid',
                                                        borderColor: (theme) => {
                                                            const color = getUrgencyColor(event.deadline!);
                                                            if (color === 'default') return theme.palette.grey[400];
                                                            // Explicitly cast to valid palette keys
                                                            const paletteKey = color as 'error' | 'warning' | 'info';
                                                            return theme.palette[paletteKey].main;
                                                        },
                                                        transition: 'transform 0.2s',
                                                        '&:hover': {
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: 2
                                                        }
                                                    }}
                                                >
                                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                                        <Box sx={{ mt: 0.5 }}>{getIcon(event.type)}</Box>
                                                        <Box flex={1}>
                                                            <Typography variant="subtitle2" fontWeight="bold">
                                                                {event.title}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                {event.message}
                                                            </Typography>
                                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Due: {dayjs(event.deadline).format('h:mm A')}
                                                                </Typography>
                                                            </Stack>
                                                        </Box>
                                                    </Stack>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Box sx={{ py: 8, textAlign: 'center' }}>
                                        <NotificationsRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="body1" color="text.secondary" fontWeight="medium">
                                            No deadlines for this day
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Select another date to view scheduled tasks
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
