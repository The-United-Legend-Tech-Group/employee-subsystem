'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Stack,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputAdornment,
    Alert,
    Collapse,
    IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { recruitmentApi, employeeApi } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

interface Assessment {
    _id: string;
    interviewId: string;
    interviewerId: string;
    score: number;
    comments: string;
    createdAt: string;
    updatedAt: string;
}

function AssessmentRow({ assessment, employeeMap }: { assessment: Assessment; employeeMap: Record<string, string> }) {
    const [open, setOpen] = useState(false);
    const isCompleted = assessment.score > 0;
    const empNumber = employeeMap[assessment.interviewerId];

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {empNumber ? `#${empNumber}` : assessment.interviewerId.slice(-8)}
                    </Typography>
                </TableCell>
                <TableCell align="center">
                    {isCompleted ? (
                        <Chip
                            icon={<CheckCircleIcon />}
                            label={`${assessment.score}/10`}
                            color="success"
                            size="small"
                        />
                    ) : (
                        <Chip
                            icon={<PendingIcon />}
                            label="Pending"
                            color="warning"
                            size="small"
                        />
                    )}
                </TableCell>
                <TableCell>
                    <Typography variant="body2">
                        {new Date(assessment.createdAt).toLocaleDateString()}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography variant="body2">
                        {new Date(assessment.updatedAt).toLocaleDateString()}
                    </Typography>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                Assessment Details
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                {/* Assessment ID and Interview ID intentionally removed from details */}
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Interviewer
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                        {employeeMap[assessment.interviewerId]
                                            ? `#${employeeMap[assessment.interviewerId]}`
                                            : assessment.interviewerId}
                                    </Typography>
                                </Box>
                                {assessment.comments && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Comments
                                        </Typography>
                                        <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'action.hover' }}>
                                            <Typography variant="body2">
                                                {assessment.comments}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export function AllAssessments() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchAllAssessments();
    }, []);

    // We now fetch employees together with assessments inside fetchAllAssessments
    // to ensure employee numbers are available before the table renders, avoiding flicker.

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredAssessments(assessments);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = assessments.filter(
            (assessment) =>
                assessment._id.toLowerCase().includes(query) ||
                assessment.interviewId.toLowerCase().includes(query) ||
                assessment.interviewerId.toLowerCase().includes(query) ||
                assessment.comments.toLowerCase().includes(query)
        );
        setFilteredAssessments(filtered);
    }, [searchQuery, assessments]);

    const fetchAllAssessments = async () => {
        try {
            setLoading(true);
            // Fetch assessments and employees in parallel so we can build the employeeMap
            const [assessResp, employees] = await Promise.all([
                recruitmentApi.getAllAssessments(),
                employeeApi.getAllEmployees(),
            ]);
            const data = assessResp.data || [];
            const newMap: Record<string, string> = {};
            (employees || []).forEach((emp: any) => {
                if (emp && emp._id) newMap[emp._id] = emp.employeeNumber ?? '';
            });
            setEmployeeMap(newMap);
            setAssessments(data);
            setFilteredAssessments(data);
        } catch (error: any) {
            console.error('Failed to fetch assessments:', error);
            toast.error('Failed to load assessments');
        } finally {
            setLoading(false);
        }
    };

    const completedCount = assessments.filter(a => a.score > 0).length;
    const pendingCount = assessments.filter(a => a.score === 0).length;

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    All Assessments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    View and manage all interview assessments
                </Typography>
            </Box>

            {/* Statistics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Total Assessments
                        </Typography>
                        <Typography variant="h4" fontWeight={600}>
                            {assessments.length}
                        </Typography>
                    </CardContent>
                </Card>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Completed
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color="success.main">
                            {completedCount}
                        </Typography>
                    </CardContent>
                </Card>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Pending
                        </Typography>
                        <Typography variant="h4" fontWeight={600} color="warning.main">
                            {pendingCount}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Search */}
            <TextField
                placeholder="Search by assessment ID, interview ID, interviewer ID, or comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                fullWidth
            />

            {/* Assessments Table */}
            {filteredAssessments.length === 0 ? (
                <Alert severity="info">
                    {searchQuery ? 'No assessments match your search criteria.' : 'No assessments found.'}
                </Alert>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell width={50} />
                                <TableCell>Interviewer (Employee #)</TableCell>
                                <TableCell align="center">Status/Score</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Updated</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAssessments.map((assessment) => (
                                <AssessmentRow key={assessment._id} assessment={assessment} employeeMap={employeeMap} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {filteredAssessments.length > 0 && (
                <Typography variant="caption" color="text.secondary" textAlign="center">
                    Showing {filteredAssessments.length} of {assessments.length} assessments
                </Typography>
            )}
        </Stack>
    );
}

