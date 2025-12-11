'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import TemplateForm from '../components/TemplateForm';
import { appraisalTemplateService } from '../../services/appraisal-template.service';
import { organizationService } from '../../services/organization.service';
import { CreateAppraisalTemplateDto, Department, Position } from '../types';

export default function CreateTemplatePage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [depts, pos] = await Promise.all([
                    organizationService.getDepartments(),
                    organizationService.getPositions(),
                ]);
                setDepartments(depts);
                setPositions(pos);
            } catch (error) {
                console.error('Failed to fetch organization data', error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (data: CreateAppraisalTemplateDto) => {
        try {
            await appraisalTemplateService.create(data);
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
