'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Skeleton, Stack, Snackbar, Alert } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import TemplateForm from '../components/TemplateForm';
import { CreateAppraisalTemplateDto, Department, Position, AppraisalTemplate } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function EditTemplatePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [template, setTemplate] = useState<AppraisalTemplate | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tmplRes, deptsRes, posRes] = await Promise.all([
                    fetch(`${API_URL}/performance/templates/${id}`, { credentials: 'include' }),
                    fetch(`${API_URL}/organization-structure/departments`, { credentials: 'include' }),
                    fetch(`${API_URL}/organization-structure/positions`, { credentials: 'include' }),
                ]);

                if (tmplRes.ok) setTemplate(await tmplRes.json());
                if (deptsRes.ok) setDepartments(await deptsRes.json());
                if (posRes.ok) setPositions(await posRes.json());
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchData();
        }
    }, [id]);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSubmit = async (data: CreateAppraisalTemplateDto) => {
        try {
            const response = await fetch(`${API_URL}/performance/templates/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update template: ${response.status} ${response.statusText} - ${errorText}`);
            }

            setSnackbar({ open: true, message: 'Template updated successfully', severity: 'success' });
        } catch (error) {
            console.error('Failed to update template', error);
            setSnackbar({ open: true, message: `Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' });
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box mb={3}>
                    <Skeleton variant="text" width={400} height={60} />
                </Box>
                <Stack spacing={3}>
                    <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="rectangular" height={56} width="50%" sx={{ borderRadius: 1 }} />
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                </Stack>
            </Container>
        );
    }

    if (!template) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h5">Template not found</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box mb={3}>
                <Typography variant="h4" component="h1">
                    Edit Appraisal Template
                </Typography>
            </Box>
            <TemplateForm
                initialData={template}
                departments={departments}
                positions={positions}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/employee/performance/templates')}
            />
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
