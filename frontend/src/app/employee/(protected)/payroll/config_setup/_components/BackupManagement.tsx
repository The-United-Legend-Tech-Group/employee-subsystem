import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RestoreIcon from '@mui/icons-material/Restore';
import BackupIcon from '@mui/icons-material/Backup';
import { backupApi } from '../_api/config-setup.api';

export default function BackupManagement() {
    const [backups, setBackups] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    // Dialog state
    const [restoreDialogOpen, setRestoreDialogOpen] = React.useState(false);
    const [selectedBackup, setSelectedBackup] = React.useState<string | null>(null);

    const fetchBackups = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await backupApi.listBackups();
            if (response.error) {
                setError(response.error);
            } else {
                setBackups(response.data?.backups || []);
            }
        } catch (err) {
            setError('Failed to fetch backups');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleCreateBackup = async () => {
        try {
            setActionLoading(true);
            setError(null);
            setSuccess(null);
            const response = await backupApi.triggerBackup();
            if (response.error) {
                setError(response.error);
            } else {
                setSuccess('Backup created successfully');
                fetchBackups();
            }
        } catch (err) {
            setError('Failed to create backup');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownload = async (backupName: string) => {
        console.log('[BackupManagement] handleDownload called with:', backupName);
        try {
            setActionLoading(true);
            setError(null);
            console.log('[BackupManagement] Calling backupApi.downloadBackup...');
            await backupApi.downloadBackup(backupName);
            console.log('[BackupManagement] Download completed successfully');
            setSuccess(`Downloading backup: ${backupName}`);
        } catch (err) {
            console.error('[BackupManagement] Download error:', err);
            setError(err instanceof Error ? err.message : 'Failed to download backup');
        } finally {
            setActionLoading(false);
        }
    };

    const openRestoreDialog = (backupName: string) => {
        setSelectedBackup(backupName);
        setRestoreDialogOpen(true);
    };

    const confirmRestore = async () => {
        if (!selectedBackup) return;

        try {
            setRestoreDialogOpen(false);
            setActionLoading(true);
            setError(null);
            setSuccess(null);

            const response = await backupApi.restoreBackup(selectedBackup);
            if (response.error) {
                setError(response.error);
            } else {
                setSuccess(`Restored successfully from ${selectedBackup}`);
            }
        } catch (err) {
            setError('Failed to restore backup');
        } finally {
            setActionLoading(false);
            setSelectedBackup(null);
        }
    };

    return (
        <Card sx={{ mt: 4 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BackupIcon color="primary" />
                        <Typography variant="h6">Backup Management</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            startIcon={<RefreshIcon />}
                            onClick={fetchBackups}
                            disabled={loading || actionLoading}
                            size="small"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<BackupIcon />}
                            onClick={handleCreateBackup}
                            disabled={loading || actionLoading}
                        >
                            Create New Backup
                        </Button>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Backup Name</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {backups.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            No backups found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    backups.map((backup) => (
                                        <TableRow key={backup}>
                                            <TableCell>{backup}</TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        startIcon={<CloudDownloadIcon />}
                                                        onClick={() => handleDownload(backup)}
                                                        disabled={actionLoading}
                                                    >
                                                        Download
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={<RestoreIcon />}
                                                        onClick={() => openRestoreDialog(backup)}
                                                        disabled={actionLoading}
                                                    >
                                                        Restore
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Restore Confirmation Dialog */}
                <Dialog
                    open={restoreDialogOpen}
                    onClose={() => setRestoreDialogOpen(false)}
                >
                    <DialogTitle>Confirm Restore</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to restore from <strong>{selectedBackup}</strong>?
                            <br /><br />
                            <Typography component="span" color="error" fontWeight="bold">
                                WARNING: This will replace all current configuration settings with the data from this backup. This action cannot be undone.
                            </Typography>
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmRestore} color="error" variant="contained" autoFocus>
                            Yes, Restore
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Overlay Loader for Actions */}
                {actionLoading && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                            zIndex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
