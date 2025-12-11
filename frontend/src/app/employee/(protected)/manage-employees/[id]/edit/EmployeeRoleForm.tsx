'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

enum SystemRole {
    DEPARTMENT_EMPLOYEE = 'department employee',
    DEPARTMENT_HEAD = 'department head',
    HR_MANAGER = 'HR Manager',
    HR_EMPLOYEE = 'HR Employee',
    PAYROLL_SPECIALIST = 'Payroll Specialist',
    SYSTEM_ADMIN = 'System Admin',
    LEGAL_POLICY_ADMIN = 'Legal & Policy Admin',
    RECRUITER = 'Recruiter',
    FINANCE_STAFF = 'Finance Staff',
    JOB_CANDIDATE = 'Job Candidate',
    HR_ADMIN = 'HR Admin',
    PAYROLL_MANAGER = 'Payroll Manager',
}

interface EmployeeRoleFormProps {
    employeeId: string;
    currentRoles: string[];
    onUpdate: () => void;
}

export default function EmployeeRoleForm({ employeeId, currentRoles, onUpdate }: EmployeeRoleFormProps) {
    const [roles, setRoles] = React.useState<string[]>(currentRoles || []);
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        setRoles(currentRoles || []);
    }, [currentRoles]);

    const toggleOpen = () => {
        setOpen((prev) => !prev);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const response = await fetch(`${apiUrl}/employee/${employeeId}/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ roles })
            });

            if (!response.ok) {
                throw new Error('Failed to update roles');
            }

            setMessage({ type: 'success', text: 'Roles updated successfully' });
            onUpdate();
        } catch (error) {
            setMessage({ type: 'error', text: 'Error updating roles' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                System Roles
            </Typography>

            {message && (
                <Alert severity={message.type} sx={{ mb: 3 }}>
                    {message.text}
                </Alert>
            )}

            <Grid container spacing={2} alignItems="flex-start">
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Assigned Roles
                    </Typography>
                    <Grid container spacing={2} alignItems="stretch">
                        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
                            <Autocomplete
                                multiple
                                open={open}
                                onOpen={() => setOpen(true)}
                                onClose={() => setOpen(false)}
                                options={Object.values(SystemRole)}
                                value={roles}
                                onChange={(event, newValue) => {
                                    setRoles(newValue);
                                }}
                                forcePopupIcon={false}
                                sx={{ flexGrow: 1 }}
                                renderTags={(value: readonly string[], getTagProps) =>
                                    value.map((option: string, index: number) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return (
                                            <Chip variant="outlined" label={option} key={key} {...tagProps} />
                                        );
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                    />
                                )}
                            />
                            <Button
                                variant="outlined"
                                onClick={toggleOpen}
                                sx={{ ml: 1, minWidth: 0, px: 1, borderColor: 'rgba(0, 0, 0, 0.23)' }}
                            >
                                <ArrowDropDownIcon />
                            </Button>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading}
                                sx={{ height: '100%', px: 4, width: { xs: '100%', md: 'auto' } }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Update Roles'}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
}
