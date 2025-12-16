'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    TextField,
    Slider,
    Divider,
    Grid,
    Card,
    CardContent,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { decryptData } from '@/common/utils/encryption';
import { AppraisalAssignment } from '../../assignments/types';
import { AppraisalTemplate, EvaluationCriterion } from '../../templates/types';
import { AppraisalRecord, CreateAppraisalRecordDto, UpdateAppraisalRecordDto, RatingEntry } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function AppraisalFormPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.id as string;

    const [assignment, setAssignment] = useState<AppraisalAssignment | null>(null);
    const [template, setTemplate] = useState<AppraisalTemplate | null>(null);
    const [record, setRecord] = useState<AppraisalRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [ratings, setRatings] = useState<Record<string, { value: number; comments: string }>>({});
    const [managerSummary, setManagerSummary] = useState('');
    const [strengths, setStrengths] = useState('');
    const [improvementAreas, setImprovementAreas] = useState('');
    const [goals, setGoals] = useState('');

    useEffect(() => {
        loadData();
    }, [assignmentId]);

    const loadData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                throw new Error('Authentication details missing');
            }

            const managerId = await decryptData(encryptedEmployeeId, token);
            if (!managerId) {
                throw new Error('Failed to decrypt manager ID');
            }

            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Fetch Assignment (via list and filter)
            const assignmentsRes = await fetch(`${API_URL}/performance/assignments?managerId=${managerId}`, { headers });
            if (!assignmentsRes.ok) throw new Error('Failed to fetch assignments');
            const assignments: AppraisalAssignment[] = await assignmentsRes.json();
            const currentAssignment = assignments.find(a => a._id === assignmentId);

            if (!currentAssignment) {
                throw new Error('Assignment not found');
            }
            setAssignment(currentAssignment);

            // 2. Fetch Template
            let templateId: string;
            if (currentAssignment.templateId && typeof currentAssignment.templateId === 'object' && '_id' in currentAssignment.templateId) {
                const rawId = (currentAssignment.templateId as any)._id;
                templateId = typeof rawId === 'string' ? rawId : String(rawId);
            } else if (typeof currentAssignment.templateId === 'string') {
                templateId = currentAssignment.templateId;
            } else {
                throw new Error('Invalid Template ID in assignment');
            }

            const templateRes = await fetch(`${API_URL}/performance/templates/${templateId}`, { headers });
            if (!templateRes.ok) throw new Error('Failed to fetch template');
            const templateData: AppraisalTemplate = await templateRes.json();
            setTemplate(templateData);

            // 3. Fetch Record if exists
            if (currentAssignment.latestAppraisalId) {
                const recordRes = await fetch(`${API_URL}/performance/records/${currentAssignment.latestAppraisalId}`, { headers });
                if (!recordRes.ok) throw new Error('Failed to fetch appraisal record');
                const recordData: AppraisalRecord = await recordRes.json();
                setRecord(recordData);

                // Populate form
                const initialRatings: Record<string, { value: number; comments: string }> = {};
                recordData.ratings.forEach(r => {
                    if (r.key === 'GOALS') {
                        setGoals(r.comments || '');
                    } else {
                        initialRatings[r.key] = { value: r.ratingValue, comments: r.comments || '' };
                    }
                });
                setRatings(initialRatings);
                setManagerSummary(recordData.managerSummary || '');
                setStrengths(recordData.strengths || '');
                setImprovementAreas(recordData.improvementAreas || '');
            } else {
                // Initialize empty ratings based on template
                const initialRatings: Record<string, { value: number; comments: string }> = {};
                templateData.criteria?.forEach((c: any) => {
                    initialRatings[c.key] = { value: templateData.ratingScale?.min || 0, comments: '' };
                });
                setRatings(initialRatings);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (key: string, value: number) => {
        setRatings(prev => ({
            ...prev,
            [key]: { ...prev[key], value }
        }));
    };

    const handleCommentChange = (key: string, comment: string) => {
        setRatings(prev => ({
            ...prev,
            [key]: { ...prev[key], comments: comment }
        }));
    };

    const handleSubmit = async () => {
        if (!assignment || !template) return;
        setSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const ratingsList = Object.entries(ratings).map(([key, data]) => ({
                key,
                ratingValue: data.value,
                comments: data.comments
            }));

            if (goals) {
                ratingsList.push({
                    key: 'GOALS',
                    ratingValue: 0,
                    comments: goals
                });
            }

            // Helper to extract ID from populated fields
            const getId = (field: any): string => {
                if (!field) return '';
                if (typeof field === 'string') return field;
                if (typeof field === 'object' && '_id' in field) return field._id;
                return String(field);
            };

            if (record) {
                // Update existing record
                const updateDto: UpdateAppraisalRecordDto = {
                    ratings: ratingsList,
                    managerSummary,
                    strengths,
                    improvementAreas
                };

                const res = await fetch(`${API_URL}/performance/records/${record._id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updateDto)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to update record');
                }
            } else {
                // Create new record
                const createDto: CreateAppraisalRecordDto = {
                    assignmentId: assignment._id,
                    cycleId: getId(assignment.cycleId),
                    templateId: getId(assignment.templateId),
                    employeeProfileId: getId(assignment.employeeProfileId),
                    managerProfileId: getId(assignment.managerProfileId),
                    ratings: ratingsList,
                    managerSummary,
                    strengths,
                    improvementAreas
                };

                const res = await fetch(`${API_URL}/performance/records`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(createDto)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to create record');
                }
            }

            router.push('/employee/performance/manager-assignments');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!template) return null;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
            <Typography variant="h4" gutterBottom>
                {template.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" paragraph>
                {template.description}
            </Typography>

            <Box component="form" noValidate autoComplete="off">
                {template.criteria?.map((criterion: any) => (
                    <Card key={criterion.key} sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {criterion.title}
                            </Typography>
                            {criterion.details && (
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {criterion.details}
                                </Typography>
                            )}

                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography gutterBottom>Rating ({template.ratingScale.min} - {template.ratingScale.max})</Typography>
                                <Slider
                                    value={ratings[criterion.key]?.value || 0}
                                    onChange={(_, val) => handleRatingChange(criterion.key, val as number)}
                                    step={template.ratingScale.step || 1}
                                    marks
                                    min={template.ratingScale.min}
                                    max={template.ratingScale.max}
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Comments / Examples</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={1}
                                    value={ratings[criterion.key]?.comments || ''}
                                    onChange={(e) => handleCommentChange(criterion.key, e.target.value)}
                                    variant="outlined"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                ))}

                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Overall Feedback
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid size={12}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Manager Summary</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={1}
                                    value={managerSummary}
                                    onChange={(e) => setManagerSummary(e.target.value)}
                                />
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Strengths</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={1}
                                    value={strengths}
                                    onChange={(e) => setStrengths(e.target.value)}
                                />
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Areas for Improvement</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={1}
                                    value={improvementAreas}
                                    onChange={(e) => setImprovementAreas(e.target.value)}
                                />
                            </Box>
                        </Grid>
                        <Grid size={12}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Goals for Next Period</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={1}
                                    value={goals}
                                    onChange={(e) => setGoals(e.target.value)}
                                    placeholder="Enter goals for the upcoming period..."
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Box display="flex" justifyContent="flex-end" gap={2}>
                    <Button variant="outlined" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Submit Appraisal'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}
