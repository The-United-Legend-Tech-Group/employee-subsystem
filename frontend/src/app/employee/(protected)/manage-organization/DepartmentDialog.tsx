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

interface DepartmentDialogProps {
    open: boolean;
    onClose: () => void;
    department?: any;
}

export default function DepartmentDialog({ open, onClose, department }: DepartmentDialogProps) {
    const [formData, setFormData] = React.useState({
        code: '',
        name: '',
        description: '',
        isActive: true,
        headPositionId: ''
    });

    React.useEffect(() => {
        if (department) {
            setFormData({
                code: department.code,
                name: department.name,
                description: department.description || '',
                isActive: department.isActive,
                headPositionId: department.headPositionId || ''
            });
        } else {
            setFormData({
                code: '',
                name: '',
                description: '',
                isActive: true,
                headPositionId: ''
            });
        }
    }, [department, open]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const token = localStorage.getItem('access_token');
        const url = department
            ? `${process.env.NEXT_PUBLIC_API_URL}/organization-structure/departments/${department._id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/organization-structure/departments`;

        const method = department ? 'PATCH' : 'POST';

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
                console.error('Failed to save department');
                // You might want to show an error message
            }
        } catch (error) {
            console.error('Error saving department', error);
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
            <DialogTitle>{department ? 'Edit Department' : 'Create Department'}</DialogTitle>
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
                        disabled={!!department}
                    />
                    <TextField
                        required
                        margin="dense"
                        id="name"
                        name="name"
                        label="Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.name}
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
                        margin="dense"
                        id="headPositionId"
                        name="headPositionId"
                        label="Head Position ID"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.headPositionId}
                        onChange={handleChange}
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
