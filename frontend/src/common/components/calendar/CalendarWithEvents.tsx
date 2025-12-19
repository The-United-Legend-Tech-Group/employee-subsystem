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
import CircularProgress from '@mui/material/CircularProgress';
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

export interface CalendarEvent {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    deadline?: string;
}

interface CalendarWithEventsProps {
    title?: string;
    fetchEvents?: () => Promise<CalendarEvent[]>;
    events?: CalendarEvent[];
    notificationPath?: string;
}

function ServerDay(props: PickersDayProps & { highlightedDays?: number[], events?: CalendarEvent[] }) {
    const { highlightedDays = [], day, outsideCurrentMonth, events = [], ...other } = props;

    // Find events for this day
    const dayEvents = events.filter(e =>
        e.deadline && dayjs(e.deadline).isSame(day, 'day')
    );

    const hasEvents = dayEvents.length > 0;

    // Determine closest deadline color
    // Red: <= 2 days from now (if future or today)
    // Orange: <= 5 days
    // Blue: > 5 days or past

    let badgeColor = 'primary';
    if (hasEvents) {
        const today = dayjs();
        const diff = day.diff(today, 'day');
        if (diff < 0) badgeColor = 'default'; // Past
        else if (diff <= 2) badgeColor = 'error';
        else if (diff <= 5) badgeColor = 'warning';
        else badgeColor = 'info';
    }

    return (
        <Badge
            key={props.day.toString()}
            overlap="circular"
            badgeContent={hasEvents ? dayEvents.length : undefined}
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

export default function CalendarWithEvents({ 
    title = 'Calendar & Schedule',
    fetchEvents,
    events: providedEvents,
    notificationPath
}: CalendarWithEventsProps) {
    const theme = useTheme();
    const [value, setValue] = React.useState<Dayjs | null>(dayjs());
    const [events, setEvents] = React.useState<CalendarEvent[]>(providedEvents || []);
    const [loading, setLoading] = React.useState(!providedEvents);
    const [selectedDateEvents, setSelectedDateEvents] = React.useState<CalendarEvent[]>([]);

    React.useEffect(() => {
        if (providedEvents) {
            setEvents(providedEvents);
            setLoading(false);
            return;
        }

        if (fetchEvents) {
            const loadEvents = async () => {
                try {
                    const data = await fetchEvents();
                    setEvents(data);
                } catch (error) {
                    console.error('Error fetching events', error);
                } finally {
                    setLoading(false);
                }
            };
            loadEvents();
        } else {
            // Default: fetch from notifications API
            const loadNotifications = async () => {
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
                        setEvents(data);
                    }
                } catch (error) {
                    console.error('Error fetching notifications', error);
                } finally {
                    setLoading(false);
                }
            };
            loadNotifications();
        }
    }, [fetchEvents, providedEvents]);

    React.useEffect(() => {
        if (!value) return;

        // Filter events for selected date
        const filteredEvents = events.filter(e =>
            e.deadline && dayjs(e.deadline).isSame(value, 'day')
        );
        setSelectedDateEvents(filteredEvents);
    }, [value, events]);

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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                {title}
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
                                            onChange={(newValue) => setValue(newValue)}
                                            loading={loading}
                                            renderLoading={() => <DayCalendarSkeleton />}
                                            showDaysOutsideCurrentMonth
                                            fixedWeekNumber={6}
                                            slots={{
                                                day: ServerDay,
                                            }}
                                            slotProps={{
                                                day: {
                                                    events,
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
                                                            return color === 'default' ? 'grey.400' : theme.palette[color].main;
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


