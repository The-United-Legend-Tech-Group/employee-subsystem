import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface Position {
    _id: string;
    code: string;
    title: string;
}

interface CreateDepartmentFormProps {
    positions?: Position[];
    onSuccess: () => void;
    onCancel: () => void;
}

export default function CreateDepartmentForm({ positions = [], onSuccess, onCancel }: CreateDepartmentFormProps) {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        headPositionId: '',
        isActive: true
    });
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            // Clean up empty optional fields
            if (!payload.headPositionId) delete payload.headPositionId;
            if (!payload.code) delete payload.code;

            const response = await fetch(`${apiUrl}/organization-structure/departments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create department');
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error creating department:', err);
            setError(err.message || 'Failed to create department');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
                Create New Department
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Stack spacing={2}>
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Department Code
                    </Typography>
                    <TextField
                        name="code"
                        placeholder="e.g., DEPT-001 (Leave empty to auto-generate)"
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
                        Name *
                    </Typography>
                    <TextField
                        name="name"
                        placeholder="e.g., Engineering"
                        value={formData.name}
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
                        placeholder="Enter department description..."
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={1}
                        fullWidth
                        size="small"
                        hiddenLabel
                    />
                </Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Department Head (Make sure to create or select a position)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Autocomplete
                            open={open}
                            onOpen={() => setOpen(true)}
                            onClose={() => setOpen(false)}
                            options={positions}
                            getOptionLabel={(option) => `${option.title} (${option.code})`}
                            value={positions.find(p => p._id === formData.headPositionId) || null}
                            onChange={(event, newValue) => {
                                setFormData(prev => ({
                                    ...prev,
                                    headPositionId: newValue ? newValue._id : ''
                                }));
                            }}
                            forcePopupIcon={false}
                            sx={{ flexGrow: 1 }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select department head"
                                    fullWidth
                                    size="small"
                                    hiddenLabel
                                />
                            )}
                        />
                        {/* <Button
                            variant="outlined"
                            onClick={() => setOpen((prev) => !prev)}
                            onMouseDown={(e) => e.preventDefault()}
                            sx={{ minWidth: 40, minHeight: 10, p: 0, borderColor: 'rgba(0, 0, 0, 0.23)' }}
                        >
                            <ArrowDropDownIcon />
                        </Button> */}
                    </Box>
                </Box>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={formData.isActive}
                            onChange={handleChange}
                            name="isActive"
                        />
                    }
                    label="Active"
                />

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
                        Create Department
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
