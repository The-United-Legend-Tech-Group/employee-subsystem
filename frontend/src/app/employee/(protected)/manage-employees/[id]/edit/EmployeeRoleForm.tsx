'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';


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
    currentPermissions?: string[];
    onUpdate: () => void;
}

export default function EmployeeRoleForm({ employeeId, currentRoles, currentPermissions = [], onUpdate }: EmployeeRoleFormProps) {
    const [roles, setRoles] = React.useState<string[]>(currentRoles || []);
    const [permissions, setPermissions] = React.useState<string[]>(currentPermissions || []);
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        setRoles(currentRoles || []);
        setPermissions(currentPermissions || []);
    }, [currentRoles, currentPermissions]);



    const handleSubmit = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
            const response = await fetch(`${apiUrl}/employee/${employeeId}/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ roles, permissions })
            });

            if (!response.ok) {
                throw new Error('Failed to update roles');
            }

            setMessage({ type: 'success', text: 'Roles and permissions updated successfully' });
            onUpdate();
        } catch (error) {
            setMessage({ type: 'error', text: 'Error updating roles' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    System Roles
                </Typography>

                <form onSubmit={(e) => e.preventDefault()}>
                    <Grid container spacing={3} alignItems="flex-start">
                        {/* Current Roles Display */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Current Roles
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {currentRoles.length > 0 ? (
                                        currentRoles.map((role, index) => (
                                            <Chip
                                                key={index}
                                                label={role}
                                                color="primary"
                                                variant="filled"
                                                size="medium"
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No roles assigned
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Current Permissions Display */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Current Permissions
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {currentPermissions.length > 0 ? (
                                        currentPermissions.map((permission, index) => (
                                            <Chip
                                                key={index}
                                                label={permission}
                                                color="secondary"
                                                variant="filled"
                                                size="medium"
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No permissions assigned
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Role Selection */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={500}>
                                    Modify Roles
                                </Typography>
                            </Box>
                            <Autocomplete
                                multiple
                                fullWidth
                                options={Object.values(SystemRole)}
                                value={roles}
                                onChange={(event, newValue) => {
                                    setRoles(newValue);
                                }}
                                slotProps={{
                                    chip: {
                                        variant: 'outlined',
                                    } as any,
                                }}
                                sx={{
                                    '& .MuiAutocomplete-inputRoot': {
                                        alignItems: 'center',
                                        minHeight: '56px',
                                    },
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select roles to assign"
                                    />
                                )}
                            />
                        </Grid>

                        {/* Permissions Selection */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={500}>
                                    Modify Permissions (Press enter to add)
                                </Typography>
                            </Box>
                            <Stack spacing={2}>
                                {/* Display permission chips */}
                                {permissions.length > 0 && (
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {permissions.map((permission, index) => (
                                            <Chip
                                                key={index}
                                                label={permission}
                                                variant="outlined"
                                                onDelete={() => {
                                                    setPermissions(permissions.filter((_, i) => i !== index));
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                )}
                                {/* Input field */}
                                <TextField
                                    fullWidth
                                    placeholder="Type permission and press Enter to add"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const input = e.target as HTMLInputElement;
                                            const value = input.value.trim();
                                            if (value && !permissions.includes(value)) {
                                                setPermissions([...permissions, value]);
                                                input.value = '';
                                            }
                                        }
                                    }}
                                />
                            </Stack>
                        </Grid>

                        {/* Submit Button */}
                        <Grid size={{ xs: 12 }}>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading}
                                size="large"
                                sx={{ px: 4 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Update Roles & Permissions'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            <Snackbar
                open={!!message}
                autoHideDuration={6000}
                onClose={() => setMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setMessage(null)}
                    severity={message?.type || 'info'}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {message?.text}
                </Alert>
            </Snackbar>
        </>
    );
}
