import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';

interface Position {
    _id: string;
    code: string;
    title: string;
    description: string;
    departmentId: string;
    reportsToPositionId?: string;
    isActive: boolean;
}

interface Department {
    _id: string;
    name: string;
}

interface CreatePositionFormProps {
    departmentId?: string;
    departmentName?: string;
    departments?: Department[];
    onSuccess: () => void;
    onCancel: () => void;
}

export default function CreatePositionForm({ departmentId, departmentName, departments = [], onSuccess, onCancel }: CreatePositionFormProps) {
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        departmentId: departmentId || '',
        isActive: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (departmentId) {
            setFormData(prev => ({ ...prev, departmentId }));
        }
    }, [departmentId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const payload: any = {
                ...formData
            };

            // Should be already in formData, but ensure it's validated
            if (!payload.departmentId) {
                throw new Error('Department must be selected');
            }

            // Clean up empty optional fields
            if (!payload.code) delete payload.code;
            if (!payload.code) delete payload.code;

            const response = await fetch(`${apiUrl}/organization-structure/positions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create position');
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error creating position:', err);
            setError(err.message || 'Failed to create position');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
                {departmentName ? `Add Position to ${departmentName}` : 'Create New Position'}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Stack spacing={2}>
                {!departmentId && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Department *
                        </Typography>
                        <TextField
                            select
                            name="departmentId"
                            value={formData.departmentId}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            hiddenLabel
                            SelectProps={{
                                displayEmpty: true,
                                renderValue: (value: any) => {
                                    if (!value) {
                                        return <Typography color="text.secondary">Select a department</Typography>;
                                    }
                                    const selected = departments.find(d => d._id === value);
                                    return selected ? selected.name : value;
                                }
                            }}
                        >
                            {departments.map((dept) => (
                                <MenuItem key={dept._id} value={dept._id}>
                                    {dept.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                )}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Position Code
                    </Typography>
                    <TextField
                        name="code"
                        placeholder="e.g., ENG-SE-01 (Leave empty to auto-generate)"
                        value={formData.code}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        helperText="If left empty, a unique code will be generated automatically."
                        hiddenLabel
                    />
                </Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Title *
                    </Typography>
                    <TextField
                        name="title"
                        placeholder="e.g., Senior Software Engineer"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        fullWidth
                        size="small"
                        hiddenLabel
                    />
                </Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Description
                    </Typography>
                    <TextField
                        name="description"
                        placeholder="Enter position description..."
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={1}
                        fullWidth
                        size="small"
                        hiddenLabel
                    />
                </Box>



                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        Create Position
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
