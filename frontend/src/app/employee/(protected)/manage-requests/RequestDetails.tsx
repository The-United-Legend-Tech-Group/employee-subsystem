import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';

interface ProfileChangeRequest {
    _id: string;
    requestId: string;
    employeeProfileId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedLegalName?: {
        firstName: string;
        middleName?: string;
        lastName: string;
        fullName?: string;
    };
    requestedMaritalStatus?: string;
    requestedChanges?: Record<string, any>;
    reason?: string;
    adminComment?: string;
    createdAt: string;
    updatedAt: string;
}

interface RequestDetailsProps {
    request: ProfileChangeRequest | null;
    onApprove: (id: string) => void;
    onReject: (id: string, reason: string) => void;
}

export default function RequestDetails({ request, onApprove, onReject }: RequestDetailsProps) {
    const [rejectReason, setRejectReason] = React.useState('');
    const [showRejectInput, setShowRejectInput] = React.useState(false);
    const [fetchedEmployee, setFetchedEmployee] = React.useState<any | null>(null);
    const [fetchingEmployee, setFetchingEmployee] = React.useState(false);

    React.useEffect(() => {
        if (request) {
            setFetchedEmployee(null);
            setShowRejectInput(false);
            setRejectReason('');
            handleFetchEmployee();
        }
    }, [request]);

    const handleFetchEmployee = async () => {
        if (!request) return;
        setFetchingEmployee(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
            const response = await fetch(`${apiUrl}/employee/${request.employeeProfileId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setFetchedEmployee(data.profile || data); // Handle both wrapped and direct responses
            } else {
                console.error('Failed to fetch employee details');
            }
        } catch (err) {
            console.error('Error fetching employee:', err);
        } finally {
            setFetchingEmployee(false);
        }
    };

    if (!request) {
        return (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} elevation={0} variant="outlined">
                <Typography color="text.secondary">Select a request to view details</Typography>
            </Paper>
        );
    }

    const handleRejectClick = () => {
        setShowRejectInput(true);
    };

    const handleConfirmReject = () => {
        onReject(request.requestId, rejectReason);
        setShowRejectInput(false);
        setRejectReason('');
    };

    const handleCancelReject = () => {
        setShowRejectInput(false);
        setRejectReason('');
    };

    return (
        <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }} elevation={0} variant="outlined">
            <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Request Details
                        </Typography>
                    </Box>
                    <Chip
                        label={request.status}
                        color={request.status === 'APPROVED' ? 'success' : request.status === 'REJECTED' ? 'error' : 'warning'}
                        variant="outlined"
                    />
                </Box>

                <Divider />

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" mb={1}>
                        Employee
                    </Typography>

                    {fetchingEmployee ? (
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                                    <Box flex={1}>
                                        <Skeleton variant="text" width="30%" height={20} />
                                        <Skeleton variant="text" width="70%" height={24} />
                                    </Box>
                                    <Box flex={1}>
                                        <Skeleton variant="text" width="40%" height={20} />
                                        <Skeleton variant="text" width="60%" height={24} />
                                    </Box>
                                </Stack>
                                <Box>
                                    <Skeleton variant="text" width="25%" height={20} />
                                    <Skeleton variant="text" width="80%" height={24} />
                                </Box>
                            </Stack>
                        </Paper>
                    ) : fetchedEmployee && (
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                                    <Box flex={1}>
                                        <Typography variant="caption" color="text.secondary">Name</Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {fetchedEmployee.firstName} {fetchedEmployee.lastName}
                                        </Typography>
                                    </Box>
                                    <Box flex={1}>
                                        <Typography variant="caption" color="text.secondary">Number</Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {fetchedEmployee.employeeNumber}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Email</Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {fetchedEmployee.workEmail || fetchedEmployee.personalEmail || 'N/A'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}
                </Box>

                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                    <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Submitted Date
                        </Typography>
                        <Typography variant="body1">
                            {new Date(request.createdAt).toLocaleString()}
                        </Typography>
                    </Box>
                    <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Reason for Request
                        </Typography>
                        <Typography variant="body1">
                            {request.reason || 'No reason provided'}
                        </Typography>
                    </Box>
                </Stack>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Requested Changes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Stack spacing={2}>
                            {request.requestedLegalName && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Requested Legal Name
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {request.requestedLegalName.firstName} {request.requestedLegalName.middleName} {request.requestedLegalName.lastName}
                                    </Typography>
                                </Box>
                            )}

                            {request.requestedMaritalStatus && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Requested Marital Status
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {request.requestedMaritalStatus}
                                    </Typography>
                                </Box>
                            )}

                            {request.requestedChanges && Object.keys(request.requestedChanges).length > 0 && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                                        Other Changes
                                    </Typography>
                                    <Stack spacing={1}>
                                        {Object.entries(request.requestedChanges).map(([key, value]) => (
                                            <Box key={key}>
                                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </Typography>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {String(value)}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {!request.requestedLegalName && !request.requestedMaritalStatus && (!request.requestedChanges || Object.keys(request.requestedChanges).length === 0) && (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                    No specific changes listed.
                                </Typography>
                            )}
                        </Stack>
                    </Paper>
                </Box>

                {request.status === 'PENDING' && (
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                        {showRejectInput ? (
                            <Stack spacing={2}>
                                <TextField
                                    placeholder="Rejection Reason"
                                    multiline
                                    rows={1}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button onClick={handleCancelReject}>Cancel</Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={handleConfirmReject}
                                        disabled={!rejectReason.trim()}
                                    >
                                        Confirm Reject
                                    </Button>
                                </Stack>
                            </Stack>
                        ) : (
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleRejectClick}
                                >
                                    Reject
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => onApprove(request.requestId)}
                                >
                                    Approve
                                </Button>
                            </Stack>
                        )}
                    </Box>
                )}
            </Stack>
        </Paper>
    );
}
