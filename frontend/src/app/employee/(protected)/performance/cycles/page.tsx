'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Stack,
    Skeleton,
    Snackbar,
    Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { AppraisalCycle, AppraisalTemplateType, CreateAppraisalCycleDto, UpdateAppraisalCycleDto, AppraisalCycleStatus } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function AppraisalCyclesPage() {
    const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCycle, setEditingCycle] = useState<AppraisalCycle | null>(null);
    const [formData, setFormData] = useState<CreateAppraisalCycleDto>({
        name: '',
        description: '',
        cycleType: AppraisalTemplateType.ANNUAL,
        startDate: '',
        endDate: '',
        managerDueDate: '',
        employeeAcknowledgementDueDate: '',
    });

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        loadCycles();
    }, []);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const loadCycles = async () => {
        try {
            setError(null);
            const response = await fetch(`${API_URL}/performance/cycles`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                credentials: 'include',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch cycles: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data = await response.json();
            setCycles(data);
        } catch (error: any) {
            console.error('Failed to load cycles', error);
            setError(error.message || 'Failed to load cycles');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (cycle?: AppraisalCycle) => {
        if (cycle) {
            setEditingCycle(cycle);
            setFormData({
                name: cycle.name,
                description: cycle.description || '',
                cycleType: cycle.cycleType,
                startDate: cycle.startDate.split('T')[0],
                endDate: cycle.endDate.split('T')[0],
                managerDueDate: cycle.managerDueDate ? cycle.managerDueDate.split('T')[0] : '',
                employeeAcknowledgementDueDate: cycle.employeeAcknowledgementDueDate ? cycle.employeeAcknowledgementDueDate.split('T')[0] : '',
            });
        } else {
            setEditingCycle(null);
            setFormData({
                name: '',
                description: '',
                cycleType: AppraisalTemplateType.ANNUAL,
                startDate: '',
                endDate: '',
                managerDueDate: '',
                employeeAcknowledgementDueDate: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCycle(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            if (editingCycle) {
                const response = await fetch(`${API_URL}/performance/cycles/${editingCycle._id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include',
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to update cycle: ${response.status} ${response.statusText} - ${errorText}`);
                }
                setSnackbar({ open: true, message: 'Cycle updated successfully', severity: 'success' });
            } else {
                const response = await fetch(`${API_URL}/performance/cycles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include',
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to create cycle: ${response.status} ${response.statusText} - ${errorText}`);
                }
                setSnackbar({ open: true, message: 'Cycle created successfully', severity: 'success' });
            }
            handleCloseDialog();
            loadCycles();
        } catch (error: any) {
            console.error('Failed to save cycle', error);
            setSnackbar({ open: true, message: error.message || 'Failed to save cycle', severity: 'error' });
        }
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cycleToDelete, setCycleToDelete] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setCycleToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!cycleToDelete) return;

        try {
            const response = await fetch(`${API_URL}/performance/cycles/${cycleToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                credentials: 'include',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete cycle: ${response.status} ${response.statusText} - ${errorText}`);
            }
            setSnackbar({ open: true, message: 'Cycle deleted successfully', severity: 'success' });
            loadCycles();
        } catch (error: any) {
            console.error('Failed to delete cycle', error);
            setSnackbar({ open: true, message: error.message || 'Failed to delete cycle', severity: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setCycleToDelete(null);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Appraisal Cycles
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Create Cycle
                </Button>
            </Box>

            {error && (
                <Box mb={3} p={2} bgcolor="error.light" color="error.contrastText" borderRadius={1}>
                    <Typography>{error}</Typography>
                </Box>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton animation="wave" /></TableCell>
                                    <TableCell><Skeleton animation="wave" /></TableCell>
                                    <TableCell><Skeleton animation="wave" /></TableCell>
                                    <TableCell><Skeleton animation="wave" /></TableCell>
                                    <TableCell><Skeleton animation="wave" /></TableCell>
                                    <TableCell align="right"><Skeleton animation="wave" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <>
                                {cycles.map((cycle) => (
                                    <TableRow key={cycle._id}>
                                        <TableCell>{cycle.name}</TableCell>
                                        <TableCell>{cycle.cycleType}</TableCell>
                                        <TableCell>{new Date(cycle.startDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(cycle.endDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={cycle.status}
                                                color={cycle.status === AppraisalCycleStatus.ACTIVE ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenDialog(cycle)} size="small">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteClick(cycle._id)} size="small" color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {cycles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No appraisal cycles found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{editingCycle ? 'Edit Appraisal Cycle' : 'Create Appraisal Cycle'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2 }}>
                        <Stack spacing={2}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Name</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Box>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Cycle Type</Typography>
                                    <TextField
                                        fullWidth
                                        select
                                        hiddenLabel
                                        name="cycleType"
                                        value={formData.cycleType}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {Object.values(AppraisalTemplateType).map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </Stack>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Description</Typography>
                                <TextField
                                    fullWidth
                                    hiddenLabel
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={1}
                                />
                            </Box>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Start Date</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Box>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>End Date</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Box>
                            </Stack>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Manager Due Date</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="managerDueDate"
                                        type="date"
                                        value={formData.managerDueDate}
                                        onChange={handleInputChange}
                                    />
                                </Box>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Employee Acknowledgement Due Date</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="employeeAcknowledgementDueDate"
                                        type="date"
                                        value={formData.employeeAcknowledgementDueDate}
                                        onChange={handleInputChange}
                                    />
                                </Box>
                            </Stack>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this appraisal cycle? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
