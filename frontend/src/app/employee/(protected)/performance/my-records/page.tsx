'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Grid,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { decryptData } from '../../../../../common/utils/encryption';
import { AppraisalRecord } from '../../../../../types/performance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function MyPerformanceRecordsPage() {
    const [records, setRecords] = useState<AppraisalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            console.log('Fetching performance records...');
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');
            console.log('Token exists:', !!token);
            console.log('Encrypted ID exists:', !!encryptedEmployeeId);

            if (!token || !encryptedEmployeeId) {
                throw new Error('Authentication details missing');
            }

            const employeeId = await decryptData(encryptedEmployeeId, token);
            console.log('Decrypted Employee ID:', employeeId);

            if (!employeeId) throw new Error('Failed to decrypt employee ID');

            const url = `${API_URL}/performance/records/employee/${employeeId}/final`;
            console.log('Fetching from URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to fetch performance records: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Records fetched:', data);
            setRecords(data);
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
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
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Performance Records
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                View your finalized performance ratings, feedback, and development notes.
            </Typography>

            {records.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>No finalized performance records found.</Typography>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {records.map((record) => (
                        <PerformanceRecordCard key={record._id} record={record} />
                    ))}
                </Box>
            )}
        </Container>
    );
}

function PerformanceRecordCard({ record }: { record: AppraisalRecord }) {
    // Helper to format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    // Accessing properties that might not be in the strict interface but are in the API response
    const publishedDate = (record as any).hrPublishedAt || (record as any).updatedAt;

    return (
        <Card elevation={3}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="div">
                        Appraisal Record
                    </Typography>
                    <Chip
                        label={record.overallRatingLabel || 'No Rating'}
                        color={record.overallRatingLabel ? 'primary' : 'default'}
                    />
                </Box>

                <Grid container spacing={2} mb={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Total Score</Typography>
                        <Typography variant="body1">{record.totalScore ?? 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Date Finalized</Typography>
                        <Typography variant="body1">{formatDate(publishedDate)}</Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>Manager Feedback</Typography>

                <Box mb={2}>
                    <Typography variant="subtitle2" color="primary">Summary</Typography>
                    <Typography variant="body2" paragraph>
                        {record.managerSummary || 'No summary provided.'}
                    </Typography>
                </Box>



                <Grid container spacing={2} mb={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', bgcolor: (theme) => alpha(theme.palette.success.main, 0.08) }}>
                            <Typography variant="subtitle2" color="success.main" gutterBottom>Strengths</Typography>
                            <Typography variant="body2">
                                {record.strengths || 'None listed.'}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) }}>
                            <Typography variant="subtitle2" color="error.main" gutterBottom>Areas for Improvement</Typography>
                            <Typography variant="body2">
                                {record.improvementAreas || 'None listed.'}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Detailed Ratings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List>
                            {record.ratings.map((rating, index) => (
                                <React.Fragment key={index}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemText
                                            primary={
                                                <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                                                    <Typography variant="subtitle1" sx={{ mr: 2 }}>{rating.title}</Typography>
                                                    <Chip size="small" label={`Rating: ${rating.ratingValue}`} />
                                                </Box>
                                            }
                                            secondary={
                                                <Box component="span">
                                                    {rating.ratingLabel && (
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="text.primary"
                                                            display="block"
                                                        >
                                                            {rating.ratingLabel}
                                                        </Typography>
                                                    )}
                                                    {rating.comments && (
                                                        <Typography component="span" variant="body2" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                            <strong>Comment:</strong> {rating.comments}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < record.ratings.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
            </CardContent>
        </Card>
    );
}
