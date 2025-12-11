'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import TemplateForm from '../components/TemplateForm';
import { appraisalTemplateService } from '../../services/appraisal-template.service';
import { organizationService } from '../../services/organization.service';
import { CreateAppraisalTemplateDto, Department, Position, AppraisalTemplate } from '../types';

export default function EditTemplatePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [template, setTemplate] = useState<AppraisalTemplate | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tmpl, depts, pos] = await Promise.all([
                    appraisalTemplateService.findOne(id),
                    organizationService.getDepartments(),
                    organizationService.getPositions(),
                ]);
                setTemplate(tmpl);
                setDepartments(depts);
                setPositions(pos);
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

    const handleSubmit = async (data: CreateAppraisalTemplateDto) => {
        try {
            await appraisalTemplateService.update(id, data);
            router.push('/employee/performance/templates');
        } catch (error) {
            console.error('Failed to update template', error);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
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
        </Container>
    );
}
