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
    Skeleton,
    TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import { AppraisalTemplate } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function AppraisalTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<AppraisalTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setError(null);
            const response = await fetch(`${API_URL}/performance/templates`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                credentials: 'include',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data = await response.json();
            setTemplates(data);
        } catch (error: any) {
            console.error('Failed to load templates', error);
            setError(error.message || 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                const response = await fetch(`${API_URL}/performance/templates/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                    credentials: 'include',
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to delete template: ${response.status} ${response.statusText} - ${errorText}`);
                }
                loadTemplates();
            } catch (error) {
                console.error('Failed to delete template', error);
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Appraisal Templates
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/employee/performance/templates/create')}
                >
                    Create Template
                </Button>
            </Box>

            {error && (
                <Box mb={3} p={2} bgcolor="error.light" color="error.contrastText" borderRadius={1}>
                    <Typography>{error}</Typography>
                </Box>
            )}

            <Paper sx={{ width: '100%', mb: 2 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Rating Scale</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                Array.from(new Array(5)).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                        <TableCell><Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 4 }} /></TableCell>
                                        <TableCell align="right">
                                            <Box display="flex" justifyContent="flex-end" gap={1}>
                                                <Skeleton variant="circular" width={40} height={40} />
                                                <Skeleton variant="circular" width={40} height={40} />
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                templates
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((template) => (
                                        <TableRow key={template._id}>
                                            <TableCell>{template.name}</TableCell>
                                            <TableCell>{template.templateType}</TableCell>
                                            <TableCell>{template.ratingScale.type}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={template.isActive ? 'Active' : 'Inactive'}
                                                    color={template.isActive ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => router.push(`/employee/performance/templates/${template._id}`)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDelete(template._id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                            {templates.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No templates found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={templates.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Container>
    );
}
