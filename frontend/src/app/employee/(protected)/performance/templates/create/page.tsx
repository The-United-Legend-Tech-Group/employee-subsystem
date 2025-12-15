'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import TemplateForm from '../components/TemplateForm';
import { CreateAppraisalTemplateDto, Department, Position } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function CreateTemplatePage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [deptsRes, posRes] = await Promise.all([
                    fetch(`${API_URL}/organization-structure/departments`, { headers, credentials: 'include' }),
                    fetch(`${API_URL}/organization-structure/positions`, { headers, credentials: 'include' }),
                ]);

                if (deptsRes.ok) setDepartments(await deptsRes.json());
                if (posRes.ok) setPositions(await posRes.json());
            } catch (error) {
                console.error('Failed to fetch organization data', error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (data: CreateAppraisalTemplateDto) => {
        try {
            const response = await fetch(`${API_URL}/performance/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create template: ${response.status} ${response.statusText} - ${errorText}`);
            }

            router.push('/employee/performance/templates');
        } catch (error) {
            console.error('Failed to create template', error);
            // Handle error (e.g., show notification)
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box mb={3}>
                <Typography variant="h4" component="h1">
                    Create Appraisal Template
                </Typography>
            </Box>
            <TemplateForm
                departments={departments}
                positions={positions}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/employee/performance/templates')}
            />
        </Container>
    );
}
