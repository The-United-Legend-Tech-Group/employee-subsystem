'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';

interface Employee {
    _id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
        name: string;
    };
    position?: {
        title: string;
    };
}

interface AssignEmployeeFormProps {
    positionId: string;
    positionCode: string; // For display
    positionTitle: string; // For display
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AssignEmployeeForm({
    positionId,
    positionCode,
    positionTitle,
    onSuccess,
    onCancel,
}: AssignEmployeeFormProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
    const [startDate, setStartDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = React.useState<string>('');

    // Debounce search
    const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    React.useEffect(() => {
        fetchEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery]);

    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const queryParams = new URLSearchParams();
            if (debouncedSearchQuery) {
                queryParams.append('search', debouncedSearchQuery);
            }
            queryParams.append('limit', '50'); // Reasonable limit for search results

            const response = await fetch(`${apiUrl}/employee?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }

            const data = await response.json();
            // Handle pagination structure if present
            if (data && Array.isArray(data.items)) {
                setEmployees(data.items);
            } else if (Array.isArray(data)) {
                setEmployees(data);
            } else {
                setEmployees([]);
            }

        } catch (err) {
            console.error('Error fetching employees:', err);
            setError('Failed to fetch employees for assignment.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedEmployeeId || !startDate) return;

        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const payload = {
                employeeId: selectedEmployeeId,
                positionId,
                startDate,
                endDate: endDate || undefined
            };

            const response = await fetch(`${apiUrl}/organization-structure/assignments`, {
                method: 'POST', // Changed from PATCH
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to assign employee to position');
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error assigning employee:', err);
            setError(err.message || 'Failed to assign employee.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box mb={4}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Assign Employee to Position
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Select an employee to assign to <strong>{positionTitle} ({positionCode})</strong>.
                    This will update the employee's current position.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Stack spacing={3}>
                <TextField
                    placeholder="Search employees by name, ID or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: loading ? <CircularProgress size={20} /> : null
                    }}
                />

                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List>
                        {employees.length === 0 && !loading ? (
                            <ListItem>
                                <ListItemText primary="No employees found" sx={{ textAlign: 'center', color: 'text.secondary' }} />
                            </ListItem>
                        ) : (
                            employees.map((employee) => (
                                <ListItem
                                    key={employee._id}
                                    disablePadding
                                    secondaryAction={
                                        <Radio
                                            checked={selectedEmployeeId === employee._id}
                                            onChange={() => setSelectedEmployeeId(employee._id)}
                                            value={employee._id}
                                            name="employee-radio"
                                        />
                                    }
                                >
                                    <ListItemButton
                                        onClick={() => setSelectedEmployeeId(employee._id)}
                                        selected={selectedEmployeeId === employee._id}
                                    >
                                        <ListItemAvatar>
                                            <Avatar>
                                                <PersonIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`${employee.firstName} ${employee.lastName}`}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary">
                                                        {employee.employeeId} - {employee.email}
                                                    </Typography>
                                                    <br />
                                                    {employee.position?.title ? `Current Position: ${employee.position.title}` : 'No Position'}
                                                    {employee.department?.name ? ` | ${employee.department.name}` : ''}
                                                </>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))
                        )}
                    </List>
                </Paper>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="End Date (Optional)"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                        variant="outlined"
                        onClick={onCancel}
                        disabled={submitting}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAssign}
                        disabled={!selectedEmployeeId || !startDate || submitting}
                        sx={{ textTransform: 'none' }}
                    >
                        {submitting ? 'Assigning...' : 'Assign Employee'}
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
}
