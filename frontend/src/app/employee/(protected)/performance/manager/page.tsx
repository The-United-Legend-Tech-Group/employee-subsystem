"use client";

import React, { useState, useEffect } from 'react';
import { 
    Container, 
    Typography, 
    Box, 
    TextField, 
    Button, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { AppraisalAssignment, AppraisalAssignmentStatus } from '@/types/performance';

export default function ManagerAssignmentsPage() {
    const [managerId, setManagerId] = useState('');
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchAssignments = async () => {
        if (!managerId) {
            setError('Please enter a Manager ID');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:50000/performance/assignments?managerId=${managerId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch assignments');
            }
            const data = await response.json();
            setAssignments(data);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleStartAppraisal = (assignmentId: string) => {
        router.push(`/employee/performance/manager/appraisal/${assignmentId}?managerId=${managerId}`);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Manager Appraisal Dashboard
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField 
                        label="Manager ID" 
                        variant="outlined" 
                        value={managerId} 
                        onChange={(e) => setManagerId(e.target.value)}
                        size="small"
                        sx={{ width: 300 }}
                    />
                    <Button 
                        variant="contained" 
                        onClick={fetchAssignments}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Fetch Assignments'}
                    </Button>
                </Box>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>

            {assignments.length > 0 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Employee ID</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Assigned At</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {assignments.map((assignment) => (
                                <TableRow key={assignment._id}>
                                    <TableCell>
                                        {typeof assignment.employeeProfileId === 'object' 
                                            ? `${assignment.employeeProfileId.firstName} ${assignment.employeeProfileId.lastName}`
                                            : assignment.employeeProfileId}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={assignment.status} 
                                            color={
                                                assignment.status === AppraisalAssignmentStatus.ACKNOWLEDGED ? 'success' : 
                                                assignment.status === AppraisalAssignmentStatus.IN_PROGRESS ? 'primary' : 'default'
                                            } 
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(assignment.assignedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="outlined" 
                                            size="small"
                                            onClick={() => handleStartAppraisal(assignment._id)}
                                        >
                                            {assignment.status === AppraisalAssignmentStatus.NOT_STARTED ? 'Start' : 'Edit'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {assignments.length === 0 && !loading && !error && (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    No assignments found. Enter a Manager ID to search.
                </Typography>
            )}
        </Container>
    );
}
