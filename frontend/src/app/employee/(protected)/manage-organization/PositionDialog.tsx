'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';

interface PositionDialogProps {
    open: boolean;
    onClose: () => void;
    position?: any;
    departments: any[];
}

export default function PositionDialog({ open, onClose, position, departments }: PositionDialogProps) {
    const [formData, setFormData] = React.useState({
        code: '',
        title: '',
        description: '',
        departmentId: '',
        reportsToPositionId: '',
        isActive: true
    });

    React.useEffect(() => {
        if (position) {
            setFormData({
                code: position.code,
                title: position.title,
                description: position.description || '',
                departmentId: position.departmentId,
                reportsToPositionId: position.reportsToPositionId || '',
                isActive: position.isActive
            });
        } else {
            setFormData({
                code: '',
                title: '',
                description: '',
                departmentId: '',
                reportsToPositionId: '',
                isActive: true
            });
        }
    }, [position, open]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const token = localStorage.getItem('access_token');
        const url = position
            ? `${process.env.NEXT_PUBLIC_API_URL}/organization-structure/positions/${position._id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/organization-structure/positions`;

        const method = position ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onClose();
            } else {
                console.error('Failed to save position');
            }
        } catch (error) {
            console.error('Error saving position', error);
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{position ? 'Edit Position' : 'Create Position'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="code"
                        name="code"
                        label="Code"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.code}
                        onChange={handleChange}
                        disabled={!!position}
                    />
                    <TextField
                        required
                        margin="dense"
                        id="title"
                        name="title"
                        label="Title"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.title}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        id="description"
                        name="description"
                        label="Description"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={formData.description}
                        onChange={handleChange}
                    />
                    <TextField
                        id="departmentId"
                        select
                        name="departmentId"
                        label="Department"
                        fullWidth
                        required
                        margin="dense"
                        value={formData.departmentId}
                        onChange={handleChange}
                    >
                        {departments.map((option) => (
                            <MenuItem key={option._id} value={option._id}>
                                {option.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="dense"
                        id="reportsToPositionId"
                        name="reportsToPositionId"
                        label="Reports To Position ID"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.reportsToPositionId}
                        onChange={handleChange}
                        helperText="Optional: Enter the ID of the position this position reports to"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.isActive}
                                onChange={handleChange}
                                name="isActive"
                            />
                        }
                        label="Active"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained">Save</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
