'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert'; // Use standard MUI Alert
import Snackbar from '@mui/material/Snackbar'; // Check if standard Snackbar should be used or if there is a custom one. Stick to standard for now.
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

interface Position {
    _id: string;
    title: string;
}

interface Employee {
    _id: string;
    firstName: string;
    lastName: string;
    primaryPositionId?: string;
    positionTitle?: string;
}

export default function ComposeNotificationPage() {
    const [title, setTitle] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [type, setType] = React.useState('Info');
    const [isBroadcast, setIsBroadcast] = React.useState(false);
    const [deadline, setDeadline] = React.useState<Dayjs | null>(null);
    const [selectedEmployees, setSelectedEmployees] = React.useState<Employee[]>([]);
    const [selectedPositions, setSelectedPositions] = React.useState<Position[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [feedback, setFeedback] = React.useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    // Search states
    const [empSearchOpen, setEmpSearchOpen] = React.useState(false);
    const [empOptions, setEmpOptions] = React.useState<Employee[]>([]);
    const [empLoading, setEmpLoading] = React.useState(false);

    const [posSearchOpen, setPosSearchOpen] = React.useState(false);
    const [posOptions, setPosOptions] = React.useState<Position[]>([]);
    const [posLoading, setPosLoading] = React.useState(false);


    // Fetch Employees
    React.useEffect(() => {
        let active = true;

        if (!empSearchOpen) {
            return undefined;
        }

        (async () => {
            setEmpLoading(true);
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
            try {
                // Fetch all employees for now (paginated by default but we ask for list)
                const res = await fetch(`${apiUrl}/employee?limit=100`, { // Arbitrary limit for demo
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (active) {
                        setEmpOptions(data.items || []);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch employees", err);
            } finally {
                setEmpLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [empSearchOpen]);

    // Fetch Positions
    React.useEffect(() => {
        let active = true;

        if (!posSearchOpen) {
            return undefined;
        }

        (async () => {
            setPosLoading(true);
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
            try {
                const res = await fetch(`${apiUrl}/organization-structure/positions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (active) {
                        setPosOptions(data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch positions", err);
            } finally {
                setPosLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [posSearchOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('access_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

        const payload = {
            title,
            message,
            type,
            deadline: deadline ? deadline.toISOString() : undefined,
            deliveryType: (selectedPositions.length === 0 && selectedEmployees.length === 0) ? 'BROADCAST' : (selectedPositions.length > 0 || selectedEmployees.length > 1 ? 'MULTICAST' : 'UNICAST'),
            recipientId: selectedEmployees.map(e => e._id),
            positionIds: selectedPositions.map(p => p._id)
        };

        // Helper to check if it represents a broadcast
        const isBroadcast = payload.recipientId.length === 0 && payload.positionIds.length === 0;

        // No validation error for empty recipients anymore, as it implies BROADCAST

        try {
            const res = await fetch(`${apiUrl}/notification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setFeedback({ message: 'Notification sent successfully!', severity: 'success' });
                // Reset form
                setTitle('');
                setMessage('');
                setIsBroadcast(false);
                setDeadline(null);
                setSelectedEmployees([]);
                setSelectedPositions([]);
            } else {
                setFeedback({ message: 'Failed to send notification.', severity: 'error' });
            }
        } catch (error) {
            setFeedback({ message: 'An error occurred.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Compose Notification
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
                Send notifications to specific employees or entire roles.
            </Typography>

            <Card variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="body2" fontWeight={600} mb={1}>
                                Title *
                            </Typography>
                            <TextField
                                placeholder="Enter title"
                                hiddenLabel
                                required
                                fullWidth
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body2" fontWeight={600} mb={1}>
                                Message *
                            </Typography>
                            <TextField
                                placeholder="Enter message"
                                hiddenLabel
                                required
                                multiline
                                rows={1}
                                fullWidth
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body2" fontWeight={600} mb={1}>
                                Type
                            </Typography>
                            <TextField
                                select
                                hiddenLabel
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                fullWidth
                            >
                                <MenuItem value="Info">Info</MenuItem>
                                <MenuItem value="Alert">Alert</MenuItem>
                                <MenuItem value="Warning">Warning</MenuItem>
                                <MenuItem value="Success">Success</MenuItem>
                            </TextField>
                        </Box>

                        <Box>
                            <Typography variant="body2" fontWeight={600} mb={1}>
                                Deadline
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DateTimePicker
                                    value={deadline}
                                    onChange={(newValue) => setDeadline(newValue)}
                                    slotProps={{ textField: { fullWidth: true, hiddenLabel: true } }}
                                />
                            </LocalizationProvider>
                        </Box>

                        <Box>
                            <Typography variant="body2" fontWeight={600} mb={1}>
                                Search Employees
                                <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                                    (Leave empty to broadcast to everyone)
                                </Typography>
                            </Typography>
                            <Autocomplete
                                multiple
                                disabled={isBroadcast}
                                popupIcon={<UnfoldMoreRoundedIcon />}
                                filterSelectedOptions
                                open={empSearchOpen}
                                onOpen={() => setEmpSearchOpen(true)}
                                onClose={() => setEmpSearchOpen(false)}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                options={empOptions}
                                loading={empLoading}
                                value={selectedEmployees}
                                onChange={(event, newValue) => setSelectedEmployees(newValue)}
                                renderOption={(props, option) => {
                                    const { key, ...otherProps } = props;
                                    return (
                                        <li key={option._id} {...otherProps}>
                                            {option.firstName} {option.lastName}
                                        </li>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        hiddenLabel
                                        placeholder="Select employees"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {empLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body2" fontWeight={600} mb={1}>
                                Search Roles / Positions
                            </Typography>
                            <Autocomplete
                                multiple
                                disabled={isBroadcast}
                                popupIcon={<UnfoldMoreRoundedIcon />}
                                open={posSearchOpen}
                                onOpen={() => setPosSearchOpen(true)}
                                onClose={() => setPosSearchOpen(false)}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                getOptionLabel={(option) => option.title}
                                options={posOptions}
                                loading={posLoading}
                                value={selectedPositions}
                                onChange={(event, newValue) => setSelectedPositions(newValue)}
                                renderOption={(props, option) => {
                                    const { key, ...otherProps } = props;
                                    return (
                                        <li key={option._id} {...otherProps}>
                                            {option.title}
                                        </li>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        hiddenLabel
                                        placeholder="Select roles"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {posLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        >
                            {loading ? 'Sending...' : 'Send Notification'}
                        </Button>
                    </Stack>
                </form>
            </Card>

            <Snackbar open={!!feedback} autoHideDuration={6000} onClose={() => setFeedback(null)}>
                <Alert onClose={() => setFeedback(null)} severity={feedback?.severity || 'info'} sx={{ width: '100%' }}>
                    {feedback?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
