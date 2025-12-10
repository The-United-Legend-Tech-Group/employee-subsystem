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

interface Department {
    _id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    headPositionId?: string;
}

interface DepartmentDetailsProps {
    department: Department | null;
    onUpdate: (id: string, data: Partial<Department>) => void;
}

export default function DepartmentDetails({ department, onUpdate }: DepartmentDetailsProps) {
    const [formData, setFormData] = React.useState({
        name: '',
        description: '',
        headPositionId: '',
        isActive: true
    });

    React.useEffect(() => {
        if (department) {
            setFormData({
                name: department.name || '',
                description: department.description || '',
                headPositionId: department.headPositionId || '',
                isActive: department.isActive
            });
        }
    }, [department]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (department) {
            onUpdate(department._id, formData);
        }
    };

    if (!department) {
        return (
            <Card variant="outlined" sx={{ mt: 4, width: '100%', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderStyle: 'dashed' }}>
                <Box textAlign="center">
                    <WorkOutlineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary">
                        Select a department to view details
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
                                    label={department.code}
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
                                    {new Date(department.createdAt).toLocaleDateString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(department.createdAt).toLocaleTimeString()}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                                    LAST UPDATED
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                    {new Date(department.updatedAt).toLocaleDateString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(department.updatedAt).toLocaleTimeString()}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Right Side: Edit Form */}
                    <Box sx={{ width: { xs: '100%', md: '70%' } }}>
                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" component="div" fontWeight="bold">
                                    Edit Department
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
                                    placeholder="Name"
                                    name="name"
                                    value={formData.name}
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
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color={formData.isActive ? 'error' : 'primary'}
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                    sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                                >
                                    {formData.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
