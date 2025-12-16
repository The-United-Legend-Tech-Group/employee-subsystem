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
import { decryptData } from '@/common/utils/encryption';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function ManagerAssignmentsPage() {
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        setError(null);
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

            const response = await fetch(`${API_URL}/performance/assignments?managerId=${managerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
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
        router.push(`/employee/performance/appraisal/${assignmentId}`);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Manager Appraisal Dashboard
            </Typography>
            
            {loading && (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!loading && assignments.length === 0 && !error && (
                <Alert severity="info">No assignments found.</Alert>
            )}

            {!loading && assignments.length > 0 && (
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
