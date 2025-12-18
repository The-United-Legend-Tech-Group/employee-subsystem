"use client";

import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    CircularProgress,
    Alert,
    TextField,
    Slider,
    Stack,
    Card,
    CardContent
} from '@mui/material';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    AppraisalAssignment,
    AppraisalTemplate,
    AppraisalRecord,
    CreateAppraisalRecordDto,
    UpdateAppraisalRecordDto
} from '@/types/performance';

export default function AppraisalFormPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const assignmentId = params.assignmentId as string;
    const managerId = searchParams.get('managerId');
    const router = useRouter();

    const [assignment, setAssignment] = useState<AppraisalAssignment | null>(null);
    const [template, setTemplate] = useState<AppraisalTemplate | null>(null);
    const [record, setRecord] = useState<AppraisalRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [ratings, setRatings] = useState<Record<string, {
        value: number,
        comments: string,
        examples: string,
        recommendations: string
    }>>({});
    const [summary, setSummary] = useState('');
    const [strengths, setStrengths] = useState('');
    const [improvements, setImprovements] = useState('');

    // Helper to parse comments
    const parseComments = (fullText: string) => {
        const parts = { comments: '', examples: '', recommendations: '' };
        if (!fullText) return parts;

        const examplesSplit = fullText.split('\n\n**Examples:**\n');
        parts.comments = examplesSplit[0];

        if (examplesSplit.length > 1) {
            const recSplit = examplesSplit[1].split('\n\n**Development Recommendations:**\n');
            parts.examples = recSplit[0];
            if (recSplit.length > 1) {
                parts.recommendations = recSplit[1];
            }
        }
        return parts;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Assignment
                const assignRes = await fetch(`http://localhost:50000/performance/assignments?managerId=${managerId}`);

                if (!assignRes.ok) throw new Error('Failed to fetch assignments');
                const assignments: AppraisalAssignment[] = await assignRes.json();
                const currentAssignment = assignments.find(a => a._id === assignmentId);

                if (!currentAssignment) throw new Error('Assignment not found');
                setAssignment(currentAssignment);

                // 2. Fetch Template
                console.log('DEBUG: Assignment Template ID:', currentAssignment.templateId);

                let templateId: string;
                if (currentAssignment.templateId && typeof currentAssignment.templateId === 'object' && '_id' in currentAssignment.templateId) {
                    const rawId = (currentAssignment.templateId as any)._id;
                    // Handle case where _id might be an object (though it should be a string in JSON)
                    templateId = typeof rawId === 'string' ? rawId : String(rawId);
                } else if (typeof currentAssignment.templateId === 'string') {
                    templateId = currentAssignment.templateId;
                } else {
                    console.error('Invalid Template ID structure:', currentAssignment.templateId);
                    throw new Error('Invalid Template ID in assignment');
                }

                if (templateId === '[object Object]') {
                    console.error('CRITICAL: templateId resulted in [object Object]. Original:', currentAssignment.templateId);
                    throw new Error('Failed to extract valid Template ID from assignment');
                }

                console.log('Fetching template with ID:', templateId);

                const templateRes = await fetch(`http://localhost:50000/performance/templates/${templateId}`);
                if (!templateRes.ok) {
                    const errorText = await templateRes.text();
                    throw new Error(`Failed to fetch template (${templateRes.status}): ${errorText}`);
                }
                const templateData: AppraisalTemplate = await templateRes.json();
                setTemplate(templateData);

                // 3. Fetch Record (if exists)
                if (currentAssignment.latestAppraisalId) {
                    const recordRes = await fetch(`http://localhost:50000/performance/records/${currentAssignment.latestAppraisalId}`);
                    if (recordRes.ok) {
                        const recordData: AppraisalRecord = await recordRes.json();
                        setRecord(recordData);

                        // Initialize form with existing data
                        const initialRatings: Record<string, { value: number, comments: string, examples: string, recommendations: string }> = {};
                        recordData.ratings.forEach(r => {
                            const parsed = parseComments(r.comments || '');
                            initialRatings[r.key] = {
                                value: r.ratingValue,
                                ...parsed
                            };
                        });
                        setRatings(initialRatings);
                        setSummary(recordData.managerSummary || '');
                        setStrengths(recordData.strengths || '');
                        setImprovements(recordData.improvementAreas || '');
                    }
                } else {
                    // Initialize empty ratings
                    const initialRatings: Record<string, { value: number, comments: string, examples: string, recommendations: string }> = {};
                    templateData.criteria.forEach(c => {
                        initialRatings[c.key] = { value: 0, comments: '', examples: '', recommendations: '' };
                    });
                    setRatings(initialRatings);
                }

            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (assignmentId && managerId) {
            fetchData();
        } else if (!managerId) {
            setError('Manager ID is missing');
            setLoading(false);
        }
    }, [assignmentId, managerId]);

    const handleRatingChange = (key: string, value: number) => {
        setRatings(prev => ({
            ...prev,
            [key]: { ...prev[key], value }
        }));
    };

    const handleFieldChange = (key: string, field: 'comments' | 'examples' | 'recommendations', value: string) => {
        setRatings(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleSubmit = async () => {
        if (!assignment || !template || !managerId) return;
        setSaving(true);
        setError(null);

        try {
            const ratingEntries = Object.entries(ratings).map(([key, data]) => {
                let combinedComments = data.comments;
                if (data.examples) combinedComments += `\n\n**Examples:**\n${data.examples}`;
                if (data.recommendations) combinedComments += `\n\n**Development Recommendations:**\n${data.recommendations}`;

                return {
                    key,
                    ratingValue: data.value,
                    comments: combinedComments
                };
            });

            if (record) {
                // Update
                const updateDto: UpdateAppraisalRecordDto = {
                    ratings: ratingEntries,
                    managerSummary: summary,
                    strengths: strengths,
                    improvementAreas: improvements
                };

                const res = await fetch(`http://localhost:50000/performance/records/${record._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateDto)
                });
                if (!res.ok) throw new Error('Failed to update record');
            } else {
                // Create
                const createDto: CreateAppraisalRecordDto = {
                    assignmentId: assignment._id,
                    cycleId: typeof assignment.cycleId === 'object' ? assignment.cycleId._id : assignment.cycleId,
                    templateId: typeof assignment.templateId === 'object' ? assignment.templateId._id : assignment.templateId,
                    employeeProfileId: typeof assignment.employeeProfileId === 'object' ? assignment.employeeProfileId._id : assignment.employeeProfileId,
                    managerProfileId: managerId,
                    ratings: ratingEntries,
                    managerSummary: summary,
                    strengths: strengths,
                    improvementAreas: improvements
                };

                const res = await fetch(`http://localhost:50000/performance/records`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(createDto)
                });
                if (!res.ok) throw new Error('Failed to create record');
            }

            router.push('/employee/performance/manager');
        } catch (err: any) {
            setError(err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!assignment || !template) return <Container sx={{ mt: 4 }}><Alert severity="warning">Data not found</Alert></Container>;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
            <Typography variant="h4" gutterBottom>
                Performance Appraisal
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
                Employee: {typeof assignment.employeeProfileId === 'object'
                    ? `${assignment.employeeProfileId.firstName} ${assignment.employeeProfileId.lastName}`
                    : assignment.employeeProfileId}
            </Typography>

            <Box component="form" noValidate autoComplete="off">
                {template.criteria.map((criterion) => (
                    <Card key={criterion.key} sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6">{criterion.title}</Typography>
                            {criterion.details && <Typography variant="body2" color="text.secondary" paragraph>{criterion.details}</Typography>}

                            <Box sx={{ mt: 2 }}>
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

                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Comments</Typography>
                                    <TextField
                                        multiline
                                        rows={1}
                                        fullWidth
                                        variant="outlined"
                                        value={ratings[criterion.key]?.comments || ''}
                                        onChange={(e) => handleFieldChange(criterion.key, 'comments', e.target.value)}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Examples</Typography>
                                    <TextField
                                        multiline
                                        rows={1}
                                        fullWidth
                                        variant="outlined"
                                        value={ratings[criterion.key]?.examples || ''}
                                        onChange={(e) => handleFieldChange(criterion.key, 'examples', e.target.value)}
                                        placeholder="Provide specific examples..."
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Development Recommendations</Typography>
                                    <TextField
                                        multiline
                                        rows={1}
                                        fullWidth
                                        variant="outlined"
                                        value={ratings[criterion.key]?.recommendations || ''}
                                        onChange={(e) => handleFieldChange(criterion.key, 'recommendations', e.target.value)}
                                        placeholder="Suggest actions for improvement..."
                                    />
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}

                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Overall Feedback</Typography>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Manager Summary</Typography>
                            <TextField
                                multiline
                                rows={1}
                                fullWidth
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                            />
                        </Box>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Strengths</Typography>
                                <TextField
                                    multiline
                                    rows={1}
                                    fullWidth
                                    value={strengths}
                                    onChange={(e) => setStrengths(e.target.value)}
                                />
                            </Box>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Areas for Improvement</Typography>
                                <TextField
                                    multiline
                                    rows={1}
                                    fullWidth
                                    value={improvements}
                                    onChange={(e) => setImprovements(e.target.value)}
                                />
                            </Box>
                        </Stack>
                    </Stack>
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={() => router.back()}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? <CircularProgress size={24} /> : 'Submit Appraisal'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}
