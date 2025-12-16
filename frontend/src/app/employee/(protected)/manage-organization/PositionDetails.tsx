import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import SaveIcon from '@mui/icons-material/Save';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

interface Position {
    _id: string;
    code: string;
    title: string;
    description: string;
    reportsToPositionId?: string;
    departmentId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Department {
    _id: string;
    code: string;
    name: string;
}

interface PositionDetailsProps {
    position: Position | null;
    onUpdate: (id: string, data: Partial<Position>) => void;
    departments: Department[];
    positions: Position[];
}

import Autocomplete from '@mui/material/Autocomplete';

export default function PositionDetails({ position, onUpdate, departments, positions }: PositionDetailsProps) {
    const [formData, setFormData] = React.useState({
        title: '',
        description: '',
        reportsToPositionId: '',
        departmentId: '',
        isActive: true
    });

    React.useEffect(() => {
        if (position) {
            setFormData({
                title: position.title || '',
                description: position.description || '',
                reportsToPositionId: position.reportsToPositionId || '',
                departmentId: position.departmentId || '',
                isActive: position.isActive
            });
        }
    }, [position]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (position) {
            onUpdate(position._id, formData);
        }
    };

    if (!position) {
        return (
            <Card variant="outlined" sx={{ mt: 4, width: '100%', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderStyle: 'dashed' }}>
                <Box textAlign="center">
                    <WorkOutlineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary">
                        Select a position to view details
                    </Typography>
                </Box>
            </Card>
        );
    }

    return (
        <Card variant="outlined" sx={{ mt: 4, width: '100%', borderRadius: 2 }}>
            <CardContent>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={4}
                    divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}
                >
                    {/* Left Side: Minimal Read-only Details */}
                    <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                        <Typography variant="h6" component="div" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                            Details
                        </Typography>

                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                                    CODE
                                </Typography>
                                <Chip
                                    label={position.code}
                                    size="small"
                                    sx={{
                                        fontWeight: 'bold',
                                        borderRadius: '4px',
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText'
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                                    CREATED AT
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                    {new Date(position.createdAt).toLocaleDateString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(position.createdAt).toLocaleTimeString()}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                                    LAST UPDATED
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                    {new Date(position.updatedAt).toLocaleDateString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(position.updatedAt).toLocaleTimeString()}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Right Side: Edit Form */}
                    <Box sx={{ width: { xs: '100%', md: '70%' } }}>
                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" component="div" fontWeight="bold">
                                    Edit Position
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    type="submit"
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                    Save Changes
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    placeholder="Title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    variant="outlined"
                                    size="small"
                                />
                                <TextField
                                    fullWidth
                                    placeholder="Description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    variant="outlined"
                                    size="small"
                                    multiline
                                    rows={1}
                                />
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Reports To Position
                                    </Typography>
                                    <Autocomplete
                                        fullWidth
                                        options={positions}
                                        getOptionLabel={(option) => `${option.title} (${option.code})`}
                                        value={positions.find(p => p._id === formData.reportsToPositionId) || null}
                                        onChange={(event, newValue) => {
                                            setFormData(prev => ({ ...prev, reportsToPositionId: newValue ? newValue._id : '' }));
                                        }}
                                        popupIcon={null}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                placeholder="Search position..."
                                                variant="outlined"
                                                size="small"
                                                helperText="Optional"
                                                hiddenLabel
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: null
                                                }}
                                            />
                                        )}
                                    />
                                </Box>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Department
                                    </Typography>
                                    <Autocomplete
                                        fullWidth
                                        options={departments}
                                        getOptionLabel={(option) => `${option.name} (${option.code})`}
                                        value={departments.find(d => d._id === formData.departmentId) || null}
                                        onChange={(event, newValue) => {
                                            setFormData(prev => ({ ...prev, departmentId: newValue ? newValue._id : '' }));
                                        }}
                                        popupIcon={null}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                placeholder="Search department..."
                                                variant="outlined"
                                                size="small"
                                                hiddenLabel
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: null
                                                }}
                                            />
                                        )}
                                    />
                                </Box>
                            </Stack>
                            <Button
                                fullWidth
                                variant="contained"
                                color={formData.isActive ? 'error' : 'primary'}
                                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                            >
                                {formData.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                        </form>
                    </Box>
                </Stack>
            </CardContent>
        </Card >
    );
}
